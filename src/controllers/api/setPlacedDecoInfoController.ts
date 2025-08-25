import { getAccountIdForRequest } from "@/src/services/loginService";
import type { ISetPlacedDecoInfoRequest } from "@/src/types/personalRoomsTypes";
import type { RequestHandler } from "express";
import { handleSetPlacedDecoInfo } from "@/src/services/shipCustomizationsService";

export const setPlacedDecoInfoController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(req.body as string) as ISetPlacedDecoInfoRequest;
    //console.log(JSON.stringify(payload, null, 2));
    await handleSetPlacedDecoInfo(accountId, payload);
    res.json({
        ...payload,
        IsPicture: !!payload.PictureFrameInfo
    } satisfies ISetPlacedDecoInfoResponse);
};

interface ISetPlacedDecoInfoResponse extends ISetPlacedDecoInfoRequest {
    IsPicture: boolean;
}
