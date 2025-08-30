import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

const allEudicoHeistJobs = [
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyOne",
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyTwo",
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyThree",
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyFour"
];

export const unlockAllProfitTakerStagesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "CompletedJobChains");
    inventory.CompletedJobChains ??= [];
    const chain = inventory.CompletedJobChains.find(x => x.LocationTag == "EudicoHeists");
    if (chain) {
        chain.Jobs = allEudicoHeistJobs;
    } else {
        inventory.CompletedJobChains.push({ LocationTag: "EudicoHeists", Jobs: allEudicoHeistJobs });
    }
    await inventory.save();
    res.end();
};
