import chokidar from "chokidar";
import { logger } from "@/src/utils/logger";
import { config, configPath, loadConfig } from "@/src/services/configService";
import { saveConfig, shouldReloadConfig } from "@/src/services/configWriterService";
import { getWebPorts, startWebServer, stopWebServer } from "@/src/services/webService";
import { sendWsBroadcast } from "@/src/services/wsService";
import { Inbox } from "@/src/models/inboxModel";
import varzia from "@/static/fixed_responses/worldState/varzia.json";

chokidar.watch(configPath).on("change", () => {
    if (shouldReloadConfig()) {
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

export const syncConfigWithDatabase = (): void => {
    // Event messages are deleted after endDate. Since we don't use beginDate/endDate and instead have config toggles, we need to delete the messages once those bools are false.
    if (!config.worldState?.galleonOfGhouls) {
        void Inbox.deleteMany({ goalTag: "GalleonRobbery" }).then(() => {}); // For some reason, I can't just do `Inbox.deleteMany(...)`; it needs this whole circus.
    }
};
