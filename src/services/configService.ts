import fs from "fs";
import path from "path";
import { repoDir } from "@/src/helpers/pathHelper";
import { args } from "@/src/helpers/commandLineArguments";
import { Inbox } from "@/src/models/inboxModel";

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
    exceptionalRelicsAlwaysGiveBronzeReward?: boolean;
    flawlessRelicsAlwaysGiveSilverReward?: boolean;
    radiantRelicsAlwaysGiveGoldReward?: boolean;
    unlockAllSimarisResearchEntries?: boolean;
    disableDailyTribute?: boolean;
    spoofMasteryRank?: number;
    relicRewardItemCountMultiplier?: number;
    nightwaveStandingMultiplier?: number;
    unfaithfulBugFixes?: {
        ignore1999LastRegionPlayed?: boolean;
        fixXtraCheeseTimer?: boolean;
    };
    worldState?: {
        creditBoost?: boolean;
        affinityBoost?: boolean;
        resourceBoost?: boolean;
        tennoLiveRelay?: boolean;
        baroTennoConRelay?: boolean;
        wolfHunt?: boolean;
        longShadow?: boolean;
        hallowedFlame?: boolean;
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
        eidolonOverride?: string;
        vallisOverride?: string;
        duviriOverride?: string;
        nightwaveOverride?: string;
        allTheFissures?: string;
        circuitGameModes?: string[];
        darvoStockMultiplier?: number;
        varziaOverride?: string;
        varziaFullyStocked?: boolean;
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
