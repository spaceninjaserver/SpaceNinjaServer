import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { createNewSession } from "../../managers/sessionManager.ts";
import { logger } from "../../utils/logger.ts";
import type { ISession } from "../../types/session.ts";
import { JSONParse } from "json-with-bigint";
import { toOid2, version_compare } from "../../helpers/inventoryHelpers.ts";

const hostSessionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const hostSessionRequest = JSONParse(String(req.body)) as ISession;
    logger.debug("HostSession Request", { hostSessionRequest });
    const session = createNewSession(hostSessionRequest, account._id);
    logger.debug(`New Session Created`, { session });

    if (account.BuildLabel && version_compare(account.BuildLabel, "2016.07.08.16.56") < 0) {
        // Pre-Specters of the Rail
        res.send(session.sessionId.toString());
    } else {
        res.json({ sessionId: toOid2(session.sessionId, account.BuildLabel), rewardSeed: 99999999 });
    }
};

export { hostSessionController };
