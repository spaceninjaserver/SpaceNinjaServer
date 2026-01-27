import chokidar from "chokidar";
import { logger } from "../utils/logger.ts";
import {
    config,
    configGetWebBindings,
    configPath,
    configRemovedOptionsKeys,
    loadConfig,
    syncConfigWithDatabase,
    type IConfig
} from "./configService.ts";
import { saveConfig, shouldReloadConfig } from "./configWriterService.ts";
import { getWebBindings, startWebServer, stopWebServer } from "./webService.ts";
import { forEachWsClient, sendWsBroadcast, type IWsMsgToClient } from "./wsService.ts";
import varzia from "../constants/varzia.ts";
import { getTunablesForClient } from "./tunablesService.ts";

chokidar.watch(configPath).on("change", () => {
    if (shouldReloadConfig()) {
        const prevTunables = JSON.stringify(config.tunables);

        logger.info("Detected a change to config file, reloading its contents.");
        try {
            loadConfig();
        } catch (e) {
            logger.error("Config changes were not applied: " + (e as Error).message);
            return;
        }
        validateConfig();
        syncConfigWithDatabase();

        if (JSON.stringify(config.tunables) != prevTunables) {
            logger.debug(`tunables changed, informing clients`);
            forEachWsClient(client => {
                if (client.isGame) {
                    client.send(
                        JSON.stringify({
                            tunables: getTunablesForClient(client.address, client.reflexiveAddress)
                        } satisfies IWsMsgToClient)
                    );
                }
            });
        }

        const configBindings = configGetWebBindings();
        const bindings = getWebBindings();
        if (
            configBindings.address != bindings.address ||
            configBindings.httpPort != bindings.httpPort ||
            configBindings.httpsPort != bindings.httpsPort
        ) {
            logger.info(`Restarting web server to apply binding changes.`);

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
    for (const key of configRemovedOptionsKeys) {
        if (config[key as keyof IConfig] !== undefined) {
            logger.debug(
                `Spotted removed option ${key} with value ${String(config[key as keyof IConfig])} in config.json.`
            );
            delete config[key as keyof IConfig];
            modified = true;
        }
    }
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
        !Object.keys(varzia.primeDualPacks).includes(config.worldState.varziaOverride)
    ) {
        config.worldState.varziaOverride = "";
        modified = true;
    }
    if (
        config.worldState?.nightwaveEpisode &&
        (config.worldState.nightwaveEpisode > 5 || config.worldState.nightwaveEpisode < 1)
    ) {
        config.worldState.nightwaveEpisode = 1;
        modified = true;
    }
    if (modified) {
        logger.info(`Updating config file to fix some issues with it.`);
        void saveConfig();
    }
};
