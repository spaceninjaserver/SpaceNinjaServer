// First, init config.
import { config, configPath, loadConfig, syncConfigWithDatabase } from "@/src/services/configService";
import fs from "fs";
try {
    loadConfig();
} catch (e) {
    if (fs.existsSync("config.json")) {
        console.log("Failed to load " + configPath + ": " + (e as Error).message);
    } else {
        console.log("Failed to load " + configPath + ". You can copy config-vanilla.json to create your config file.");
    }
    process.exit(1);
}

// Now we can init the logger with the settings provided in the config.
import { logger } from "@/src/utils/logger";
logger.info("Starting up...");

// Proceed with normal startup: bring up config watcher service, validate config, connect to MongoDB, and finally start listening for HTTP.
import mongoose from "mongoose";
import path from "path";
import { JSONStringify } from "json-with-bigint";
import { startWebServer } from "@/src/services/webService";
import { validateConfig } from "@/src/services/configWatcherService";
import { updateWorldStateCollections } from "@/src/services/worldStateService";
import { repoDir } from "@/src/helpers/pathHelper";

JSON.stringify = JSONStringify; // Patch JSON.stringify to work flawlessly with Bigints.

validateConfig();

fs.readFile(path.join(repoDir, "BUILD_DATE"), "utf-8", (err, data) => {
    if (!err) {
        logger.info(`Docker image was built on ${data.trim()}`);
    }
});

mongoose
    .connect(config.mongodbUrl)
    .then(() => {
        logger.info("Connected to MongoDB");
        syncConfigWithDatabase();

        startWebServer();

        void updateWorldStateCollections();
        setInterval(() => {
            void updateWorldStateCollections();
        }, 60_000);
    })
    .catch(error => {
        if (error instanceof Error) {
            logger.error(`Error connecting to MongoDB server: ${error.message}`);
        }
        process.exit(1);
    });
