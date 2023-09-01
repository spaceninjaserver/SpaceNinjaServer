import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import { MissionInventoryUpdate, MissionInventoryUpdateRewardInfo } from "@/src/types/missionInventoryUpdateType";
import missionNames from "@/static/data/mission-names.json";
import missionReward from "@/static/data/mission-rewards.json";

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

        console.log(getRewards(parsedData.RewardInfo));

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

interface MissionNames {
    [key: string]: string;
}
const getRewards = (rewardInfo: MissionInventoryUpdateRewardInfo | undefined): Reward[] | undefined => {
    if (!rewardInfo) return;

    const missionName = (missionNames as MissionNames)[rewardInfo.node];
    const rewards = missionReward.find(i => i.mission === missionName)?.rewards;

    if (!rewards) return [];

    // TODO - add Rotation logic

    // Separate guaranteed and chance drops
    const guaranteedDrops: Reward[] = [];
    const chanceDrops: Reward[] = [];
    for (const reward of rewards) {
        if (reward.chance === 100) guaranteedDrops.push(reward);
        else chanceDrops.push(reward);
    }

    const randomDrop = getRandomRewardByChance(chanceDrops);
    if (randomDrop) guaranteedDrops.push(randomDrop);

    return guaranteedDrops;
};

interface Reward {
    name: string;
    chance: number;
    rotation?: string;
}
const getRandomRewardByChance = (data: Reward[] | undefined): Reward | undefined => {
    if (!data || data.length == 0) return;

    const totalChance = data.reduce((sum, item) => sum + item.chance, 0);
    const randomValue = Math.random() * totalChance;

    let cumulativeChance = 0;
    for (const item of data) {
        cumulativeChance += item.chance;
        if (randomValue <= cumulativeChance) {
            return item;
        }
    }

    return;
};

export { missionInventoryUpdateController };
