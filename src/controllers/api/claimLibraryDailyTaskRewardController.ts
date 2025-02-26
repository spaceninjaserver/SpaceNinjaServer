import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const claimLibraryDailyTaskRewardController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);

    const rewardQuantity = inventory.LibraryActiveDailyTaskInfo!.RewardQuantity;
    const rewardStanding = inventory.LibraryActiveDailyTaskInfo!.RewardStanding;
    inventory.LibraryActiveDailyTaskInfo = undefined;
    inventory.LibraryAvailableDailyTaskInfo = undefined;

    let syndicate = inventory.Affiliations.find(x => x.Tag == "LibrarySyndicate");
    if (!syndicate) {
        syndicate = inventory.Affiliations[inventory.Affiliations.push({ Tag: "LibrarySyndicate", Standing: 0 }) - 1];
    }
    syndicate.Standing += rewardStanding;

    inventory.FusionPoints += 80 * rewardQuantity;
    await inventory.save();

    res.json({
        RewardItem: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/RareFusionBundle",
        RewardQuantity: rewardQuantity,
        StandingAwarded: rewardStanding,
        InventoryChanges: {
            FusionPoints: 80 * rewardQuantity
        }
    });
};
