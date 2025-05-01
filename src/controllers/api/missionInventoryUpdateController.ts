import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountForRequest } from "@/src/services/loginService";
import { IMissionInventoryUpdateRequest } from "@/src/types/requestTypes";
import { addMissionInventoryUpdates, addMissionRewards } from "@/src/services/missionInventoryUpdateService";
import { generateRewardSeed, getInventory } from "@/src/services/inventoryService";
import { getInventoryResponse } from "./inventoryController";
import { logger } from "@/src/utils/logger";
import { IMissionInventoryUpdateResponse } from "@/src/types/missionTypes";

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
//move credit calc in here, return MissionRewards: [] if no reward info
export const missionInventoryUpdateController: RequestHandler = async (req, res): Promise<void> => {
    const account = await getAccountForRequest(req);
    const missionReport = getJSONfromString<IMissionInventoryUpdateRequest>((req.body as string).toString());
    logger.debug("mission report:", missionReport);

    const inventory = await getInventory(account._id.toString());
    const firstCompletion = missionReport.SortieId
        ? inventory.CompletedSorties.indexOf(missionReport.SortieId) == -1
        : false;
    const inventoryUpdates = await addMissionInventoryUpdates(inventory, missionReport);

    if (
        missionReport.MissionStatus !== "GS_SUCCESS" &&
        !(missionReport.RewardInfo?.jobId || missionReport.RewardInfo?.challengeMissionId)
    ) {
        inventory.RewardSeed = generateRewardSeed();
        await inventory.save();
        const inventoryResponse = await getInventoryResponse(inventory, true, account.BuildLabel);
        res.json({
            InventoryJson: JSON.stringify(inventoryResponse),
            MissionRewards: []
        });
        return;
    }

    const {
        MissionRewards,
        inventoryChanges,
        credits,
        AffiliationMods,
        SyndicateXPItemReward,
        ConquestCompletedMissionsCount
    } = await addMissionRewards(inventory, missionReport, firstCompletion);

    inventory.RewardSeed = generateRewardSeed();
    await inventory.save();
    const inventoryResponse = await getInventoryResponse(inventory, true, account.BuildLabel);

    //TODO: figure out when to send inventory. it is needed for many cases.
    res.json({
        InventoryJson: JSON.stringify(inventoryResponse),
        InventoryChanges: inventoryChanges,
        MissionRewards,
        ...credits,
        ...inventoryUpdates,
        //FusionPoints: inventoryChanges?.FusionPoints, // This in combination with InventoryJson or InventoryChanges seems to just double the number of endo shown, so unsure when this is needed.
        SyndicateXPItemReward,
        AffiliationMods,
        ConquestCompletedMissionsCount
    } satisfies IMissionInventoryUpdateResponse);
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
