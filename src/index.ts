import { logger } from "./utils/logger";

logger.info("Starting up...");

import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";
import { config, validateConfig } from "./services/configService";
import { registerLogFileCreationListener } from "@/src/utils/logger";
import mongoose from "mongoose";

// Patch JSON.stringify to work flawlessly with Bigints. Yeah, it's not pretty.
// TODO: Might wanna use json-with-bigint if/when possible.
{
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (BigInt.prototype as any).toJSON = function (): string {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        return "<BIGINT>" + this.toString() + "</BIGINT>";
    };
    const og_stringify = JSON.stringify;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (JSON as any).stringify = (obj: any): string => {
        return og_stringify(obj).split(`"<BIGINT>`).join(``).split(`</BIGINT>"`).join(``);
    };
}

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
