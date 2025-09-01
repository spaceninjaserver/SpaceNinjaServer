import fs from "fs";
import path from "path";
import { repoDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";
import { Inbox } from "../models/inboxModel.ts";

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
    administratorNames?: string[];
    autoCreateAccount?: boolean;
    skipTutorial?: boolean;
    unlockAllScans?: boolean;
    unlockAllShipFeatures?: boolean;
    unlockAllShipDecorations?: boolean;
    unlockAllFlavourItems?: boolean;
    unlockAllSkins?: boolean;
    unlockAllCapturaScenes?: boolean;
    unlockAllDecoRecipes?: boolean;
    fullyStockedVendors?: boolean;
    skipClanKeyCrafting?: boolean;
    noDojoRoomBuildStage?: boolean;
    noDojoDecoBuildStage?: boolean;
    fastDojoRoomDestruction?: boolean;
    noDojoResearchCosts?: boolean;
    noDojoResearchTime?: boolean;
    fastClanAscension?: boolean;
    spoofMasteryRank?: number;
    relicRewardItemCountMultiplier?: number;
    nightwaveStandingMultiplier?: number;
    unfaithfulBugFixes?: {
        ignore1999LastRegionPlayed?: boolean;
        fixXtraCheeseTimer?: boolean;
        useAnniversaryTagForOldGoals?: boolean;
    };
    worldState?: {
        creditBoost?: boolean;
        affinityBoost?: boolean;
        resourceBoost?: boolean;
        tennoLiveRelay?: boolean;
        baroTennoConRelay?: boolean;
        baroAlwaysAvailable?: boolean;
        baroFullyStocked?: boolean;
        varziaFullyStocked?: boolean;
        wolfHunt?: boolean;
        orphixVenom?: boolean;
        longShadow?: boolean;
        hallowedFlame?: boolean;
        anniversary?: number;
        hallowedNightmares?: boolean;
        hallowedNightmaresRewardsOverride?: number;
        proxyRebellion?: boolean;
        proxyRebellionRewardsOverride?: number;
        galleonOfGhouls?: number;
        ghoulEmergenceOverride?: boolean;
        plagueStarOverride?: boolean;
        starDaysOverride?: boolean;
        dogDaysOverride?: boolean;
        dogDaysRewardsOverride?: number;
        bellyOfTheBeast?: boolean;
        bellyOfTheBeastProgressOverride?: number;
        eightClaw?: boolean;
        eightClawProgressOverride?: number;
        thermiaFracturesOverride?: boolean;
        thermiaFracturesProgressOverride?: number;
        eidolonOverride?: string;
        vallisOverride?: string;
        duviriOverride?: string;
        nightwaveOverride?: string;
        allTheFissures?: string;
        varziaOverride?: string;
        circuitGameModes?: string[];
        darvoStockMultiplier?: number;
    };
    dev?: {
        keepVendorsExpired?: boolean;
    };
}

export const configRemovedOptionsKeys = [
    "NRS",
    "skipAllDialogue",
    "infiniteCredits",
    "infinitePlatinum",
    "infiniteEndo",
    "infiniteRegalAya",
    "infiniteHelminthMaterials",
    "claimingBlueprintRefundsIngredients",
    "dontSubtractPurchaseCreditCost",
    "dontSubtractPurchasePlatinumCost",
    "dontSubtractPurchaseItemCost",
    "dontSubtractPurchaseStandingCost",
    "dontSubtractVoidTraces",
    "dontSubtractConsumables",
    "universalPolarityEverywhere",
    "unlockDoubleCapacityPotatoesEverywhere",
    "unlockExilusEverywhere",
    "unlockArcanesEverywhere",
    "unlockAllProfitTakerStages",
    "unlockAllSimarisResearchEntries",
    "noDailyStandingLimits",
    "noDailyFocusLimit",
    "noArgonCrystalDecay",
    "noMasteryRankUpCooldown",
    "noVendorPurchaseLimits",
    "noDecoBuildStage",
    "noDeathMarks",
    "noKimCooldowns",
    "syndicateMissionsRepeatable",
    "instantFinishRivenChallenge",
    "instantResourceExtractorDrones",
    "noResourceExtractorDronesDamage",
    "baroAlwaysAvailable",
    "baroFullyStocked",
    "missionsCanGiveAllRelics",
    "exceptionalRelicsAlwaysGiveBronzeReward",
    "flawlessRelicsAlwaysGiveSilverReward",
    "radiantRelicsAlwaysGiveGoldReward",
    "disableDailyTribute"
];

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
    const newConfig = JSON.parse(fs.readFileSync(configPath, "utf-8")) as IConfig;

    // Set all values to undefined now so if the new config.json omits some fields that were previously present, it's correct in-memory.
    for (const key of Object.keys(config)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (config as any)[key] = undefined;
    }

    Object.assign(config, newConfig);
};

export const syncConfigWithDatabase = (): void => {
    // Event messages are deleted after endDate. Since we don't use beginDate/endDate and instead have config toggles, we need to delete the messages once those bools are false.
    // Also, for some reason, I can't just do `Inbox.deleteMany(...)`; - it needs this whole circus.
    if (!config.worldState?.creditBoost) {
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666672" }).then(() => {});
    }
    if (!config.worldState?.affinityBoost) {
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666673" }).then(() => {});
    }
    if (!config.worldState?.resourceBoost) {
        void Inbox.deleteMany({ globaUpgradeId: "5b23106f283a555109666674" }).then(() => {});
    }
    if (!config.worldState?.galleonOfGhouls) {
        void Inbox.deleteMany({ goalTag: "GalleonRobbery" }).then(() => {});
    }
};
