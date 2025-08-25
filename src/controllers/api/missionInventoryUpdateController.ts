import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { IMissionInventoryUpdateRequest } from "../../types/requestTypes.ts";
import { addMissionInventoryUpdates, addMissionRewards } from "../../services/missionInventoryUpdateService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getInventoryResponse } from "./inventoryController.ts";
import { logger } from "../../utils/logger.ts";
import type {
    IMissionInventoryUpdateResponse,
    IMissionInventoryUpdateResponseBackToDryDock,
    IMissionInventoryUpdateResponseRailjackInterstitial
} from "../../types/missionTypes.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import { generateRewardSeed } from "../../services/rngService.ts";

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
    const inventoryUpdates = await addMissionInventoryUpdates(account, inventory, missionReport);

    if (
        missionReport.MissionStatus !== "GS_SUCCESS" &&
        !(
            missionReport.RewardInfo?.jobId ||
            missionReport.RewardInfo?.challengeMissionId ||
            missionReport.RewardInfo?.T
        )
    ) {
        if (missionReport.EndOfMatchUpload) {
            inventory.RewardSeed = generateRewardSeed();
        }
        await inventory.save();
        const inventoryResponse = await getInventoryResponse(inventory, true, account.BuildLabel);
        res.json({
            InventoryJson: JSON.stringify(inventoryResponse),
            MissionRewards: []
        });
        sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
        return;
    }

    const {
        MissionRewards,
        inventoryChanges,
        credits,
        AffiliationMods,
        SyndicateXPItemReward,
        ConquestCompletedMissionsCount
    } = await addMissionRewards(account, inventory, missionReport, firstCompletion);

    if (missionReport.EndOfMatchUpload) {
        inventory.RewardSeed = generateRewardSeed();
    }
    await inventory.save();

    //TODO: figure out when to send inventory. it is needed for many cases.
    const deltas: IMissionInventoryUpdateResponseRailjackInterstitial = {
        InventoryChanges: inventoryChanges,
        MissionRewards,
        ...credits,
        ...inventoryUpdates,
        //FusionPoints: inventoryChanges?.FusionPoints, // This in combination with InventoryJson or InventoryChanges seems to just double the number of endo shown, so unsure when this is needed.
        SyndicateXPItemReward,
        AffiliationMods,
        ConquestCompletedMissionsCount
    };
    if (missionReport.RJ) {
        logger.debug(`railjack interstitial request, sending only deltas`, deltas);
        res.json(deltas);
    } else if (missionReport.RewardInfo) {
        logger.debug(`classic mission completion, sending everything`);
        const inventoryResponse = await getInventoryResponse(inventory, true, account.BuildLabel);
        res.json({
            InventoryJson: JSON.stringify(inventoryResponse),
            ...deltas
        } satisfies IMissionInventoryUpdateResponse);
    } else {
        logger.debug(`no reward info, assuming this wasn't a mission completion and we should just sync inventory`);
        const inventoryResponse = await getInventoryResponse(inventory, true, account.BuildLabel);
        res.json({
            InventoryJson: JSON.stringify(inventoryResponse)
        } satisfies IMissionInventoryUpdateResponseBackToDryDock);
    }

    sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
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
