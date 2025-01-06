import { TRarity } from "warframe-public-export-plus";

export interface IRngResult {
    type: string;
    itemCount: number;
    probability: number;
}

export const getRandomElement = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

// Returns a random integer between min (inclusive) and max (inclusive).
// https://stackoverflow.com/a/1527820
export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomReward = (pool: IRngResult[]): IRngResult | undefined => {
    if (pool.length == 0) return;

    const totalChance = pool.reduce((accum, item) => accum + item.probability, 0);
    const randomValue = Math.random() * totalChance;

    let cumulativeChance = 0;
    for (const item of pool) {
        cumulativeChance += item.probability;
        if (randomValue <= cumulativeChance) {
            return item;
        }
    }
    throw new Error("What the fuck?");
};

export const getRandomWeightedReward = (
    pool: { Item: string; Rarity: TRarity }[],
    weights: Record<TRarity, number>
): IRngResult | undefined => {
    const resultPool: IRngResult[] = [];
    const rarityCounts: Record<TRarity, number> = { COMMON: 0, UNCOMMON: 0, RARE: 0, LEGENDARY: 0 };
    for (const entry of pool) {
        ++rarityCounts[entry.Rarity];
    }
    for (const entry of pool) {
        resultPool.push({
            type: entry.Item,
            itemCount: 1,
            probability: weights[entry.Rarity] / rarityCounts[entry.Rarity]
        });
    }
    return getRandomReward(resultPool);
};

export const getRandomWeightedReward2 = (
    pool: { type: string; itemCount: number; rarity: TRarity }[],
    weights: Record<TRarity, number>
): IRngResult | undefined => {
    const resultPool: IRngResult[] = [];
    const rarityCounts: Record<TRarity, number> = { COMMON: 0, UNCOMMON: 0, RARE: 0, LEGENDARY: 0 };
    for (const entry of pool) {
        ++rarityCounts[entry.rarity];
    }
    for (const entry of pool) {
        resultPool.push({
            type: entry.type,
            itemCount: entry.itemCount,
            probability: weights[entry.rarity] / rarityCounts[entry.rarity]
        });
    }
    return getRandomReward(resultPool);
};
