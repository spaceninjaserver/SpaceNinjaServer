import { RequestHandler } from "express";
import { getSession } from "@/src/managers/sessionManager";

const findSessionsController: RequestHandler = (_req, res) => {
    console.log("FindSession Request:", JSON.parse(_req.body));
    let r = JSON.parse(_req.body);
    if (r.id != undefined) {
        console.log("Found ID");
        let s = getSession(r.id);

        if (s) res.json({ queryId: r.queryId, Sessions: s });
        else res.json({});
    } else if (r.originalSessionId != undefined) {
        console.log("Found OriginalSessionID");

        let s = getSession(r.originalSessionId);
        if (s) res.json({ queryId: r.queryId, Sessions: [s] });
        else res.json({});
    } else {
        console.log("Found SessionRequest");

        let s = getSession(_req.body);
        if (s) res.json({ queryId: r.queryId, Sessions: [s] });
        else res.json({});
    }
};

export { findSessionsController };
