import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { IPictureFrameInfo } from "@/src/types/shipTypes";

export const setPlacedDecoInfoController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    const payload = JSON.parse(req.body as string) as ISetPlacedDecoInfoRequest;

    const room = personalRooms.Ship.Rooms.find(room => room.Name === payload.Room);
    if (!room) {
        throw new Error("room not found");
    }

    const placedDeco = room.PlacedDecos?.find(x => x._id.toString() == payload.DecoId);
    if (!placedDeco) {
        throw new Error("deco not found");
    }

    placedDeco.PictureFrameInfo = payload.PictureFrameInfo;

    await personalRooms.save();

    res.end();
};

interface ISetPlacedDecoInfoRequest {
    DecoType: string;
    DecoId: string;
    Room: string;
    PictureFrameInfo: IPictureFrameInfo;
    BootLocation: string;
}
