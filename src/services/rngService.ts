export interface IRngResult {
    type:        string;
    itemCount:   number;
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
