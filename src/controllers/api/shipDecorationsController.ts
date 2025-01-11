import { getAccountIdForRequest } from "@/src/services/loginService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { TBootLocation } from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { Types } from "mongoose";

interface IShipDecorationsRequest {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    Room: string;
    BootLocation?: TBootLocation;
    IsApartment?: boolean;
    RemoveId?: string;
    MoveId?: string;
    OldRoom?: string;
    Scale?: number;
}

interface IShipDecorationsResponse {
    DecoId?: string;
    Room?: string;
    IsApartment?: boolean;
    MaxCapacityIncrease?: number;
    OldRoom?: string;
    NewRoom?: string;
}

const handleSetShipDecorations = async (
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
            const existingDecorationIndex = roomToPlaceIn?.PlacedDecos?.findIndex(
                deco => deco._id.toString() === placedDecoration.MoveId
            );

            if (existingDecorationIndex === -1) {
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
        Scale: placedDecoration.Scale,
        _id: decoId
    });

    await personalRooms.save();

    return { DecoId: decoId.toString(), Room: placedDecoration.Room, IsApartment: placedDecoration.IsApartment };
};

export const shipDecorationsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const shipDecorationsRequest = JSON.parse(req.body as string) as IShipDecorationsRequest;
    const placedDecoration = await handleSetShipDecorations(accountId, shipDecorationsRequest);
    res.send(placedDecoration);
};
