import { config, type IHubServer } from "./configService.ts";

export type TRegionId = "ASIA" | "OCEANIA" | "EUROPE" | "RUSSIA" | "NORTH_AMERICA" | "SOUTH_AMERICA";

export interface IHubInstance {
    Players: number;
    Hub: string;
}

export const hubInstances: Record<string, IHubInstance> = {};

export interface IHubServerStats {
    Players: number;
    Instances: number;
}

export const getAllHubServerStats = (): Record<string, IHubServerStats> => {
    const stats: Record<string, IHubServerStats> = {};
    for (const level of Object.values(hubInstances)) {
        stats[level.Hub] ??= { Players: 0, Instances: 0 };
        stats[level.Hub].Players += level.Players;
        stats[level.Hub].Instances += 1;
    }
    return stats;
};

export const pickHubServer = (regionId: TRegionId): IHubServer => {
    let bestServer = { address: "%THIS_MACHINE%:6952" };
    let bestServerScore = Number.MAX_SAFE_INTEGER;
    const allStats = getAllHubServerStats();
    for (const server of config.hubServers!) {
        const stats = allStats[server.address] as IHubServerStats | undefined;
        const score = (stats?.Players ?? 0) + (stats?.Instances ?? 0) + (server.regions?.includes(regionId) ? 0 : 1000);
        if (score < bestServerScore) {
            bestServer = server;
            bestServerScore = score;
        }
    }
    return bestServer;
};
