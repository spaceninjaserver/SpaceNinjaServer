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
            logger.error("Failed to reload config.json. Did you delete it?! Execution cannot continue.");
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
    if (typeof config.administratorNames == "string") {
        logger.info(`Updating config.json to make administratorNames an array.`);
        config.administratorNames = [config.administratorNames];
        void saveConfig();
    }
};

export const updateConfig = async (data: string): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, data);
    Object.assign(config, JSON.parse(data));
};

export const saveConfig = async (): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
};
