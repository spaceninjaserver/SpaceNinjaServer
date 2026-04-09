import type { RequestHandler } from "express";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import { Account } from "../../models/loginModel.ts";

export const getRegisteredLosersController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        res.json(await Account.find({}, "id DisplayName"));
    } else {
        res.status(401).end();
    }
};
