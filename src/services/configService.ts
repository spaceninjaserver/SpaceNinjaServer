import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { repoDir } from "@/src/helpers/pathHelper";
import { logger } from "@/src/utils/logger";

const configPath = path.join(repoDir, "config.json");
export const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as IConfig;

let amnesia = false;
fs.watchFile(configPath, () => {
    if (amnesia) {
        amnesia = false;
    } else {
        logger.info("Detected a change to config.json, reloading its contents.");

        // Set all values to undefined now so if the new config.json omits some fields that were previously present, it's correct in-memory.
        for (const key of Object.keys(config)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            (config as any)[key] = undefined;
        }

        Object.assign(config, JSON.parse(fs.readFileSync(configPath, "utf-8")));
        validateConfig();
    }
});

interface IConfig {
    mongodbUrl: string;
    logger: ILoggerConfig;
    myAddress: string;
    httpPort?: number;
    httpsPort?: number;
    myIrcAddresses?: string[];
    NRS?: string[];
    administratorNames?: string[];
    autoCreateAccount?: boolean;
    skipTutorial?: boolean;
    skipAllDialogue?: boolean;
    unlockAllScans?: boolean;
    unlockAllMissions?: boolean;
    infiniteCredits?: boolean;
    infinitePlatinum?: boolean;
    infiniteEndo?: boolean;
    infiniteRegalAya?: boolean;
    infiniteHelminthMaterials?: boolean;
    unlockAllShipFeatures?: boolean;
    unlockAllShipDecorations?: boolean;
    unlockAllFlavourItems?: boolean;
    unlockAllSkins?: boolean;
    unlockAllCapturaScenes?: boolean;
    universalPolarityEverywhere?: boolean;
    unlockDoubleCapacityPotatoesEverywhere?: boolean;
    unlockExilusEverywhere?: boolean;
    unlockArcanesEverywhere?: boolean;
    noDailyStandingLimits?: boolean;
    noArgonCrystalDecay?: boolean;
    noVendorPurchaseLimits?: boolean;
    instantResourceExtractorDrones?: boolean;
    noDojoRoomBuildStage?: boolean;
    fastDojoRoomDestruction?: boolean;
    noDojoResearchCosts?: boolean;
    noDojoResearchTime?: boolean;
    fastClanAscension?: boolean;
    spoofMasteryRank?: number;
    worldState?: {
        creditBoost?: boolean;
        affinityBoost?: boolean;
        resourceBoost?: boolean;
        starDays?: boolean;
        lockTime?: number;
    };
}

interface ILoggerConfig {
    files: boolean;
    level: string; // "fatal" | "error" | "warn" | "info" | "http" | "debug" | "trace";
}

export const updateConfig = async (data: string): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, data);
    Object.assign(config, JSON.parse(data));
};

export const saveConfig = async (): Promise<void> => {
    amnesia = true;
    await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2));
};

export const validateConfig = (): void => {
    if (typeof config.administratorNames == "string") {
        logger.info(`Updating config.json to make administratorNames an array.`);
        config.administratorNames = [config.administratorNames];
        void saveConfig();
    }
};
