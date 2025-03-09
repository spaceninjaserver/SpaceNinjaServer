import { getAccountForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const ircDroppedController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    account.Dropped = true;
    await account.save();
    res.end();
};
