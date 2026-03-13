import type { RequestHandler } from "express";
import { getSessionByID } from "../../managers/sessionManager.ts";
import { logger } from "../../utils/logger.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { toOid2 } from "../../helpers/inventoryHelpers.ts";

export const joinSessionGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const session = getSessionByID(req.query.sessionId as string);
    if (session) res.json({ rewardSeed: session.rewardSeed, sessionId: toOid2(session.sessionId, account.BuildLabel) });
    else res.json({});
};

export const joinSessionPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const reqBody = JSON.parse(String(req.body)) as IJoinSessionRequest;
    logger.debug(`JoinSession Request`, { reqBody });
    const session = getSessionByID(reqBody.sessionIds[0]);
    if (session) res.json({ rewardSeed: session.rewardSeed, sessionId: toOid2(session.sessionId, account.BuildLabel) });
    else res.json({});
};

interface IJoinSessionRequest {
    sessionIds: string[];
}
