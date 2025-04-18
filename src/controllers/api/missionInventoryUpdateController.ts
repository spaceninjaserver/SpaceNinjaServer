import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMissionInventoryUpdateRequest } from "@/src/types/requestTypes";
import { addMissionInventoryUpdates, addMissionRewards } from "@/src/services/missionInventoryUpdateService";
import { getInventory } from "@/src/services/inventoryService";
import { getInventoryResponse } from "./inventoryController";
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
//move credit calc in here, return MissionRewards: [] if no reward info
export const missionInventoryUpdateController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);
    const missionReport = getJSONfromString<IMissionInventoryUpdateRequest>((req.body as string).toString());
    logger.debug("mission report:", missionReport);

    const inventory = await getInventory(accountId);
    const firstCompletion = missionReport.SortieId
        ? inventory.CompletedSorties.indexOf(missionReport.SortieId) == -1
        : false;
    const inventoryUpdates = await addMissionInventoryUpdates(inventory, missionReport);

    if (
        missionReport.MissionStatus !== "GS_SUCCESS" &&
        !(missionReport.RewardInfo?.jobId || missionReport.RewardInfo?.challengeMissionId)
    ) {
        await inventory.save();
        const inventoryResponse = await getInventoryResponse(inventory, true);
        res.json({
            InventoryJson: JSON.stringify(inventoryResponse),
            MissionRewards: []
        });
        return;
    }

    const { MissionRewards, inventoryChanges, credits, AffiliationMods, SyndicateXPItemReward } =
        await addMissionRewards(inventory, missionReport, firstCompletion);

    await inventory.save();
    const inventoryResponse = await getInventoryResponse(inventory, true);

    //TODO: figure out when to send inventory. it is needed for many cases.
    res.json({
        InventoryJson: JSON.stringify(inventoryResponse),
        InventoryChanges: inventoryChanges,
        MissionRewards,
        ...credits,
        ...inventoryUpdates,
        FusionPoints: inventoryChanges?.FusionPoints,
        SyndicateXPItemReward,
        AffiliationMods
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
