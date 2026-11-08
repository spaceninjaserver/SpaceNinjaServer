import fs from "fs";
import path from "path";
import { repoDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";
import type { Request } from "express";
import { version_compare } from "../helpers/inventoryHelpers.ts";
import configDefaults from "../../config-vanilla.json" with { type: "json" };
import type { TConfigAlertKey } from "../constants/configAlerts.ts";

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

export type TLogLevel = "error" | "warn" | "info" | "http" | "debug" | "trace";

type TQolConfigKey =
    | "tutorialGivesStanceMods"
    | "twentythreeHourMasteryRankCooldown"
    | "doubleDailySynthesisEndoReward"
    | "tylRegorDropsTwoEquinoxParts"
    | "railjackExtraResourceBundlesReward"
    | "railjackSteelEssencesReward";

export interface IConfig {
    /** @deprecated */ mongodbUrl?: string;
    database:
        | string
        | {
              engine: "MongoDB 7.0" | "MongoDB 8.0";
              dbPath: string;
          };
    logger: {
        files: boolean;
        /** @deprecated */ level?: TLogLevel;
        fileLevel?: TLogLevel;
        consoleLevel?: TLogLevel;
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
        giveBreedingGroundsRewardsAtSum?: boolean;
    };
    worldState?: {
        creditBoostMultiplier?: number;
        affinityBoostMultiplier?: number;
        resourceBoostMultiplier?: number;
        resourceBoostAffectsAllPickups?: boolean;
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
        qtccAlerts?: boolean;
        galleonOfGhouls?: number;
        ghoulEmergenceOverride?: boolean;
        plagueStarOverride?: boolean;
        starDaysOverride?: boolean;
        saintPatrickOverride?: boolean;
        prideOverride?: boolean;
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
        epochOperationTaubound?: boolean;
        epochOperationTauboundProgressOverride?: number;
        invasionGrineerCount?: number;
        invasionCorpusCount?: number;
        invasionOutbreakCount?: number;
        invasionGoal?: number;
        invasionSimulatedHours?: number;
        invasionSpreadHours?: number;
        invasionRestHoursOverride?: number;
        constructionPctPerDay?: number;
        constructionPctPerWin?: number;
        constructionEventMissions?: number;
        constructionEventDays?: number;
        relayEventMercuryOverride?: string;
        relayEventEarthOverride?: string;
        relayEventSaturnOverride?: string;
        relayEventPlutoOverride?: string;
        eidolonOverride?: string;
        vallisOverride?: string;
        duviriOverride?: string;
        nightwaveOverride?: string;
        nightwaveEpisode?: number;
        classicAlerts?: boolean;
        allTheFissures?: string;
        varziaOverride?: string;
        circuitGameModes?: string[];
        darvoStockMultiplier?: number;
        communitySynthesisTarget?: number;
        communitySynthesisProgress?: number;
        snowdayShowdown?: boolean;
        breedingGrounds?: boolean;
    } & Partial<Record<TConfigAlertKey, boolean>>;
    serversideQualityOfLife?: Record<TQolConfigKey, boolean | null>;
    inventoryDefaults?: Record<string, any>;
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

export const serverCheatBooleans = [
    "skipTutorial",
    "skipClanKeyCrafting",
    "fullyStockedVendors",
    "noHubDiscrimination"
] as const satisfies readonly (keyof IConfig)[];

export const worldStateNumberOptions = {
    darvoStockMultiplier: { default: 1, step: 0.01 },
    creditBoostMultiplier: { default: 0, min: 0, max: 1000000 },
    affinityBoostMultiplier: { default: 0, min: 0, max: 1000000 },
    resourceBoostMultiplier: { default: 0, min: 0, max: 1000000 },
    nightwaveEpisode: { default: 1, min: 1, max: 5 },
    invasionGrineerCount: { default: 1, min: 0, max: 5 },
    invasionCorpusCount: { default: 1, min: 0, max: 5 },
    invasionOutbreakCount: { default: 2, min: 0, max: 5 },
    invasionGoal: { default: 30000, min: 1, max: 100000 },
    invasionSimulatedHours: { default: 36, min: 0, max: 720 },
    invasionSpreadHours: { default: 2, min: 0, max: 72 },
    invasionRestHoursOverride: { min: 0, max: 72 },
    constructionPctPerDay: { default: 0.75, min: 0, max: 100, step: 0.01 },
    constructionPctPerWin: { default: 1, min: 0, max: 100, step: 0.01 },
    constructionEventMissions: { default: 30, min: 1, max: 100000 },
    constructionEventDays: { default: 4, min: 1, max: 30 },
    operationAtramentumProgressOverride: { default: 0, min: 0, max: 100 },
    bellyOfTheBeastProgressOverride: { default: 0, min: 0, max: 100 },
    eightClawProgressOverride: { default: 0, min: 0, max: 100 },
    thermiaFracturesProgressOverride: { default: 0, min: 0, max: 100 },
    epochOperationTauboundProgressOverride: { default: 0, min: 0, max: 100 },
    communitySynthesisTarget: { default: 0, min: 0, max: 10 },
    communitySynthesisProgress: { default: 0, min: 0, max: 100, step: 0.1 }
} as const satisfies Partial<
    Record<keyof NonNullable<IConfig["worldState"]>, { default?: number; min?: number; max?: number; step?: number }>
>;

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
    database: "mongodb://127.0.0.1:27017/openWF",
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

export const shouldDoServerQol = (
    key: TQolConfigKey,
    clientBuildLabel: string,
    introducedInBuildLabel: string
): boolean => {
    let value = config.serversideQualityOfLife?.[key];
    if (value === undefined) {
        value = configDefaults.serversideQualityOfLife[key];
    }
    if (value === null) {
        return version_compare(clientBuildLabel, introducedInBuildLabel) >= 0;
    }
    return value;
};
