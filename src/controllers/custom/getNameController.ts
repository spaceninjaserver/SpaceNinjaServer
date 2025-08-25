import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";

export const getNameController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    res.json(account.DisplayName);
};
