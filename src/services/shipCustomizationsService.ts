import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { getShip } from "@/src/services/shipService";
import {
    ISetShipCustomizationsRequest,
    IShipDatabase,
    IShipDecorationsRequest,
    IShipDecorationsResponse
} from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { Types } from "mongoose";

export const setShipCustomizations = async (shipCustomization: ISetShipCustomizationsRequest) => {
    const ship = await getShip(new Types.ObjectId(shipCustomization.ShipId));

    let shipChanges: Partial<IShipDatabase>;
    if (shipCustomization.IsExterior) {
        shipChanges = {
            ShipExteriorColors: shipCustomization.Customization.Colors,
            SkinFlavourItem: shipCustomization.Customization.SkinFlavourItem,
            ShipAttachments: shipCustomization.Customization.ShipAttachments,
            AirSupportPower: shipCustomization.AirSupportPower!
        };
    } else {
        shipChanges = {
            ShipInteriorColors: shipCustomization.Customization.Colors
        };
    }
    ship.set(shipChanges);

    await ship.save();
};

export const handleSetShipDecorations = async (
    accountId: string,
    placedDecoration: IShipDecorationsRequest
): Promise<IShipDecorationsResponse> => {
    const personalRooms = await getPersonalRooms(accountId);

    const rooms = placedDecoration.IsApartment ? personalRooms.Apartment.Rooms : personalRooms.Ship.Rooms;

    const roomToPlaceIn = rooms.find(room => room.Name === placedDecoration.Room);

    if (!roomToPlaceIn) {
        logger.error("room not found");
        throw new Error("room not found");
    }

    if (placedDecoration.MoveId) {
        //moved within the same room
        if (placedDecoration.OldRoom === placedDecoration.Room) {
            const existingDecorationIndex = roomToPlaceIn?.PlacedDecos?.findIndex(
                deco => deco._id.toString() === placedDecoration.MoveId
            );

            if (existingDecorationIndex === -1) {
                logger.error("decoration to be moved not found");
                throw new Error("decoration to be moved not found");
            }

            roomToPlaceIn.PlacedDecos[existingDecorationIndex].Pos = placedDecoration.Pos;
            roomToPlaceIn.PlacedDecos[existingDecorationIndex].Rot = placedDecoration.Rot;

            if (placedDecoration.Scale) {
                roomToPlaceIn.PlacedDecos[existingDecorationIndex].Scale = placedDecoration.Scale;
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
            Scale: placedDecoration.Scale || 1,
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

    //TODO: check whether to remove from shipitems

    if (placedDecoration.RemoveId) {
        roomToPlaceIn.PlacedDecos.pull({ _id: placedDecoration.RemoveId });
        await personalRooms.save();
        return {
            DecoId: placedDecoration.RemoveId,
            Room: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: 0
        };
    }

    // TODO: handle capacity

    //place decoration
    const decoId = new Types.ObjectId();
    roomToPlaceIn.PlacedDecos?.push({
        Type: placedDecoration.Type,
        Pos: placedDecoration.Pos,
        Rot: placedDecoration.Rot,
        Scale: placedDecoration.Scale || 1,
        _id: decoId
    });

    await personalRooms.save();

    return { DecoId: decoId.toString(), Room: placedDecoration.Room, IsApartment: placedDecoration.IsApartment };
};
