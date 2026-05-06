import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IStepSequencerClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import { Types } from "mongoose";

export const stepSequencersController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "StepSequencers");
    const payload = JSON.parse(String(req.body)) as IStepSequencerClient;
    let stepSequencerId = payload.ItemId.$oid;
    if (stepSequencerId == "000000000000000000000000") {
        stepSequencerId = new Types.ObjectId().toString();
        inventory.StepSequencers.push({
            NotePacks: payload.NotePacks,
            FingerPrint: payload.FingerPrint,
            Name: payload.Name,
            _id: stepSequencerId
        });
    } else {
        const stepSequencer = inventory.StepSequencers.id(stepSequencerId)!;
        stepSequencer.NotePacks = payload.NotePacks;
        stepSequencer.FingerPrint = payload.FingerPrint;
        stepSequencer.Name = payload.Name;
    }
    await inventory.save();
    res.json({ $oid: stepSequencerId });
};
