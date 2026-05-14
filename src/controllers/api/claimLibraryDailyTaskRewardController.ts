import { addFusionPoints, getInventory2 } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const claimLibraryDailyTaskRewardController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory2(
        accountId,
        "LibraryActiveDailyTaskInfo",
        "LibraryAvailableDailyTaskInfo",
        "Affiliations",
        "infiniteEndo",
        "FusionPoints"
    );

    const rewardStoreItem = inventory.LibraryActiveDailyTaskInfo!.RewardStoreItem;
    const rewardEndo = rewardStoreItem == "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/RareFusionBundle" ? 80 : 50;
    const rewardQuantity = inventory.LibraryActiveDailyTaskInfo!.RewardQuantity;
    const rewardStanding = inventory.LibraryActiveDailyTaskInfo!.RewardStanding;
    inventory.LibraryActiveDailyTaskInfo = undefined;
    inventory.LibraryAvailableDailyTaskInfo = undefined;

    let syndicate = inventory.Affiliations.find(x => x.Tag == "LibrarySyndicate");
    if (!syndicate) {
        syndicate = inventory.Affiliations[inventory.Affiliations.push({ Tag: "LibrarySyndicate", Standing: 0 }) - 1];
    }
    syndicate.Standing += rewardStanding;

    addFusionPoints(inventory, rewardEndo * rewardQuantity);
    await inventory.save();

    res.json({
        RewardItem: rewardStoreItem,
        RewardQuantity: rewardQuantity,
        StandingAwarded: rewardStanding,
        InventoryChanges: {
            FusionPoints: rewardEndo * rewardQuantity
        }
    });
};
