import { RequestHandler } from "express";
import { getWorldState, populateDailyDeal, populateFissures } from "@/src/services/worldStateService";
import { version_compare } from "@/src/helpers/inventoryHelpers";

export const worldStateController: RequestHandler = async (req, res) => {
    const buildLabel = req.query.buildLabel as string | undefined;
    const worldState = getWorldState(buildLabel);

    const populatePromises = [populateDailyDeal(worldState)];

    // Omitting void fissures for versions prior to Dante Unbound to avoid script errors.
    if (!buildLabel || version_compare(buildLabel, "2024.03.24.20.00") >= 0) {
        populatePromises.push(populateFissures(worldState));
    }

    await Promise.all(populatePromises);

    res.json(worldState);
};
