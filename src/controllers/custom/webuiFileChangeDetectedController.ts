import { args } from "../../helpers/commandLineArguments.ts";
import { sendWsBroadcast } from "../../services/wsService.ts";
import type { RequestHandler } from "express";

export const webuiFileChangeDetectedController: RequestHandler = (req, res) => {
    if (args.dev && args.secret && req.query.secret == args.secret) {
        sendWsBroadcast({ reload: true });
    }
    res.end();
};
