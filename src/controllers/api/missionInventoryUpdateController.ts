import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import { combineRewardAndLootInventory, getRewards } from "@/src/services/missionInventoryUpdateService ";
import { IMissionInventoryUpdate } from "@/src/types/missionInventoryUpdateType";
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
- [ ]  Missions
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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const missionInventoryUpdateController: RequestHandler = async (req, res) => {
    const [data] = String(req.body).split("\n");
    const id = req.query.accountId as string;

    try {
        const lootInventory = JSON.parse(data) as IMissionInventoryUpdate;
        if (typeof lootInventory !== "object" || lootInventory === null) {
            throw new Error("Invalid data format");
        }

        const { InventoryChanges, MissionRewards } = getRewards(lootInventory.RewardInfo);

        const { combinedInventoryChanges, TotalCredits, CreditsBonus, MissionCredits, FusionPoints } =
            combineRewardAndLootInventory(InventoryChanges, lootInventory);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const InventoryJson = JSON.stringify(await missionInventoryUpdate(combinedInventoryChanges, id));
        res.json({
            // InventoryJson, // this part will reset game data and missions will be locked
            MissionRewards,
            InventoryChanges,
            TotalCredits,
            CreditsBonus,
            MissionCredits,
            ...(FusionPoints !== undefined && { FusionPoints })
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
