import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { createNewSession } from "../../services/sessionService.ts";
import { logger } from "../../utils/logger.ts";
import type { IHostSessionRequest } from "../../types/sessionTypes.ts";
import { JSONParse } from "json-with-bigint";
import { toOid2, version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const hostSessionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const hostSessionRequest = JSONParse(String(req.body)) as IHostSessionRequest;
    logger.debug("HostSession Request", { hostSessionRequest });
    const session = await createNewSession(hostSessionRequest, account._id);
    logger.debug(`New Session Created`, { session });

    if (version_compare(buildLabel, gameToBuildVersion["18.16.0"]) < 0) {
        // Pre-Specters of the Rail
        res.send(session._id.toString());
    } else {
        res.json({ sessionId: toOid2(session._id, buildLabel), rewardSeed: session.rewardSeed });
    }
};
