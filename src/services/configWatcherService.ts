import fs from "fs";
import fsPromises from "fs/promises";
import { logger } from "../utils/logger";
import { config, configPath, loadConfig } from "./configService";
import { getWebPorts, startWebServer, stopWebServer } from "./webService";

let amnesia = false;
fs.watchFile(configPath, () => {
    if (amnesia) {
        amnesia = false;
    } else {
        logger.info("Detected a change to config.json, reloading its contents.");
        try {
            loadConfig();
        } catch (e) {
            logger.error("FATAL ERROR: Config failed to be reloaded: " + (e as Error).message);
            process.exit(1);
        }
        validateConfig();

        const webPorts = getWebPorts();
        if (config.httpPort != webPorts.http || config.httpsPort != webPorts.https) {
            logger.info(`Restarting web server to apply port changes.`);
            void stopWebServer().then(startWebServer);
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
    if (modified) {
        logger.info(`Updating config.json to fix some issues with it.`);
        void saveConfig();
    }
};

export const saveConfig = async (): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
};
