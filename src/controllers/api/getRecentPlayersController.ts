import type { RequestHandler } from "express";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "../../services/friendService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { fromOid, toOid2 } from "../../helpers/inventoryHelpers.ts";
import { Account } from "../../models/loginModel.ts";

export const getRecentPlayersController: RequestHandler = async (req, res): Promise<void> => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<IRecentPlayersPayload>(String(req.body));
    const results: IFriendInfo[] = [];
    for (const info of payload.RecentPlayers) {
        try {
            if (!fromOid(info._id)) {
                // U18 may provide an empty $id but with a DisplayName for us to look us.
                const otherAccount = await Account.findOne({ DisplayName: info.DisplayName }, "_id");
                if (!otherAccount) {
                    continue;
                }
                info._id = toOid2(otherAccount._id, account.BuildLabel);
            }
            await Promise.all([
                addAccountDataToFriendInfo(info, account.BuildLabel),
                addInventoryDataToFriendInfo(info)
            ]);
            results.push(info);
        } catch (_) {
            /* empty */
        }
    }
    res.json({ RecentPlayers: results });
};

interface IRecentPlayersPayload {
    RecentPlayers: IFriendInfo[]; // in request, this is all defaulted except for _id and DisplayName
}
