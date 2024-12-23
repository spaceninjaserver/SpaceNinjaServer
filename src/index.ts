import { logger } from "./utils/logger";

logger.info("Starting up...");

import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";
import { config } from "./services/configService";
import { connectDatabase } from "@/src/services/mongoService";
import { registerLogFileCreationListener } from "@/src/utils/logger";

registerLogFileCreationListener();

void (async (): Promise<void> => {
    await connectDatabase();

    const httpPort = config.httpPort || 80;
    const httpsPort = config.httpsPort || 443;
    const options = {
        key: fs.readFileSync("static/certs/key.pem"),
        cert: fs.readFileSync("static/certs/cert.pem")
    };

    http.createServer(app).listen(httpPort, () => {
        logger.info("HTTP server started on port " + httpPort);
        https.createServer(options, app).listen(httpsPort, () => {
            logger.info("HTTPS server started on port " + httpsPort);
        });
    });
})();
