import { RequestHandler } from "express";
import { getSession } from "@/src/managers/sessionManager";

const findSessionsController: RequestHandler = (_req, res) => {
    console.log("FindSession Request:", JSON.parse(_req.body));
    let req = JSON.parse(_req.body);
    if (req.id != undefined) {
        console.log("Found ID");
        let session = getSession(req.id);

        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else if (req.originalSessionId != undefined) {
        console.log("Found OriginalSessionID");

        let session = getSession(req.originalSessionId);
        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    } else {
        console.log("Found SessionRequest");

        let session = getSession(_req.body);
        if (session) res.json({ queryId: req.queryId, Sessions: session });
        else res.json({});
    }
};

export { findSessionsController };
