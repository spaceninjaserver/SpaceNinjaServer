import { getLeaderboard } from "../../services/leaderboardService.ts";
import type { RequestHandler } from "express";

export const leaderboardController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as ILeaderboardRequest;
    res.json({
        results: await getLeaderboard(
            payload.field,
            payload.before,
            payload.after,
            payload.pivotId,
            payload.guildId,
            payload.guildTier
        )
    });
};

interface ILeaderboardRequest {
    field: string;
    before: number;
    after: number;
    pivotId?: string;
    guildId?: string;
    guildTier?: number;
}
