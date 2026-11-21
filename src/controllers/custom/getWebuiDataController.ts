import type { RequestHandler } from "express";
import { ExportSyndicates } from "warframe-public-export-plus";
import type { TStandingLimitBin } from "warframe-public-export-plus";
import {
    accountCheatBooleans,
    accountCheatBooleansHiddenFromWebui,
    accountCheatNumbers,
    type TAccountCheatBooleanKey
} from "../../types/inventoryTypes/inventoryTypes.ts";
import { qolConfigIntroducedIn, serverCheatBooleans, worldStateNumberOptions } from "../../services/configService.ts";
import { circuitGameModes } from "../../types/worldStateTypes.ts";
import { configAlerts } from "../../constants/configAlerts.ts";
import { lunarNewYearFlashSales } from "../../constants/flashSales.ts";
import { anniversaryGoalsByWeek } from "../../constants/anniversary.ts";
import { baroRelayNodes, evilBaroDefaultYear, evilBaroEvents } from "../../constants/baro.ts";
import { constructionEventRelays } from "../../constants/constructionEvents.ts";
import { duviriMoods } from "../../constants/duviri.ts";

type TWebuiLoc = Record<string, string>;

function locAttrs(key: string, replace?: string): TWebuiLoc {
    return replace === undefined ? { "data-loc": key } : { "data-loc": key, "data-loc-replace": replace };
}

function itemMapAttrs(key: string, replace?: string): TWebuiLoc {
    return replace === undefined
        ? { "data-loc-itemMap": key }
        : { "data-loc-itemMap": key, "data-loc-replace": replace };
}

function itemMapTcAttrs(key: string): TWebuiLoc {
    return { "data-loc-itemMap-tc": key };
}

function placeholderAttrs(key: string): TWebuiLoc {
    return { "data-loc-placeholder": key };
}

function descAttrs(key: string): TWebuiLoc {
    return { "data-loc-title": key };
}

function toDisableAttrs(value: number): TWebuiLoc {
    return { "data-loc-title": "general_toDisable", "data-loc-title-replace": String(value) };
}

type TServerCheat = {
    key: string;
    label?: TWebuiLoc; // defaults to "worldState_<option name>"
    note?: TWebuiLoc; // shown as a (!) icon after the label, its text is shown as a tooltip on hover
    sameRow?: true; // shown in the same row as the previous option
    sameGroup?: true; // toggle shown in the same wrapping row as the previous one
    groupLabel?: TWebuiLoc; // heading of the group that this option starts
    incompatibleWith?: string[]; // keys of the options that this one can't be used together with
} & (
    | {
          type: "boolean";
          nullable?: boolean;
      }
    | {
          type: "enum";
          default: string;
          // A plain "true", "false" or "null" is labelled enabled, disabled or normal.
          // If omitted, the WebUI fills the values from getItemLists.
          values?: (string | { value: string; label: TWebuiLoc })[];
      }
    | { type: "int" | "float"; default?: number; min?: number; max?: number; step?: number }
    | {
          type: "stringArray";
          values?: readonly string[];
      }
    | {
          type: "action";
          endpoint: string;
          query?: string;
          method?: "GET" | "POST"; // defaults to GET
          confirm?: string; // loc key of a question asked first
          success?: string; // loc key of the toast shown when it's done, |COUNT| is replaced if the endpoint responds with { count }
          nothing?: string; // loc key of the toast shown when the endpoint responds with { count: 0 }
          debounce?: boolean;
      }
    | {
          // shown as a card of its own, items are from getItemLists[itemList]
          type: "itemList";
          itemList: string;
      }
    | {
          // shown as a card of its own, entries are stored in the database instead of the config
          type: "dbList";
          endpoint: string; // GET returns IDbListData, POST takes TDbListUpdate
          placeholder?: TWebuiLoc; // of the name input
          values?: { value: string; label: TWebuiLoc }[]; // if given, each entry has one of these as its value
      }
);

