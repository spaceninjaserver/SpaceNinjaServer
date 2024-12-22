import { getAccountIdForRequest } from "@/src/services/loginService";
import { ISetPlacedDecoInfoRequest } from "@/src/types/shipTypes";
import { RequestHandler } from "express";
import { handleSetPlacedDecoInfo } from "@/src/services/shipCustomizationsService";

export const setPlacedDecoInfoController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(req.body as string) as ISetPlacedDecoInfoRequest;
    await handleSetPlacedDecoInfo(accountId, payload);
    res.end();
};
