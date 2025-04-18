import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Account, Ignore } from "@/src/models/loginModel";
import { getAccountForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const removeIgnoredUserController: RequestHandler = async (req, res) => {
    const accountId = await getAccountForRequest(req);
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
