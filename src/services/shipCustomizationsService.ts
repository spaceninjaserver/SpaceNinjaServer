import { getPersonalRooms } from "./personalRoomsService.ts";
import { getShip } from "./shipService.ts";
import type {
    IResetShipDecorationsRequest,
    IResetShipDecorationsResponse,
    ISetPlacedDecoInfoRequest,
    ISetShipCustomizationsRequest,
    IShipDecorationsRequest,
    IShipDecorationsResponse,
    RoomsType,
    TBootLocation,
    TPersonalRoomsDatabaseDocument
} from "../types/personalRoomsTypes.ts";
import { logger } from "../utils/logger.ts";
import { Types } from "mongoose";
import { addFusionTreasures, addShipDecorations, getInventory } from "./inventoryService.ts";
import { Guild } from "../models/guildModel.ts";
import { hasGuildPermission } from "./guildService.ts";
import { GuildPermission } from "../types/guildTypes.ts";
import { ExportResources } from "warframe-public-export-plus";
import { convertCustomizationInfo } from "./importService.ts";

export const setShipCustomizations = async (
    accountId: string,
    shipCustomization: ISetShipCustomizationsRequest
): Promise<void> => {
    if (shipCustomization.IsExterior) {
        const ship = await getShip(new Types.ObjectId(shipCustomization.ShipId));
        if (ship.ShipOwnerId.toString() == accountId) {
            ship.set({
                ShipExteriorColors: shipCustomization.Customization.Colors,
                SkinFlavourItem: shipCustomization.Customization.SkinFlavourItem,
                ShipAttachments: shipCustomization.Customization.ShipAttachments,
                AirSupportPower: shipCustomization.AirSupportPower!
            });
            await ship.save();
        }
    } else {
        const personalRooms = await getPersonalRooms(accountId);
        if (shipCustomization.IsShop) {
            personalRooms.TailorShop.Colors = shipCustomization.Customization.Colors;
            personalRooms.TailorShop.LevelDecosVisible = shipCustomization.Customization.LevelDecosVisible;
            personalRooms.TailorShop.CustomJson = shipCustomization.Customization.CustomJson;
        } else {
            personalRooms.Ship.ShipInterior = shipCustomization.Customization;
        }
        await personalRooms.save();
    }
};

export const handleSetShipDecorations = async (
    accountId: string,
    placedDecoration: IShipDecorationsRequest
): Promise<IShipDecorationsResponse> => {
    const personalRooms = await getPersonalRooms(accountId);

    const rooms = getRoomsForBootLocation(personalRooms, placedDecoration);

    const roomToPlaceIn = rooms.find(room => room.Name === placedDecoration.Room);

    if (!roomToPlaceIn) {
        throw new Error(`unknown room: ${placedDecoration.Room}`);
    }

    const entry = Object.entries(ExportResources).find(arr => arr[1].deco == placedDecoration.Type);
    if (!entry) {
        throw new Error(`unknown deco type: ${placedDecoration.Type}`);
    }
    const [itemType, meta] = entry;
    if (meta.capacityCost === undefined) {
        throw new Error(`unknown deco type: ${placedDecoration.Type}`);
    }

    if (placedDecoration.MoveId) {
        //moved within the same room
        if (placedDecoration.OldRoom === placedDecoration.Room) {
            const existingDecoration = roomToPlaceIn.PlacedDecos.id(placedDecoration.MoveId);

            if (!existingDecoration) {
                throw new Error("decoration to be moved not found");
            }

            existingDecoration.Pos = placedDecoration.Pos;
            existingDecoration.Rot = placedDecoration.Rot;

            if (placedDecoration.Scale) {
                existingDecoration.Scale = placedDecoration.Scale;
            }

            await personalRooms.save();
            return {
                OldRoom: placedDecoration.OldRoom,
                NewRoom: placedDecoration.Room,
                IsApartment: placedDecoration.IsApartment,
                MaxCapacityIncrease: 0
            };
        }

        //moved to a different room
        const oldRoom = rooms.find(room => room.Name === placedDecoration.OldRoom);

        if (!oldRoom) {
            logger.error("old room not found");
            throw new Error("old room not found");
        }

        oldRoom.PlacedDecos.pull({ _id: placedDecoration.MoveId });
        oldRoom.MaxCapacity += meta.capacityCost;

        const newDecoration = {
            Type: placedDecoration.Type,
            Pos: placedDecoration.Pos,
            Rot: placedDecoration.Rot,
            Scale: placedDecoration.Scale,
            Sockets: placedDecoration.Sockets,
            _id: placedDecoration.MoveId
        };

        //the new room is still roomToPlaceIn
        roomToPlaceIn.PlacedDecos.push(newDecoration);
        roomToPlaceIn.MaxCapacity -= meta.capacityCost;

        await personalRooms.save();
        return {
            OldRoom: placedDecoration.OldRoom,
            NewRoom: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: -meta.capacityCost
        };
    }

    if (placedDecoration.RemoveId) {
        const decoIndex = roomToPlaceIn.PlacedDecos.findIndex(x => x._id.equals(placedDecoration.RemoveId));
        const deco = roomToPlaceIn.PlacedDecos[decoIndex];
        roomToPlaceIn.PlacedDecos.splice(decoIndex, 1);
        roomToPlaceIn.MaxCapacity += meta.capacityCost;
        await personalRooms.save();

        const inventory = await getInventory(accountId);
        if (deco.Sockets !== undefined) {
            addFusionTreasures(inventory, [{ ItemType: itemType, Sockets: deco.Sockets, ItemCount: 1 }]);
        } else {
            addShipDecorations(inventory, [{ ItemType: itemType, ItemCount: 1 }]);
        }
        await inventory.save();

        return {
            DecoId: placedDecoration.RemoveId,
            Room: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: 0 // Client already implies the capacity being refunded.
        };
    }

    const inventory = await getInventory(accountId);
    if (placedDecoration.Sockets !== undefined) {
        addFusionTreasures(inventory, [{ ItemType: itemType, Sockets: placedDecoration.Sockets, ItemCount: -1 }]);
    } else {
        addShipDecorations(inventory, [{ ItemType: itemType, ItemCount: -1 }]);
    }
    await inventory.save();

    //place decoration
    const decoId = new Types.ObjectId();
    roomToPlaceIn.PlacedDecos.push({
        Type: placedDecoration.Type,
        Pos: placedDecoration.Pos,
        Rot: placedDecoration.Rot,
        Scale: placedDecoration.Scale,
        Sockets: placedDecoration.Sockets,
        _id: decoId
    });
    roomToPlaceIn.MaxCapacity -= meta.capacityCost;

    await personalRooms.save();

    return {
        DecoId: decoId.toString(),
        Room: placedDecoration.Room,
        IsApartment: placedDecoration.IsApartment,
        MaxCapacityIncrease: -meta.capacityCost
    };
};

