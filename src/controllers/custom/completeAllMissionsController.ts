import { BL_LATEST } from "../../constants/gameVersions.ts";
import { addString } from "../../helpers/stringHelpers.ts";
import { addChallenges, ensureUserHasSteelPathRewards, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addFixedLevelRewards } from "../../services/missionInventoryUpdateService.ts";
import { handleStoreItemAcquisition } from "../../services/purchaseService.ts";
import type { IMissionReward } from "../../types/missionTypes.ts";
import type { RequestHandler } from "express";
import { ExportRegions } from "warframe-public-export-plus";

export const completeAllMissionsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, undefined);
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
                await addFixedLevelRewards(node.missionReward, MissionRewards, BL_LATEST);
            }
        }
        mission.Tier = 1;
    }
    for (const reward of MissionRewards) {
        await handleStoreItemAcquisition(reward.StoreItem, inventory, reward.ItemCount, undefined, true);
    }
    await addChallenges(BL_LATEST, inventory, [
        {
            Progress: 1,
            Name: `KillPhorid`
        },
        {
            Progress: 1,
            Name: `SaviourOfCeres`
        },
        {
            Progress: 1,
            Name: `SaviourOfEarth`
        },
        {
            Progress: 1,
            Name: `SaviourOfEuropa`
        },
        {
            Progress: 1,
            Name: `SaviourOfJupiter`
        },
        {
            Progress: 1,
            Name: `SaviourOfMars`
        },
        {
            Progress: 1,
            Name: `SaviourOfMercury`
        },
        {
            Progress: 1,
            Name: `SaviourOfNeptune`
        },
        {
            Progress: 1,
            Name: `SaviourOfPhobos`
        },
        {
            Progress: 1,
            Name: `SaviourOfPluto`
        },
        {
            Progress: 1,
            Name: `SaviourOfSaturn`
        },
        {
            Progress: 1,
            Name: `SaviourOfSedna`
        },
        {
            Progress: 1,
            Name: `SaviourOfUranus`
        },
        {
            Progress: 1,
            Name: `SaviourOfVenus`
        }
    ]);
    await ensureUserHasSteelPathRewards(inventory, true);
    addString(inventory.NodeIntrosCompleted, "TeshinHardModeUnlocked");
    addString(inventory.NodeIntrosCompleted, "CetusInvasionNodeIntro");
    addString(inventory.NodeIntrosCompleted, "CetusSyndicate_IntroJob");
    let syndicate = inventory.Affiliations.find(x => x.Tag == "CetusSyndicate");
    if (!syndicate) {
        syndicate =
            inventory.Affiliations[inventory.Affiliations.push({ Tag: "CetusSyndicate", Standing: 250, Title: 0 })]; // Non-zero standing avoids Konzu's "prove yourself" text. 250 is identical to newbie bounty + bonus
    }
    await inventory.save();
    res.end();
};