const configAlertCheats = (): TServerCheat[] => {
    const cheats: TServerCheat[] = [];
    const weeklyCheats: TServerCheat[] = [];
    let group: string | undefined;
    for (const key of Object.keys(configAlerts)) {
        const match = key.match(/^([a-zA-Z]+?)(\d{4})Week(\d+)$/);
        if (!match) {
            cheats.push({ key: "worldState." + key, type: "boolean" });
            continue;
        }
        const [, event, year, week] = match;
        const isNewGroup = group != event + year;
        group = event + year;
        weeklyCheats.push({
            key: "worldState." + key,
            type: "boolean",
            label: locAttrs("worldState_week", week),
            ...(isNewGroup ? { groupLabel: locAttrs("worldState_" + event, year) } : { sameGroup: true })
        });
    }
    return [...cheats, ...weeklyCheats];
};

const relayEventCheats = (): TServerCheat[] =>
    constructionEventRelays.map((relay, i) => ({
        key: "worldState." + relay.configKey,
        type: "enum",
        default: "",
        values: [
            { value: "", label: locAttrs("normal") },
            { value: "FC_GRINEER", label: itemMapAttrs("/Lotus/Language/G1Quests/FomorianRevengeBattleName") },
            { value: "FC_CORPUS", label: itemMapAttrs("/Lotus/Language/Menu/CorpusRazorbackProject") },
            { value: "disabled", label: locAttrs("disabled") }
        ],
        label: locAttrs("worldState_relayEvent", relay.VictimNode),
        ...(i % 2 == 1 ? { sameRow: true } : {})
    }));

const qolCheats: TServerCheat[] = Object.entries(qolConfigIntroducedIn).map(([key, version]) => ({
    key: "serversideQualityOfLife." + key,
    type: "enum",
    default: "null",
    values: [
        { value: "null", label: locAttrs("general_enabledFromVersion", version) },
        { value: "true", label: locAttrs("general_enabledForAllVersions") },
        { value: "false", label: locAttrs("general_disabledForAllVersions") }
    ],
    label: locAttrs("cheats_qol_" + key)
}));

const accountCheatActions: TServerCheat[] = (
    [
        { key: "unlockAllShipFeatures", endpoint: "/custom/unlockAllShipFeatures", debounce: true },
        {
            key: "unlockAllNormalMissions",
            endpoint: "/custom/completeAllMissions",
            query: "&normalOnly=1",
            success: "cheats_unlockAllMissions_ok",
            debounce: true
        },
        {
            key: "unlockAllMissions",
            endpoint: "/custom/completeAllMissions",
            success: "cheats_unlockAllMissions_ok",
            debounce: true
        },
        { key: "markAllAsRead", endpoint: "/custom/markAllAsRead", success: "code_succRelog", debounce: true },
        {
            key: "unlockAllScans",
            endpoint: "/custom/unlockAllScans",
            success: "cheats_unlockSuccRelog",
            debounce: true
        },
        { key: "unlockAllCapturaScenes", endpoint: "/custom/unlockAllCapturaScenes", debounce: true },
        {
            key: "unlockAllFocusSchools",
            endpoint: "/custom/unlockAllFocusSchools",
            success: "code_focusUnlocked",
            nothing: "code_focusAllUnlocked"
        },
        {
            key: "helminthUnlockAll",
            endpoint: "/api/infestedFoundry.php",
            query: "&mode=custom_unlockall",
            method: "POST"
        },
        { key: "addMissingSubsumedAbilities", endpoint: "/custom/addMissingHelminthBlueprints", debounce: true },
        { key: "intrinsicsUnlockAll", endpoint: "/custom/unlockAllIntrinsics" },
        {
            key: "maxPlexus",
            endpoint: "/custom/maxPlexus",
            success: "code_succRankUp",
            nothing: "code_noEquipmentToRankUp",
            debounce: true
        },
        { key: "unlockAllJobChainBounties", endpoint: "/custom/unlockAllJobChainBounties", debounce: true },
        { key: "unlockAllSimarisResearchEntries", endpoint: "/custom/unlockAllSimarisResearchEntries", debounce: true },
        {
            key: "addMissingDangerRooms",
            endpoint: "/custom/addMissingDangerRooms",
            success: "code_succAdded",
            debounce: true
        }
    ] as const
).map(action => ({ ...action, type: "action", label: locAttrs("cheats_" + action.key) }));

