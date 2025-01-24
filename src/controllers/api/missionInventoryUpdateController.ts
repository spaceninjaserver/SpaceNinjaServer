import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMissionInventoryUpdateRequest } from "@/src/types/requestTypes";
import {
    addMissionInventoryUpdates,
    addMissionRewards,
    calculateFinalCredits
} from "@/src/services/missionInventoryUpdateService";
import { getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";
/*
**** INPUT ****
- [ ]  crossPlaySetting
- [ ]  rewardsMultiplier
- [ ]  ActiveBoosters
- [x]  LongGuns
- [x]  Pistols
- [x]  Suits
- [x]  Melee
- [x]  RawUpgrades
- [x]  MiscItems
- [x]  RegularCredits
- [ ]  RandomUpgradesIdentified
- [ ]  MissionFailed
- [ ]  MissionStatus
- [ ]  CurrentLoadOutIds
- [ ]  AliveTime
- [ ]  MissionTime
- [x]  Missions
- [ ]  CompletedAlerts
- [ ]  LastRegionPlayed
- [ ]  GameModeId
- [ ]  hosts
- [x]  ChallengeProgress
- [ ]  SeasonChallengeHistory
- [ ]  PS (anticheat data)
- [ ]  ActiveDojoColorResearch
- [x]  RewardInfo
- [ ]  ReceivedCeremonyMsg
- [ ]  LastCeremonyResetDate
- [ ]  MissionPTS (Used to validate the mission/alive time above.)
- [ ]  RepHash
- [ ]  EndOfMatchUpload
- [ ]  ObjectiveReached
- [ ]  FpsAvg
- [ ]  FpsMin
- [ ]  FpsMax
- [ ]  FpsSamples
*/

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const missionInventoryUpdateController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);

    const missionReport = getJSONfromString<IMissionInventoryUpdateRequest>((req.body as string).toString());

    const inventory = await getInventory(accountId);

    const missionRewardsResults = await addMissionRewards(inventory, missionReport);

    if (missionReport.MissionStatus !== "GS_SUCCESS") {
        const InventoryJson = JSON.stringify((await inventory.save()).toJSON());

        res.json({ InventoryJson, MissionRewards: [] });
        return;
    }

    if (!missionRewardsResults) {
        throw new Error("Failed to add mission rewards, should not happen");
    }

    const { MissionRewards, inventoryChanges, missionCompletionCredits } = missionRewardsResults;

    const inventoryUpdates = addMissionInventoryUpdates(inventory, missionReport);

    //creditBonus is not correct for mirage mission 3
    const credits = calculateFinalCredits(inventory, {
        missionCompletionCredits,
        missionDropCredits: missionReport.RegularCredits ?? 0,
        rngRewardCredits: inventoryChanges.RegularCredits as number
    });

    const InventoryJson = JSON.stringify((await inventory.save()).toJSON());

    //TODO: figure out when to send inventory. it is needed for many cases.
    res.json({
        InventoryJson,
        InventoryChanges: inventoryChanges,
        MissionRewards,
        ...credits,
        ...inventoryUpdates,
        FusionPoints: inventoryChanges.FusionPoints
    });
};

/*
**** OUTPUT ****
- [x]  InventoryJson
- [x]  MissionRewards
- [x]  TotalCredits
- [x]  CreditsBonus
- [x]  MissionCredits
- [x]  InventoryChanges
- [x]  FusionPoints
*/
