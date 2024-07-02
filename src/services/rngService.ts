import { TRarity } from "warframe-public-export-plus";

export interface IRngResult {
    type: string;
    itemCount: number;
    probability: number;
}

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
