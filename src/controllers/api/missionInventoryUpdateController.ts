import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import { combineRewardAndLootInventory, getRewards } from "@/src/services/missionInventoryUpdateService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMissionInventoryUpdateRequest } from "@/src/types/requestTypes";
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
- [ ]  PS (Passive anti-cheat data which includes your username, module list, process list, and system name.)
- [ ]  ActiveDojoColorResearch
- [x]  RewardInfo
- [ ]  ReceivedCeremonyMsg
- [ ]  LastCeremonyResetDate
- [ ]  MissionPTS (Used to validate the mission/alive time above.)
- [ ]  RepHash (A hash from the replication manager/RepMgr Unknown what it does.)
- [ ]  EndOfMatchUpload
- [ ]  ObjectiveReached
- [ ]  FpsAvg
- [ ]  FpsMin
- [ ]  FpsMax
- [ ]  FpsSamples
*/

const missionInventoryUpdateController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
        const lootInventory = getJSONfromString(req.body.toString()) as IMissionInventoryUpdateRequest;

        logger.debug("missionInventoryUpdate with lootInventory =", lootInventory);

        const { InventoryChanges, MissionRewards } = getRewards(lootInventory);

        const { combinedInventoryChanges, TotalCredits, CreditsBonus, MissionCredits, FusionPoints } =
            combineRewardAndLootInventory(InventoryChanges, lootInventory);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const InventoryJson = JSON.stringify(await missionInventoryUpdate(combinedInventoryChanges, accountId));
        res.json({
            // InventoryJson, // this part will reset game data and missions will be locked
            MissionRewards,
            InventoryChanges,
            TotalCredits,
            CreditsBonus,
            MissionCredits,
            FusionPoints
        });
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }
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

export { missionInventoryUpdateController };
