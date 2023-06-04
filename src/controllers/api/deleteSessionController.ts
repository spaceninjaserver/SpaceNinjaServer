import { RequestHandler } from "express";
import { deleteSession } from '@/src/managers/sessionManager';

const deleteSessionController: RequestHandler = (_req, res) => {
    
    //res.json({ sessionId: { $oid: "64768f104722f795300c9fc0" }, rewardSeed: 5867309943877621023 });
    deleteSession(_req.query.sessionId as string);
    res.sendStatus(200);
};

export { deleteSessionController };
