import type { RequestHandler } from "express";
import { updateShipFeature } from "@/src/services/personalRoomsService";
import type { IUnlockShipFeatureRequest } from "@/src/types/requestTypes";
import { parseString } from "@/src/helpers/general";

export const unlockShipFeatureController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const shipFeatureRequest = JSON.parse((req.body as string).toString()) as IUnlockShipFeatureRequest;
    await updateShipFeature(accountId, shipFeatureRequest.Feature);
    res.send([]);
};
