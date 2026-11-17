import type { RequestHandler } from "express";
import { deleteSession } from "../../services/sessionService.ts";
import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";

export const deleteSessionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    await deleteSession(req.query.sessionId as string);
    const buildVersion = getBuildVersion(req, account);
    if (buildVersion < gameToBuildVersionInt["18.16.0"]) {
        // Pre-Specters of the Rail
        res.send(req.query.sessionId as string); // Unsure if this is correct, but the client is chill with it
    } else {
        res.sendStatus(200);
    }
};
