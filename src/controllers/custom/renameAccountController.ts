import { RequestHandler } from "express";
import { getAccountForRequest, isNameTaken } from "@/src/services/loginService";

export const renameAccountController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (typeof req.query.newname == "string") {
        if (await isNameTaken(req.query.newname)) {
            res.status(409).json("Name already in use");
        } else {
            account.DisplayName = req.query.newname;
            await account.save();
            res.end();
        }
    } else {
        res.status(400).end();
    }
};
