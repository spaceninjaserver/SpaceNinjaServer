import type { RequestHandler, Response } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Account } from "../../models/loginModel.ts";

export const getAccountIdPostController: RequestHandler = (req, res) => {
    const { targetName } = getJSONfromString<IGetAccountIdRequest>(String(req.body));
    return getAccountId(targetName, res);
};

export const getAccountIdGetController: RequestHandler = (req, res) => {
    return getAccountId(req.query.targetName as string, res);
};

const getAccountId = async (targetName: string, res: Response): Promise<void> => {
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
