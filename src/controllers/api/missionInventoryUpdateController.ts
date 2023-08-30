import { Request, Response } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import fs from "fs";
import { MissionInventoryUpdate } from "@/src/types/missionInventoryUpdateType";
/*
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
- [+]  ChallengeProgress
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
const missionInventoryUpdateController = async (req: Request, res: Response) => {
    fs.writeFile("./tmp/missionInventoryUpdate", req.body as string, err => {
        if (err) return console.log(err);
    }); // temp log, !!! tmp folder need on main dir

    const [data] = String(req.body).split("\n");
    const id = req.query.accountId as string;

    // TODO - salt check

    try {
        const parsedData = JSON.parse(data) as MissionInventoryUpdate;
        if (typeof parsedData !== "object" || parsedData === null) throw new Error("Invalid data format");
        await missionInventoryUpdate(parsedData, id);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }

    // TODO - get original response
    res.json({});
};

export { missionInventoryUpdateController };
