import { addString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addFixedLevelRewards } from "@/src/services/missionInventoryUpdateService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { IMissionReward } from "@/src/types/missionTypes";
import { RequestHandler } from "express";
import { ExportRegions } from "warframe-public-export-plus";

export const completeAllMissionsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const MissionRewards: IMissionReward[] = [];
    for (const [tag, node] of Object.entries(ExportRegions)) {
        if (!inventory.Missions.find(x => x.Tag == tag)) {
            inventory.Missions.push({
                Completes: 1,
                Tier: 1,
                Tag: tag
            });

            if (node.missionReward) {
                console.log(node.missionReward);
                addFixedLevelRewards(node.missionReward, inventory, MissionRewards);
            }
        }
    }
    for (const reward of MissionRewards) {
        await handleStoreItemAcquisition(reward.StoreItem, inventory, reward.ItemCount, undefined, true);
    }
    addString(inventory.NodeIntrosCompleted, "TeshinHardModeUnlocked");
    await inventory.save();
    res.end();
};
