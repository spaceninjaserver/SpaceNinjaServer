import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";

export const getNameController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    res.json(account.DisplayName);
};
