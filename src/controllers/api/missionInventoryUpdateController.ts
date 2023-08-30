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
    fs.writeFile("./tmp/missionInventoryUpdate", req.body,(err)=>{
        if(err)
            return console.log(err);
    });  // temp log, !!! tmp folder need on main dir

    const [data, _secondIGuessIsSalt] = String(req.body).split("\n");
    const id = req.query.accountId as string;

    // TODO - salt check

    try {
        const parsedData = JSON.parse(data);
        if (typeof parsedData !== 'object' || parsedData === null)
            throw new Error('Invalid data format');
    
        await missionInventoryUpdate(parsedData, id);
    } catch (err) {
        console.error('Error parsing JSON data:', err);
    }

    // TODO - get original response
    res.json({});
};

export { missionInventoryUpdateController };
