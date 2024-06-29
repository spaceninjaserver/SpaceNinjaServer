import { RequestHandler } from "express";
import { unlockShipFeature } from "@/src/services/personalRoomsService";
import { parseString } from "@/src/helpers/general";

export interface IUnlockShipFeatureRequest {
    Feature: string;
    KeyChain: string;
    ChainStage: number;
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const unlockShipFeatureController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    const shipFeatureRequest = JSON.parse(String(req.body)) as IUnlockShipFeatureRequest;
    await unlockShipFeature(accountId, shipFeatureRequest.Feature);
    res.send([]);
};
