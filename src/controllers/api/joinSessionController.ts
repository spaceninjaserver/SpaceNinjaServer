import type { RequestHandler } from "express";
import { getSessionByID } from "../../managers/sessionManager.ts";
import { logger } from "../../utils/logger.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { toOid2 } from "../../helpers/inventoryHelpers.ts";
import { generateRewardSeed } from "../../services/rngService.ts";

export const joinSessionGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const sessionId = req.query.sessionId as string;
    const session = getSessionByID(sessionId);
    if (!session) {
        logger.warn(`joining an unknown session; rewardSeed will not be in sync`);
    }
    res.json({
        rewardSeed: session?.rewardSeed ?? generateRewardSeed(),
        sessionId: toOid2(sessionId, account.BuildLabel)
    });
};

export const joinSessionPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const reqBody = JSON.parse(String(req.body)) as IJoinSessionRequest;
    logger.debug(`JoinSession Request`, { reqBody });
    const sessionId = reqBody.sessionIds[0];
    const session = getSessionByID(sessionId);
    if (!session) {
        logger.warn(`joining an unknown session; rewardSeed will not be in sync`);
    }
    res.json({
        rewardSeed: session?.rewardSeed ?? generateRewardSeed(),
        sessionId: toOid2(sessionId, account.BuildLabel)
    });
};

interface IJoinSessionRequest {
    sessionIds: string[];
}
