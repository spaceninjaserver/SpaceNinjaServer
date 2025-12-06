import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import { sendWsBroadcastToGame } from "../../services/wsService.ts";

const allEudicoHeistJobs = [
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyOne",
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyTwo",
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyThree",
    "/Lotus/Types/Gameplay/Venus/Jobs/Heists/HeistProfitTakerBountyFour"
];

const allNokkoColonyJobs = [
    "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJobA",
    "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJobB",
    "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJobC",
    "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJobSteelPathA",
    "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJobSteelPathB",
    "/Lotus/Types/Gameplay/NokkoColony/Jobs/NokkoJobSteelPathC"
];

export const unlockAllJobChainBountiesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "CompletedJobChains");
    inventory.CompletedJobChains ??= [];

    const eudicoHeistsChain = inventory.CompletedJobChains.find(x => x.LocationTag == "EudicoHeists");
    if (eudicoHeistsChain) {
        eudicoHeistsChain.Jobs = allEudicoHeistJobs;
    } else {
        inventory.CompletedJobChains.push({ LocationTag: "EudicoHeists", Jobs: allEudicoHeistJobs });
    }

    const nokkoColonyChain = inventory.CompletedJobChains.find(x => x.LocationTag == "NokkoColony");
    if (nokkoColonyChain) {
        nokkoColonyChain.Jobs = allNokkoColonyJobs;
    } else {
        inventory.CompletedJobChains.push({ LocationTag: "NokkoColony", Jobs: allNokkoColonyJobs });
    }

    await inventory.save();
    res.end();
    sendWsBroadcastToGame(accountId, { sync_inventory: true });
};
