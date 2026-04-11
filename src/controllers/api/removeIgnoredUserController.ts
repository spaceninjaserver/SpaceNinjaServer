import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Account, Ignore } from "../../models/loginModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const removeIgnoredUserController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IRemoveIgnoredUserRequest>(String(req.body));
    const ignoreeAccount = await Account.findOne(
        { DisplayName: data.playerName.substring(0, data.playerName.length - 1) },
        "_id"
    );
    if (ignoreeAccount) {
        await Ignore.deleteOne({ ignorer: accountId, ignoree: ignoreeAccount._id });
    }
    res.end();
};

interface IRemoveIgnoredUserRequest {
    playerName: string;
}
