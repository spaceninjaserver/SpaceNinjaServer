import fs from "fs";
import fsPromises from "fs/promises";
import { logger } from "../utils/logger";
import { config, configPath, loadConfig } from "./configService";
import { getWebPorts, sendWsBroadcast, startWebServer, stopWebServer } from "./webService";
import { Inbox } from "../models/inboxModel";

let amnesia = false;
fs.watchFile(configPath, (now, then) => {
    // https://github.com/oven-sh/bun/issues/20542
    if (process.versions.bun && now.mtimeMs == then.mtimeMs) {
        return;
    }

    if (amnesia) {
        amnesia = false;
    } else {
        logger.info("Detected a change to config file, reloading its contents.");
        try {
            loadConfig();
        } catch (e) {
            logger.error("FATAL ERROR: Config failed to be reloaded: " + (e as Error).message);
            process.exit(1);
        }
        validateConfig();
        syncConfigWithDatabase();

        const webPorts = getWebPorts();
        if (config.httpPort != webPorts.http || config.httpsPort != webPorts.https) {
            logger.info(`Restarting web server to apply port changes.`);

            // Tell webui clients to reload with new port
            sendWsBroadcast({ ports: { http: config.httpPort, https: config.httpsPort } });

            void stopWebServer().then(startWebServer);
        } else {
            sendWsBroadcast({ config_reloaded: true });
        }
    }
});

export const validateConfig = (): void => {
    let modified = false;
    if (config.administratorNames) {
        if (!Array.isArray(config.administratorNames)) {
            config.administratorNames = [config.administratorNames];
            modified = true;
        }
        for (let i = 0; i != config.administratorNames.length; ++i) {
            if (typeof config.administratorNames[i] != "string") {
                config.administratorNames[i] = String(config.administratorNames[i]);
                modified = true;
            }
        }
    }
    if (
        config.worldState?.galleonOfGhouls &&
        config.worldState.galleonOfGhouls != 1 &&
        config.worldState.galleonOfGhouls != 2 &&
        config.worldState.galleonOfGhouls != 3
    ) {
        config.worldState.galleonOfGhouls = 0;
        modified = true;
    }
    if (modified) {
        logger.info(`Updating config file to fix some issues with it.`);
        void saveConfig();
    }
};

export const saveConfig = async (): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
};

export const syncConfigWithDatabase = (): void => {
    // Event messages are deleted after endDate. Since we don't use beginDate/endDate and instead have config toggles, we need to delete the messages once those bools are false.
    if (!config.worldState?.galleonOfGhouls) {
        void Inbox.deleteMany({ goalTag: "GalleonRobbery" }).then(() => {}); // For some reason, I can't just do `Inbox.deleteMany(...)`; it needs this whole circus.
    }
};
