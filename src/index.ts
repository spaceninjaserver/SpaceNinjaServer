import { config, configPath, loadConfig } from "./services/configService.ts";
import fs from "fs";
import { initLogger, logger } from "./utils/logger.ts";
import mongoose from "mongoose";
import path from "path";
import child_process from "child_process";
import { JSONStringify } from "json-with-bigint";
import { startWebServer, type IListenError } from "./services/webService.ts";
import { syncConfigWithDatabase, validateConfig } from "./services/configWatcherService.ts";
import { updateWorldStateCollections } from "./services/worldStateService.ts";
import { repoDir } from "./helpers/pathHelper.ts";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { args } from "./helpers/commandLineArguments.ts";
import { runSelfTests } from "./services/selfTestService.ts";

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

initLogger(); // depends on config

JSON.stringify = JSONStringify; // Patch JSON.stringify to work flawlessly with Bigints.

validateConfig(); // depends on logger

fs.readFile(path.join(repoDir, "BUILD_DATE"), "utf-8", (err, data) => {
    if (!err) {
        logger.info(`Docker image was built on ${data.trim()}`);
    }
});

if (args.test) {
    const allGood = runSelfTests();
    logger.info(`Self-tests finished`);
    process.exit(allGood ? 0 : 1);
} else {
    let mongodUri = config.database;
    if (typeof mongodUri != "string") {
        const dataDir = path.resolve(mongodUri.dbPath);
        fs.mkdirSync(dataDir, { recursive: true });

        const downloadDir = "node_modules/.cache";

        // Breaking MongoMemoryServer is as easy as pressing Ctrl+C while it's extracting and it has no "cache integrity checking" of its own (https://github.com/typegoose/mongodb-memory-server/issues/991)
        if (fs.existsSync(`${downloadDir}/mongod-x64-win32-7.0.34.exe`)) {
            if (fs.statSync(`${downloadDir}/mongod-x64-win32-7.0.34.exe`).size != 65191936) {
                logger.debug(`${downloadDir}/mongod-x64-win32-7.0.34.exe has invalid size, deleting it`);
                fs.unlinkSync(`${downloadDir}/mongod-x64-win32-7.0.34.exe`);
            }
        }

        const mongod = await MongoMemoryServer.create({
            binary: {
                version: mongodUri.engine == "MongoDB 8.0" ? undefined : "7.0.34", // Check https://www.mongodb.com/docs/v7.0/release-notes/7.0/ for updates :)
                downloadDir
            },
            instance: {
                dbPath: dataDir,
                port: 27117, // Prefer 27117 just to have a steady port for Compass, etc.
                portGeneration: true // If 27117 is not available, another port is fine.
            }
        });
        mongodUri = mongod.getUri();
        logger.info(`MongoDB server running at ${mongodUri}`);
        mongodUri += "openWF";
    }

    try {
        await mongoose.connect(mongodUri);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error connecting to MongoDB server: ${error.message}`);
        }
        process.exit(1);
    }
    const mongodbBuildInfo = await mongoose.connection.db!.admin().buildInfo();
    if (
        Array.isArray(mongodbBuildInfo.versionArray) &&
        mongodbBuildInfo.versionArray.every(x => typeof x == "number")
    ) {
        const [major, minor, patch] = mongodbBuildInfo.versionArray;
        logger.info(`Connected to MongoDB v${major}.${minor}.${patch}`);
    } else {
        logger.info("Connected to MongoDB (version unknown)");
    }
    syncConfigWithDatabase();

    try {
        await startWebServer();
    } catch (_err) {
        const err = _err as IListenError;
        if (err.port) {
            logger.error(`Failed to bind port ${err.port}`);
            if (process.platform == "win32") {
                logger.error(
                    `You can check who has that port via powershell: Get-Process -Id (Get-NetTCPConnection -LocalPort ${err.port}).OwningProcess`
                );
            }
        } else {
            logger.error(err.message);
        }
        process.exit(1);
    }

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

    if (args.dev) {
        logger.info(
            "Developer mode is enabled. Note that this project is where it is now due to code contributions; please pay it forward with pull requests."
        );
        runSelfTests();
    }

    void updateWorldStateCollections();
    setInterval(() => {
        void updateWorldStateCollections();
    }, 60_000);
}
