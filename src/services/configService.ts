import fs from "fs";
import path from "path";
import { repoDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";
import type { Request } from "express";

export type TRegionId = "ASIA" | "OCEANIA" | "EUROPE" | "RUSSIA" | "NORTH_AMERICA" | "SOUTH_AMERICA";

export interface IHubServer {
    address: string;
    regions?: TRegionId[];
    dtlsUnsupported?: boolean;
}

export interface IWebuiConfig {
    enabled?: boolean;
    adminOnly?: boolean;
    defaultLanguage?: string;
    nonAdminPermissions?: Record<string, boolean | Record<string, boolean>>;
}

export interface IConfig {
    mongodbUrl: string;
    logger: {
        files: boolean;
        level: string; // "fatal" | "error" | "warn" | "info" | "http" | "debug" | "trace";
        format?: string;
    };
    myAddress: string;
    bindAddress?: string;
    httpPort?: number;
    httpsPort?: number;
    httpsCertFile?: string;
    httpsKeyFile?: string;
    ircExecutable?: string;
    ircAddress?: string;
    hubExecutable?: string;
    /** @deprecated */ hubAddress?: string;
    hubServers?: IHubServer[];
    noHubDiscrimination?: boolean;
    /** @deprecated */ nrsAddress?: string;
    nrsAddresses?: string[];
    dtls?: number;
    administratorNames?: string[];
    autoCreateAccount?: boolean;
    fallbackBuildLabel?: string;
    skipTutorial?: boolean;
    fullyStockedVendors?: boolean;
    skipClanKeyCrafting?: boolean;
    webui?: IWebuiConfig;
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
        baroRelayOverride?: number;
        evilBaroStage?: number;
        varziaFullyStocked?: boolean;
        vanguardVaultRelics?: boolean;
        wolfHunt?: number;
        scarletSpear?: boolean;
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
        dagathAlerts2026Week1?: boolean;
        dagathAlerts2026Week2?: boolean;
        dagathAlerts2026Week3?: boolean;
        dagathAlerts2026Week4?: boolean;
        starDaysAlerts2026Week1?: boolean;
        starDaysAlerts2026Week2?: boolean;
        starDaysAlerts2026Week3?: boolean;
        starDaysAlerts2026Week4?: boolean;
        qtccAlerts?: boolean;
        galleonOfGhouls?: number;
        ghoulEmergenceOverride?: boolean;
        plagueStarOverride?: boolean;
        starDaysOverride?: boolean;
        saintPatrickOverride?: boolean;
        xmasOverride?: boolean;
        lunarNewYear?: string;
        dogDaysOverride?: boolean;
        dogDaysRewardsOverride?: number;
        operationAtramentum?: boolean;
        operationAtramentumProgressOverride?: number;
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
        nightwaveEpisode?: number;
        allTheFissures?: string;
        varziaOverride?: string;
        circuitGameModes?: string[];
        darvoStockMultiplier?: number;
        communitySynthesisTarget?: number;
        communitySynthesisProgress?: number;
    };
    serversideQualityOfLife?: {
        twentythreeHourMasteryRankCooldown?: boolean;
        doubleDailySynthesisEndoReward?: boolean;
    };
    tunables?: {
        useLoginToken?: boolean;
        prohibitSkipMissionStartTimer?: boolean;
        prohibitDisableProfanityFilter?: boolean;
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

export const configIdToIndexable = (id: string): [Record<string, boolean | string | number | undefined>, string] => {
    let obj = config as unknown as Record<string, never>;
    const arr = id.split(".");
    while (arr.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        obj[arr[0]] ??= {} as never;
        obj = obj[arr[0]];
        arr.splice(0, 1);
    }
    return [obj, arr[0]];
};

export interface IWebServerParams {
    address: string;
    httpPort: number;
    httpsPort: number;
    certFile: string;
    keyFile: string;
}

export const getWebServerParams = (): IWebServerParams => {
    return {
        address: config.bindAddress || "0.0.0.0",
        httpPort: config.httpPort || 80,
        httpsPort: config.httpsPort || 443,
        certFile: config.httpsCertFile || "static/cert/cert.pem",
        keyFile: config.httpsKeyFile || "static/cert/key.pem"
    };
};

export const getNrsAddresses = (): [string, number][] => {
    return (config.nrsAddresses ?? []).map(nrsAddr => {
        nrsAddr = nrsAddr.replaceAll("%THIS_MACHINE%", "127.0.0.1");
        let nrsPort = 4950;
        const colon = nrsAddr.indexOf(":");
        if (colon != -1) {
            nrsPort = parseInt(nrsAddr.substring(colon + 1));
            nrsAddr = nrsAddr.substring(0, colon);
        }
        return [nrsAddr, nrsPort];
    });
};
