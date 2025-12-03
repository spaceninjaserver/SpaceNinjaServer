import type { RequestHandler } from "express";
import { getWorldState, populateDailyDeal, populateFissures } from "../../services/worldStateService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../../static/fixed_responses/gameToBuildVersion.json" with { type: "json" };

export const worldStateController: RequestHandler = async (req, res) => {
    const buildLabel = req.query.buildLabel as string | undefined;
    const worldState = getWorldState(buildLabel);

    const populatePromises = [populateDailyDeal(worldState)];

    // Omitting void fissures for versions prior to Dante Unbound to avoid script errors.
    if (!buildLabel || version_compare(buildLabel, gameToBuildVersion["35.5.0"]) >= 0) {
        populatePromises.push(populateFissures(worldState));
    }

    await Promise.all(populatePromises);

    res.json(worldState);
};
