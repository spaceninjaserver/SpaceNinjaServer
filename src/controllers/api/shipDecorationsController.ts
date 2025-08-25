import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IShipDecorationsRequest, IResetShipDecorationsRequest } from "../../types/personalRoomsTypes.ts";
import type { RequestHandler } from "express";
import { handleResetShipDecorations, handleSetShipDecorations } from "../../services/shipCustomizationsService.ts";

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