interface IServerCheatCard {
    label?: TWebuiLoc;
    options: TServerCheat[];
}

const serverCheats = {
    server: {
        label: locAttrs("cheats_server"),
        options: [
            ...serverCheatBooleans.map(key => ({ key, type: "boolean" as const, label: locAttrs("cheats_" + key) })),
            ...qolCheats
        ]
    },
    actions: {
        label: locAttrs("cheats_actions"),
        options: [
            {
                key: "resetIceBladeChampion",
                type: "action",
                endpoint: "/custom/resetIceBladeChampion",
                confirm: "code_resetIceBladeChampionConfirm",
                success: "code_succChange",
                debounce: true,
                label: locAttrs("worldState_resetIceBladeChampion")
            }
        ]
    },
    relaysAndVendors: {
        options: [
            { key: "worldState.tennoLiveRelay", type: "boolean" },
            { key: "worldState.baroTennoConRelay", type: "boolean" },
            { key: "worldState.baroAlwaysAvailable", type: "boolean", label: locAttrs("cheats_baroAlwaysAvailable") },
            { key: "worldState.baroFullyStocked", type: "boolean", label: locAttrs("cheats_baroFullyStocked") },
            { key: "worldState.varziaFullyStocked", type: "boolean" },
            { key: "worldState.vanguardVaultRelics", type: "boolean" },
            {
                key: "worldState.baroRelayOverride",
                type: "enum",
                default: "0",
                values: [
                    { value: "0", label: locAttrs("disabled") },
                    ...baroRelayNodes.map((node, i) => ({
                        value: String(i + 1),
                        label: itemMapAttrs(node, String(i + 1))
                    }))
                ]
            },
            {
                key: "worldState.evilBaroStage",
                type: "enum",
                default: "0",
                values: [
                    { value: "0", label: locAttrs("disabled") },
                    { value: "1", label: locAttrs("worldState_week", "1") },
                    { value: "2", label: locAttrs("worldState_week", "2") },
                    { value: "3", label: locAttrs("worldState_week", "3") },
                    { value: "4", label: locAttrs("worldState_week", "4") }
                ]
            },
            {
                key: "worldState.evilBaroYear",
                type: "enum",
                default: String(evilBaroDefaultYear),
                values: Object.keys(evilBaroEvents)
                    .reverse()
                    .map(year => ({ value: year, label: locAttrs("worldState_from_year", year) })),
                sameRow: true
            },
            { key: "worldState.darvoStockMultiplier", type: "float", ...worldStateNumberOptions.darvoStockMultiplier }
        ]
    },
    boosters: {
        options: [
            {
                key: "worldState.creditBoostMultiplier",
                type: "int",
                ...worldStateNumberOptions.creditBoostMultiplier,
                note: toDisableAttrs(0)
            },
            {
                key: "worldState.affinityBoostMultiplier",
                type: "int",
                ...worldStateNumberOptions.affinityBoostMultiplier,
                note: toDisableAttrs(0)
            },
            {
                key: "worldState.resourceBoostMultiplier",
                type: "int",
                ...worldStateNumberOptions.resourceBoostMultiplier,
                note: toDisableAttrs(0)
            },
            {
                key: "worldState.resourceBoostAffectsAllPickups",
                type: "boolean",
                note: descAttrs("worldState_resourceBoostAffectsAllPickupsDesc"),
                sameRow: true
            }
        ]
    },
    rotations: {
        options: [
            { key: "worldState.nightwaveOverride", type: "enum", default: "" },
            {
                key: "worldState.nightwaveEpisode",
                type: "int",
                ...worldStateNumberOptions.nightwaveEpisode,
                sameRow: true
            },
            {
                key: "worldState.eidolonOverride",
                type: "enum",
                default: "",
                values: [
                    { value: "", label: locAttrs("disabled") },
                    { value: "day", label: locAttrs("worldState_day") },
                    { value: "night", label: locAttrs("worldState_night") }
                ]
            },
            {
                key: "worldState.vallisOverride",
                type: "enum",
                default: "",
                values: [
                    { value: "", label: locAttrs("disabled") },
                    { value: "warm", label: itemMapAttrs("/Lotus/Language/Game/TimeOfDay_Warm") },
                    { value: "cold", label: itemMapAttrs("/Lotus/Language/Game/TimeOfDay_Cold") }
                ]
            },
            {
                key: "worldState.duviriOverride",
                type: "enum",
                default: "",
                values: [
                    { value: "", label: locAttrs("disabled") },
                    ...duviriMoods.map(({ mood, name }) => ({ value: mood, label: itemMapAttrs(name) }))
                ]
            },
            {
                key: "worldState.allTheFissures",
                type: "enum",
                default: "",
                values: [
                    { value: "", label: locAttrs("normal") },
                    { value: "normal", label: locAttrs("worldState_allAtOnceNormal") },
                    { value: "hard", label: locAttrs("worldState_allAtOnceSteelPath") }
                ],
                label: locAttrs("worldState_fissures")
            },
            { key: "worldState.varziaOverride", type: "enum", default: "" },
            {
                key: "worldState.circuitGameModes",
                type: "stringArray",
                values: circuitGameModes,
                label: locAttrs("worldState_theCircuitOverride")
            }
        ]
    },
    nightwaveExcludedChallenges: {
        options: [{ key: "worldState.nightwaveExcludedChallenges", type: "itemList", itemList: "NightwaveChallenges" }]
    },
    invasionsAndConstruction: {
        options: [
            {
                key: "worldState.invasionGrineerCount",
                type: "int",
                ...worldStateNumberOptions.invasionGrineerCount
            },
            {
                key: "worldState.invasionCorpusCount",
                type: "int",
                ...worldStateNumberOptions.invasionCorpusCount,
                sameRow: true
            },
            {
                key: "worldState.invasionOutbreakCount",
                type: "int",
                ...worldStateNumberOptions.invasionOutbreakCount,
                sameRow: true
            },
            { key: "worldState.invasionGoal", type: "int", ...worldStateNumberOptions.invasionGoal },
            {
                key: "worldState.invasionSimulatedHours",
                type: "int",
                ...worldStateNumberOptions.invasionSimulatedHours,
                note: toDisableAttrs(0)
            },
            {
                key: "worldState.invasionSpreadHours",
                type: "int",
                ...worldStateNumberOptions.invasionSpreadHours,
                note: toDisableAttrs(0)
            },
            {
                key: "worldState.invasionRestHoursOverride",
                type: "int",
                ...worldStateNumberOptions.invasionRestHoursOverride
            },
            {
                key: "worldState.constructionPctPerDay",
                type: "float",
                ...worldStateNumberOptions.constructionPctPerDay
            },
            {
                key: "worldState.constructionPctPerWin",
                type: "float",
                ...worldStateNumberOptions.constructionPctPerWin,
                sameRow: true
            },
            ...relayEventCheats(),
            {
                key: "worldState.constructionEventMissions",
                type: "int",
                ...worldStateNumberOptions.constructionEventMissions
            },
            {
                key: "worldState.constructionEventDays",
                type: "int",
                ...worldStateNumberOptions.constructionEventDays,
                sameRow: true
            }
        ]
    },
    alerts: {
        options: [
            { key: "worldState.qtccAlerts", type: "boolean" },
            ...configAlertCheats(),
            {
                key: "worldState.classicAlerts",
                type: "enum",
                default: "null",
                values: [
                    { value: "null", label: locAttrs("worldState_classicAlertsUpTo") },
                    { value: "true", label: locAttrs("worldState_classicAlertsOnAllVersions") },
                    "false"
                ]
            }
        ]
    },
    events: {
        options: [
            { key: "unfaithfulBugFixes.useAnniversaryTagForOldGoals", type: "boolean" },
            {
                key: "worldState.bloodOfPerita",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/TauPrequel/TauPrequelFinal/TauPrequelEventAlertTitle")
            },
            {
                key: "worldState.scarletSpear",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/G1Quests/FlotillaOperation")
            },
            {
                key: "worldState.orphixVenom",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/Events/MechSurvivalName"),
                incompatibleWith: [
                    "worldState.galleonOfGhouls",
                    "worldState.wolfHunt",
                    "worldState.proxyRebellion",
                    "worldState.anniversary"
                ]
            },
            {
                key: "worldState.longShadow",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/G1Quests/ProjectNightwatchTacAlertTitle"),
                incompatibleWith: ["worldState.anniversary"]
            },
            {
                key: "worldState.hallowedFlame",
                type: "boolean",
                label: itemMapTcAttrs("/Lotus/Language/Events/TacAlertHalloweenLantern"),
                incompatibleWith: [
                    "worldState.hallowedNightmares",
                    "worldState.dogDaysOverride",
                    "worldState.anniversary"
                ]
            },
            {
                key: "worldState.snowdayShowdown",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/G1Quests/TacAlertSnowballFightTitle")
            },
            {
                key: "worldState.breedingGrounds",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/G1Quests/InfestedCorpusHiveEventName")
            },
            {
                key: "unfaithfulBugFixes.giveBreedingGroundsRewardsAtSum",
                type: "boolean",
                note: descAttrs("worldState_giveBreedingGroundsRewardsAtSumDesc"),
                sameGroup: true
            },
            {
                key: "worldState.wolfHunt",
                type: "enum",
                default: "null",
                values: [
                    { value: "null", label: locAttrs("disabled") },
                    { value: "1", label: locAttrs("worldState_from_year", "2025") },
                    { value: "0", label: locAttrs("worldState_from_year", "2019") }
                ],
                label: itemMapAttrs("/Lotus/Language/Alerts/WolfAlert"),
                incompatibleWith: ["worldState.galleonOfGhouls", "worldState.orphixVenom", "worldState.anniversary"]
            },
            {
                key: "worldState.hallowedNightmares",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/G1Quests/TacAlertHalloweenTitle"),
                incompatibleWith: ["worldState.hallowedFlame", "worldState.dogDaysOverride", "worldState.anniversary"]
            },
            {
                key: "worldState.hallowedNightmaresRewardsOverride",
                type: "enum",
                default: "0",
                values: [
                    { value: "3", label: locAttrs("worldState_from_year", "2026") },
                    { value: "2", label: locAttrs("worldState_from_year", "2018") },
                    { value: "1", label: locAttrs("worldState_from_year", "2016") },
                    { value: "0", label: locAttrs("worldState_from_year", "2015") }
                ],
                label: locAttrs("worldState_hallowedNightmaresRewards"),
                sameRow: true
            },
            {
                key: "worldState.naberusNightsOverride",
                type: "boolean",
                nullable: true,
                label: itemMapAttrs("/Lotus/Language/Events/HalloweenNaberusName")
            },
            {
                key: "worldState.proxyRebellion",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/Alerts/TacAlertProxyRebellion"),
                incompatibleWith: ["worldState.anniversary", "worldState.orphixVenom"]
            },
            {
                key: "worldState.proxyRebellionRewardsOverride",
                type: "enum",
                default: "0",
                values: [
                    { value: "0", label: locAttrs("worldState_from_year", "2019") },
                    { value: "1", label: locAttrs("worldState_from_year", "2018") }
                ],
                label: locAttrs("worldState_proxyRebellionRewards"),
                sameRow: true
            },
            {
                key: "worldState.galleonOfGhouls",
                type: "enum",
                default: "0",
                values: [
                    { value: "0", label: locAttrs("disabled") },
                    { value: "1", label: locAttrs("worldState_we1") },
                    { value: "2", label: locAttrs("worldState_we2") },
                    { value: "3", label: locAttrs("worldState_we3") }
                ],
                label: itemMapAttrs("/Lotus/Language/Events/GalleonRobberyEventMissionTitle"),
                incompatibleWith: ["worldState.wolfHunt", "worldState.anniversary", "worldState.orphixVenom"]
            },
            {
                key: "worldState.anniversary",
                type: "enum",
                default: "null",
                values: [
                    { value: "null", label: locAttrs("disabled") },
                    ...anniversaryGoalsByWeek.map((_, i) => ({
                        value: String(i),
                        label: locAttrs("worldState_week", String(i + 1))
                    }))
                ],
                incompatibleWith: [
                    "worldState.wolfHunt",
                    "worldState.galleonOfGhouls",
                    "worldState.hallowedNightmares",
                    "worldState.hallowedFlame",
                    "worldState.dogDaysOverride",
                    "worldState.proxyRebellion",
                    "worldState.longShadow",
                    "worldState.orphixVenom"
                ]
            },
            {
                key: "worldState.ghoulEmergenceOverride",
                type: "boolean",
                nullable: true,
                label: itemMapTcAttrs("/Lotus/Language/GameModes/RecurringGhoulAlert")
            },
            {
                key: "worldState.plagueStarOverride",
                type: "boolean",
                nullable: true,
                label: itemMapTcAttrs("/Lotus/Language/InfestedPlainsEvent/InfestedPlainsBountyName")
            },
            {
                key: "worldState.starDaysOverride",
                type: "boolean",
                nullable: true,
                label: itemMapAttrs("/Lotus/Language/Events/ValentinesFortunaName")
            },
            {
                key: "worldState.saintPatrickOverride",
                type: "boolean",
                nullable: true,
                label: locAttrs("worldState_saintPatrick")
            },
            { key: "worldState.xmasOverride", type: "boolean", nullable: true, label: locAttrs("worldState_xmas") },
            { key: "worldState.prideOverride", type: "boolean", nullable: true },
            {
                key: "worldState.lunarNewYear",
                type: "enum",
                default: "null",
                values: [
                    { value: "null", label: locAttrs("disabled") },
                    { value: "all", label: locAttrs("worldState_allAtOnce") },
                    ...Object.keys(lunarNewYearFlashSales).map(year => ({
                        value: year,
                        label: locAttrs("worldState_lunarNewYearEntry", year)
                    }))
                ],
                label: itemMapAttrs("/Lotus/Language/Store/LunarNewYearSearchTag")
            },
            {
                key: "worldState.dogDaysOverride",
                type: "boolean",
                nullable: true,
                label: itemMapAttrs("/Lotus/Language/Alerts/TacAlertWaterFight"),
                incompatibleWith: [
                    "worldState.hallowedFlame",
                    "worldState.hallowedNightmares",
                    "worldState.anniversary"
                ]
            },
            {
                key: "worldState.dogDaysRewardsOverride",
                type: "enum",
                default: "null",
                values: [
                    "null",
                    { value: "4", label: locAttrs("worldState_from_year", "2026") },
                    { value: "3", label: locAttrs("worldState_from_year", "2025") },
                    { value: "2", label: locAttrs("worldState_from_year", "2024") },
                    { value: "1", label: locAttrs("worldState_from_year", "2023") },
                    { value: "0", label: locAttrs("worldState_pre_year", "2023") }
                ],
                label: locAttrs("worldState_dogDaysRewards"),
                sameRow: true
            },
            {
                key: "worldState.operationAtramentum",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/Shadowgrapher/ShadowgrapherEventName")
            },
            {
                key: "worldState.operationAtramentumProgressOverride",
                type: "int",
                ...worldStateNumberOptions.operationAtramentumProgressOverride,
                sameRow: true
            },
            {
                key: "worldState.bellyOfTheBeast",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/JadeShadows/EventAlertTitle")
            },
            {
                key: "worldState.bellyOfTheBeastProgressOverride",
                type: "int",
                ...worldStateNumberOptions.bellyOfTheBeastProgressOverride,
                sameRow: true
            },
            { key: "worldState.eightClaw", type: "boolean", label: itemMapAttrs("/Lotus/Language/Isleweaver/Event") },
            {
                key: "worldState.eightClawProgressOverride",
                type: "int",
                ...worldStateNumberOptions.eightClawProgressOverride,
                sameRow: true
            },
            {
                key: "worldState.thermiaFracturesOverride",
                type: "boolean",
                nullable: true,
                label: itemMapTcAttrs("/Lotus/Language/G1Quests/HeatFissuresEventName")
            },
            {
                key: "worldState.thermiaFracturesProgressOverride",
                type: "int",
                ...worldStateNumberOptions.thermiaFracturesProgressOverride,
                sameRow: true
            },
            {
                key: "worldState.epochOperationTaubound",
                type: "boolean",
                label: itemMapAttrs("/Lotus/Language/TauPrologue/RoadToTauEventName")
            },
            {
                key: "worldState.epochOperationTauboundProgressOverride",
                type: "int",
                ...worldStateNumberOptions.epochOperationTauboundProgressOverride,
                sameRow: true
            },
            {
                key: "worldState.communitySynthesisTarget",
                type: "int",
                ...worldStateNumberOptions.communitySynthesisTarget,
                note: toDisableAttrs(0)
            },
            {
                key: "worldState.communitySynthesisProgress",
                type: "float",
                ...worldStateNumberOptions.communitySynthesisProgress
            }
        ]
    },
    featuredGuilds: {
        label: itemMapAttrs("/Lotus/Language/Dojo/FeaturedDojo"),
        options: [
            {
                key: "featuredGuilds",
                type: "dbList",
                endpoint: "/custom/featuredGuilds",
                placeholder: placeholderAttrs("worldState_featuredDojoClanName"),
                values: [
                    { value: "0", label: locAttrs("worldState_featuredDojoIcon_default") },
                    { value: "1", label: locAttrs("worldState_featuredDojoIcon_bestNew") },
                    { value: "2", label: locAttrs("worldState_featuredDojoIcon_allStar") },
                    {
                        value: "3",
                        label: itemMapAttrs("/Lotus/Language/Menu/Options_Controls_ControllerIconSet_TennoCon")
                    },
                    {
                        value: "4",
                        label: itemMapAttrs("/Lotus/Language/EntratiLab/EntratiGeneral/EntratiEventTrophyTierTwo")
                    },
                    {
                        value: "5",
                        label: itemMapAttrs("/Lotus/Language/EntratiLab/EntratiGeneral/EntratiEventTrophyTierThree")
                    },
                    {
                        value: "6",
                        label: itemMapAttrs("/Lotus/Language/EntratiLab/EntratiGeneral/EntratiEventTrophyTierFour")
                    },
                    { value: "7", label: locAttrs("worldState_featuredDojoIcon_qtcc") },
                    { value: "8", label: locAttrs("worldState_featuredDojoIcon_qtccArthur") }
                ]
            }
        ]
    }
} satisfies Record<string, IServerCheatCard>;

