import { args } from "@/src/helpers/commandLineArguments";
import { config } from "@/src/services/configService";
import { sendWsBroadcast } from "@/src/services/webService";
import { RequestHandler } from "express";

export const webuiFileChangeDetectedController: RequestHandler = (req, res) => {
    if (args.dev && args.secret && req.query.secret == args.secret) {
        sendWsBroadcast({ ports: { http: config.httpPort, https: config.httpsPort } });
    }
    res.end();
};
