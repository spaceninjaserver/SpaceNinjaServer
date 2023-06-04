import { RequestHandler } from "express";
import { getSessionByID } from "@/src/managers/sessionManager";

const joinSessionController: RequestHandler = (_req, res) => {
    const req = JSON.parse(String(_req.body)) as { sessionIds: string[] };
    const session = getSessionByID(req.sessionIds[0]);
    res.json({ rewardSeed: session?.rewardSeed, sessionId: { $oid: session?.sessionId } });
};

export { joinSessionController };
