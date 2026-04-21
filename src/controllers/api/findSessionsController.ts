import type { RequestHandler } from "express";
import { getSession } from "../../services/sessionService.ts";
import { logger } from "../../utils/logger.ts";
import type { IFindSessionRequest } from "../../types/sessionTypes.ts";
import { getNrsAddresses } from "../../services/configService.ts";

export const findSessionsController: RequestHandler = async (_req, res) => {
    const req = JSON.parse(String(_req.body)) as IFindSessionRequest;
    logger.debug("FindSession Request:", req);
    const sessions = await getSession(req);

    if (!sessions.length && "id" in req) {
        // (OpenWF-specific) Maybe NRS can tell us who the host of this session is...
        logger.debug(`Unknown session id, asking NRS...`);
        try {
            for (const [nrsAddr, nrsPort] of getNrsAddresses()) {
                const res = await fetch(`http://${nrsAddr}:${nrsPort}/api/session/${req.id}`);
                const json = (await res.json()) as INrsSessionInfo;
                if (json.hid) {
                    sessions.push({ id: req.id, createdBy: json.hid });
                    break;
                }
            }
        } catch (e) {
            /* empty */
        }
    }

    logger.debug("FindSession Result:", { sessions });
    if (sessions.length) res.json({ queryId: req.queryId, Sessions: sessions });
    else res.json({});
};

interface INrsSessionInfo {
    id?: string;
    hid?: string;
}
