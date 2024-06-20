import { IMissionRewardResponse, IReward, IInventoryFieldType, inventoryFields } from "@/src/types/missionTypes";

import missionsDropTable from "@/static/json/missions-drop-table.json";
import {
    modNames,
    relicNames,
    miscNames,
    resourceNames,
    gearNames,
    blueprintNames
} from "@/src/services/itemDataService";
import { IMissionInventoryUpdateRequest } from "../types/requestTypes";
import { logger } from "@/src/utils/logger";

// need reverse engineer rewardSeed, otherwise ingame displayed rotation reward will be different than added to db or displayed on mission end
const getRewards = ({
    RewardInfo
}: IMissionInventoryUpdateRequest): {
    InventoryChanges: IMissionInventoryUpdateRequest;
    MissionRewards: IMissionRewardResponse[];
} => {
    if (!RewardInfo) {
        return { InventoryChanges: {}, MissionRewards: [] };
    }

    const rewards = (missionsDropTable as { [key: string]: IReward[] })[RewardInfo.node];
    if (!rewards) {
        return { InventoryChanges: {}, MissionRewards: [] };
    }

    const rotationCount = RewardInfo.rewardQualifications?.length || 0;
    const rotations = getRotations(rotationCount);
    const drops: IReward[] = [];
    for (const rotation of rotations) {
        const rotationRewards = rewards.filter(reward => reward.rotation === rotation);

        // Separate guaranteed and chance drops
        const guaranteedDrops: IReward[] = [];
        const chanceDrops: IReward[] = [];
        for (const reward of rotationRewards) {
            if (reward.chance === 100) {
                guaranteedDrops.push(reward);
            } else {
                chanceDrops.push(reward);
            }
        }

        const randomDrop = getRandomRewardByChance(chanceDrops);
        if (randomDrop) {
            guaranteedDrops.push(randomDrop);
        }

        drops.push(...guaranteedDrops);
    }

    // const testDrops = [
    //     { chance: 7.69, name: "Lith W3 Relic", rotation: "B" },
    //     { chance: 7.69, name: "Lith W3 Relic", rotation: "B" },
    //     { chance: 10.82, name: "2X Orokin Cell", rotation: "C" },
    //     { chance: 10.82, name: "Arrow Mutation", rotation: "C" },
    //     { chance: 10.82, name: "200 Endo", rotation: "C" },
    //     { chance: 10.82, name: "200 Endo", rotation: "C" },
    //     { chance: 10.82, name: "2,000,000 Credits Cache", rotation: "C" },
    //     { chance: 7.69, name: "Health Restore (Large)", rotation: "C" },
    //     { chance: 7.69, name: "Vapor Specter Blueprint", rotation: "C" }
    // ];
    // logger.debug("Mission rewards:", testDrops);
    // return formatRewardsToInventoryType(testDrops);

    logger.debug("Mission rewards:", drops);
    return formatRewardsToInventoryType(drops);
};

const combineRewardAndLootInventory = (
    rewardInventory: IMissionInventoryUpdateRequest,
    lootInventory: IMissionInventoryUpdateRequest
) => {
    const missionCredits = lootInventory.RegularCredits || 0;
    const creditsBonus = rewardInventory.RegularCredits || 0;
    const totalCredits = missionCredits + creditsBonus;
    const FusionPoints = (lootInventory.FusionPoints || 0) + (rewardInventory.FusionPoints || 0) || undefined;

    lootInventory.RegularCredits = totalCredits;
    if (FusionPoints) {
        lootInventory.FusionPoints = FusionPoints;
    }
    inventoryFields.forEach((field: IInventoryFieldType) => {
        if (rewardInventory[field] && !lootInventory[field]) {
            lootInventory[field] = [];
        }
        rewardInventory[field]?.forEach(item => lootInventory[field]!.push(item));
    });

    return {
        combinedInventoryChanges: lootInventory,
        TotalCredits: [totalCredits, totalCredits],
        CreditsBonus: [creditsBonus, creditsBonus],
        MissionCredits: [missionCredits, missionCredits],
        ...(FusionPoints !== undefined && { FusionPoints })
    };
};

