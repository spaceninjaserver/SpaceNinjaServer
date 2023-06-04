import { RequestHandler } from "express";
import { getSessionByID } from '@/src/managers/sessionManager';

const joinSessionController: RequestHandler = (_req, res) => {
    
    console.log("JoinSession Request:", JSON.parse(_req.body));
    let r = JSON.parse(_req.body);
    let s = getSessionByID(r.sessionIds[0])
    res.json({"rewardSeed":s?.rewardSeed,"sessionId":{"$oid":s?.sessionId}});
};

export { joinSessionController };