import type { RequestHandler } from "express";
import {
    getWorldState,
    populateDailyDeal,
    populateFeaturedGuilds,
    populateFissures
} from "../../services/worldStateService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { BL_LATEST } from "../../constants/gameVersions.ts";
import { getInventory2 } from "../../services/inventoryService.ts";

export const worldStateController: RequestHandler = async (req, res) => {
    let buildLabel: string;
    let elionWorkaroundNeeded = false;
    if (req.query.accountId) {
        const account = await getAccountForRequest(req);
        buildLabel = getBuildLabel(req, account);
        if (buildLabel == "2013.07.04.20.17/") {
            const inventory = await getInventory2(account._id, "Missions");
            if (
                !inventory.Missions.some(x => x.Tag == "SolNode12" && x.Completes > 0) && // Not done Elion yet?
                (inventory.Missions.find(x => x.Tag == "SolNode119")?.Completes ?? 0) > 0 // but have done Caloris (mission before Elion)?
            ) {
                elionWorkaroundNeeded = true; // User is gonna need help in this buildLabel
            }
        }
    } else if (typeof req.query.buildLabel == "string") {
        buildLabel = req.query.buildLabel.replaceAll(" ", "+");
    } else {
        buildLabel = BL_LATEST;
    }

    const worldState = getWorldState(buildLabel);
    await Promise.all([
        populateDailyDeal(worldState),
        populateFeaturedGuilds(worldState),
        populateFissures(worldState)
    ]);

    if (elionWorkaroundNeeded) {
        worldState.Alerts.push({
            _id: { $id: "e1i03119f130000000000000" },
            Activation: { sec: 0, usec: 0 },
            Expiry: { sec: 2000000000, usec: 0 },
            MissionInfo: {
                location: "SolNode12",
                completeTag: "SolNode12",
                missionType: "MT_RESCUE",
                faction: "FC_GRINEER",
                difficulty: 0.1,
                levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusLevel", // The issue seems to be with "/Lotus/Levels/Proc/Grineer/SimpleGrineerGalleonLevel" + MT_RESCUE, which Elion is, so this fixes it.
                enemySpec: "/Lotus/Types/Game/GrineerSquadOne",
                minEnemyLevel: 1,
                maxEnemyLevel: 3,
                descText: "Elion is bugged in this version. Use this alert to complete it instead!"
            }
        });
    }

    if (req.query.l) {
        for (const event of worldState.Events) {
            const msg = event.Messages.find(x => x.LanguageCode == req.query.l)?.Message ?? event.Msg;
            if (msg) {
                event.Messages = [{ Message: msg }];
            }
        }
    }

    res.json(worldState);
};
