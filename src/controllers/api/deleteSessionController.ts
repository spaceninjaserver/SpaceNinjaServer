import type { RequestHandler } from "express";
import { deleteSession } from "../../managers/sessionManager.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

const deleteSessionController: RequestHandler = async (_req, res) => {
    const account = await getAccountForRequest(_req);
    deleteSession(_req.query.sessionId as string);
    if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["18.16.0"]) < 0) {
        // Pre-Specters of the Rail
        res.send(_req.query.sessionId as string); // Unsure if this is correct, but the client is chill with it
    } else {
        res.sendStatus(200);
    }
};

export { deleteSessionController };
