import type { RequestHandler } from "express";
import { updateShipFeature } from "../../services/personalRoomsService.ts";
import type { IUnlockShipFeatureRequest } from "../../types/requestTypes.ts";
import { parseString } from "../../helpers/general.ts";

export const unlockShipFeatureController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const shipFeatureRequest = JSON.parse((req.body as string).toString()) as IUnlockShipFeatureRequest;
    await updateShipFeature(accountId, shipFeatureRequest.Feature);
    res.send([]);
};
