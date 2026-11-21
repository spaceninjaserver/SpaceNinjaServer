import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
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
    let count = 0;
    for (const [LocationTag, Jobs] of [
        ["EudicoHeists", allEudicoHeistJobs],
        ["NokkoColony", allNokkoColonyJobs]
    ] as const) {
        const added = await Inventory.updateOne(
            { accountOwnerId: accountId, "CompletedJobChains.LocationTag": LocationTag },
            { $addToSet: { "CompletedJobChains.$.Jobs": { $each: Jobs } } }
        );
        if (added.matchedCount == 0) {
            await Inventory.updateOne(
                { accountOwnerId: accountId },
                { $push: { CompletedJobChains: { LocationTag, Jobs } } }
            );
            ++count;
        } else {
            count += added.modifiedCount;
        }
    }
    if (count != 0) {
        sendWsBroadcastToGame(accountId, { sync_inventory: true });
    }
    res.json({ count });
};
