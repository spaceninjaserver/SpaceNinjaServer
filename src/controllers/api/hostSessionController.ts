import { RequestHandler } from "express";
import { createNewSession } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";
import { ISession } from "@/src/types/session";

const hostSessionController: RequestHandler = (req, res) => {
    const hostSessionRequest = JSON.parse(req.body as string) as ISession;
    logger.debug("HostSession Request", { hostSessionRequest });
    let session = createNewSession(hostSessionRequest, req.query.accountId as string);
    logger.debug(`New Session Created`, { session });

    res.json({ sessionId: { $oid: session.sessionId }, rewardSeed: 99999999 });
};

export { hostSessionController };
