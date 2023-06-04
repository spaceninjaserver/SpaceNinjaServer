import { RequestHandler } from "express";
import { createNewSession } from "@/src/managers/sessionManager";
import { Session } from "@/src/types/session";

const hostSessionController: RequestHandler = (_req, res) => {
    const session = createNewSession(JSON.parse(String(_req.body)) as Session, _req.query.accountId as string);

    res.json({ sessionId: { $oid: session.sessionId }, rewardSeed: 99999999 });
};

export { hostSessionController };
