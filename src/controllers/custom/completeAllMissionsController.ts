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
        let mission = inventory.Missions.find(x => x.Tag == tag);
        if (!mission) {
            mission =
                inventory.Missions[
                    inventory.Missions.push({
                        Completes: 0,
                        Tier: 0,
                        Tag: tag
                    }) - 1
                ];
        }
        if (mission.Completes == 0) {
            mission.Completes++;
            if (node.missionReward) {
                addFixedLevelRewards(node.missionReward, MissionRewards);
            }
        }
        mission.Tier = 1;
    }
    for (const reward of MissionRewards) {
        await handleStoreItemAcquisition(reward.StoreItem, inventory, reward.ItemCount, undefined, true);
    }
    addString(inventory.NodeIntrosCompleted, "TeshinHardModeUnlocked");
    await inventory.save();
    res.end();
};
