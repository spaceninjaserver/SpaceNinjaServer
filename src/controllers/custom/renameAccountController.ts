import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";

export const renameAccountController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (typeof req.query.newname == "string") {
        account.DisplayName = req.query.newname;
        await account.save();
        res.end();
    } else {
        res.status(400).end();
    }
};
