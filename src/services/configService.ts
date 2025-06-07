import fs from "fs";
import path from "path";
import { repoDir } from "@/src/helpers/pathHelper";

interface IConfig {
    mongodbUrl: string;
    logger: {
        files: boolean;
        level: string; // "fatal" | "error" | "warn" | "info" | "http" | "debug" | "trace";
    };
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
    claimingBlueprintRefundsIngredients?: boolean;
    dontSubtractVoidTraces?: boolean;
    dontSubtractConsumables?: boolean;
    unlockAllShipFeatures?: boolean;
    unlockAllShipDecorations?: boolean;
    unlockAllFlavourItems?: boolean;
    unlockAllSkins?: boolean;
    unlockAllCapturaScenes?: boolean;
    unlockAllDecoRecipes?: boolean;
    universalPolarityEverywhere?: boolean;
    unlockDoubleCapacityPotatoesEverywhere?: boolean;
    unlockExilusEverywhere?: boolean;
    unlockArcanesEverywhere?: boolean;
    noDailyStandingLimits?: boolean;
    noDailyFocusLimit?: boolean;
    noArgonCrystalDecay?: boolean;
    noMasteryRankUpCooldown?: boolean;
    noVendorPurchaseLimits?: boolean;
    noDeathMarks?: boolean;
    noKimCooldowns?: boolean;
    syndicateMissionsRepeatable?: boolean;
    instantFinishRivenChallenge?: boolean;
    instantResourceExtractorDrones?: boolean;
    noResourceExtractorDronesDamage?: boolean;
    skipClanKeyCrafting?: boolean;
    noDojoRoomBuildStage?: boolean;
    noDojoDecoBuildStage?: boolean;
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
        nightwaveOverride?: string;
    };
}

export const configPath = path.join(repoDir, "config.json");

export const config: IConfig = {
    mongodbUrl: "mongodb://127.0.0.1:27017/openWF",
    logger: {
        files: true,
        level: "trace"
    },
    myAddress: "localhost"
};

export const loadConfig = (): void => {
    // Set all values to undefined now so if the new config.json omits some fields that were previously present, it's correct in-memory.
    for (const key of Object.keys(config)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (config as any)[key] = undefined;
    }

    Object.assign(config, JSON.parse(fs.readFileSync(configPath, "utf-8")));
};
