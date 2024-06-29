import { setShipCustomizations } from "@/src/services/shipCustomizationsService";
import { ISetShipCustomizationsRequest } from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const setShipCustomizationsController: RequestHandler = async (req, res) => {
    try {
        const setShipCustomizationsRequest = JSON.parse(String(req.body)) as ISetShipCustomizationsRequest;

        const setShipCustomizationsResponse = await setShipCustomizations(setShipCustomizationsRequest);
        res.json(setShipCustomizationsResponse);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error in setShipCustomizationsController: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
    }
};
