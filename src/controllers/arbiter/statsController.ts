import type { RequestHandler } from "express";
import {
    getAllHubServerStats,
    hubInstances,
    type IHubServerStats,
    type TRegionId
} from "../../services/arbiterService.ts";
import { config } from "../../services/configService.ts";

export const statsController: RequestHandler = (_req, res) => {
    const response: IArbiterStatsResponse = {
        Hubs: {},
        Levels: hubInstances
    };
    const allStats = getAllHubServerStats();
    for (const server of config.hubServers!) {
        const stats = allStats[server.address] as IHubServerStats | undefined;
        response.Hubs[server.address] = {
            Players: stats?.Players ?? 0,
            Instances: stats?.Instances ?? 0,
            RegionIds: server.regions!
        };
    }
    res.json(response);
};

interface IArbiterStatsResponse {
    Hubs: Record<
        string,
        {
            Players: number;
            Instances: number;
            RegionIds: TRegionId[];
        }
    >;
    Levels: Record<
        string,
        {
            Players: number;
            Hub: string;
        }
    >;
}
