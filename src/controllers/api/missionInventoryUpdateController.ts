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
import { RawUpgrade } from "@/src/types/inventoryTypes/inventoryTypes";

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

        const { InventoryChanges, MissionRewards } = getRewards(parsedData.RewardInfo);

        const missionCredits = parsedData.RegularCredits || 0;
        const creditsBonus = InventoryChanges.RegularCredits || 1000;
        const totalCredits = missionCredits + creditsBonus;

        const MissionCredits = [missionCredits, missionCredits];
        const CreditsBonus = [creditsBonus, creditsBonus];
        const TotalCredits = [totalCredits, totalCredits];
        const FusionPoints =
            parsedData.FusionPoints || InventoryChanges.FusionPoints
                ? (parsedData.FusionPoints || 0) + (InventoryChanges.FusionPoints || 0)
                : undefined;

        // combine reward and loot
        parsedData.RegularCredits = totalCredits;
        if (FusionPoints) parsedData.FusionPoints = FusionPoints;
        if (InventoryChanges.RawUpgrades && !parsedData.RawUpgrades) parsedData.RawUpgrades = [];
        InventoryChanges.RawUpgrades?.forEach(i => parsedData.RawUpgrades!.push(i));
        if (InventoryChanges.MiscItems && !parsedData.MiscItems) parsedData.RawUpgrades = [];
        InventoryChanges.MiscItems?.forEach(i => parsedData.MiscItems!.push(i));

        const Inventory = await missionInventoryUpdate(parsedData, id);
        InventoryChanges.RawUpgrades?.forEach(
            (i: RawUpgrade) => (i.LastAdded = Inventory.RawUpgrades.find(j => j.ItemType === i.ItemType)?.LastAdded)
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const InventoryJson = JSON.stringify(Inventory);
        res.json({
            // InventoryJson, // this part will reset game data and missions will be locked
            TotalCredits,
            CreditsBonus,
            MissionCredits,
            MissionRewards,
            InventoryChanges,
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

interface StringDictionary {
    [key: string]: string;
}
const getRewards = (
    rewardInfo: MissionInventoryUpdateRewardInfo | undefined
): { InventoryChanges: MissionInventoryUpdate; MissionRewards: MissionRewardResponse[] } => {
    if (!rewardInfo) return { InventoryChanges: {}, MissionRewards: [] };

    // TODO - add Rotation logic
    // no data for rotation, need reverse engineer rewardSeed, otherwise ingame displayed rotation loot will be different than added to db

    // "RewardInfo": {
    //     "node": "SolNode39",
    //     "rewardTier": 1,
    //     "nightmareMode": false,
    //     "useVaultManifest": false,
    //     "EnemyCachesFound": 0,
    //     "toxinOk": true,
    //     "lostTargetWave": 0,
    //     "defenseTargetCount": 1,
    //     "EOM_AFK": 0,
    //     "rewardQualifications": "11",
    //     "PurgatoryRewardQualifications": "",
    //     "rewardSeed": -5604904486637266000
    // },

    const missionName = (missionNames as StringDictionary)[rewardInfo.node];
    const rewards = missionsDropTable.find(i => i.mission === missionName)?.rewards;

    if (!rewards) return { InventoryChanges: {}, MissionRewards: [] };

    // Separate guaranteed and chance drops
    const guaranteedDrops: Reward[] = [];
    const chanceDrops: Reward[] = [];
    for (const reward of rewards) {
        if (reward.chance === 100) guaranteedDrops.push(reward);
        else chanceDrops.push(reward);
    }

    const randomDrop = getRandomRewardByChance(chanceDrops);
    if (randomDrop) guaranteedDrops.push(randomDrop);

    console.log("Mission rewards:", guaranteedDrops);

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

interface MissionRewardResponse {
    StoreItem?: string;
    TypeName: string;
    UpgradeLevel: number;
    ItemCount: number;
    TweetText: string;
    ProductCategory: string;
}
const formatRewardsToInventoryType = (
    rewards: Reward[]
): { InventoryChanges: MissionInventoryUpdate; MissionRewards: MissionRewardResponse[] } => {
    const InventoryChanges: MissionInventoryUpdate = {};
    const MissionRewards: MissionRewardResponse[] = [];
    rewards.forEach(i => {
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

        if (mod) {
            if (!InventoryChanges.RawUpgrades) InventoryChanges.RawUpgrades = [];
            InventoryChanges.RawUpgrades.push({ ItemType: mod, ItemCount: 1 });
            MissionRewards.push({
                StoreItem: mod.replace("/Lotus/", "/Lotus/StoreItems/"),
                TypeName: mod,
                UpgradeLevel: 0,
                ItemCount: 1,
                TweetText: `${i.name} (Mod)`,
                ProductCategory: "Upgrades"
            });
        } else if (skin) {
            /* skin */
        } else if (gear) {
            /* gear */
        } else if (arcane) {
            /* arcane */
        } else if (craft) {
            /* craft */
        } else if (misc || resource) {
            if (!InventoryChanges.MiscItems) InventoryChanges.MiscItems = [];
            const ItemType = misc || resource;
            const ItemCount = parseInt(i.name) || 1;
            InventoryChanges.MiscItems.push({ ItemType, ItemCount });
        } else if (relic) {
            /* relic */
        } else if (i.name.includes(" Endo")) {
            InventoryChanges.FusionPoints = parseInt(i.name);
        } else if (i.name.includes(" Credits Cache") || i.name.includes("Return: ")) {
            InventoryChanges.RegularCredits = parseInt(i.name.replace(/ Credits Cache|Return: |,/g, ""));
        }
    });
    return { InventoryChanges, MissionRewards };
};

export { missionInventoryUpdateController };
