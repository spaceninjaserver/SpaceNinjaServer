import { parseString } from "@/src/helpers/general";
import { IShipDecorationsRequest } from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { handleSetShipDecorations } from "@/src/services/shipCustomizationsService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const shipDecorationsController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const shipDecorationsRequest = JSON.parse(req.body as string) as IShipDecorationsRequest;

    try {
        const placedDecoration = await handleSetShipDecorations(accountId, shipDecorationsRequest);
        res.send(placedDecoration);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error in saveLoadoutController: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
    }
};
