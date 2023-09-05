import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import {
    IMissionInventoryUpdate,
    IMissionInventoryUpdateRewardInfo,
    IMissionRewardResponse,
    IReward
} from "@/src/types/missionInventoryUpdateType";
import { IRawUpgrade } from "@/src/types/inventoryTypes/inventoryTypes";

import missionsDropTable from "@/static/json/missions-drop-table.json";
import { modNames, relicNames, miscNames, resourceNames, gearNames, blueprintNames } from "@/static/data/items";
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
- [ ]  RewardInfo
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
        const parsedData = JSON.parse(data) as IMissionInventoryUpdate;
        if (typeof parsedData !== "object" || parsedData === null) throw new Error("Invalid data format");

        const { InventoryChanges, MissionRewards } = getRewards(parsedData.RewardInfo);

        const missionCredits = parsedData.RegularCredits || 0;
        const creditsBonus = InventoryChanges.RegularCredits || 1000;
        const totalCredits = missionCredits + creditsBonus;

        const MissionCredits = [missionCredits, missionCredits];
        const CreditsBonus = [creditsBonus, creditsBonus];
        const TotalCredits = [totalCredits, totalCredits];
        const FusionPoints = (parsedData.FusionPoints || 0) + (InventoryChanges.FusionPoints || 0) || undefined;

        // combine reward and loot
        parsedData.RegularCredits = totalCredits;
        if (FusionPoints) parsedData.FusionPoints = FusionPoints;
        inventoryFields.forEach((field: InventoryFieldType) => {
            if (InventoryChanges[field] && !parsedData[field]) parsedData[field] = [];
            InventoryChanges[field]?.forEach(i => parsedData[field]!.push(i));
        });

        const Inventory = await missionInventoryUpdate(parsedData, id);
        InventoryChanges.RawUpgrades?.forEach(
            (i: IRawUpgrade) => (i.LastAdded = Inventory.RawUpgrades.find(j => j.ItemType === i.ItemType)?.LastAdded)
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

const inventoryFields = ["RawUpgrades", "MiscItems", "Consumables", "Recipes"] as const;
type InventoryFieldType = (typeof inventoryFields)[number];

// need reverse engineer rewardSeed, otherwise ingame displayed rotation loot will be different than added to db
const getRewards = (
    rewardInfo: IMissionInventoryUpdateRewardInfo | undefined
): { InventoryChanges: IMissionInventoryUpdate; MissionRewards: IMissionRewardResponse[] } => {
    if (!rewardInfo) return { InventoryChanges: {}, MissionRewards: [] };

    const rewards = (missionsDropTable as { [key: string]: IReward[] })[rewardInfo.node];
    if (!rewards) return { InventoryChanges: {}, MissionRewards: [] };

    const rotationCount = rewardInfo.rewardQualifications?.length || 0;
    const rotations = getRotations(rotationCount);
    const drops: IReward[] = [];
    for (const rotation of rotations) {
        const rotationRewards = rewards.filter(i => i.rotation === rotation);

        // Separate guaranteed and chance drops
        const guaranteedDrops: IReward[] = [];
        const chanceDrops: IReward[] = [];
        for (const reward of rotationRewards) {
            if (reward.chance === 100) guaranteedDrops.push(reward);
            else chanceDrops.push(reward);
        }

        const randomDrop = getRandomRewardByChance(chanceDrops);
        if (randomDrop) guaranteedDrops.push(randomDrop);

        drops.push(...guaranteedDrops);
    }

    // const testDrops = [
    //     { chance: 7.69, name: "Lith W3 Relic", rotation: "B" },
    //     { chance: 7.69, name: "Lith W3 Relic", rotation: "B" },
    //     { chance: 10.82, name: "2X Orokin Cell", rotation: "C" },
    //     { chance: 10.82, name: "Link Armor", rotation: "C" },
    //     { chance: 10.82, name: "200 Endo", rotation: "C" },
    //     { chance: 10.82, name: "2,000,000 Credits Cache", rotation: "C" },
    //     { chance: 7.69, name: "Health Restore (Large)", rotation: "C" },
    //     { chance: 7.69, name: "Vapor Specter Blueprint", rotation: "C" }
    // ];
    // console.log("Mission rewards:", testDrops);
    // return formatRewardsToInventoryType(testDrops);

    console.log("Mission rewards:", drops);
    return formatRewardsToInventoryType(drops);
};

const getRotations = (rotationCount: number): (string | undefined)[] => {
    if (rotationCount === 0) return [undefined];

    const rotations = ["A", "B", "C"];
    let rotationIndex = 0;
    const rotatedValues = [];

    for (let i = 1; i <= rotationCount; i++) {
        rotatedValues.push(rotations[rotationIndex]);
        rotationIndex = (rotationIndex + 1) % 3;
    }

    return rotatedValues;
};

const getRandomRewardByChance = (data: IReward[] | undefined): IReward | undefined => {
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

const formatRewardsToInventoryType = (
    rewards: IReward[]
): { InventoryChanges: IMissionInventoryUpdate; MissionRewards: IMissionRewardResponse[] } => {
    const InventoryChanges: IMissionInventoryUpdate = {};
    const MissionRewards: IMissionRewardResponse[] = [];
    for (const reward of rewards) {
        if (itemCheck(InventoryChanges, MissionRewards, reward.name)) continue;

        if (reward.name.includes(" Endo")) {
            if (!InventoryChanges.FusionPoints) InventoryChanges.FusionPoints = 0;
            InventoryChanges.FusionPoints += getCountFromName(reward.name);
        } else if (reward.name.includes(" Credits Cache") || reward.name.includes("Return: ")) {
            if (!InventoryChanges.RegularCredits) InventoryChanges.RegularCredits = 0;
            InventoryChanges.RegularCredits += getCountFromName(reward.name);
        }
    }
    return { InventoryChanges, MissionRewards };
};

const itemCheck = (
    InventoryChanges: IMissionInventoryUpdate,
    MissionRewards: IMissionRewardResponse[],
    name: string
) => {
    const rewardCheck = {
        RawUpgrades: modNames[name],
        Consumables: gearNames[name],
        MiscItems:
            miscNames[name] ||
            miscNames[name.replace(/\d+X\s*/, "")] ||
            resourceNames[name] ||
            resourceNames[name.replace(/\d+X\s*/, "")] ||
            relicNames[name.replace("Relic", "Intact")] ||
            relicNames[name.replace("Relic (Radiant)", "Radiant")],
        Recipes: blueprintNames[name]
    };
    for (const key of Object.keys(rewardCheck) as InventoryFieldType[]) {
        if (rewardCheck[key]) {
            addRewardResponse(InventoryChanges, MissionRewards, name, rewardCheck[key]!, key);
            return true;
        }
    }
    return false;
};

const getCountFromName = (name: string) => {
    const regex = /(^(?:\d{1,3}(?:,\d{3})*(?:\.\d+)?)(\s|X))|(\s(?:\d{1,3}(?:,\d{3})*(?:\.\d+)?)$)/;
    const countMatches = name.match(regex);
    return countMatches ? parseInt(countMatches[0].replace(/,/g, ""), 10) : 1;
};

const addRewardResponse = (
    InventoryChanges: IMissionInventoryUpdate,
    MissionRewards: IMissionRewardResponse[],
    ItemName: string,
    ItemType: string,
    InventoryCategory: InventoryFieldType
) => {
    if (!ItemType) return;
    if (!InventoryChanges[InventoryCategory]) InventoryChanges[InventoryCategory] = [];
    const ItemCount = getCountFromName(ItemName);
    const TweetText = `${ItemName}`;

    const existReward = InventoryChanges[InventoryCategory]!.find(j => j.ItemType === ItemType);
    if (existReward) {
        existReward.ItemCount += ItemCount;
        const missionReward = MissionRewards.find(j => j.TypeName === ItemType);
        if (missionReward) missionReward.ItemCount += ItemCount;
    } else {
        InventoryChanges[InventoryCategory]!.push({ ItemType, ItemCount });
        MissionRewards.push({
            ItemCount,
            TweetText,
            ProductCategory: InventoryCategory,
            StoreItem: ItemType.replace("/Lotus/", "/Lotus/StoreItems/"),
            TypeName: ItemType
        });
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _missionRewardsCheckAllNamings = () => {
    let tempRewards: IReward[] = [];
    Object.values(missionsDropTable as { [key: string]: IReward[] }).forEach(i => {
        i.forEach(j => {
            tempRewards.push(j);
        });
    });
    tempRewards = tempRewards
        .filter(i => !modNames[i.name])
        .filter(i => !miscNames[i.name])
        .filter(i => !miscNames[i.name.replace(/\d+X\s*/, "")])
        .filter(i => !resourceNames[i.name])
        .filter(i => !resourceNames[i.name.replace(/\d+X\s*/, "")])
        .filter(i => !gearNames[i.name])
        .filter(i => {
            return (
                !relicNames[i.name.replace("Relic", "Intact")] &&
                !relicNames[i.name.replace("Relic (Radiant)", "Radiant")]
            );
        })
        .filter(i => !blueprintNames[i.name])
        .filter(i => !i.name.includes(" Endo"))
        .filter(i => !i.name.includes(" Credits Cache") && !i.name.includes("Return: "));
    console.log(tempRewards);
};
// _missionRewardsCheckAllNamings();

export { missionInventoryUpdateController };
