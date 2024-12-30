import { logger } from "./utils/logger";

logger.info("Starting up...");

import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";
import { config, validateConfig } from "./services/configService";
import { registerLogFileCreationListener } from "@/src/utils/logger";
import mongoose from "mongoose";

registerLogFileCreationListener();
validateConfig();

mongoose
    .connect(config.mongodbUrl)
    .then(() => {
        logger.info("Connected to MongoDB");

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

                logger.info(
                    "Access the WebUI in your browser at http://localhost" + (httpPort == 80 ? "" : ":" + httpPort)
                );
            });
        });
    })
    .catch(error => {
        if (error instanceof Error) {
            logger.error(`Error connecting to MongoDB server: ${error.message}`);
        }
        process.exit(1);
    });
