import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import { MissionInventoryUpdate, MissionInventoryUpdateRewardInfo } from "@/src/types/missionInventoryUpdateType";

import missionsDropTable from "@/static/json/missions-drop-table.json";
import missionNames from "@/static/json/mission-names.json";
import modNames from "@/static/json/mod-names.json";
import relicNames from "@/static/json/relic-names.json";
import skinNames from "@/static/json/skin-names.json";
import miscNames from "@/static/json/misc-names.json";
import resourceNames from "@/static/json/resource-names.json";
import gearNames from "@/static/json/gear-names.json";
import arcaneNames from "@/static/json/arcane-names.json";
import craftNames from "@/static/json/craft-names.json";

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

        const missionCredits = parsedData.RegularCredits || 0;
        const creditsBonus = 0;
        const totalCredits = missionCredits + creditsBonus;

        const MissionCredits = [missionCredits, missionCredits]; // collected credits
        const CreditsBonus = [creditsBonus, creditsBonus]; // mission reward
        const TotalCredits = [totalCredits, totalCredits];

        console.log(getRewards(parsedData.RewardInfo));

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const InventoryJson = JSON.stringify(await missionInventoryUpdate(parsedData, id));
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

interface StringDictionary {
    [key: string]: string;
}
const getRewards = (rewardInfo: MissionInventoryUpdateRewardInfo | undefined) => {
    if (!rewardInfo) return;

    const missionName = (missionNames as StringDictionary)[rewardInfo.node];
    const rewards = missionsDropTable.find(i => i.mission === missionName)?.rewards;

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

    return formatRewardsToInventoryType(guaranteedDrops);
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

const formatRewardsToInventoryType = (rewards: Reward[]) => {
    return rewards.map(i => {
        const mod = (modNames as StringDictionary)[i.name];
        const skin = (skinNames as StringDictionary)[i.name];
        const gear = (gearNames as StringDictionary)[i.name];
        const arcane = (arcaneNames as StringDictionary)[i.name];
        const craft = (craftNames as StringDictionary)[i.name];
        const misc =
            (miscNames as StringDictionary)[i.name] || (miscNames as StringDictionary)[i.name.replace(/\d+X\s*/, "")];
        const resource =
            (resourceNames as StringDictionary)[i.name] ||
            (resourceNames as StringDictionary)[i.name.replace(/\d+X\s*/, "")];
        const relic =
            (relicNames as StringDictionary)[i.name.replace("Relic", "Exceptional")] ||
            (relicNames as StringDictionary)[i.name.replace("Relic (Radiant)", "Radiant")];

        let ItemType: string = mod;
        const ItemCount = 1;

        if (mod) {
            ItemType = mod;
        } else if (skin) {
            ItemType = skin;
        } else if (gear) {
            ItemType = gear;
        } else if (arcane) {
            ItemType = arcane;
        } else if (craft) {
            ItemType = craft;
        } else if (misc) {
            ItemType = misc;
        } else if (resource) {
            ItemType = resource;
        } else if (relic) {
            ItemType = relic;
        } else if (i.name.includes(" Endo")) {
            /* endo */
        } else if (i.name.includes(" Credits Cache") || i.name.includes("Return: ")) {
            /* credits */
        }
        return { ItemType, ItemCount };
    });
};

export { missionInventoryUpdateController };
