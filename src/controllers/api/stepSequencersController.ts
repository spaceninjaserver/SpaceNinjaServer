import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { IStepSequencer } from "@/src/types/inventoryTypes/inventoryTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const stepSequencersController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const stepSequencer = JSON.parse(req.body.toString()) as IStepSequencer;
    delete stepSequencer.ItemId;
    const stepSequencerIndex = inventory.StepSequencers.push(stepSequencer);
    const changedInventory = await inventory.save();
    res.json(changedInventory.StepSequencers[stepSequencerIndex - 1]); // unsure about the expected response format, but it seems anything works.
};
