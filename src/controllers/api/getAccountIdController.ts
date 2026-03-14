import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Account } from "../../models/loginModel.ts";

export const getAccountIdController: RequestHandler = async (req, res) => {
    let { targetName } = getJSONfromString<IGetAccountIdRequest>(String(req.body));
    if (targetName.charCodeAt(targetName.length - 1) >= 0xe000) {
        targetName = targetName.substring(0, targetName.length - 1);
    }
    const account = await Account.findOne({ DisplayName: targetName }, "_id DisplayName");
    if (account) {
        res.send(`${account._id.toString()},${account.DisplayName}`);
    } else {
        res.status(409).send("Given Username does not exist.");
    }
};

interface IGetAccountIdRequest {
    targetName: string;
}