const serverCheatsLayout: (keyof typeof serverCheats)[][] = [
    ["server", "actions", "relaysAndVendors", "boosters", "rotations", "nightwaveExcludedChallenges", "featuredGuilds"],
    ["alerts", "events", "invasionsAndConstruction"]
];

for (const name of Object.keys(serverCheats)) {
    if (serverCheatsLayout.flat().filter(x => x == name).length != 1) {
        throw new Error(`server cheats card ${name} must be in serverCheatsLayout exactly once`);
    }
}

const supportedSyndicates = Object.entries(ExportSyndicates)
    .filter(([, syndicate]) => !["STANDING_LIMIT_BIN_KAHL", "STANDING_LIMIT_BIN_PVP"].includes(syndicate.dailyLimitBin))
    .map(([tag]) => tag);

const syndicateBinOrder: TStandingLimitBin[] = [
    "STANDING_LIMIT_BIN_NORMAL",
    "STANDING_LIMIT_BIN_PVP",
    "STANDING_LIMIT_BIN_LIBRARY",
    "STANDING_LIMIT_BIN_CETUS",
    "STANDING_LIMIT_BIN_QUILLS",
    "STANDING_LIMIT_BIN_SOLARIS",
    "STANDING_LIMIT_BIN_VENTKIDS",
    "STANDING_LIMIT_BIN_VOX",
    "STANDING_LIMIT_BIN_ENTRATI",
    "STANDING_LIMIT_BIN_NECRALOID",
    "STANDING_LIMIT_BIN_CAVIA",
    "STANDING_LIMIT_BIN_ZARIMAN",
    "STANDING_LIMIT_BIN_HEX",
    "STANDING_LIMIT_BIN_NONE"
];

