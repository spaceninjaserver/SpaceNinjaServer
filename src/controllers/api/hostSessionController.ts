import { RequestHandler } from "express";
import { createNewSession } from "@/src/managers/sessionManager";

const hostSessionController: RequestHandler = (_req, res) => {
    console.log("HostSession Request:", JSON.parse(_req.body));
    let session = createNewSession(JSON.parse(_req.body), _req.query.accountId as string);
    console.log("New Session Created: ", session);

    res.json({ sessionId: { $oid: session.sessionId }, rewardSeed: 99999999 });
};

export { hostSessionController };
