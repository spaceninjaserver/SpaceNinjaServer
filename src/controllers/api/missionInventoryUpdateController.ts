import { RequestHandler } from "express";
import { addRawUpgrades, addMiscItems } from "@/src/services/inventoryService";
import fs from 'fs';
/*
- [ ]  crossPlaySetting
- [ ]  rewardsMultiplier
- [ ]  ActiveBoosters
- [ ]  LongGuns
- [ ]  Pistols
- [ ]  Suits
- [ ]  Melee
- [x]  RawUpgrades
- [x]  MiscItems
- [ ]  RegularCredits
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
- [ ]  ChallengeProgress
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
    fs.writeFile("./tmp/test", req.body, function(err) {
        if(err) {
            return console.log(err);
        }
    });
    
    const [data, _secondIGuessIsSalt] = String(req.body).split("\n");
    const {RawUpgrades, MiscItems} = JSON.parse(data);
    const id = req.query.accountId as string;
    addRawUpgrades(RawUpgrades, id);
    addMiscItems(MiscItems, id);

    res.json({});
};

export { missionInventoryUpdateController };
