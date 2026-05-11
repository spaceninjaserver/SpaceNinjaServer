import type { RequestHandler } from "express";
import { deleteSession } from "../../services/sessionService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const deleteSessionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    await deleteSession(req.query.sessionId as string);
    const buildLabel = getBuildLabel(req, account);
    if (version_compare(buildLabel, gameToBuildVersion["18.16.0"]) < 0) {
        // Pre-Specters of the Rail
        res.send(req.query.sessionId as string); // Unsure if this is correct, but the client is chill with it
    } else {
        res.sendStatus(200);
    }
};
