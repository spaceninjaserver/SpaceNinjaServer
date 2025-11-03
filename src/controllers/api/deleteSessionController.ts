import type { RequestHandler } from "express";
import { deleteSession } from "../../managers/sessionManager.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";

const deleteSessionController: RequestHandler = async (_req, res) => {
    const account = await getAccountForRequest(_req);
    deleteSession(_req.query.sessionId as string);
    if (account.BuildLabel && version_compare(account.BuildLabel, "2016.07.08.16.56") < 0) {
        // Pre-Specters of the Rail
        res.send(_req.query.sessionId as string); // Unsure if this is correct, but the client is chill with it
    } else {
        res.sendStatus(200);
    }
};

export { deleteSessionController };