const syndicateBinLabels: Partial<Record<TStandingLimitBin, string>> = {
    STANDING_LIMIT_BIN_NORMAL: "syndicates_dailyLimitBin_normal",
    STANDING_LIMIT_BIN_NONE: "syndicates_dailyLimitBin_none"
};

interface IWebuiSyndicateBin {
    bin: TStandingLimitBin;
    label?: string;
    syndicates: string[];
    nightwave?: true;
}

const syndicateBins: IWebuiSyndicateBin[] = syndicateBinOrder.flatMap(bin => {
    const entries = Object.entries(ExportSyndicates).filter(([, syndicate]) => syndicate.dailyLimitBin == bin);
    return [false, true]
        .map(nightwave => ({
            bin,
            label: syndicateBinLabels[bin],
            syndicates: entries.filter(([, syndicate]) => !!syndicate.dailyChallenges == nightwave).map(([tag]) => tag),
            nightwave: nightwave || undefined
        }))
        .filter(group => group.syndicates.length != 0);
});

const getCheatLabel = (cheat: TServerCheat): TWebuiLoc =>
    cheat.label ?? locAttrs("worldState_" + cheat.key.split(".")[1]);

const getCheatLabelKey = (cheat: TServerCheat): string => {
    const label = getCheatLabel(cheat);
    const attr = ["data-loc-itemMap", "data-loc-itemMap-tc", "data-loc"].find(attr => attr in label);
    return attr ? label[attr] : cheat.key;
};

