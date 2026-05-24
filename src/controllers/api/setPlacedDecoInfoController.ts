import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { ISetPlacedDecoInfoRequest } from "../../types/personalRoomsTypes.ts";
import type { RequestHandler } from "express";
import { handleSetPlacedDecoInfo } from "../../services/shipCustomizationsService.ts";
import { logger } from "../../utils/logger.ts";

export const setPlacedDecoInfoController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(req.body as string) as ISetPlacedDecoInfoRequest;
    logger.trace("setPlacedDecoInfo request:", payload);
    await handleSetPlacedDecoInfo(accountId, payload);
    res.json({
        ...payload,
        IsPicture: !!payload.PictureFrameInfo
    } satisfies ISetPlacedDecoInfoResponse);
};

interface ISetPlacedDecoInfoResponse extends ISetPlacedDecoInfoRequest {
    IsPicture: boolean;
}
