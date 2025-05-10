import { TRarity } from "warframe-public-export-plus";

export interface IRngResult {
    type: string;
    itemCount: number;
    probability: number;
}

export const getRandomElement = <T>(arr: readonly T[]): T | undefined => {
    return arr[Math.floor(Math.random() * arr.length)];
};

// Returns a random integer between min (inclusive) and max (inclusive).
// https://stackoverflow.com/a/1527820
export const getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRewardAtPercentage = <T extends { probability: number }>(
    pool: T[],
    percentage: number
): T | undefined => {
    if (pool.length == 0) return;

    const totalChance = pool.reduce((accum, item) => accum + item.probability, 0);
    const randomValue = percentage * totalChance;

    let cumulativeChance = 0;
    for (const item of pool) {
        cumulativeChance += item.probability;
        if (randomValue <= cumulativeChance) {
            return item;
        }
    }
    return pool[pool.length - 1];
};

export const getRandomReward = <T extends { probability: number }>(pool: T[]): T | undefined => {
    return getRewardAtPercentage(pool, Math.random());
};

export const getRandomWeightedReward = <T extends { rarity: TRarity }>(
    pool: T[],
    weights: Record<TRarity, number>
): (T & { probability: number }) | undefined => {
    const resultPool: (T & { probability: number })[] = [];
    const rarityCounts: Record<TRarity, number> = { COMMON: 0, UNCOMMON: 0, RARE: 0, LEGENDARY: 0 };
    for (const entry of pool) {
        ++rarityCounts[entry.rarity];
    }
    for (const entry of pool) {
        resultPool.push({
            ...entry,
            probability: weights[entry.rarity] / rarityCounts[entry.rarity]
        });
    }
    return getRandomReward(resultPool);
};

export const getRandomWeightedRewardUc = <T extends { Rarity: TRarity }>(
    pool: T[],
    weights: Record<TRarity, number>
): (T & { probability: number }) | undefined => {
    const resultPool: (T & { probability: number })[] = [];
    const rarityCounts: Record<TRarity, number> = { COMMON: 0, UNCOMMON: 0, RARE: 0, LEGENDARY: 0 };
    for (const entry of pool) {
        ++rarityCounts[entry.Rarity];
    }
    for (const entry of pool) {
        resultPool.push({
            ...entry,
            probability: weights[entry.Rarity] / rarityCounts[entry.Rarity]
        });
    }
    return getRandomReward(resultPool);
};

// ChatGPT generated this. It seems to have a good enough distribution.
export const mixSeeds = (seed1: number, seed2: number): number => {
    let seed = seed1 ^ seed2;
    seed ^= seed >>> 21;
    seed ^= seed << 35;
    seed ^= seed >>> 4;
    return seed >>> 0;
};

// Seeded RNG with identical results to the game client. Based on work by Donald Knuth.
export class SRng {
    state: bigint;

    constructor(seed: bigint | number) {
        this.state = BigInt(seed);
    }

    randomInt(min: number, max: number): number {
        const diff = max - min;
        if (diff != 0) {
            this.state = (0x5851f42d4c957f2dn * this.state + 0x14057b7ef767814fn) & 0xffffffffffffffffn;
            min += (Number(this.state >> 32n) & 0x3fffffff) % (diff + 1);
        }
        return min;
    }

    randomElement<T>(arr: readonly T[]): T | undefined {
        return arr[this.randomInt(0, arr.length - 1)];
    }

    randomFloat(): number {
        this.state = (0x5851f42d4c957f2dn * this.state + 0x14057b7ef767814fn) & 0xffffffffffffffffn;
        return (Number(this.state >> 38n) & 0xffffff) * 0.000000059604645;
    }

    randomReward<T extends { probability: number }>(pool: T[]): T | undefined {
        return getRewardAtPercentage(pool, this.randomFloat());
    }
}
