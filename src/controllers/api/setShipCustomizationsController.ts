import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const setShipCustomizationsController: RequestHandler = (_req, res) => {
    try {
        res.send(200);
        handleSetShipDecorations();
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error in saveLoadoutController: ${error.message}`);
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: "unknown error" });
        }
    }

    function handleSetShipDecorations() {}
};