const getRotations = (rotationCount: number): (string | undefined)[] => {
    if (rotationCount === 0) return [undefined];

    const rotationPattern = ["A", "A", "B", "C"];
    const rotatedValues = [];

    for (let i = 0; i < rotationCount; i++) {
        rotatedValues.push(rotationPattern[i % rotationPattern.length]);
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
): { InventoryChanges: IMissionInventoryUpdateRequest; MissionRewards: IMissionRewardResponse[] } => {
    const InventoryChanges: IMissionInventoryUpdateRequest = {};
    const MissionRewards: IMissionRewardResponse[] = [];
    for (const reward of rewards) {
        if (itemCheck(InventoryChanges, MissionRewards, reward.name)) {
            continue;
        }

        if (reward.name.includes(" Endo")) {
            if (!InventoryChanges.FusionPoints) {
                InventoryChanges.FusionPoints = 0;
            }
            InventoryChanges.FusionPoints += getCountFromName(reward.name);
        } else if (reward.name.includes(" Credits Cache") || reward.name.includes("Return: ")) {
            if (!InventoryChanges.RegularCredits) {
                InventoryChanges.RegularCredits = 0;
            }
            InventoryChanges.RegularCredits += getCountFromName(reward.name);
        }
    }
    return { InventoryChanges, MissionRewards };
};

const itemCheck = (
    InventoryChanges: IMissionInventoryUpdateRequest,
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
    for (const key of Object.keys(rewardCheck) as IInventoryFieldType[]) {
        if (rewardCheck[key]) {
            addRewardResponse(InventoryChanges, MissionRewards, name, rewardCheck[key], key);
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
    InventoryChanges: IMissionInventoryUpdateRequest,
    MissionRewards: IMissionRewardResponse[],
    ItemName: string,
    ItemType: string,
    InventoryCategory: IInventoryFieldType
) => {
    if (!ItemType) return;

    if (!InventoryChanges[InventoryCategory]) {
        InventoryChanges[InventoryCategory] = [];
    }

    const ItemCount = getCountFromName(ItemName);
    const TweetText = `${ItemName}`;

    const existReward = InventoryChanges[InventoryCategory]!.find(item => item.ItemType === ItemType);
    if (existReward) {
        existReward.ItemCount += ItemCount;
        const missionReward = MissionRewards.find(missionReward => missionReward.TypeName === ItemType);
        if (missionReward) {
            missionReward.ItemCount += ItemCount;
        }
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
    Object.values(missionsDropTable as { [key: string]: IReward[] }).forEach(rewards => {
        rewards.forEach(reward => {
            tempRewards.push(reward);
        });
    });
    tempRewards = tempRewards
        .filter(reward => !modNames[reward.name])
        .filter(reward => !miscNames[reward.name])
        .filter(reward => !miscNames[reward.name.replace(/\d+X\s*/, "")])
        .filter(reward => !resourceNames[reward.name])
        .filter(reward => !resourceNames[reward.name.replace(/\d+X\s*/, "")])
        .filter(reward => !gearNames[reward.name])
        .filter(reward => {
            return (
                !relicNames[reward.name.replace("Relic", "Intact")] &&
                !relicNames[reward.name.replace("Relic (Radiant)", "Radiant")]
            );
        })
        .filter(reward => !blueprintNames[reward.name])
        .filter(reward => !reward.name.includes(" Endo"))
        .filter(reward => !reward.name.includes(" Credits Cache") && !reward.name.includes("Return: "));
    logger.debug(`temp rewards`, { tempRewards });
};
// _missionRewardsCheckAllNamings();

export { getRewards, combineRewardAndLootInventory };
