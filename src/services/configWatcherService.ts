import chokidar from "chokidar";
import fsPromises from "fs/promises";
import { logger } from "../utils/logger";
import { config, configPath, loadConfig } from "./configService";
import { getWebPorts, sendWsBroadcast, startWebServer, stopWebServer } from "./webService";
import { Inbox } from "../models/inboxModel";
import varzia from "@/static/fixed_responses/worldState/varzia.json";

let amnesia = false;
chokidar.watch(configPath).on("change", () => {
    if (amnesia) {
        amnesia = false;
    } else {
        logger.info("Detected a change to config file, reloading its contents.");
        try {
            loadConfig();
        } catch (e) {
            logger.error("Config changes were not applied: " + (e as Error).message);
            return;
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
    if (
        config.worldState?.varziaOverride &&
        !varzia.primeDualPacks.some(p => p.ItemType === config.worldState?.varziaOverride)
    ) {
        config.worldState.varziaOverride = "";
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
