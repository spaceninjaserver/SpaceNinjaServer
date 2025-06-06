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
import mongoose from "mongoose";
import { JSONStringify } from "json-with-bigint";
import { startWebServer } from "./services/webService";

import { validateConfig } from "@/src/services/configWatcherService";

// Patch JSON.stringify to work flawlessly with Bigints.
JSON.stringify = JSONStringify;

validateConfig();

mongoose
    .connect(config.mongodbUrl)
    .then(() => {
        logger.info("Connected to MongoDB");
        startWebServer();
    })
    .catch(error => {
        if (error instanceof Error) {
            logger.error(`Error connecting to MongoDB server: ${error.message}`);
        }
        process.exit(1);
    });
