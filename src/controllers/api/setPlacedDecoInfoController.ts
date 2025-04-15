import { getAccountIdForRequest } from "@/src/services/loginService";
import { IPictureFrameInfo, ISetPlacedDecoInfoRequest } from "@/src/types/shipTypes";
import { RequestHandler } from "express";
import { handleSetPlacedDecoInfo } from "@/src/services/shipCustomizationsService";

export const setPlacedDecoInfoController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = JSON.parse(req.body as string) as ISetPlacedDecoInfoRequest;
    await handleSetPlacedDecoInfo(accountId, payload);
    res.json({
        DecoId: payload.DecoId,
        IsPicture: true,
        PictureFrameInfo: payload.PictureFrameInfo,
        BootLocation: payload.BootLocation
    } satisfies ISetPlacedDecoInfoResponse);
};

interface ISetPlacedDecoInfoResponse {
    DecoId: string;
    IsPicture: boolean;
    PictureFrameInfo?: IPictureFrameInfo;
    BootLocation?: string;
}
