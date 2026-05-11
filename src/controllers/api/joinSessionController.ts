import type { RequestHandler } from "express";
import { getSessionByID } from "../../services/sessionService.ts";
import { logger } from "../../utils/logger.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { toOid2 } from "../../helpers/inventoryHelpers.ts";
import { generateRewardSeed } from "../../services/rngService.ts";

export const joinSessionGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const sessionId = req.query.sessionId as string;
    const session = await getSessionByID(sessionId);
    if (!session) {
        logger.warn(`joining an unknown session; rewardSeed will not be in sync`);
    }
    res.json({
        rewardSeed: session?.rewardSeed ?? generateRewardSeed(),
        sessionId: toOid2(sessionId, buildLabel)
    });
};

export const joinSessionPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const reqBody = JSON.parse(String(req.body)) as IJoinSessionRequest;
    logger.debug(`JoinSession Request`, { reqBody });
    const sessionId = reqBody.sessionIds[0];
    const session = await getSessionByID(sessionId);
    if (!session) {
        logger.warn(`joining an unknown session; rewardSeed will not be in sync`);
    }
    res.json({
        rewardSeed: session?.rewardSeed ?? generateRewardSeed(),
        sessionId: toOid2(sessionId, buildLabel)
    });
};

interface IJoinSessionRequest {
    sessionIds: string[];
}
