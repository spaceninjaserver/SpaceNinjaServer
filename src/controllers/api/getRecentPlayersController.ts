import type { RequestHandler } from "express";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "../../services/friendService.ts";

export const getRecentPlayersController: RequestHandler = async (req, res): Promise<void> => {
    const payload = getJSONfromString<IRecentPlayersPayload>(String(req.body));
    const promises: Promise<void>[] = [];
    for (const info of payload.RecentPlayers) {
        promises.push(addAccountDataToFriendInfo(info));
        promises.push(addInventoryDataToFriendInfo(info));
    }
    await Promise.all(promises);
    res.json(payload);
};

interface IRecentPlayersPayload {
    RecentPlayers: IFriendInfo[]; // in request, this is all defaulted except for _id and DisplayName
}
