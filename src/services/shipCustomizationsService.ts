import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { getShip } from "@/src/services/shipService";
import {
    ISetShipCustomizationsRequest,
    IShipDecorationsRequest,
    IShipDecorationsResponse,
    ISetPlacedDecoInfoRequest
} from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { Types } from "mongoose";
import { addShipDecorations, getInventory } from "./inventoryService";
import { config } from "./configService";
import { Guild } from "../models/guildModel";
import { hasGuildPermission } from "./guildService";
import { GuildPermission } from "../types/guildTypes";

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
            personalRooms.ShipInteriorColors = shipCustomization.Customization.Colors;
        }
        await personalRooms.save();
    }
};

export const handleSetShipDecorations = async (
    accountId: string,
    placedDecoration: IShipDecorationsRequest
): Promise<IShipDecorationsResponse> => {
    const personalRooms = await getPersonalRooms(accountId);

    const rooms =
        placedDecoration.BootLocation == "SHOP"
            ? personalRooms.TailorShop.Rooms
            : placedDecoration.IsApartment
              ? personalRooms.Apartment.Rooms
              : personalRooms.Ship.Rooms;

    const roomToPlaceIn = rooms.find(room => room.Name === placedDecoration.Room);

    if (!roomToPlaceIn) {
        throw new Error("room not found");
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
                MaxCapacityIncrease: 0 // TODO: calculate capacity change upon removal
            };
        }

        //moved to a different room
        const oldRoom = rooms.find(room => room.Name === placedDecoration.OldRoom);

        if (!oldRoom) {
            logger.error("old room not found");
            throw new Error("old room not found");
        }

        oldRoom.PlacedDecos.pull({ _id: placedDecoration.MoveId });

        const newDecoration = {
            Type: placedDecoration.Type,
            Pos: placedDecoration.Pos,
            Rot: placedDecoration.Rot,
            Scale: placedDecoration.Scale,
            _id: placedDecoration.MoveId
        };

        //the new room is still roomToPlaceIn
        roomToPlaceIn.PlacedDecos.push(newDecoration);
        await personalRooms.save();
        return {
            OldRoom: placedDecoration.OldRoom,
            NewRoom: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: 0 // TODO: calculate capacity change upon removal
        };
    }

    if (placedDecoration.RemoveId) {
        roomToPlaceIn.PlacedDecos.pull({ _id: placedDecoration.RemoveId });
        await personalRooms.save();

        if (!config.unlockAllShipDecorations) {
            const inventory = await getInventory(accountId);
            addShipDecorations(inventory, [{ ItemType: placedDecoration.Type, ItemCount: 1 }]);
            await inventory.save();
        }

        return {
            DecoId: placedDecoration.RemoveId,
            Room: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: 0
        };
    } else {
        if (!config.unlockAllShipDecorations) {
            const inventory = await getInventory(accountId);
            addShipDecorations(inventory, [{ ItemType: placedDecoration.Type, ItemCount: -1 }]);
            await inventory.save();
        }
    }

    // TODO: handle capacity

    //place decoration
    const decoId = new Types.ObjectId();
    roomToPlaceIn.PlacedDecos.push({
        Type: placedDecoration.Type,
        Pos: placedDecoration.Pos,
        Rot: placedDecoration.Rot,
        Scale: placedDecoration.Scale,
        _id: decoId
    });

    await personalRooms.save();

    return { DecoId: decoId.toString(), Room: placedDecoration.Room, IsApartment: placedDecoration.IsApartment };
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

    const room = personalRooms.Ship.Rooms.find(room => room.Name === req.Room);
    if (!room) {
        throw new Error("room not found");
    }

    const placedDeco = room.PlacedDecos.id(req.DecoId);
    if (!placedDeco) {
        throw new Error("deco not found");
    }

    placedDeco.PictureFrameInfo = req.PictureFrameInfo;

    await personalRooms.save();
};
