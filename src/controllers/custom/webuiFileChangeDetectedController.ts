import { args } from "@/src/helpers/commandLineArguments";
import { sendWsBroadcast } from "@/src/services/webService";
import { RequestHandler } from "express";

export const webuiFileChangeDetectedController: RequestHandler = (req, res) => {
    if (args.dev && args.secret && req.query.secret == args.secret) {
        sendWsBroadcast({ reload: true });
    }
    res.end();
};
