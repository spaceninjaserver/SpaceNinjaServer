import { RequestHandler } from "express";
import { missionInventoryUpdate } from "@/src/services/inventoryService";
import {
    IMissionInventoryUpdate,
    IMissionInventoryUpdateRewardInfo,
    IMissionRewardResponse,
    IReward
} from "@/src/types/missionInventoryUpdateType";
import { RawUpgrade } from "@/src/types/inventoryTypes/inventoryTypes";

import missionsDropTable from "@/static/json/missions-drop-table.json";
import {
    modNames,
    relicNames,
    skinNames,
    miscNames,
    resourceNames,
    gearNames,
    arcaneNames,
    craftNames
} from "@/static/data/items";

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
    rewards.forEach(i => {
        const mod = modNames[i.name];
        const skin = skinNames[i.name];
        const gear = gearNames[i.name];
        const arcane = arcaneNames[i.name];
        const craft = craftNames[i.name];
        const misc = miscNames[i.name] || miscNames[i.name.replace(/\d+X\s*/, "")];
        const resource = resourceNames[i.name] || resourceNames[i.name.replace(/\d+X\s*/, "")];
        const relic =
            relicNames[i.name.replace("Relic", "Exceptional")] ||
            relicNames[i.name.replace("Relic (Radiant)", "Radiant")];

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

        .filter(i => !skinNames[i.name])
        .filter(i => !miscNames[i.name])
        .filter(i => !miscNames[i.name.replace(/\d+X\s*/, "")])
        .filter(i => !resourceNames[i.name])
        .filter(i => !resourceNames[i.name.replace(/\d+X\s*/, "")])
        .filter(i => !gearNames[i.name])
        .filter(i => !arcaneNames[i.name])
        .filter(i => !craftNames[i.name])
        .filter(i => {
            // return true;
            // return !relicNames[i.name.replace("Relic", "Exceptional")];
            // console.log(i.name.replace("Relic", "Exceptional"));
            return (
                !relicNames[i.name.replace("Relic", "Exceptional")] &&
                !relicNames[i.name.replace("Relic (Radiant)", "Radiant")]
            );
        })
        .filter(i => !i.name.includes(" Endo"))
        .filter(i => !i.name.includes(" Credits Cache") && !i.name.includes("Return: "));
    console.log(tempRewards);
};
// _missionRewardsCheckAllNamings();

export { missionInventoryUpdateController };