interface IWebuiServerCheatCard extends IServerCheatCard {
    column: number;
}

const toWebuiCheats = (): Record<string, IWebuiServerCheatCard> => {
    const cards: Record<string, IWebuiServerCheatCard> = Object.fromEntries(
        serverCheatsLayout.flatMap((names, column) =>
            names.map(name => [name, { ...serverCheats[name], column }] as const)
        )
    );
    const cheatsByKey = new Map(
        Object.values(cards).flatMap(card => card.options.map(cheat => [cheat.key, cheat] as const))
    );
    return Object.fromEntries(
        Object.entries(cards).map(([name, card]) => [
            name,
            {
                ...card,
                options: card.options.map(({ incompatibleWith, ...rest }) => {
                    const cheat = { ...rest, label: getCheatLabel(rest) };
                    if (!incompatibleWith) {
                        return cheat;
                    }
                    const labelKeys = incompatibleWith.map(key => {
                        const other = cheatsByKey.get(key);
                        return other ? getCheatLabelKey(other) : key;
                    });
                    return { ...cheat, note: { ...cheat.note, "data-loc-inc": labelKeys.join("|") } };
                })
            }
        ])
    );
};

interface IWebuiData {
    accountCheats: {
        booleans: TAccountCheatBooleanKey[];
        numbers: typeof accountCheatNumbers;
        supportedSyndicates: string[];
        actions: TServerCheat[];
    };
    serverCheats: Record<string, IWebuiServerCheatCard>;
    syndicateBins: IWebuiSyndicateBin[];
}

export const getWebuiDataController: RequestHandler = (_req, res) => {
    const data: IWebuiData = {
        accountCheats: {
            booleans: accountCheatBooleans.filter(key => !accountCheatBooleansHiddenFromWebui.includes(key)),
            numbers: accountCheatNumbers,
            supportedSyndicates,
            actions: accountCheatActions
        },
        serverCheats: toWebuiCheats(),
        syndicateBins
    };
    res.json(data);
};
