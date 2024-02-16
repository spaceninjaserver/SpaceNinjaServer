import { getPersonalRooms } from "@/src/controllers/api/getShipController";
import { parseString } from "@/src/helpers/general";
import { getShip } from "@/src/services/shipService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { Types } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const shipDecorationsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const shipDecorationsRequest = JSON.parse(req.body as string) as IShipDecorationsRequest;
    console.log(shipDecorationsRequest);

    try {
        const placedDecoration = await handleSetShipDecorations(accountId, shipDecorationsRequest);
        res.send(placedDecoration);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error in saveLoadoutController: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
    }
};

const handleSetShipDecorations = async (
    accountId: string,
    placedDecoration: IShipDecorationsRequest
): Promise<IShipDecorationsResponse> => {
    const personalRooms = await getPersonalRooms(accountId);
    console.log(placedDecoration);

    const room = personalRooms.Ship.Rooms.find(room => room.Name === placedDecoration.Room);

    //TODO: check whether to remove from shipitems

    if (placedDecoration.RemoveId) {
        room?.PlacedDecos?.pull({ _id: placedDecoration.RemoveId });
        await personalRooms.save();
        return {
            DecoId: placedDecoration.RemoveId,
            Room: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: 0
        };
    }

    // TODO: handle capacity

    const decoId = new Types.ObjectId();
    room?.PlacedDecos?.push({
        Type: placedDecoration.Type,
        Pos: placedDecoration.Pos,
        Rot: placedDecoration.Rot,
        _id: decoId
    });

    await personalRooms.save();

    return { DecoId: decoId.toString(), Room: placedDecoration.Room, IsApartment: placedDecoration.IsApartment };
};

export interface IShipDecorationsRequest {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    Room: string;
    IsApartment: boolean;
    RemoveId: string;
}

export interface IShipDecorationsResponse {
    DecoId: string;
    Room: string;
    IsApartment: boolean;
    MaxCapacityIncrease?: number;
}
