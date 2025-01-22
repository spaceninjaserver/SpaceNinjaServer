import { RequestHandler } from "express";
import { updateShipFeature } from "@/src/services/personalRoomsService";
import { IUnlockShipFeatureRequest } from "@/src/types/requestTypes";
import { parseString } from "@/src/helpers/general";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const unlockShipFeatureController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    const shipFeatureRequest = JSON.parse((req.body as string).toString()) as IUnlockShipFeatureRequest;
    await updateShipFeature(accountId, shipFeatureRequest.Feature);
    res.send([]);
};
