import { getAccountIdForRequest } from "@/src/services/loginService";
import { IShipDecorationsRequest } from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { handleSetShipDecorations } from "@/src/services/shipCustomizationsService";

export const shipDecorationsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const shipDecorationsRequest = JSON.parse(req.body as string) as IShipDecorationsRequest;

    try {
        const placedDecoration = await handleSetShipDecorations(accountId, shipDecorationsRequest);
        res.send(placedDecoration);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error in shipDecorationsController: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
    }
};
