import fs from "fs";
import path from "path";
import { repoDir } from "@/src/helpers/pathHelper";
import { args } from "@/src/helpers/commandLineArguments";

export interface IConfig {
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
    infiniteCredits?: boolean;
    infinitePlatinum?: boolean;
    infiniteEndo?: boolean;
    infiniteRegalAya?: boolean;
    infiniteHelminthMaterials?: boolean;
    claimingBlueprintRefundsIngredients?: boolean;
    dontSubtractPurchaseCreditCost?: boolean;
    dontSubtractPurchasePlatinumCost?: boolean;
    dontSubtractPurchaseItemCost?: boolean;
    dontSubtractPurchaseStandingCost?: boolean;
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
    fullyStockedVendors?: boolean;
    baroAlwaysAvailable?: boolean;
    baroFullyStocked?: boolean;
    syndicateMissionsRepeatable?: boolean;
    unlockAllProfitTakerStages?: boolean;
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
    missionsCanGiveAllRelics?: boolean;
    unlockAllSimarisResearchEntries?: boolean;
    spoofMasteryRank?: number;
    nightwaveStandingMultiplier?: number;
    unfaithfulBugFixes?: {
        ignore1999LastRegionPlayed?: boolean;
        fixXtraCheeseTimer?: boolean;
    };
    worldState?: {
        creditBoost?: boolean;
        affinityBoost?: boolean;
        resourceBoost?: boolean;
        starDays?: boolean;
        eidolonOverride?: string;
        vallisOverride?: string;
        duviriOverride?: string;
        nightwaveOverride?: string;
        circuitGameModes?: string[];
    };
    dev?: {
        keepVendorsExpired?: boolean;
    };
}

export const configPath = path.join(repoDir, args.configPath ?? "config.json");

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
