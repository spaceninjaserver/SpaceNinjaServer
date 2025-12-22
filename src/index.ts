// First, init config.
import { config, configPath, loadConfig, syncConfigWithDatabase } from "./services/configService.ts";
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
import { logger } from "./utils/logger.ts";
logger.info("Starting up...");

// Proceed with normal startup: bring up config watcher service, validate config, connect to MongoDB, and finally start listening for HTTP.
import mongoose from "mongoose";
import path from "path";
import child_process from "child_process";
import { JSONStringify } from "json-with-bigint";
import { startWebServer } from "./services/webService.ts";
import { validateConfig } from "./services/configWatcherService.ts";
import { updateWorldStateCollections } from "./services/worldStateService.ts";
import { repoDir } from "./helpers/pathHelper.ts";

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

        for (const [what, key] of [
            ["IRC", "ircExecutable"],
            ["HUB", "hubExecutable"]
        ] as const) {
            if (config[key]) {
                logger.info(`Starting ${what}: ${config[key]}`);
                child_process.execFile(config[key], (error, _stdout, _stderr) => {
                    if (error) {
                        logger.warn(`Failed to start ${what} server`, error);
                    } else {
                        logger.warn(`${what} server terminated unexpectedly`);
                    }
                });
            }
        }

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
