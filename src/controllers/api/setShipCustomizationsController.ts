import { getAccountIdForRequest } from "@/src/services/loginService";
import { setShipCustomizations } from "@/src/services/shipCustomizationsService";
import { ISetShipCustomizationsRequest } from "@/src/types/shipTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const setShipCustomizationsController: RequestHandler = async (req, res) => {
    try {
        const accountId = await getAccountIdForRequest(req);
        const setShipCustomizationsRequest = JSON.parse(req.body as string) as ISetShipCustomizationsRequest;

        const setShipCustomizationsResponse = await setShipCustomizations(accountId, setShipCustomizationsRequest);
        res.json(setShipCustomizationsResponse);
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error in setShipCustomizationsController: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
    }
};
