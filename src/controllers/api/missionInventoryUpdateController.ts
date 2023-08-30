import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import fs from 'fs';
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
const missionInventoryUpdateController: RequestHandler = async (req, res) => {
    // fs.writeFile("./tmp/test", req.body, function(err) {
    //     if(err) {
    //         return console.log(err);
    //     }
    // });
    
    const [data, _secondIGuessIsSalt] = String(req.body).split("\n");
    const id = req.query.accountId as string;
    
    await missionInventoryUpdate(JSON.parse(data), id);

    res.json({});
};

export { missionInventoryUpdateController };
