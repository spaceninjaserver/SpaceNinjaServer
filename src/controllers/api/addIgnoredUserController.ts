import { toOid } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Account, Ignore } from "@/src/models/loginModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IFriendInfo } from "@/src/types/friendTypes";
import { RequestHandler } from "express";

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
