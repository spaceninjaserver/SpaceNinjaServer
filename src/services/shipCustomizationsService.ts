import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { ISetPlacedDecoInfoRequest } from "@/src/types/shipTypes";

export const handleSetPlacedDecoInfo = async (accountId: string, req: ISetPlacedDecoInfoRequest): Promise<void> => {
    const personalRooms = await getPersonalRooms(accountId);

    const room = personalRooms.Ship.Rooms.find(room => room.Name === req.Room);
    if (!room) {
        throw new Error("room not found");
    }

    const placedDeco = room.PlacedDecos?.find(x => x._id.toString() == req.DecoId);
    if (!placedDeco) {
        throw new Error("deco not found");
    }

    placedDeco.PictureFrameInfo = req.PictureFrameInfo;

    await personalRooms.save();
};
