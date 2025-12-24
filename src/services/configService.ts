import fs from "fs";
import path from "path";
import { repoDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { Request } from "express";

export interface IConfig {
    mongodbUrl: string;
    logger: {
        files: boolean;
        level: string; // "fatal" | "error" | "warn" | "info" | "http" | "debug" | "trace";
    };
    myAddress: string;
    bindAddress?: string;
    httpPort?: number;
    httpsPort?: number;
    ircExecutable?: string;
    ircAddress?: string;
    hubExecutable?: string;
    hubAddress?: string;
    nrsAddress?: string;
    dtls?: number;
    administratorNames?: string[];
    autoCreateAccount?: boolean;
    skipTutorial?: boolean;
    fullyStockedVendors?: boolean;
    skipClanKeyCrafting?: boolean;
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
        evilBaroStage?: number;
        varziaFullyStocked?: boolean;
        vanguardVaultRelics?: boolean;
        wolfHunt?: number;
        orphixVenom?: boolean;
        bloodOfPerita?: boolean;
        longShadow?: boolean;
        hallowedFlame?: boolean;
        anniversary?: number;
        hallowedNightmares?: boolean;
        hallowedNightmaresRewardsOverride?: number;
        naberusNightsOverride?: boolean;
        proxyRebellion?: boolean;
        proxyRebellionRewardsOverride?: number;
        voidCorruption2025Week1?: boolean;
        voidCorruption2025Week2?: boolean;
        voidCorruption2025Week3?: boolean;
        voidCorruption2025Week4?: boolean;
        qtccAlerts?: boolean;
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
    tunables?: {
        useLoginToken?: boolean;
        prohibitSkipMissionStartTimer?: boolean;
        prohibitFovOverride?: boolean;
        prohibitFreecam?: boolean;
        prohibitTeleport?: boolean;
        prohibitScripts?: boolean;
        motd?: string;
        udpProxyUpstream?: string;
    };
    dev?: {
        keepVendorsExpired?: boolean;
    };
}

export const configRemovedOptionsKeys = [
    "unlockallShipFeatures",
    "testQuestKey",
    "lockTime",
    "starDays",
    "platformCDNs",
    "completeAllQuests",
    "worldSeed",
    "unlockAllQuests",
    "unlockAllMissions",
    "version",
    "matchmakingBuildId",
    "buildLabel",
    "infiniteResources",
    "testMission",
    "skipStoryModeChoice",
    "NRS",
    "myIrcAddresses",
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
    "unlockAllScans",
    "unlockAllShipFeatures",
    "unlockAllCapturaScenes",
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
    "disableDailyTribute",
    "noDojoRoomBuildStage",
    "noDojoDecoBuildStage",
    "fastDojoRoomDestruction",
    "noDojoResearchCosts",
    "noDojoResearchTime",
    "fastClanAscension",
    "unlockAllSkins",
    "unlockAllFlavourItems",
    "unlockAllShipDecorations",
    "unlockAllDecoRecipes",
    "spoofMasteryRank",
    "relicRewardItemCountMultiplier",
    "nightwaveStandingMultiplier"
];
if (args.docker) {
    configRemovedOptionsKeys.push("bindAddress");
    configRemovedOptionsKeys.push("httpPort");
    configRemovedOptionsKeys.push("httpsPort");
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

export const getReflexiveAddress = (request: Request): { myAddress: string; myUrlBase: string } => {
    let myAddress: string;
    let myUrlBase: string = request.protocol + "://";
    if (request.host.indexOf("warframe.com") == -1) {
        // Client request was redirected cleanly, so we know it can reach us how it's reaching us now.
        myAddress = request.hostname;
        myUrlBase += request.host;
    } else {
        // Don't know how the client reached us, hoping the config does.
        myAddress = config.myAddress;
        myUrlBase += myAddress;
        const port: number = request.protocol == "http" ? config.httpPort || 80 : config.httpsPort || 443;
        if (port != (request.protocol == "http" ? 80 : 443)) {
            myUrlBase += ":" + port;
        }
    }
    return { myAddress, myUrlBase };
};

export interface IBindings {
    address: string;
    httpPort: number;
    httpsPort: number;
}

export const configGetWebBindings = (): IBindings => {
    return {
        address: config.bindAddress || "0.0.0.0",
        httpPort: config.httpPort || 80,
        httpsPort: config.httpsPort || 443
    };
};
