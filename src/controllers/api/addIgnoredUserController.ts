import { toOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Account, Ignore } from "../../models/loginModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import type { RequestHandler } from "express";

export const addIgnoredUserController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IAddIgnoredUserRequest>(String(req.body));
    const ignoreeAccount = await Account.findOne(
        { DisplayName: data.playerName.substring(0, data.playerName.length - 1) },
        "_id"
    );
    if (ignoreeAccount) {
        await Ignore.create({ ignorer: accountId, ignoree: ignoreeAccount._id });
        res.json({
            Ignored: {
                _id: toOid(ignoreeAccount._id),
                DisplayName: data.playerName
            } satisfies IFriendInfo
        });
    } else {
        res.status(400).end();
    }
};

interface IAddIgnoredUserRequest {
    playerName: string;
}
