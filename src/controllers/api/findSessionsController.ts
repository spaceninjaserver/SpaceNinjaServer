import type { RequestHandler } from "express";
import { getSession } from "../../managers/sessionManager.ts";
import { logger } from "../../utils/logger.ts";
import type { IFindSessionRequest } from "../../types/session.ts";
import { getNrsAddress } from "../../services/configService.ts";

export const findSessionsController: RequestHandler = async (_req, res) => {
    const req = JSON.parse(String(_req.body)) as IFindSessionRequest;
    logger.debug("FindSession Request:", req);
    const sessions = getSession(req);

    if (!sessions.length && "id" in req) {
        // (OpenWF-specific) Maybe NRS can tell us who the host of this session is...
        logger.debug(`Unknown session id, asking NRS...`);
        try {
            const [nrsAddr, nrsPort] = getNrsAddress();
            const res = await fetch(`http://${nrsAddr}:${nrsPort}/api/session/${req.id}`);
            const json = (await res.json()) as INrsSessionInfo;
            if (json.hid) {
                sessions.push({ id: req.id, createdBy: json.hid });
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
