import type { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import { createNewSession } from "@/src/managers/sessionManager";
import { logger } from "@/src/utils/logger";
import type { ISession } from "@/src/types/session";
import { JSONParse } from "json-with-bigint";
import { toOid2, version_compare } from "@/src/helpers/inventoryHelpers";

const hostSessionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const hostSessionRequest = JSONParse(String(req.body)) as ISession;
    logger.debug("HostSession Request", { hostSessionRequest });
    const session = createNewSession(hostSessionRequest, account._id);
    logger.debug(`New Session Created`, { session });

    if (account.BuildLabel && version_compare(account.BuildLabel, "2015.03.21.08.17") < 0) {
        // U15 or below
        res.send(session.sessionId.toString());
    } else {
        res.json({ sessionId: toOid2(session.sessionId, account.BuildLabel), rewardSeed: 99999999 });
    }
};

export { hostSessionController };
