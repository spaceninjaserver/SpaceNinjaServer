import { addString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addFixedLevelRewards } from "../../services/missionInventoryUpdateService.ts";
import { handleStoreItemAcquisition } from "../../services/purchaseService.ts";
import type { IMissionReward } from "../../types/missionTypes.ts";
import type { RequestHandler } from "express";
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
    addString(inventory.NodeIntrosCompleted, "CetusSyndicate_IntroJob");
    await inventory.save();
    res.end();
};