const getRoomsForBootLocation = (
    personalRooms: TPersonalRoomsDatabaseDocument,
    request: { BootLocation?: TBootLocation; IsApartment?: boolean }
): RoomsType[] => {
    if (request.BootLocation == "SHOP") {
        return personalRooms.TailorShop.Rooms;
    }
    if (request.BootLocation == "APARTMENT" || request.IsApartment) {
        return personalRooms.Apartment.Rooms;
    }
    return personalRooms.Ship.Rooms;
};

export const handleResetShipDecorations = async (
    accountId: string,
    request: IResetShipDecorationsRequest
): Promise<IResetShipDecorationsResponse> => {
    const [personalRooms, inventory] = await Promise.all([getPersonalRooms(accountId), getInventory(accountId)]);
    const room = getRoomsForBootLocation(personalRooms, request).find(room => room.Name === request.Room);
    if (!room) {
        throw new Error(`unknown room: ${request.Room}`);
    }

    for (const deco of room.PlacedDecos) {
        const entry = Object.entries(ExportResources).find(arr => arr[1].deco == deco.Type);
        if (!entry) {
            throw new Error(`unknown deco type: ${deco.Type}`);
        }
        const [itemType, meta] = entry;
        if (meta.capacityCost === undefined) {
            throw new Error(`unknown deco type: ${deco.Type}`);
        }

        // refund item
        if (deco.Sockets !== undefined) {
            addFusionTreasures(inventory, [{ ItemType: itemType, Sockets: deco.Sockets, ItemCount: 1 }]);
        } else {
            addShipDecorations(inventory, [{ ItemType: itemType, ItemCount: 1 }]);
        }

        // refund capacity
        room.MaxCapacity += meta.capacityCost;
    }

    // empty room
    room.PlacedDecos.splice(0, room.PlacedDecos.length);

    await Promise.all([personalRooms.save(), inventory.save()]);

    return {
        ResetRoom: request.Room,
        ClaimedDecos: [], // Not sure what this is for; the client already implies that the decos were returned to inventory.
        NewCapacity: room.MaxCapacity
    };
};

export const handleSetPlacedDecoInfo = async (accountId: string, req: ISetPlacedDecoInfoRequest): Promise<void> => {
    if (req.GuildId && req.ComponentId) {
        const guild = (await Guild.findById(req.GuildId))!;
        if (await hasGuildPermission(guild, accountId, GuildPermission.Decorator)) {
            const component = guild.DojoComponents.id(req.ComponentId)!;
            const deco = component.Decos!.find(x => x._id.equals(req.DecoId))!;
            deco.PictureFrameInfo = req.PictureFrameInfo;
            await guild.save();
        }
        return;
    }

    const personalRooms = await getPersonalRooms(accountId);

    const room = getRoomsForBootLocation(personalRooms, req).find(room => room.Name === req.Room);
    if (!room) {
        throw new Error(`unknown room: ${req.Room}`);
    }

    const placedDeco = room.PlacedDecos.id(req.DecoId);
    if (!placedDeco) {
        throw new Error(`unknown deco id: ${req.DecoId}`);
    }

    placedDeco.PictureFrameInfo = req.PictureFrameInfo;
    placedDeco.CustomizationInfo = req.CustomizationInfo ? convertCustomizationInfo(req.CustomizationInfo) : undefined;
    placedDeco.AnimPoseItem = req.AnimPoseItem;

    await personalRooms.save();
};
