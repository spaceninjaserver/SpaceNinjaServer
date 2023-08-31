import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import { MissionInventoryUpdate } from "@/src/types/missionInventoryUpdateType";
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
- [ ]  PS
- [ ]  ActiveDojoColorResearch
- [ ]  RewardInfo
- [ ]  ReceivedCeremonyMsg
- [ ]  LastCeremonyResetDate
- [ ]  MissionPTS
- [ ]  RepHash
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

    // TODO - salt check

    try {
        const parsedData = JSON.parse(data) as MissionInventoryUpdate;
        if (typeof parsedData !== "object" || parsedData === null) throw new Error("Invalid data format");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const InventoryJson = JSON.stringify(await missionInventoryUpdate(parsedData, id));

        const missionCredits = parsedData.RegularCredits || 0;
        const creditsBonus = 0;
        const totalCredits = missionCredits + creditsBonus;

        const MissionCredits = [missionCredits, missionCredits]; // collected credits
        const CreditsBonus = [creditsBonus, creditsBonus]; // mission reward
        const TotalCredits = [totalCredits, totalCredits];

        // TODO - get missions reward table

        res.json({
            // InventoryJson, // this part will reset game data and missions will be locked
            TotalCredits,
            CreditsBonus,
            MissionCredits
        });
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }
};

/*
**** OUTPUT ****
- [x]  InventoryJson
- [ ]  MissionRewards
- [x]  TotalCredits
- [x]  CreditsBonus
- [x]  MissionCredits
- [ ]  InventoryChanges
- [ ]  FusionPoints int
*/

export { missionInventoryUpdateController };
