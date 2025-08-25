import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IShipDecorationsRequest, IResetShipDecorationsRequest } from "@/src/types/personalRoomsTypes";
import type { RequestHandler } from "express";
import { handleResetShipDecorations, handleSetShipDecorations } from "@/src/services/shipCustomizationsService";

export const shipDecorationsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    if (req.query.reset == "1") {
        const request = JSON.parse(req.body as string) as IResetShipDecorationsRequest;
        const response = await handleResetShipDecorations(accountId, request);
        res.send(response);
    } else {
        const shipDecorationsRequest = JSON.parse(req.body as string) as IShipDecorationsRequest;
        const placedDecoration = await handleSetShipDecorations(accountId, shipDecorationsRequest);
        res.send(placedDecoration);
    }
};
