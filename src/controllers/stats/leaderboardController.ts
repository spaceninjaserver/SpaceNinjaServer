import { getLeaderboard } from "@/src/services/leaderboardService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const leaderboardController: RequestHandler = async (req, res) => {
    logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
    const payload = JSON.parse(String(req.body)) as ILeaderboardRequest;
    res.json({
        results: await getLeaderboard(payload.field, payload.before, payload.after, payload.guildId, payload.pivotId)
    });
};

interface ILeaderboardRequest {
    field: string;
    before: number;
    after: number;
    guildId?: string;
    pivotId?: string;
}
