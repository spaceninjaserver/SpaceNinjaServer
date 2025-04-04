// First, init config.
import { config, loadConfig } from "@/src/services/configService";
try {
    loadConfig();
} catch (e) {
    console.log("ERROR: Failed to load config.json. You can copy config.json.example to create your config.json.");
    process.exit(1);
}

// Now we can init the logger with the settings provided in the config.
import { logger } from "@/src/utils/logger";
logger.info("Starting up...");

// Proceed with normal startup: bring up config watcher service, validate config, connect to MongoDB, and finally start listening for HTTP.
import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";
import mongoose from "mongoose";
import { Json, JSONStringify } from "json-with-bigint";
import { validateConfig } from "@/src/services/configWatcherService";

// Patch JSON.stringify to work flawlessly with Bigints.
JSON.stringify = (obj: Exclude<Json, undefined>, _replacer?: unknown, space?: string | number): string => {
    return JSONStringify(obj, space);
};

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

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        http.createServer(app).listen(httpPort, () => {
            logger.info("HTTP server started on port " + httpPort);
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
