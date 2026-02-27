import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";

export const ircDroppedController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req, "IRC");
    account.Dropped = true;
    await account.save();
    res.end();
};
