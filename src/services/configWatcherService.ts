/* eslint-disable @typescript-eslint/no-deprecated */
import chokidar from "chokidar";
import { logger } from "../utils/logger.ts";
import {
    config,
    configPath,
    configRemovedOptionsKeys,
    getWebServerParams,
    loadConfig,
    type IConfig
} from "./configService.ts";
import { saveConfig, shouldReloadConfig } from "./configWriterService.ts";
import { startWebServer, stopWebServer } from "./webService.ts";
import {
    bootNonAdminsFromWebui,
    forEachWsClient,
    sendWsBroadcast,
    sendWsBroadcastToGame,
    sendWsBroadcastToWebui,
    type IWsMsgToClient
} from "./wsService.ts";
import varzia from "../constants/varzia.ts";
import { getTunablesForClient } from "./tunablesService.ts";
import { Account } from "../models/loginModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import { createMessage } from "./inboxService.ts";

chokidar.watch(configPath).on("change", () => {
    if (shouldReloadConfig()) {
        const prevLogFormat = config.logger.format ?? "%timestamp% [%level%] %message%";
        const prevWorldState = JSON.stringify(config.worldState);
        const prevTunables = JSON.stringify(config.tunables);
        const prevWebParams = JSON.stringify(getWebServerParams());

        logger.info("Detected a change to config file, reloading its contents.");
        try {
            loadConfig();
        } catch (e) {
            logger.error("Config changes were not applied: " + (e as Error).message);
            return;
        }
        validateConfig();
        syncConfigWithDatabase();

        if ((config.logger.format ?? "%timestamp% [%level%] %message%") != prevLogFormat) {
            logger.info("Log format changed.");
            logger.debug("Here's some text to feast your eyes upon.");
        }

        if (JSON.stringify(config.worldState) != prevWorldState) {
            logger.debug(`config.worldState changed, informing clients`);
            sendWsBroadcastToGame(undefined, { sync_world_state: true });
        }

        if (JSON.stringify(config.tunables) != prevTunables) {
            logger.debug(`config.tunables changed, informing clients`);
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

        if (JSON.stringify(getWebServerParams()) != prevWebParams) {
            logger.info(`Restarting web server to apply changes.`);

            // Tell webui clients to reload with new port
            sendWsBroadcast({ ports: { http: config.httpPort, https: config.httpsPort } });

            void stopWebServer().then(() => {
                startWebServer().catch((e: Error) => {
                    logger.error(`Could not start up web server again: ${e.message}`);
                });
            });
        } else {
            sendWsBroadcastToWebui({ config_reloaded: true });
        }

        // Handle change to adminOnly or administratorNames
        if (config.webui?.adminOnly) {
            bootNonAdminsFromWebui();
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
    if (!config.hubServers) {
        config.hubServers = [
            {
                address:
                    (config.hubAddress == "127.0.0.1:6951" ? config.tunables?.udpProxyUpstream : config.hubAddress) ??
                    "%THIS_MACHINE%:6952",
                regions: ["ASIA", "OCEANIA", "EUROPE", "RUSSIA", "NORTH_AMERICA", "SOUTH_AMERICA"],
                dtlsUnsupported: true
            }
        ];
        delete config.hubAddress;
        if (config.tunables) {
            delete config.tunables.udpProxyUpstream;
        }
        modified = true;
    }
    if (config.nrsAddress) {
        config.nrsAddresses = Array.isArray(config.nrsAddress) ? config.nrsAddress : [config.nrsAddress];
        delete config.nrsAddress;
        modified = true;
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
    if (config.webui?.defaultLanguage) {
        if (
            ["en", "de", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "tr", "uk", "zh", "tc", "th"].indexOf(
                config.webui.defaultLanguage
            ) == -1
        ) {
            config.webui.defaultLanguage = "en";
            modified = true;
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
    if (
        config.worldState?.baroRelayOverride &&
        (config.worldState.baroRelayOverride > 4 || config.worldState.baroRelayOverride < 0)
    ) {
        config.worldState.baroRelayOverride = 0;
        modified = true;
    }
    if (
        config.worldState?.lunarNewYear &&
        !["all", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"].includes(
            config.worldState.lunarNewYear
        )
    ) {
        delete config.worldState.lunarNewYear;
        modified = true;
    }
    if (modified) {
        logger.info(`Updating config file to fix some issues with it.`);
        void saveConfig();
    }
};

export const syncConfigWithDatabase = (): void => {
    // Event messages are deleted after endDate. Since we don't use beginDate/endDate and instead have config toggles, we need to delete the messages once those bools are false.
    // Also, for some reason, I can't just do `Inbox.deleteMany(...)`; - it needs this whole circus.
    if (!config.worldState?.creditBoost) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_creditBoost: 1 } }).then(() => {});
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666672" }).then(() => {});
    }
    if (!config.worldState?.affinityBoost) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_affinityBoost: 1 } }).then(() => {});
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666673" }).then(() => {});
    }
    if (!config.worldState?.resourceBoost) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_resourceBoost: 1 } }).then(() => {});
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666674" }).then(() => {});
    }
    if (!config.worldState?.galleonOfGhouls) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_galleonOfGhouls: 1 } }).then(() => {});
        void Inbox.deleteMany({ goalTag: "GalleonRobbery" }).then(() => {});
    }
    if (!config.worldState?.longShadow) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_longShadow: 1 } }).then(() => {});
        void Inbox.deleteMany({ goalTag: "NightwatchTacAlert" }).then(() => {});
    }
    if (!config.worldState?.bloodOfPerita) {
        void Account.find({ receivedEventMessage_bloodOfPerita: { $exists: true } }, "_id").then(accounts => {
            for (const account of accounts) {
                void createMessage(account._id, [
                    {
                        sndr: "/Lotus/Language/1999/MessengerRoatheName",
                        sub: "/Lotus/Language/TauPrequel/TauPrequelFinal/RoathesValorOutroInboxTitle",
                        msg: "/Lotus/Language/TauPrequel/TauPrequelFinal/RoathesValorOutroInbox",
                        icon: "/Lotus/Interface/Icons/Npcs/Roathe.png",
                        // startDate & endDate would be present with the event dates but MongoDB would delete the message if we set an endDate in the past.
                        transmission: "/Lotus/Sounds/Dialog/Tau/RoatheEventOutroInbox/DRoatheEventOutroInbox0020Roathe",
                        QuestReq: "/Lotus/Types/Keys/TauPrequel/TauPrequelQuestKeyChain"
                    }
                ]);
            }
            void Account.updateMany({}, { $unset: { receivedEventMessage_bloodOfPerita: 1 } }).then(() => {});
        });
        void Inbox.deleteMany({
            transmission: "/Lotus/Sounds/Dialog/Tau/RoatheEventOutroInbox/DRoatheEventIntroInbox0010Roathe"
        }).then(() => {});
    }
    if (!config.worldState?.operationAtramentum) {
        void Account.updateMany({}, { $unset: { receivedEventMessage_operationAtramentum: 1 } }).then(() => {});
        void Inbox.deleteMany({
            transmission: "/Lotus/Sounds/Dialog/Shadowgrapher/Vendor/DSGInbox0011AspirantZorba"
        }).then(() => {});
    }
};
