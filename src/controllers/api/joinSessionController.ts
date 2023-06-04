import { RequestHandler } from "express";
import { getSessionByID } from "@/src/managers/sessionManager";

const joinSessionController: RequestHandler = (_req, res) => {
    console.log("JoinSession Request:", JSON.parse(_req.body));
    let req = JSON.parse(_req.body);
    let session = getSessionByID(req.sessionIds[0]);
    res.json({ rewardSeed: session?.rewardSeed, sessionId: { $oid: session?.sessionId } });
};

export { joinSessionController };
