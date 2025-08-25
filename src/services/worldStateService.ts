import staticWorldState from "@/static/fixed_responses/worldState/worldState.json";
import baro from "@/static/fixed_responses/worldState/baro.json";
import varzia from "@/static/fixed_responses/worldState/varzia.json";
import fissureMissions from "@/static/fixed_responses/worldState/fissureMissions.json";
import sortieTilesets from "@/static/fixed_responses/worldState/sortieTilesets.json";
import sortieTilesetMissions from "@/static/fixed_responses/worldState/sortieTilesetMissions.json";
import syndicateMissions from "@/static/fixed_responses/worldState/syndicateMissions.json";
import darvoDeals from "@/static/fixed_responses/worldState/darvoDeals.json";
import invasionNodes from "@/static/fixed_responses/worldState/invasionNodes.json";
import invasionRewards from "@/static/fixed_responses/worldState/invasionRewards.json";
import pvpChallenges from "@/static/fixed_responses/worldState/pvpChallenges.json";
import { buildConfig } from "@/src/services/buildConfigService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { config } from "@/src/services/configService";
import { getRandomElement, getRandomInt, sequentiallyUniqueRandomElement, SRng } from "@/src/services/rngService";
import type { IMissionReward, IRegion } from "warframe-public-export-plus";
import { eMissionType, ExportRegions, ExportSyndicates } from "warframe-public-export-plus";
import type {
    ICalendarDay,
    ICalendarEvent,
    ICalendarSeason,
    IGoal,
    IInvasion,
    ILiteSortie,
    IPrimeVaultTrader,
    IPrimeVaultTraderOffer,
    IPVPChallengeInstance,
    ISeasonChallenge,
    ISortie,
    ISortieMission,
    ISyndicateMissionInfo,
    ITmp,
    IVoidStorm,
    IVoidTrader,
    IVoidTraderOffer,
    IWorldState,
    TCircuitGameMode
} from "@/src/types/worldStateTypes";
import { toMongoDate, toOid, version_compare } from "@/src/helpers/inventoryHelpers";
import { logger } from "@/src/utils/logger";
import { DailyDeal, Fissure } from "@/src/models/worldStateModel";

const sortieBosses = [
    "SORTIE_BOSS_HYENA",
    "SORTIE_BOSS_KELA",
    "SORTIE_BOSS_VOR",
    "SORTIE_BOSS_RUK",
    "SORTIE_BOSS_HEK",
    "SORTIE_BOSS_KRIL",
    "SORTIE_BOSS_TYL",
    "SORTIE_BOSS_JACKAL",
    "SORTIE_BOSS_ALAD",
    "SORTIE_BOSS_AMBULAS",
    "SORTIE_BOSS_NEF",
    "SORTIE_BOSS_RAPTOR",
    "SORTIE_BOSS_PHORID",
    "SORTIE_BOSS_LEPHANTIS",
    "SORTIE_BOSS_INFALAD",
    "SORTIE_BOSS_CORRUPTED_VOR"
] as const;

type TSortieBoss = (typeof sortieBosses)[number];

const sortieBossToFaction: Record<TSortieBoss, string> = {
    SORTIE_BOSS_HYENA: "FC_CORPUS",
    SORTIE_BOSS_KELA: "FC_GRINEER",
    SORTIE_BOSS_VOR: "FC_GRINEER",
    SORTIE_BOSS_RUK: "FC_GRINEER",
    SORTIE_BOSS_HEK: "FC_GRINEER",
    SORTIE_BOSS_KRIL: "FC_GRINEER",
    SORTIE_BOSS_TYL: "FC_GRINEER",
    SORTIE_BOSS_JACKAL: "FC_CORPUS",
    SORTIE_BOSS_ALAD: "FC_CORPUS",
    SORTIE_BOSS_AMBULAS: "FC_CORPUS",
    SORTIE_BOSS_NEF: "FC_CORPUS",
    SORTIE_BOSS_RAPTOR: "FC_CORPUS",
    SORTIE_BOSS_PHORID: "FC_INFESTATION",
    SORTIE_BOSS_LEPHANTIS: "FC_INFESTATION",
    SORTIE_BOSS_INFALAD: "FC_INFESTATION",
    SORTIE_BOSS_CORRUPTED_VOR: "FC_OROKIN"
};

const sortieFactionToSystemIndexes: Record<string, number[]> = {
    FC_GRINEER: [0, 2, 3, 5, 6, 9, 11, 18],
    FC_CORPUS: [1, 4, 7, 8, 12, 15],
    FC_INFESTATION: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15],
    FC_OROKIN: [14]
};

const sortieFactionToFactionIndexes: Record<string, number[]> = {
    FC_GRINEER: [0],
    FC_CORPUS: [1],
    FC_INFESTATION: [0, 1, 2],
    FC_OROKIN: [3]
};

const sortieBossNode: Record<Exclude<TSortieBoss, "SORTIE_BOSS_CORRUPTED_VOR">, string> = {
    SORTIE_BOSS_ALAD: "SolNode53",
    SORTIE_BOSS_AMBULAS: "SolNode51",
    SORTIE_BOSS_HEK: "SolNode24",
    SORTIE_BOSS_HYENA: "SolNode127",
    SORTIE_BOSS_INFALAD: "SolNode166",
    SORTIE_BOSS_JACKAL: "SolNode104",
    SORTIE_BOSS_KELA: "SolNode193",
    SORTIE_BOSS_KRIL: "SolNode99",
    SORTIE_BOSS_LEPHANTIS: "SolNode712",
    SORTIE_BOSS_NEF: "SettlementNode20",
    SORTIE_BOSS_PHORID: "SolNode171",
    SORTIE_BOSS_RAPTOR: "SolNode210",
    SORTIE_BOSS_RUK: "SolNode32",
    SORTIE_BOSS_TYL: "SolNode105",
    SORTIE_BOSS_VOR: "SolNode108"
};

const eidolonJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AssassinateBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AssassinateBountyCap",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountySab",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountyLib",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountyCap",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/ReclamationBountyCap",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/ReclamationBountyTheft",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/ReclamationBountyCache",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/CaptureBountyCapOne",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/CaptureBountyCapTwo",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/SabotageBountySab",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/RescueBountyResc"
];

const eidolonNarmerJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AssassinateBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AttritionBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/ReclamationBountyTheft",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AttritionBountyLib"
];

const eidolonGhoulJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyHunt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyRes"
];

const venusJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobAmbush",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobExcavation",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobRecovery",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusChaosJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusChaosJobExcavation",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusCullJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusCullJobExterminate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusCullJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusIntelJobRecovery",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusIntelJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusIntelJobSpy",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusSpyJobSpy",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusTheftJobAmbush",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusTheftJobExcavation",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusTheftJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusHelpingJobCaches",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusHelpingJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusHelpingJobSpy",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusPreservationJobDefense",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusPreservationJobRecovery",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusPreservationJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusWetworkJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusWetworkJobSpy"
];

const venusNarmerJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusCullJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusCullJobExterminate",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusPreservationJobDefense",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusTheftJobExcavation"
];

const microplanetJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosAreaDefenseBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosAssassinateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosCrpSurvivorBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosGrnSurvivorBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosKeyPiecesBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosExcavateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosPurifyBounty"
];

const microplanetEndlessJobs: readonly string[] = [
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndlessAreaDefenseBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndlessExcavateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndlessPurifyBounty"
];

export const EPOCH = 1734307200 * 1000; // Monday, Dec 16, 2024 @ 00:00 UTC+0; should logically be winter in 1999 iteration 0

const isBeforeNextExpectedWorldStateRefresh = (nowMs: number, thenMs: number): boolean => {
    return nowMs + 300_000 > thenMs;
};

const getSortieTime = (day: number): number => {
    const dayStart = EPOCH + day * 86400000;
    const date = new Date(dayStart);
    date.setUTCHours(12);
    const isDst = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        timeZoneName: "short"
    })
        .formatToParts(date)
        .find(part => part.type === "timeZoneName")!
        .value.includes("DT");
    return dayStart + (isDst ? 16 : 17) * 3600000;
};

const pushSyndicateMissions = (
    worldState: IWorldState,
    day: number,
    seed: number,
    idSuffix: string,
    syndicateTag: string
): void => {
    const nodeOptions: string[] = [...syndicateMissions];

    const rng = new SRng(seed);
    const nodes: string[] = [];
    for (let i = 0; i != 6; ++i) {
        const index = rng.randomInt(0, nodeOptions.length - 1);
        nodes.push(nodeOptions[index]);
        nodeOptions.splice(index, 1);
    }

    const dayStart = getSortieTime(day);
    const dayEnd = getSortieTime(day + 1);
    worldState.SyndicateMissions.push({
        _id: { $oid: ((dayStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + idSuffix },
        Activation: { $date: { $numberLong: dayStart.toString() } },
        Expiry: { $date: { $numberLong: dayEnd.toString() } },
        Tag: syndicateTag,
        Seed: seed,
        Nodes: nodes
    });
};

type TSortieTileset = keyof typeof sortieTilesetMissions;

const pushTilesetModifiers = (modifiers: string[], tileset: TSortieTileset): void => {
    switch (tileset) {
        case "GrineerForestTileset":
            modifiers.push("SORTIE_MODIFIER_HAZARD_FOG");
            break;
        case "CorpusShipTileset":
        case "GrineerGalleonTileset":
        case "InfestedCorpusShipTileset":
            modifiers.push("SORTIE_MODIFIER_HAZARD_MAGNETIC");
            modifiers.push("SORTIE_MODIFIER_HAZARD_FIRE");
            modifiers.push("SORTIE_MODIFIER_HAZARD_ICE");
            break;
        case "CorpusIcePlanetTileset":
        case "CorpusIcePlanetTilesetCaves":
            modifiers.push("SORTIE_MODIFIER_HAZARD_COLD");
            break;
    }
};

export const getSortie = (day: number): ISortie => {
    const seed = new SRng(day).randomInt(0, 100_000);
    const rng = new SRng(seed);

    const boss = rng.randomElement(sortieBosses)!;

    const nodes: string[] = [];
    for (const [key, value] of Object.entries(ExportRegions)) {
        if (
            sortieFactionToSystemIndexes[sortieBossToFaction[boss]].includes(value.systemIndex) &&
            sortieFactionToFactionIndexes[sortieBossToFaction[boss]].includes(value.factionIndex!) &&
            key in sortieTilesets &&
            (key != "SolNode228" || sortieBossToFaction[boss] == "FC_GRINEER") // PoE does not work for non-infested enemies
        ) {
            nodes.push(key);
        }
    }

    const selectedNodes: ISortieMission[] = [];
    const missionTypes = new Set();

    for (let i = 0; i < 3; i++) {
        const randomIndex = rng.randomInt(0, nodes.length - 1);
        const node = nodes[randomIndex];

        const modifiers = [
            "SORTIE_MODIFIER_LOW_ENERGY",
            "SORTIE_MODIFIER_IMPACT",
            "SORTIE_MODIFIER_SLASH",
            "SORTIE_MODIFIER_PUNCTURE",
            "SORTIE_MODIFIER_EXIMUS",
            "SORTIE_MODIFIER_MAGNETIC",
            "SORTIE_MODIFIER_CORROSIVE",
            "SORTIE_MODIFIER_VIRAL",
            "SORTIE_MODIFIER_ELECTRICITY",
            "SORTIE_MODIFIER_RADIATION",
            "SORTIE_MODIFIER_FIRE",
            "SORTIE_MODIFIER_EXPLOSION",
            "SORTIE_MODIFIER_FREEZE",
            "SORTIE_MODIFIER_POISON",
            "SORTIE_MODIFIER_SECONDARY_ONLY",
            "SORTIE_MODIFIER_SHOTGUN_ONLY",
            "SORTIE_MODIFIER_SNIPER_ONLY",
            "SORTIE_MODIFIER_RIFLE_ONLY",
            "SORTIE_MODIFIER_BOW_ONLY"
        ];

        if (i == 2 && boss != "SORTIE_BOSS_CORRUPTED_VOR" && rng.randomInt(0, 2) == 2) {
            const tileset = sortieTilesets[sortieBossNode[boss] as keyof typeof sortieTilesets] as TSortieTileset;
            pushTilesetModifiers(modifiers, tileset);

            const modifierType = rng.randomElement(modifiers)!;

            selectedNodes.push({
                missionType: "MT_ASSASSINATION",
                modifierType,
                node: sortieBossNode[boss],
                tileset
            });
            continue;
        }

        const tileset = sortieTilesets[node as keyof typeof sortieTilesets] as TSortieTileset;
        pushTilesetModifiers(modifiers, tileset);

        const missionType = rng.randomElement(sortieTilesetMissions[tileset])!;

        if (missionTypes.has(missionType) || missionType == "MT_ASSASSINATION") {
            i--;
            continue;
        }

        modifiers.push("SORTIE_MODIFIER_MELEE_ONLY"); // not an assassination mission, can now push this

        if (missionType != "MT_TERRITORY") {
            modifiers.push("SORTIE_MODIFIER_HAZARD_RADIATION");
        }

        if (ExportRegions[node].factionIndex == 0) {
            // Grineer
            modifiers.push("SORTIE_MODIFIER_ARMOR");
        } else if (ExportRegions[node].factionIndex == 1) {
            // Corpus
            modifiers.push("SORTIE_MODIFIER_SHIELDS");
        }

        const modifierType = rng.randomElement(modifiers)!;

        selectedNodes.push({
            missionType,
            modifierType,
            node,
            tileset
        });
        nodes.splice(randomIndex, 1);
        missionTypes.add(missionType);
    }

    const dayStart = getSortieTime(day);
    const dayEnd = getSortieTime(day + 1);
    return {
        _id: { $oid: ((dayStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "d4d932c97c0a3acd" },
        Activation: { $date: { $numberLong: dayStart.toString() } },
        Expiry: { $date: { $numberLong: dayEnd.toString() } },
        Reward: "/Lotus/Types/Game/MissionDecks/SortieRewards",
        Seed: seed,
        Boss: boss,
        Variants: selectedNodes
    };
};

interface IRotatingSeasonChallengePools {
    daily: string[];
    weekly: string[];
    hardWeekly: string[];
    weeklyPermanent: string[];
}

export const getSeasonChallengePools = (syndicateTag: string): IRotatingSeasonChallengePools => {
    const syndicate = ExportSyndicates[syndicateTag];
    return {
        daily: syndicate.dailyChallenges!,
        weekly: syndicate.weeklyChallenges!.filter(
            x =>
                x.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/") &&
                !x.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanent")
        ),
        hardWeekly: syndicate.weeklyChallenges!.filter(x =>
            x.startsWith("/Lotus/Types/Challenges/Seasons/WeeklyHard/")
        ),
        weeklyPermanent: syndicate.weeklyChallenges!.filter(x =>
            x.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanent")
        )
    };
};

const getSeasonDailyChallenge = (pools: IRotatingSeasonChallengePools, day: number): ISeasonChallenge => {
    const dayStart = EPOCH + day * 86400000;
    const dayEnd = EPOCH + (day + 3) * 86400000;
    return {
        _id: { $oid: "67e1b5ca9d00cb47" + day.toString().padStart(8, "0") },
        Daily: true,
        Activation: { $date: { $numberLong: dayStart.toString() } },
        Expiry: { $date: { $numberLong: dayEnd.toString() } },
        Challenge: sequentiallyUniqueRandomElement(pools.daily, day, 2, 605732938)!
    };
};

const pushSeasonWeeklyChallenge = (
    activeChallenges: ISeasonChallenge[],
    pool: string[],
    nightwaveSeason: number,
    week: number,
    id: number
): void => {
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    const challengeId = week * 7 + id;
    const rng = new SRng(new SRng(challengeId).randomInt(0, 100_000));
    let challenge: string;
    do {
        challenge = rng.randomElement(pool)!;
    } while (activeChallenges.some(x => x.Challenge == challenge));
    activeChallenges.push({
        _id: {
            $oid:
                (nightwaveSeason + 1).toString().padStart(4, "0") +
                "bb2d9d00cb47" +
                challengeId.toString().padStart(8, "0")
        },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Challenge: challenge
    });
};

export const pushWeeklyActs = (
    activeChallenges: ISeasonChallenge[],
    pools: IRotatingSeasonChallengePools,
    week: number,
    nightwaveStartTimestamp: number,
    nightwaveSeason: number
): void => {
    pushSeasonWeeklyChallenge(activeChallenges, pools.weekly, nightwaveSeason, week, 0);
    pushSeasonWeeklyChallenge(activeChallenges, pools.weekly, nightwaveSeason, week, 1);
    if (pools.weeklyPermanent.length > 0) {
        const weekStart = EPOCH + week * unixTimesInMs.week;
        const weekEnd = weekStart + unixTimesInMs.week;
        const nightwaveWeekStart = ((): number => {
            let ts = nightwaveStartTimestamp - EPOCH;
            ts -= ts % unixTimesInMs.week;
            return EPOCH + ts;
        })();
        const nightwaveWeek = Math.trunc((weekStart - nightwaveWeekStart) / unixTimesInMs.week);
        const weeklyPermanentIndex = (nightwaveWeek * 3) % pools.weeklyPermanent.length;
        for (let i = 0; i < 3; i++) {
            activeChallenges.push({
                _id: {
                    $oid:
                        (nightwaveSeason + 1).toString().padStart(4, "0") +
                        "b96e9d00cb47" +
                        (week * 7 + 2 + i).toString().padStart(8, "0")
                },
                Activation: { $date: { $numberLong: weekStart.toString() } },
                Expiry: { $date: { $numberLong: weekEnd.toString() } },
                Challenge: pools.weeklyPermanent[weeklyPermanentIndex + i]
            });
        }
    } else {
        pushSeasonWeeklyChallenge(activeChallenges, pools.weekly, nightwaveSeason, week, 2);
        pushSeasonWeeklyChallenge(activeChallenges, pools.weekly, nightwaveSeason, week, 3);
        pushSeasonWeeklyChallenge(activeChallenges, pools.weekly, nightwaveSeason, week, 4);
    }
    pushSeasonWeeklyChallenge(activeChallenges, pools.hardWeekly, nightwaveSeason, week, 5);
    pushSeasonWeeklyChallenge(activeChallenges, pools.hardWeekly, nightwaveSeason, week, 6);
};

const generateXpAmounts = (rng: SRng, stageCount: number, minXp: number, maxXp: number): number[] => {
    const step = minXp < 1000 ? 1 : 10;
    const totalDeciXp = rng.randomInt(minXp / step, maxXp / step);
    const xpAmounts: number[] = [];
    if (stageCount < 4) {
        const perStage = Math.ceil(totalDeciXp / stageCount) * step;
        for (let i = 0; i != stageCount; ++i) {
            xpAmounts.push(perStage);
        }
    } else {
        const perStage = Math.ceil(Math.round(totalDeciXp * 0.667) / (stageCount - 1)) * step;
        for (let i = 0; i != stageCount - 1; ++i) {
            xpAmounts.push(perStage);
        }
        xpAmounts.push(Math.ceil(totalDeciXp * 0.332) * step);
    }
    return xpAmounts;
};
// Test vectors:
//console.log(generateXpAmounts(new SRng(1337n), 5, 5000, 5000)); // [840, 840, 840, 840, 1660]
//console.log(generateXpAmounts(new SRng(1337n), 3, 40, 40)); // [14, 14, 14]
//console.log(generateXpAmounts(new SRng(1337n), 5, 150, 150)); // [25, 25, 25, 25, 50]
//console.log(generateXpAmounts(new SRng(1337n), 4, 10, 10)); // [2, 2, 2, 4]
//console.log(generateXpAmounts(new SRng(1337n), 4, 15, 15)); // [4, 4, 4, 5]
//console.log(generateXpAmounts(new SRng(1337n), 4, 20, 20)); // [5, 5, 5, 7]

export const pushClassicBounties = (syndicateMissions: ISyndicateMissionInfo[], bountyCycle: number): void => {
    const table = String.fromCharCode(65 + (bountyCycle % 3));
    const vaultTable = String.fromCharCode(65 + ((bountyCycle + 1) % 3));
    const deimosDTable = String.fromCharCode(65 + (bountyCycle % 2));

    const seed = new SRng(bountyCycle).randomInt(0, 100_000);
    const bountyCycleStart = bountyCycle * 9000000;
    const bountyCycleEnd = bountyCycleStart + 9000000;

    {
        const rng = new SRng(seed);
        const pool = [...eidolonJobs];
        syndicateMissions.push({
            _id: {
                $oid: ((bountyCycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000008"
            },
            Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
            Tag: "CetusSyndicate",
            Seed: seed,
            Nodes: [],
            Jobs: [
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATable${table}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: generateXpAmounts(rng, 3, 1000, 1500)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierBTable${table}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    xpAmounts: generateXpAmounts(rng, 3, 1750, 2250)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierCTable${table}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 20,
                    maxEnemyLevel: 40,
                    xpAmounts: generateXpAmounts(rng, 4, 2500, 3000)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierDTable${table}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 50,
                    xpAmounts: generateXpAmounts(rng, 5, 3250, 3750)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${table}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: generateXpAmounts(rng, 5, 4000, 4500)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${table}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [840, 840, 840, 840, 1660]
                },
                {
                    jobType: rng.randomElement(eidolonNarmerJobs),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/NarmerTable${table}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 70,
                    xpAmounts: generateXpAmounts(rng, 5, 4500, 5000)
                }
            ]
        });
    }

    {
        const rng = new SRng(seed);
        const pool = [...venusJobs];
        syndicateMissions.push({
            _id: {
                $oid: ((bountyCycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000025"
            },
            Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
            Tag: "SolarisSyndicate",
            Seed: seed,
            Nodes: [],
            Jobs: [
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierATable${table}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: generateXpAmounts(rng, 3, 1000, 1500)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierBTable${table}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 10,
                    maxEnemyLevel: 30,
                    xpAmounts: generateXpAmounts(rng, 3, 1750, 2250)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierCTable${table}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 20,
                    maxEnemyLevel: 40,
                    xpAmounts: generateXpAmounts(rng, 4, 2500, 3000)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierDTable${table}Rewards`,
                    masteryReq: 3,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 50,
                    xpAmounts: generateXpAmounts(rng, 5, 3250, 3750)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${table}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: generateXpAmounts(rng, 5, 4000, 4500)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${table}Rewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [840, 840, 840, 840, 1660]
                },
                {
                    jobType: rng.randomElement(venusNarmerJobs),
                    rewards: "/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/NarmerTableBRewards",
                    masteryReq: 0,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 70,
                    xpAmounts: generateXpAmounts(rng, 5, 4500, 5000)
                }
            ]
        });
    }

    {
        const rng = new SRng(seed);
        const pool = [...microplanetJobs];
        syndicateMissions.push({
            _id: {
                $oid: ((bountyCycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000002"
            },
            Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
            Tag: "EntratiSyndicate",
            Seed: seed,
            Nodes: [],
            Jobs: [
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierATable${table}Rewards`,
                    masteryReq: 0,
                    minEnemyLevel: 5,
                    maxEnemyLevel: 15,
                    xpAmounts: generateXpAmounts(rng, 3, 12, 18)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierCTable${table}Rewards`,
                    masteryReq: 1,
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: generateXpAmounts(rng, 3, 24, 36)
                },
                {
                    jobType: rng.randomElement(microplanetEndlessJobs),
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierBTable${table}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 25,
                    maxEnemyLevel: 30,
                    endless: true,
                    xpAmounts: [14, 14, 14]
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierDTable${deimosDTable}Rewards`,
                    masteryReq: 2,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: generateXpAmounts(rng, 4, 72, 88)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETableARewards`,
                    masteryReq: 3,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 60,
                    xpAmounts: generateXpAmounts(rng, 5, 115, 135)
                },
                {
                    jobType: rng.randomElementPop(pool),
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETableARewards`,
                    masteryReq: 10,
                    minEnemyLevel: 100,
                    maxEnemyLevel: 100,
                    xpAmounts: [25, 25, 25, 25, 50]
                },
                {
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/VaultBountyTierATable${vaultTable}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 30,
                    maxEnemyLevel: 40,
                    xpAmounts: [2, 2, 2, 4],
                    locationTag: "ChamberB",
                    isVault: true
                },
                {
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/VaultBountyTierBTable${vaultTable}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 50,
                    xpAmounts: [4, 4, 4, 5],
                    locationTag: "ChamberA",
                    isVault: true
                },
                {
                    rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/VaultBountyTierCTable${vaultTable}Rewards`,
                    masteryReq: 5,
                    minEnemyLevel: 50,
                    maxEnemyLevel: 60,
                    xpAmounts: [5, 5, 5, 7],
                    locationTag: "ChamberC",
                    isVault: true
                }
            ]
        });
    }
};

const birthdays: number[] = [
    1, // Kaya
    45, // Lettie
    74, // Minerva (MinervaVelemirDialogue_rom.dialogue)
    143, // Amir
    166, // Flare
    191, // Aoi
    306, // Eleanor
    307, // Arthur
    338, // Quincy
    355 // Velimir (MinervaVelemirDialogue_rom.dialogue)
];

const getCalendarSeason = (week: number): ICalendarSeason => {
    const seasonIndex = week % 4;
    const seasonDay1 = [1, 91, 182, 274][seasonIndex];
    const seasonDay91 = seasonDay1 + 90;
    const eventDays: ICalendarDay[] = [];
    for (const day of birthdays) {
        if (day < seasonDay1) {
            continue;
        }
        if (day >= seasonDay91) {
            break;
        }
        //logger.debug(`birthday on day ${day}`);
        eventDays.push({ day, events: [] }); // This is how CET_PLOT looks in worldState as of around 38.5.0
    }
    const rng = new SRng(new SRng(week).randomInt(0, 100_000));
    const challenges = [
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesWithMeleeEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesWithMeleeMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesWithMeleeHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesWithAbilitiesEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesWithAbilitiesMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEnemiesWithAbilitiesHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarDestroyPropsEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarDestroyPropsMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarDestroyPropsHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEximusEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEximusMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillEximusHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesWithAbilitiesEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesWithAbilitiesMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesWithAbilitiesHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTankHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesWithMeleeEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesWithMeleeMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillScaldraEnemiesWithMeleeHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesWithAbilitiesEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesWithAbilitiesMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesWithAbilitiesHard",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesWithMeleeEasy",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesWithMeleeMedium",
        "/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesWithMeleeHard"
    ];
    const rewardRanges: number[] = [];
    const upgradeRanges: number[] = [];
    for (let i = 0; i != 6; ++i) {
        const chunkDay1 = seasonDay1 + i * 15;
        const chunkDay13 = chunkDay1 - 1 + 13;
        let challengeDay: number;
        do {
            challengeDay = rng.randomInt(chunkDay1, chunkDay13);
        } while (birthdays.indexOf(challengeDay) != -1);

        let challengeIndex;
        let challenge;
        do {
            challengeIndex = rng.randomInt(0, challenges.length - 1);
            challenge = challenges[challengeIndex];
        } while (i < 2 && !challenge.endsWith("Easy")); // First 2 challenges should be easy
        challenges.splice(challengeIndex, 1);

        //logger.debug(`challenge on day ${challengeDay}`);
        eventDays.push({
            day: challengeDay,
            events: [{ type: "CET_CHALLENGE", challenge }]
        });

        rewardRanges.push(challengeDay);
        if (i == 0 || i == 3 || i == 5) {
            upgradeRanges.push(challengeDay);
        }
    }
    rewardRanges.push(seasonDay91);
    upgradeRanges.push(seasonDay91);

    const rewards = [
        "/Lotus/StoreItems/Types/Items/MiscItems/UtilityUnlocker",
        "/Lotus/StoreItems/Types/Recipes/Components/FormaAuraBlueprint",
        "/Lotus/StoreItems/Types/Recipes/Components/FormaBlueprint",
        "/Lotus/StoreItems/Types/Recipes/Components/WeaponUtilityUnlockerBlueprint",
        "/Lotus/StoreItems/Types/Items/MiscItems/WeaponMeleeArcaneUnlocker",
        "/Lotus/StoreItems/Types/Items/MiscItems/WeaponSecondaryArcaneUnlocker",
        "/Lotus/StoreItems/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker",
        "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/CircuitSilverSteelPathFusionBundle",
        "/Lotus/StoreItems/Types/BoosterPacks/CalendarRivenPack",
        "/Lotus/Types/StoreItems/Packages/Calendar/CalendarKuvaBundleSmall",
        "/Lotus/Types/StoreItems/Packages/Calendar/CalendarKuvaBundleLarge",
        "/Lotus/StoreItems/Types/BoosterPacks/CalendarArtifactPack",
        "/Lotus/StoreItems/Types/BoosterPacks/CalendarMajorArtifactPack",
        "/Lotus/Types/StoreItems/Boosters/AffinityBooster3DayStoreItem",
        "/Lotus/Types/StoreItems/Boosters/ModDropChanceBooster3DayStoreItem",
        "/Lotus/Types/StoreItems/Boosters/ResourceDropChance3DayStoreItem",
        "/Lotus/StoreItems/Types/Items/MiscItems/Forma",
        "/Lotus/StoreItems/Types/Recipes/Components/OrokinCatalystBlueprint",
        "/Lotus/StoreItems/Types/Recipes/Components/OrokinReactorBlueprint",
        "/Lotus/StoreItems/Types/Items/MiscItems/WeaponUtilityUnlocker",
        "/Lotus/Types/StoreItems/Packages/Calendar/CalendarVosforPack",
        "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalOrange",
        "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalNira",
        "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalGreen",
        "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal",
        "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalAmar",
        "/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalViolet"
    ];
    for (let i = 0; i != rewardRanges.length - 1; ++i) {
        const events: ICalendarEvent[] = [];
        for (let j = 0; j != 2; ++j) {
            const rewardIndex = rng.randomInt(0, rewards.length - 1);
            events.push({ type: "CET_REWARD", reward: rewards[rewardIndex] });
            rewards.splice(rewardIndex, 1);
        }

        //logger.debug(`trying to fit rewards between day ${rewardRanges[i]} and ${rewardRanges[i + 1]}`);
        let day: number;
        do {
            day = rng.randomInt(rewardRanges[i] + 1, rewardRanges[i + 1] - 1);
        } while (eventDays.find(x => x.day == day));
        eventDays.push({ day, events });
    }

    const upgradesByHexMember = [
        [
            "/Lotus/Upgrades/Calendar/AttackAndMovementSpeedOnCritMelee",
            "/Lotus/Upgrades/Calendar/ElectricalDamageOnBulletJump",
            "/Lotus/Upgrades/Calendar/ElectricDamagePerDistance",
            "/Lotus/Upgrades/Calendar/ElectricStatusDamageAndChance",
            "/Lotus/Upgrades/Calendar/OvershieldCap",
            "/Lotus/Upgrades/Calendar/SpeedBuffsWhenAirborne"
        ],
        [
            "/Lotus/Upgrades/Calendar/AbilityStrength",
            "/Lotus/Upgrades/Calendar/EnergyOrbToAbilityRange",
            "/Lotus/Upgrades/Calendar/MagnetStatusPull",
            "/Lotus/Upgrades/Calendar/MagnitizeWithinRangeEveryXCasts",
            "/Lotus/Upgrades/Calendar/PowerStrengthAndEfficiencyPerEnergySpent",
            "/Lotus/Upgrades/Calendar/SharedFreeAbilityEveryXCasts"
        ],
        [
            "/Lotus/Upgrades/Calendar/EnergyWavesOnCombo",
            "/Lotus/Upgrades/Calendar/FinisherChancePerComboMultiplier",
            "/Lotus/Upgrades/Calendar/MeleeAttackSpeed",
            "/Lotus/Upgrades/Calendar/MeleeCritChance",
            "/Lotus/Upgrades/Calendar/MeleeSlideFowardMomentumOnEnemyHit",
            "/Lotus/Upgrades/Calendar/RadialJavelinOnHeavy"
        ],
        [
            "/Lotus/Upgrades/Calendar/Armor",
            "/Lotus/Upgrades/Calendar/CloneActiveCompanionForEnergySpent",
            "/Lotus/Upgrades/Calendar/CompanionDamage",
            "/Lotus/Upgrades/Calendar/CompanionsBuffNearbyPlayer",
            "/Lotus/Upgrades/Calendar/CompanionsRadiationChance",
            "/Lotus/Upgrades/Calendar/RadiationProcOnTakeDamage",
            "/Lotus/Upgrades/Calendar/ReviveEnemyAsSpectreOnKill"
        ],
        [
            "/Lotus/Upgrades/Calendar/EnergyOrbsGrantShield",
            "/Lotus/Upgrades/Calendar/EnergyRestoration",
            "/Lotus/Upgrades/Calendar/ExplodingHealthOrbs",
            "/Lotus/Upgrades/Calendar/GenerateOmniOrbsOnWeakKill",
            "/Lotus/Upgrades/Calendar/HealingEffects",
            "/Lotus/Upgrades/Calendar/OrbsDuplicateOnPickup"
        ],
        [
            "/Lotus/Upgrades/Calendar/BlastEveryXShots",
            "/Lotus/Upgrades/Calendar/GasChanceToPrimaryAndSecondary",
            "/Lotus/Upgrades/Calendar/GuidingMissilesChance",
            "/Lotus/Upgrades/Calendar/MagazineCapacity",
            "/Lotus/Upgrades/Calendar/PunchToPrimary",
            "/Lotus/Upgrades/Calendar/RefundBulletOnStatusProc",
            "/Lotus/Upgrades/Calendar/StatusChancePerAmmoSpent"
        ]
    ];
    for (let i = 0; i != upgradeRanges.length - 1; ++i) {
        // Pick 3 unique hex members
        const hexMembersPickedForThisDay: number[] = [];
        for (let j = 0; j != 3; ++j) {
            let hexMemberIndex: number;
            do {
                hexMemberIndex = rng.randomInt(0, upgradesByHexMember.length - 1);
            } while (hexMembersPickedForThisDay.indexOf(hexMemberIndex) != -1);
            hexMembersPickedForThisDay.push(hexMemberIndex);
        }
        hexMembersPickedForThisDay.sort(); // Always present them in the same order

        // For each hex member, pick an upgrade that was not yet picked this season.
        const events: ICalendarEvent[] = [];
        for (const hexMemberIndex of hexMembersPickedForThisDay) {
            const upgrades = upgradesByHexMember[hexMemberIndex];
            const upgradeIndex = rng.randomInt(0, upgrades.length - 1);
            events.push({ type: "CET_UPGRADE", upgrade: upgrades[upgradeIndex] });
            upgrades.splice(upgradeIndex, 1);
        }

        //logger.debug(`trying to fit upgrades between day ${upgradeRanges[i]} and ${upgradeRanges[i + 1]}`);
        let day: number;
        do {
            day = rng.randomInt(upgradeRanges[i] + 1, upgradeRanges[i + 1] - 1);
        } while (eventDays.find(x => x.day == day));
        eventDays.push({ day, events });
    }

    eventDays.sort((a, b) => a.day - b.day);

    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    return {
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Days: eventDays,
        Season: (["CST_WINTER", "CST_SPRING", "CST_SUMMER", "CST_FALL"] as const)[seasonIndex],
        YearIteration: Math.trunc(week / 4),
        Version: 19,
        UpgradeAvaliabilityRequirements: ["/Lotus/Upgrades/Calendar/1999UpgradeApplicationRequirement"]
    };
};

// Not very faithful, but to avoid the same node coming up back-to-back (which is not valid), I've split these into 2 arrays which we're alternating between.

const voidStormMissions = {
    VoidT1: [
        "CrewBattleNode519",
        "CrewBattleNode518",
        "CrewBattleNode515",
        "CrewBattleNode503",
        "CrewBattleNode509",
        "CrewBattleNode522",
        "CrewBattleNode511",
        "CrewBattleNode512"
    ],
    VoidT2: ["CrewBattleNode501", "CrewBattleNode534", "CrewBattleNode530", "CrewBattleNode535", "CrewBattleNode533"],
    VoidT3: ["CrewBattleNode521", "CrewBattleNode516", "CrewBattleNode524", "CrewBattleNode525"],
    VoidT4: [
        "CrewBattleNode555",
        "CrewBattleNode553",
        "CrewBattleNode554",
        "CrewBattleNode539",
        "CrewBattleNode531",
        "CrewBattleNode527",
        "CrewBattleNode542",
        "CrewBattleNode538",
        "CrewBattleNode543",
        "CrewBattleNode536",
        "CrewBattleNode550",
        "CrewBattleNode529"
    ]
} as const;

const voidStormLookbehind = {
    VoidT1: 3,
    VoidT2: 1,
    VoidT3: 1,
    VoidT4: 3
} as const;

const pushVoidStorms = (arr: IVoidStorm[], hour: number): void => {
    const activation = hour * unixTimesInMs.hour + 40 * unixTimesInMs.minute;
    const expiry = activation + 90 * unixTimesInMs.minute;
    let accum = 0;
    const tierIdx = { VoidT1: hour * 2, VoidT2: hour, VoidT3: hour, VoidT4: hour * 2 };
    for (const tier of ["VoidT1", "VoidT1", "VoidT2", "VoidT3", "VoidT4", "VoidT4"] as const) {
        arr.push({
            _id: {
                $oid:
                    ((activation / 1000) & 0xffffffff).toString(16).padStart(8, "0") +
                    "0321e89b" +
                    (accum++).toString().padStart(8, "0")
            },
            Node: sequentiallyUniqueRandomElement(
                voidStormMissions[tier],
                tierIdx[tier]++,
                voidStormLookbehind[tier],
                2051969264
            )!,
            Activation: { $date: { $numberLong: activation.toString() } },
            Expiry: { $date: { $numberLong: expiry.toString() } },
            ActiveMissionTier: tier
        });
    }
};

interface ITimeConstraint {
    name: string;
    isValidTime: (timeSecs: number) => boolean;
    getIdealTimeBefore: (timeSecs: number) => number;
}

const eidolonDayConstraint: ITimeConstraint = {
    name: "eidolon day",
    isValidTime: (timeSecs: number): boolean => {
        const eidolonEpoch = 1391992660;
        const eidolonCycle = Math.trunc((timeSecs - eidolonEpoch) / 9000);
        const eidolonCycleStart = eidolonEpoch + eidolonCycle * 9000;
        const eidolonCycleEnd = eidolonCycleStart + 9000;
        const eidolonCycleNightStart = eidolonCycleEnd - 3000;
        return !isBeforeNextExpectedWorldStateRefresh(timeSecs * 1000, eidolonCycleNightStart * 1000);
    },
    getIdealTimeBefore: (timeSecs: number): number => {
        const eidolonEpoch = 1391992660;
        const eidolonCycle = Math.trunc((timeSecs - eidolonEpoch) / 9000);
        const eidolonCycleStart = eidolonEpoch + eidolonCycle * 9000;
        return eidolonCycleStart;
    }
};

const eidolonNightConstraint: ITimeConstraint = {
    name: "eidolon night",
    isValidTime: (timeSecs: number): boolean => {
        const eidolonEpoch = 1391992660;
        const eidolonCycle = Math.trunc((timeSecs - eidolonEpoch) / 9000);
        const eidolonCycleStart = eidolonEpoch + eidolonCycle * 9000;
        const eidolonCycleEnd = eidolonCycleStart + 9000;
        const eidolonCycleNightStart = eidolonCycleEnd - 3000;
        return (
            timeSecs >= eidolonCycleNightStart &&
            !isBeforeNextExpectedWorldStateRefresh(timeSecs * 1000, eidolonCycleEnd * 1000)
        );
    },
    getIdealTimeBefore: (timeSecs: number): number => {
        const eidolonEpoch = 1391992660;
        const eidolonCycle = Math.trunc((timeSecs - eidolonEpoch) / 9000);
        const eidolonCycleStart = eidolonEpoch + eidolonCycle * 9000;
        const eidolonCycleEnd = eidolonCycleStart + 9000;
        const eidolonCycleNightStart = eidolonCycleEnd - 3000;
        if (eidolonCycleNightStart > timeSecs) {
            // Night hasn't started yet, but we need to return a time in the past.
            return eidolonCycleNightStart - 9000;
        }
        return eidolonCycleNightStart;
    }
};

const venusColdConstraint: ITimeConstraint = {
    name: "venus cold",
    isValidTime: (timeSecs: number): boolean => {
        const vallisEpoch = 1541837628;
        const vallisCycle = Math.trunc((timeSecs - vallisEpoch) / 1600);
        const vallisCycleStart = vallisEpoch + vallisCycle * 1600;
        const vallisCycleEnd = vallisCycleStart + 1600;
        const vallisCycleColdStart = vallisCycleStart + 400;
        return (
            timeSecs >= vallisCycleColdStart &&
            !isBeforeNextExpectedWorldStateRefresh(timeSecs * 1000, vallisCycleEnd * 1000)
        );
    },
    getIdealTimeBefore: (timeSecs: number): number => {
        const vallisEpoch = 1541837628;
        const vallisCycle = Math.trunc((timeSecs - vallisEpoch) / 1600);
        const vallisCycleStart = vallisEpoch + vallisCycle * 1600;
        const vallisCycleColdStart = vallisCycleStart + 400;
        if (vallisCycleColdStart > timeSecs) {
            // Cold hasn't started yet, but we need to return a time in the past.
            return vallisCycleColdStart - 1600;
        }
        return vallisCycleColdStart;
    }
};

const venusWarmConstraint: ITimeConstraint = {
    name: "venus warm",
    isValidTime: (timeSecs: number): boolean => {
        const vallisEpoch = 1541837628;
        const vallisCycle = Math.trunc((timeSecs - vallisEpoch) / 1600);
        const vallisCycleStart = vallisEpoch + vallisCycle * 1600;
        const vallisCycleColdStart = vallisCycleStart + 400;
        return !isBeforeNextExpectedWorldStateRefresh(timeSecs * 1000, vallisCycleColdStart * 1000);
    },
    getIdealTimeBefore: (timeSecs: number): number => {
        const vallisEpoch = 1541837628;
        const vallisCycle = Math.trunc((timeSecs - vallisEpoch) / 1600);
        const vallisCycleStart = vallisEpoch + vallisCycle * 1600;
        return vallisCycleStart;
    }
};

const getIdealTimeSatsifyingConstraints = (constraints: ITimeConstraint[]): number => {
    let timeSecs = Math.trunc(Date.now() / 1000);
    let allGood;
    do {
        allGood = true;
        for (const constraint of constraints) {
            if (!constraint.isValidTime(timeSecs)) {
                //logger.debug(`${constraint.name} is not happy with ${timeSecs}`);
                const prevTimeSecs = timeSecs;
                const suggestion = constraint.getIdealTimeBefore(timeSecs);
                timeSecs = suggestion;
                do {
                    timeSecs += 60;
                    if (timeSecs >= prevTimeSecs || !constraint.isValidTime(timeSecs)) {
                        timeSecs = suggestion; // Can't find a compromise; just take the suggestion and try to compromise on another constraint.
                        break;
                    }
                } while (!constraints.every(constraint => constraint.isValidTime(timeSecs)));
                allGood = false;
                break;
            }
        }
    } while (!allGood);
    return timeSecs;
};

const fullyStockBaro = (vt: IVoidTrader): void => {
    for (const armorSet of baro.armorSets) {
        if (Array.isArray(armorSet[0])) {
            for (const set of armorSet as IVoidTraderOffer[][]) {
                for (const item of set) {
                    vt.Manifest.push(item);
                }
            }
        } else {
            for (const item of armorSet as IVoidTraderOffer[]) {
                vt.Manifest.push(item);
            }
        }
    }
    for (const item of baro.rest) {
        vt.Manifest.push(item);
    }
};

const getVarziaRotation = (week: number): string => {
    const seed = new SRng(week).randomInt(0, 100_000);
    const rng = new SRng(seed);
    return rng.randomElement(varzia.primeDualPacks)!.ItemType;
};

const getVarziaManifest = (dualPack: string): IPrimeVaultTraderOffer[] => {
    const rotrationManifest = varzia.primeDualPacks.find(pack => pack.ItemType === dualPack);
    if (!rotrationManifest) return [];

    const mainPack = [{ ItemType: rotrationManifest.ItemType, PrimePrice: 10 }];
    const singlePacks: IPrimeVaultTraderOffer[] = [];
    const items: IPrimeVaultTraderOffer[] = [];
    const bobbleHeads: IPrimeVaultTraderOffer[] = [];

    for (const singlePackType of rotrationManifest.SinglePacks) {
        singlePacks.push({ ItemType: singlePackType, PrimePrice: 6 });

        const sp = varzia.primeSinglePacks.find(pack => pack.ItemType === singlePackType);
        if (sp) {
            items.push(...sp.Items);
            sp.BobbleHeads.forEach(bobbleHead => {
                bobbleHeads.push({ ItemType: bobbleHead, PrimePrice: 1 });
            });
        }
    }

    const relics = rotrationManifest.Relics.map(relic => ({ ItemType: relic, RegularPrice: 1 }));

    return [singlePacks[0], ...mainPack, singlePacks[1], ...items, ...bobbleHeads, ...relics];
};

const getAllVarziaManifests = (): IPrimeVaultTraderOffer[] => {
    const dualPacks: IPrimeVaultTraderOffer[] = [];
    const singlePacks: IPrimeVaultTraderOffer[] = [];
    const items: IPrimeVaultTraderOffer[] = [];
    const bobbleHeads: IPrimeVaultTraderOffer[] = [];
    const relics: IPrimeVaultTraderOffer[] = [];

    const singlePackSet = new Set<string>();
    const itemsSet = new Set<string>();
    const bobbleHeadsSet = new Set<string>();

    varzia.primeDualPacks.forEach(dualPack => {
        dualPacks.push({ ItemType: dualPack.ItemType, PrimePrice: 10 });

        dualPack.SinglePacks.forEach(singlePackType => {
            if (!singlePackSet.has(singlePackType)) {
                singlePackSet.add(singlePackType);
                singlePacks.push({ ItemType: singlePackType, PrimePrice: 6 });
            }

            const sp = varzia.primeSinglePacks.find(pack => pack.ItemType === singlePackType)!;
            sp.Items.forEach(item => {
                if (!itemsSet.has(item.ItemType)) {
                    itemsSet.add(item.ItemType);
                    items.push(item);
                }
            });

            sp.BobbleHeads.forEach(bobbleHead => {
                if (!bobbleHeadsSet.has(bobbleHead)) {
                    bobbleHeadsSet.add(bobbleHead);
                    bobbleHeads.push({ ItemType: bobbleHead, PrimePrice: 1 });
                }
            });
        });

        relics.push(...dualPack.Relics.map(relic => ({ ItemType: relic, RegularPrice: 1 })));
    });

    return [...dualPacks, ...singlePacks, ...items, ...bobbleHeads, ...relics];
};

const createInvasion = (day: number, idx: number): IInvasion => {
    const id = day * 3 + idx;
    const defender = (["FC_GRINEER", "FC_CORPUS", day % 2 ? "FC_GRINEER" : "FC_CORPUS"] as const)[idx];
    const rng = new SRng(new SRng(id).randomInt(0, 1_000_000));
    const isInfestationOutbreak = rng.randomInt(0, 1) == 0;
    const attacker = isInfestationOutbreak ? "FC_INFESTATION" : defender == "FC_GRINEER" ? "FC_CORPUS" : "FC_GRINEER";
    const startMs = EPOCH + day * 86400_000;
    const oid =
        ((startMs / 1000) & 0xffffffff).toString(16).padStart(8, "0") +
        "fd148cb8" +
        (idx & 0xffffffff).toString(16).padStart(8, "0");
    const node = sequentiallyUniqueRandomElement(invasionNodes[defender], id, 5, 690175)!; // Can't repeat the other 2 on this day nor the last 3
    const progress = (Date.now() - startMs) / 86400_000;
    const countMultiplier = isInfestationOutbreak || rng.randomInt(0, 1) ? -1 : 1; // if defender is winning, count is negative
    const fiftyPercent = rng.randomInt(1000, 29000); // introduce some 'yitter' for the percentages
    const rewardFloat = rng.randomFloat();
    const rewardTier = rewardFloat < 0.201 ? "RARE" : rewardFloat < 0.7788 ? "COMMON" : "UNCOMMON";
    const attackerReward: IMissionReward = {};
    const defenderReward: IMissionReward = {};
    if (isInfestationOutbreak) {
        defenderReward.countedItems = [
            rng.randomElement(invasionRewards[rng.randomInt(0, 1) ? "FC_INFESTATION" : defender][rewardTier])!
        ];
    } else {
        attackerReward.countedItems = [rng.randomElement(invasionRewards[attacker][rewardTier])!];
        defenderReward.countedItems = [rng.randomElement(invasionRewards[defender][rewardTier])!];
    }
    return {
        _id: { $oid: oid },
        Faction: attacker,
        DefenderFaction: defender,
        Node: node,
        Count: Math.round(
            (progress < 0.5 ? progress * 2 * fiftyPercent : fiftyPercent + (30_000 - fiftyPercent) * (progress - 0.5)) *
                countMultiplier
        ),
        Goal: 30000, // Value seems to range from 30000 to 98000 in intervals of 1000. Higher values are increasingly rare. I don't think this is relevant for the frontend besides dividing count by it.
        LocTag: isInfestationOutbreak
            ? ExportRegions[node].missionIndex == 0
                ? "/Lotus/Language/Menu/InfestedInvasionBoss"
                : "/Lotus/Language/Menu/InfestedInvasionGeneric"
            : attacker == "FC_CORPUS"
              ? "/Lotus/Language/Menu/CorpusInvasionGeneric"
              : "/Lotus/Language/Menu/GrineerInvasionGeneric",
        Completed: startMs + 86400_000 < Date.now(), // Sorta unfaithful. Invasions on live are (at least in part) in fluenced by people completing them. And otherwise also probably not hardcoded to last 24 hours.
        ChainID: { $oid: oid },
        AttackerReward: attackerReward,
        AttackerMissionInfo: {
            seed: rng.randomInt(0, 1_000_000),
            faction: defender
        },
        DefenderReward: defenderReward,
        DefenderMissionInfo: {
            seed: rng.randomInt(0, 1_000_000),
            faction: attacker
        },
        Activation: {
            $date: {
                $numberLong: startMs.toString()
            }
        }
    };
};

export const getInvasionByOid = (oid: string): IInvasion | undefined => {
    const arr = oid.split("fd148cb8");
    if (arr.length == 2 && arr[0].length == 8 && arr[1].length == 8) {
        return createInvasion(idToDay(oid), parseInt(arr[1], 16));
    }
    return undefined;
};

export const getWorldState = (buildLabel?: string): IWorldState => {
    const constraints: ITimeConstraint[] = [];
    if (config.worldState?.eidolonOverride) {
        constraints.push(config.worldState.eidolonOverride == "day" ? eidolonDayConstraint : eidolonNightConstraint);
    }
    if (config.worldState?.vallisOverride) {
        constraints.push(config.worldState.vallisOverride == "cold" ? venusColdConstraint : venusWarmConstraint);
    }
    if (config.worldState?.duviriOverride) {
        const duviriMoods = ["sorrow", "fear", "joy", "anger", "envy"];
        const desiredMood = duviriMoods.indexOf(config.worldState.duviriOverride);
        if (desiredMood == -1) {
            logger.warn(`ignoring invalid config value for worldState.duviriOverride`, {
                value: config.worldState.duviriOverride,
                valid_values: duviriMoods
            });
        } else {
            constraints.push({
                name: `duviri ${config.worldState.duviriOverride}`,
                isValidTime: (timeSecs: number): boolean => {
                    const moodIndex = Math.trunc(timeSecs / 7200);
                    return moodIndex % 5 == desiredMood;
                },
                getIdealTimeBefore: (timeSecs: number): number => {
                    let moodIndex = Math.trunc(timeSecs / 7200);
                    moodIndex -= ((moodIndex % 5) - desiredMood + 5) % 5; // while (moodIndex % 5 != desiredMood) --moodIndex;
                    const moodStart = moodIndex * 7200;
                    return moodStart;
                }
            });
        }
    }
    const timeSecs = getIdealTimeSatsifyingConstraints(constraints);
    if (constraints.length != 0) {
        const delta = Math.trunc(Date.now() / 1000) - timeSecs;
        if (delta > 1) {
            logger.debug(
                `reported time is ${delta} seconds behind real time to satisfy selected constraints (${constraints.map(x => x.name).join(", ")})`
            );
        }
    }
    const timeMs = timeSecs * 1000;
    const day = Math.trunc((timeMs - EPOCH) / 86400000);
    const week = Math.trunc(day / 7);
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    const date = new Date(timeMs);

    const worldState: IWorldState = {
        BuildLabel: typeof buildLabel == "string" ? buildLabel.split(" ").join("+") : buildConfig.buildLabel,
        Time: timeSecs,
        Goals: [],
        Alerts: [],
        Sorties: [],
        LiteSorties: [],
        ActiveMissions: [],
        FlashSales: [],
        GlobalUpgrades: [],
        Invasions: [],
        VoidTraders: [],
        PrimeVaultTraders: [],
        VoidStorms: [],
        DailyDeals: [],
        EndlessXpChoices: [],
        KnownCalendarSeasons: [],
        PVPChallengeInstances: [],
        ...staticWorldState,
        SyndicateMissions: [...staticWorldState.SyndicateMissions],
        InGameMarket: {
            LandingPage: {
                Categories: staticWorldState.InGameMarket.LandingPage.Categories.map(c => ({
                    ...c,
                    Items: [...c.Items]
                }))
            }
        }
    };

    // Old versions seem to really get hung up on not being able to load these.
    if (buildLabel && version_compare(buildLabel, "2017.10.12.17.04") < 0) {
        worldState.PVPChallengeInstances = [];
    }

    if (config.worldState?.tennoLiveRelay) {
        worldState.Goals.push({
            _id: {
                $oid: "687bf9400000000000000000"
            },
            Activation: {
                $date: {
                    $numberLong: "1752955200000"
                }
            },
            Expiry: {
                $date: {
                    $numberLong: "2000000000000"
                }
            },
            Count: 0,
            Goal: 0,
            Success: 0,
            Personal: true,
            Desc: "/Lotus/Language/Locations/RelayStationTennoConB",
            ToolTip: "/Lotus/Language/Locations/RelayStationTennoConDescB",
            Icon: "/Lotus/Interface/Icons/Categories/IconTennoLive.png",
            Tag: "TennoConRelayB",
            Node: "TennoConBHUB6"
        });
    }
    if (config.worldState?.baroTennoConRelay) {
        worldState.Goals.push({
            _id: { $oid: "687bb2f00000000000000000" },
            Activation: { $date: { $numberLong: "1752937200000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            Goal: 0,
            Success: 0,
            Personal: true,
            //"Faction": "FC_GRINEER",
            Desc: "/Lotus/Language/Locations/RelayStationTennoCon",
            ToolTip: "/Lotus/Language/Locations/RelayStationTennoConDesc",
            Icon: "/Lotus/Interface/Icons/Categories/IconTennoConSigil.png",
            Tag: "TennoConRelay",
            Node: "TennoConHUB2"
        });
        const vt: IVoidTrader = {
            _id: { $oid: "687809030379266d790495c6" },
            Activation: { $date: { $numberLong: "1752937200000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Character: "Baro'Ki Teel",
            Node: "TennoConHUB2",
            Manifest: []
        };
        worldState.VoidTraders.push(vt);
        fullyStockBaro(vt);
    }
    const isFebruary = date.getUTCMonth() == 1;
    if (config.worldState?.starDaysOverride ?? isFebruary) {
        worldState.Goals.push({
            _id: { $oid: "67a4dcce2a198564d62e1647" },
            Activation: {
                $date: {
                    $numberLong: config.worldState?.starDaysOverride
                        ? "1738868400000"
                        : Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1).toString()
                }
            },
            Expiry: {
                $date: {
                    $numberLong: config.worldState?.starDaysOverride
                        ? "2000000000000"
                        : Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1).toString()
                }
            },
            Count: 0,
            Goal: 0,
            Success: 0,
            Personal: true,
            Desc: "/Lotus/Language/Events/ValentinesFortunaName",
            ToolTip: "/Lotus/Language/Events/ValentinesFortunaName",
            Icon: "/Lotus/Interface/Icons/WorldStatePanel/ValentinesEventIcon.png",
            Tag: "FortunaValentines",
            Node: "SolarisUnitedHub1"
        });
    }
    // The client gets kinda confused when multiple goals have the same tag, so considering these mutually exclusive.
    if (config.worldState?.galleonOfGhouls == 1) {
        worldState.Goals.push({
            _id: { $oid: "6814ddf00000000000000000" },
            Activation: { $date: { $numberLong: "1746198000000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            Goal: 1,
            Success: 0,
            Personal: true,
            Bounty: true,
            ClampNodeScores: true,
            Node: "EventNode19",
            MissionKeyName: "/Lotus/Types/Keys/GalleonRobberyAlert",
            Desc: "/Lotus/Language/Events/GalleonRobberyEventMissionTitle",
            Icon: "/Lotus/Interface/Icons/Player/GalleonRobberiesEvent.png",
            Tag: "GalleonRobbery",
            Reward: {
                items: [
                    "/Lotus/StoreItems/Types/Recipes/Weapons/GrnChainSawTonfaBlueprint",
                    "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                ]
            }
        });
    } else if (config.worldState?.galleonOfGhouls == 2) {
        worldState.Goals.push({
            _id: { $oid: "681e18700000000000000000" },
            Activation: { $date: { $numberLong: "1746802800000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            Goal: 1,
            Success: 0,
            Personal: true,
            Bounty: true,
            ClampNodeScores: true,
            Node: "EventNode28", // Incompatible with Wolf Hunt (2025), Orphix Venom, Warframe Anniversary
            MissionKeyName: "/Lotus/Types/Keys/GalleonRobberyAlertB",
            Desc: "/Lotus/Language/Events/GalleonRobberyEventMissionTitle",
            Icon: "/Lotus/Interface/Icons/Player/GalleonRobberiesEvent.png",
            Tag: "GalleonRobbery",
            Reward: {
                items: [
                    "/Lotus/StoreItems/Types/Recipes/Weapons/MortiforShieldAndSwordBlueprint",
                    "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                ]
            }
        });
    } else if (config.worldState?.galleonOfGhouls == 3) {
        worldState.Goals.push({
            _id: { $oid: "682752f00000000000000000" },
            Activation: { $date: { $numberLong: "1747407600000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            Goal: 1,
            Success: 0,
            Personal: true,
            Bounty: true,
            ClampNodeScores: true,
            Node: "EventNode19",
            MissionKeyName: "/Lotus/Types/Keys/GalleonRobberyAlertC",
            Desc: "/Lotus/Language/Events/GalleonRobberyEventMissionTitle",
            Icon: "/Lotus/Interface/Icons/Player/GalleonRobberiesEvent.png",
            Tag: "GalleonRobbery",
            Reward: {
                items: [
                    "/Lotus/Types/StoreItems/Packages/EventCatalystReactorBundle",
                    "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                ]
            }
        });
    }

    const firstNovemberWeekday = new Date(Date.UTC(date.getUTCFullYear(), 10, 1)).getUTCDay();
    const firstNovemberMondayOffset = (8 - firstNovemberWeekday) % 7;

    const plagueStarStart = Date.UTC(date.getUTCFullYear(), 10, firstNovemberMondayOffset + 1, 16);
    const plagueStarEnd = Date.UTC(date.getUTCFullYear(), 10, firstNovemberMondayOffset + 15, 16);

    const isPlagueStarActive = timeMs >= plagueStarStart && timeMs < plagueStarEnd;
    if (config.worldState?.plagueStarOverride ?? isPlagueStarActive) {
        worldState.Goals.push({
            _id: { $oid: "654a5058c757487cdb11824f" },
            Activation: {
                $date: {
                    $numberLong: config.worldState?.plagueStarOverride ? "1699372800000" : plagueStarStart.toString()
                }
            },
            Expiry: {
                $date: {
                    $numberLong: config.worldState?.plagueStarOverride ? "2000000000000" : plagueStarEnd.toString()
                }
            },
            Tag: "InfestedPlains",
            RegionIdx: 2,
            Faction: "FC_INFESTATION",
            Desc: "/Lotus/Language/InfestedPlainsEvent/InfestedPlainsBountyName",
            ToolTip: "/Lotus/Language/InfestedPlainsEvent/InfestedPlainsBountyDesc",
            Icon: "/Lotus/Materials/Emblems/PlagueStarEventBadge_e.png",
            JobAffiliationTag: "EventSyndicate",
            Jobs: [
                {
                    jobType: "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/InfestedPlainsBounty",
                    rewards: "/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/PlagueStarTableRewards",
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: [50, 300, 100, 575]
                },
                {
                    jobType: "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/InfestedPlainsBountyAdvanced",
                    rewards: "/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/PlagueStarTableRewards",
                    minEnemyLevel: 55,
                    maxEnemyLevel: 65,
                    xpAmounts: [200, 1000, 300, 1700],
                    requiredItems: [
                        "/Lotus/StoreItems/Types/Items/Eidolon/InfestedEventIngredient",
                        "/Lotus/StoreItems/Types/Items/Eidolon/InfestedEventClanIngredient"
                    ],
                    useRequiredItemsAsMiscItemFee: true
                },
                {
                    jobType: "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/InfestedPlainsBountySteelPath",
                    rewards: "/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/PlagueStarTableSteelPathRewards",
                    minEnemyLevel: 100,
                    maxEnemyLevel: 110,
                    xpAmounts: [200, 1100, 400, 2100],
                    masteryReq: 10,
                    requiredItems: [
                        "/Lotus/StoreItems/Types/Items/Eidolon/InfestedEventIngredient",
                        "/Lotus/StoreItems/Types/Items/Eidolon/InfestedEventClanIngredient"
                    ],
                    useRequiredItemsAsMiscItemFee: true
                }
            ],
            Transmission: "/Lotus/Sounds/Dialog/PlainsMeteorLeadUp/LeadUp/DLeadUp0021Lotus",
            InstructionalItem: "/Lotus/Types/StoreItems/Packages/PlagueStarEventStoreItem"
        });
    }

    const firstAugustWeekday = new Date(Date.UTC(date.getUTCFullYear(), 7, 1)).getUTCDay();
    const firstAugustWednesdayOffset = (3 - firstAugustWeekday + 7) % 7;
    const dogDaysStart = Date.UTC(date.getUTCFullYear(), 7, 1 + firstAugustWednesdayOffset, 15);

    const firstSeptemberWeekday = new Date(Date.UTC(date.getUTCFullYear(), 8, 1)).getUTCDay();
    const firstSeptemberWednesdayOffset = (3 - firstSeptemberWeekday + 7) % 7;
    const dogDaysEnd = Date.UTC(date.getUTCFullYear(), 8, 1 + firstSeptemberWednesdayOffset, 15);

    const isDogDaysActive = timeMs >= dogDaysStart && timeMs < dogDaysEnd;
    if (config.worldState?.dogDaysOverride ?? isDogDaysActive) {
        const activationTimeStamp = config.worldState?.dogDaysOverride ? "1699372800000" : dogDaysStart.toString();
        const expiryTimeStamp = config.worldState?.dogDaysOverride ? "2000000000000" : dogDaysEnd.toString();
        const rewards = [
            [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Weapons/Redeemer/RedeemerRelayWaterSkin"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/MiscItems/PhotoboothTileHydroidRelay"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/ShipDecos/RelayHydroidBobbleHead"]
                },
                {
                    items: [
                        "/Lotus/StoreItems/Types/Items/MiscItems/OrokinReactor",
                        "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                    ]
                }
            ],
            [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Sigils/DogDays2023ASigil"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 25
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyBeachKavat"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 50
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyRucksackKubrow"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 75
                        }
                    ]
                },
                {
                    items: ["/Lotus/StoreItems/Types/Items/ShipDecos/LisetPropCleaningDroneBeachcomber"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 100
                        }
                    ]
                }
            ],
            [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/Seasonal/AvatarImageDogDays2024Glyph"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 25
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/ShipDecos/DogDays2024Poster"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 50
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Clan/DogDaysKubrowBadgeItem"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 75
                        }
                    ]
                },
                {
                    items: ["/Lotus/StoreItems/Types/Items/ShipDecos/DogDays2024LisetPropCleaningDroneBeachcomber"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 100
                        }
                    ]
                }
            ],
            [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageDogDaysHydroidGlyph"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 25
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageDogDaysLokiGlyph"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 50
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageDogDaysNovaGlyph"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 75
                        }
                    ]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageDogDaysValkyrGlyph"],
                    countedItems: [
                        {
                            ItemType: "/Lotus/Types/Items/MiscItems/WaterFightBucks",
                            ItemCount: 100
                        }
                    ]
                }
            ]
        ];

        const year = config.worldState?.dogDaysRewardsOverride ?? 3;

        worldState.Goals.push({
            _id: {
                $oid:
                    ((dogDaysStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") +
                    "c57487c3768936d" +
                    year.toString(16)
            },
            Activation: { $date: { $numberLong: activationTimeStamp } },
            Expiry: { $date: { $numberLong: expiryTimeStamp } },
            Count: 0,
            Goal: 100,
            InterimGoals: [25, 50],
            BonusGoal: 200,
            Success: 0,
            Personal: true,
            Bounty: true,
            ClampNodeScores: true,
            Node: "EventNode25", // Incompatible with Hallowed Flame, Hallowed Nightmares, Warframe Anniversary
            ConcurrentMissionKeyNames: [
                "/Lotus/Types/Keys/TacAlertKeyWaterFightB",
                "/Lotus/Types/Keys/TacAlertKeyWaterFightC",
                "/Lotus/Types/Keys/TacAlertKeyWaterFightD"
            ],
            ConcurrentNodeReqs: [25, 50, 100],
            ConcurrentNodes: ["EventNode24", "EventNode34", "EventNode35"], // Incompatible with Hallowed Flame, Hallowed Nightmares, Warframe Anniversary
            MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyWaterFightA",
            Faction: "FC_CORPUS",
            Desc: "/Lotus/Language/Alerts/TacAlertWaterFight",
            Icon: "/Lotus/Interface/Icons/StoreIcons/Emblems/SplashEventIcon.png",
            Tag: "WaterFight",
            InterimRewards: rewards[year].slice(0, 2),
            Reward: rewards[year][2],
            BonusReward: rewards[year][3],
            ScoreVar: "Team1Score",
            NightLevel: "/Lotus/Levels/GrineerBeach/GrineerBeachEventNight.level"
        });

        const baseStoreItem = {
            ShowInMarket: true,
            HideFromMarket: false,
            SupporterPack: false,
            Discount: 0,
            BogoBuy: 0,
            BogoGet: 0,
            StartDate: { $date: { $numberLong: activationTimeStamp } },
            EndDate: { $date: { $numberLong: expiryTimeStamp } },
            ProductExpiryOverride: { $date: { $numberLong: expiryTimeStamp } }
        };

        const storeItems = [
            {
                TypeName: "/Lotus/Types/StoreItems/Packages/WaterFightNoggleBundle",
                PremiumOverride: 240,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFBeastMasterBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFChargerBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFEngineerBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFGruntBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImagePopsicleGrineerPurple",
                PremiumOverride: 0,
                RegularOverride: 1
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFHealerBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFHeavyBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFHellionBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFSniperBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFTankBobbleHead",
                PremiumOverride: 35,
                RegularOverride: 0
            },
            {
                TypeName: "/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerRollers",
                PremiumOverride: 75,
                RegularOverride: 0
            }
        ];

        worldState.FlashSales.push(...storeItems.map(item => ({ ...baseStoreItem, ...item })));

        const seasonalItems = storeItems.map(item => item.TypeName);

        const seasonalCategory = worldState.InGameMarket.LandingPage.Categories.find(c => c.CategoryName == "SEASONAL");

        if (seasonalCategory) {
            seasonalCategory.Items ??= [];
            seasonalCategory.Items.push(...seasonalItems);
        } else {
            worldState.InGameMarket.LandingPage.Categories.push({
                CategoryName: "SEASONAL",
                Name: "/Lotus/Language/Store/SeasonalCategoryTitle",
                Icon: "seasonal",
                AddToMenu: true,
                Items: seasonalItems
            });
        }
    }

    if (config.worldState?.anniversary != undefined) {
        // Incompatible with: Use Tag from Warframe Anniversary for old Events, Wolf Hunt (2025), Galleon Of Ghouls, Hallowed Flame, Hallowed Nightmares, Dog Days, Proxy Rebellion, Long Shadow
        const goalsByWeek: Partial<IGoal>[][] = [
            [
                {
                    Node: "EventNode28",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2019E",
                    Tag: "Anniversary2019TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Upgrades/Skins/Excalibur/ExcaliburDexSkin"]
                    }
                },
                {
                    Node: "EventNode26",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2020F",
                    Tag: "Anniversary2020TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/Items/ShipDecos/ExcaliburDexBobbleHead"]
                    }
                },
                {
                    Node: "EventNode19",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2024ChallengeModeA",
                    Tag: "Anniversary2024TacAlertCMA",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/Items/MiscItems/WeaponUtilityUnlocker"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode24",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2017C",
                    Tag: "Anniversary2018TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Weapons/Tenno/LongGuns/DexTheThird/DexTheThird"]
                    }
                },
                {
                    Node: "EventNode18",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2020H",
                    Tag: "Anniversary2020TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/ImageDexAnniversary"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode18",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2022J",
                    Tag: "Anniversary2022TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Upgrades/Skins/Rhino/RhinoDexSkin"]
                    }
                },
                {
                    Node: "EventNode38",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2025D",
                    Tag: "Anniversary2020TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/Items/ShipDecos/RhinoDexBobbleHead"]
                    }
                },
                {
                    Node: "EventNode27",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2025ChallengeModeA",
                    Tag: "Anniversary2024TacAlertCMA",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode2",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2020G",
                    Tag: "Anniversary2020TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Upgrades/Skins/Liset/DexLisetSkin"]
                    }
                },
                {
                    Node: "EventNode17",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2017B",
                    Tag: "Anniversary2018TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Weapons/Tenno/Melee/Swords/DexTheSecond/DexTheSecond"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode18",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2017A",
                    Tag: "Anniversary2018TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Weapons/Tenno/Pistols/DexFuris/DexFuris"]
                    }
                },
                {
                    Node: "EventNode26",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2023K",
                    Tag: "Anniversary2025TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageCommunityClemComic"]
                    }
                },
                {
                    Node: "EventNode12",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2025ChallengeModeB",
                    Tag: "Anniversary2025TacAlertCMB",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/Items/MiscItems/WeaponPrimaryArcaneUnlocker"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode17",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2025A",
                    Tag: "Anniversary2025TacAlert",
                    Reward: {
                        items: [
                            "/Lotus/StoreItems/Weapons/Tenno/Melee/Swords/KatanaAndWakizashi/Dex2023Nikana/Dex2023Nikana"
                        ]
                    }
                },
                {
                    Node: "EventNode27",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2018D",
                    Tag: "Anniversary2018TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Upgrades/Skins/Scarves/DexScarf"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode38",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2025C",
                    Tag: "Anniversary2018TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Upgrades/Skins/Wisp/DexWispSkin"]
                    }
                },
                {
                    Node: "EventNode12",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2024L",
                    Tag: "Anniversary2024TacAlert",
                    Reward: {
                        items: ["/Lotus/Types/StoreItems/Packages/OperatorDrifterDexBundle"]
                    }
                },
                {
                    Node: "EventNode26",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2024ChallengeModeB",
                    Tag: "Anniversary2024TacAlertCMB",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/Recipes/Components/UmbraFormaBlueprint"]
                    }
                }
            ],
            [
                {
                    Node: "EventNode37",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2021I",
                    Tag: "Anniversary2021TacAlert",
                    Reward: {
                        items: [
                            "/Lotus/StoreItems/Upgrades/Skins/Armor/Dex2020Armor/Dex2020ArmorAArmor",
                            "/Lotus/StoreItems/Upgrades/Skins/Armor/Dex2020Armor/Dex2020ArmorCArmor",
                            "/Lotus/StoreItems/Upgrades/Skins/Armor/Dex2020Armor/Dex2020ArmorLArmor",
                            "/Lotus/StoreItems/Types/Game/CatbrowPet/CatbrowGeneticSignature"
                        ],
                        countedItems: [
                            {
                                ItemType: "/Lotus/Types/Game/CatbrowPet/CatbrowGeneticSignature",
                                ItemCount: 10
                            }
                        ]
                    }
                },
                {
                    Node: "EventNode9",
                    MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyAnniversary2025B",
                    Tag: "Anniversary2025TacAlert",
                    Reward: {
                        items: ["/Lotus/StoreItems/Types/StoreItems/SuitCustomizations/ColourPickerAnniversaryEleven"]
                    }
                }
            ]
        ];
        goalsByWeek[config.worldState.anniversary].forEach((goal, i) => {
            worldState.Goals.push({
                _id: {
                    $oid:
                        "67c6d8e725b23feb" +
                        config.worldState?.anniversary!.toString(16).padStart(4, "0") +
                        i.toString(16).padStart(4, "0")
                },
                Activation: { $date: { $numberLong: "1745593200000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 1,
                Success: 0,
                Personal: true,
                ClampNodeScores: true,
                Node: goal.Node,
                MissionKeyName: goal.MissionKeyName,
                Desc: goal.Tag!.endsWith("CMB")
                    ? "/Lotus/Language/Events/Anniversary2024ChallengeMode"
                    : "/Lotus/Language/G1Quests/Anniversary2017MissionTitle",
                Icon: "/Lotus/Interface/Icons/Player/GlyphLotus12Anniversary.png",
                Tag: goal.Tag!,
                Reward: goal.Reward
            });
        });
    }

    if (config.worldState?.wolfHunt) {
        worldState.Goals.push({
            _id: {
                $oid: "67ed7672798d6466172e3b9d"
            },
            Activation: {
                $date: {
                    $numberLong: "1743616800000"
                }
            },
            Expiry: {
                $date: {
                    $numberLong: "2000000000000"
                }
            },
            Count: 0,
            Goal: 3,
            InterimGoals: [1, 2],
            BonusGoal: 4,
            Success: 0,
            Personal: true,
            Bounty: true,
            ClampNodeScores: true,
            Node: "EventNode29",
            ConcurrentMissionKeyNames: [
                "/Lotus/Types/Keys/WolfTacAlertReduxB",
                "/Lotus/Types/Keys/WolfTacAlertReduxC",
                "/Lotus/Types/Keys/WolfTacAlertReduxD"
            ],
            ConcurrentNodeReqs: [1, 2, 3],
            ConcurrentNodes: ["EventNode28", "EventNode39", "EventNode40"], // Incompatible with Galleon Of Ghouls, Orphix Venom, Warframe Anniversary
            MissionKeyName: "/Lotus/Types/Keys/WolfTacAlertReduxA",
            Faction: "FC_GRINEER",
            Desc: "/Lotus/Language/Alerts/WolfAlert",
            Icon: "/Lotus/Interface/Icons/Npcs/Seasonal/WolfStalker.png",
            Tag: "WolfHuntRedux",
            InterimRewards: [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Recipes/Weapons/WeaponParts/ThrowingHammerHandle"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Recipes/Weapons/WeaponParts/ThrowingHammerHead"]
                }
            ],
            Reward: {
                credits: 50000,
                items: ["/Lotus/StoreItems/Types/Recipes/Weapons/WeaponParts/ThrowingHammerMotor"]
            },
            BonusReward: {
                credits: 50000,
                items: [
                    "/Lotus/StoreItems/Types/Recipes/Weapons/ThrowingHammerBlueprint",
                    "/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst",
                    "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                ]
            }
        });
    }

    const tagsForOlderGoals: string[] = [
        "Anniversary2018TacAlert",
        "Anniversary2019TacAlert",
        "Anniversary2020TacAlert",
        "Anniversary2021TacAlert",
        "Anniversary2022TacAlert",
        "Anniversary2024TacAlert",
        "Anniversary2024TacAlertCMA",
        "Anniversary2025TacAlert",
        "Anniversary2025TacAlertCMB"
    ];

    if (config.worldState?.hallowedFlame) {
        worldState.Goals.push(
            {
                _id: { $oid: "5db305403d34b5158873519a" },
                Activation: { $date: { $numberLong: "1699372800000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 3,
                InterimGoals: [1, 2],
                Success: 0,
                Personal: true,
                Bounty: true,
                ClampNodeScores: true,
                Node: "EventNode24", // Incompatible with Hallowed Nightmares, Dog Days
                ConcurrentMissionKeyNames: [
                    "/Lotus/Types/Keys/LanternEndlessEventKeyB",
                    "/Lotus/Types/Keys/LanternEndlessEventKeyC"
                ],
                ConcurrentNodeReqs: [1, 2],
                ConcurrentNodes: ["EventNode25", "EventNode34"], // Incompatible with Hallowed Nightmares, Dog Days
                MissionKeyName: "/Lotus/Types/Keys/LanternEndlessEventKeyA",
                Faction: "FC_INFESTATION",
                Desc: "/Lotus/Language/Events/TacAlertHalloweenLantern",
                Icon: "/Lotus/Interface/Icons/JackOLanternColour.png",
                Tag: config.unfaithfulBugFixes?.useAnniversaryTagForOldGoals ? tagsForOlderGoals[0] : "Halloween19",
                InterimRewards: [
                    { items: ["/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst"] },
                    { items: ["/Lotus/StoreItems/Types/Items/MiscItems/Forma"] }
                ],
                Reward: {
                    items: ["/Lotus/StoreItems/Types/Items/MiscItems/FormaAura"]
                }
            },
            {
                _id: { $oid: "5db3054a3d34b5158873519c" },
                Activation: { $date: { $numberLong: "1699372800000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 900,
                Success: 0,
                Personal: true,
                Bounty: true,
                Best: true,
                ClampNodeScores: true,
                Node: "EventNode35",
                MissionKeyName: "/Lotus/Types/Keys/LanternEndlessEventKeyD",
                Faction: "FC_INFESTATION",
                Desc: "/Lotus/Language/Events/TacAlertHalloweenLanternEndless",
                Icon: "/Lotus/Interface/Icons/JackOLanternColour.png",
                Tag: "Halloween19Endless",
                PrereqGoalTags: [
                    config.unfaithfulBugFixes?.useAnniversaryTagForOldGoals ? tagsForOlderGoals[0] : "Halloween19"
                ],
                Reward: {
                    items: [
                        "/Lotus/StoreItems/Upgrades/Skins/Effects/BatsEphemera",
                        "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                    ]
                },
                ScoreVar: "EndlessMissionTimeElapsed",
                ScoreMaxTag: "Halloween19ScoreMax"
            }
        );
    }

    if (config.worldState?.hallowedNightmares) {
        const rewards = [
            // 2018
            [
                {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Sigils/DotD2016Sigil"]
                },
                {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Halloween/HalloweenDread"]
                },
                {
                    items: ["/Lotus/StoreItems/Types/Items/MiscItems/OrokinReactor"]
                }
            ],
            // 2016
            [
                {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Sigils/OrokinCatalyst"]
                },
                {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Sigils/DotD2016Sigil"]
                },
                {
                    items: [
                        "/Lotus/StoreItems/Types/Items/MiscItems/OrokinReactor",
                        "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                    ]
                }
            ],
            // 2015
            [
                {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Sigils/OrokinCatalyst"]
                },
                {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"]
                }
            ]
        ];
        const year = config.worldState.hallowedNightmaresRewardsOverride ?? 0;

        worldState.Goals.push({
            _id: { $oid: "5bc98f00000000000000000" + year.toString(16) },
            Activation: { $date: { $numberLong: "1539972000000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            InterimGoals: [1],
            Goal: 2,
            Success: 0,
            Personal: true,
            Bounty: true,
            Tag: config.unfaithfulBugFixes?.useAnniversaryTagForOldGoals ? tagsForOlderGoals[0] : "Halloween",
            Faction: "FC_INFESTATION",
            Desc: "/Lotus/Language/G1Quests/TacAlertHalloweenTitle",
            ToolTip: "/Lotus/Language/G1Quests/TacAlertHalloweenToolTip",
            Icon: "/Lotus/Interface/Icons/JackOLanternColour.png",
            ClampNodeScores: true,
            Node: "EventNode2", // Incompatible with Warframe Anniversary
            MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyHalloween",
            ConcurrentMissionKeyNames: ["/Lotus/Types/Keys/TacAlertKeyHalloweenBonus"],
            ConcurrentNodeReqs: [1],
            ConcurrentNodes: ["EventNode24"], // Incompatible with Hallowed Flame, Dog Days, Warframe Anniversary
            InterimRewards: [rewards[year][0]],
            Reward: rewards[year][1]
        });
        if (year != 2) {
            worldState.Goals.push({
                _id: { $oid: "5bc98f01000000000000000" + year.toString(16) },
                Activation: { $date: { $numberLong: "1539972000000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 666,
                Success: 0,
                Personal: true,
                Bounty: true,
                Best: true,
                Tag: "Halloween",
                PrereqGoalTags: [
                    config.unfaithfulBugFixes?.useAnniversaryTagForOldGoals ? tagsForOlderGoals[0] : "Halloween"
                ],
                Faction: "FC_INFESTATION",
                Desc: "Hallowed Nightmares - Time Attack",
                ToolTip: "/Lotus/Language/G1Quests/TacAlertHalloweenToolTip",
                Icon: "/Lotus/Interface/Icons/JackOLanternColour.png",
                ClampNodeScores: true,
                Node: "EventNode25", // Incompatible with Hallowed Flame, Dog Days
                MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyHalloweenTimeAttack",
                ScoreVar: "TimeAttackScore",
                ScoreMaxTag: "Halloween16",
                Reward: rewards[year][2]
            });
        }
    }

    if (config.worldState?.proxyRebellion) {
        const rewards = [
            // 2019
            [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/MiscItems/UtilityUnlocker"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Upgrades/Mods/Randomized/RawPistolRandomMod"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/Types/StoreItems/Packages/EventCatalystReactorBundle"]
                },
                {
                    items: [
                        "/Lotus/StoreItems/Upgrades/Skins/Scarves/HornSkullScarf",
                        "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                    ]
                }
            ],
            // 2018
            [
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Upgrades/Mods/FusionBundles/NightwatchFusionBundle"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/StoreItems/Types/Items/MiscItems/UtilityUnlocker"]
                },
                {
                    credits: 50000,
                    items: ["/Lotus/Types/StoreItems/Packages/EventCatalystReactorBundle"]
                },
                {
                    items: [
                        "/Lotus/StoreItems/Upgrades/Skins/Sigils/EnergySigilA",
                        "/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"
                    ]
                }
            ]
        ];
        const year = config.worldState.proxyRebellionRewardsOverride ?? 0;

        worldState.Goals.push({
            _id: { $oid: "5b5b5da0000000000000000" + year.toString(16) },
            Activation: { $date: { $numberLong: "1532714400000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            Goal: 3,
            InterimGoals: [1, 2],
            BonusGoal: 4,
            Success: 0,
            Personal: true,
            Bounty: true,
            ClampNodeScores: true,
            Node: "EventNode18", // Incompatible with Warframe Anniversary
            ConcurrentMissionKeyNames: [
                "/Lotus/Types/Keys/TacAlertKeyProxyRebellionTwo",
                "/Lotus/Types/Keys/TacAlertKeyProxyRebellionThree",
                "/Lotus/Types/Keys/TacAlertKeyProxyRebellionFour"
            ],
            ConcurrentNodeReqs: [1, 2, 3],
            ConcurrentNodes: ["EventNode7", "EventNode4", "EventNode17"], // Incompatible with Orphix venom, Warframe Anniversary
            MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyProxyRebellionOne",
            Faction: "FC_CORPUS",
            Desc: "/Lotus/Language/Alerts/TacAlertProxyRebellion",
            Icon: "/Lotus/Materials/Emblems/BountyBadge_e.png",
            Tag: config.unfaithfulBugFixes?.useAnniversaryTagForOldGoals ? tagsForOlderGoals[1] : "ProxyRebellion",
            InterimRewards: rewards[year].slice(0, 2),
            Reward: rewards[year][2],
            BonusReward: rewards[year][3]
        });
    }

    if (config.worldState?.longShadow) {
        worldState.Goals.push({
            _id: { $oid: "5bc9e8f7272d5d184c8398c9" },
            Activation: { $date: { $numberLong: "1539972000000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: 0,
            InterimGoals: [1, 2],
            Goal: 3,
            BonusGoal: 4,
            Success: 0,
            Personal: true,
            Bounty: true,
            Tag: config.unfaithfulBugFixes?.useAnniversaryTagForOldGoals ? tagsForOlderGoals[2] : "NightwatchTacAlert",
            Faction: "FC_GRINEER",
            Desc: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertTitle",
            Icon: "/Lotus/Materials/Emblems/BountyBadge_e.png",
            ClampNodeScores: true,
            Node: "EventNode9", // Incompatible with Warframe Anniversary
            MissionKeyName: "/Lotus/Types/Keys/TacAlertKeyProjectNightwatchEasy",
            ConcurrentMissionKeyNames: [
                "/Lotus/Types/Keys/TacAlertKeyProjectNightwatch",
                "/Lotus/Types/Keys/TacAlertKeyProjectNightwatchHard",
                "/Lotus/Types/Keys/TacAlertKeyProjectNightwatchBonus"
            ],
            ConcurrentNodeReqs: [1, 2, 3],
            ConcurrentNodes: ["SolNode136", "EventNode3", "EventNode0"],
            InterimRewards: [
                {
                    credits: 50000,
                    countedItems: [
                        { ItemType: "/Lotus/Upgrades/Mods/FusionBundles/RareFusionBundle", ItemCount: 10 } // Not sure about that
                    ]
                },
                {
                    items: ["/Lotus/StoreItems/Types/Items/MiscItems/UtilityUnlocker"]
                }
            ],
            Reward: {
                items: ["/Lotus/Types/StoreItems/Packages/EventCatalystReactorBundle"]
            },
            BonusReward: { items: ["/Lotus/StoreItems/Upgrades/Skins/Clan/BountyHunterBadgeItem"] }
        });
    }
    if (config.worldState?.bellyOfTheBeast) {
        worldState.Goals.push({
            _id: { $oid: "67a5035c2a198564d62e165e" },
            Activation: { $date: { $numberLong: "1738868400000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: config.worldState.bellyOfTheBeastProgressOverride ?? 0,
            HealthPct: (config.worldState.bellyOfTheBeastProgressOverride ?? 0) / 100,
            Goal: 0,
            Personal: true,
            Community: true,
            ClanGoal: [72, 216, 648, 1944, 5832],
            Tag: "JadeShadowsEvent",
            Faction: "FC_MITW",
            Desc: "/Lotus/Language/JadeShadows/JadeShadowsEventName",
            ToolTip: "/Lotus/Language/JadeShadows/JadeShadowsShortEventDesc",
            Icon: "/Lotus/Interface/Icons/WorldStatePanel/JadeShadowsEventBadge.png",
            ScoreLocTag: "/Lotus/Language/JadeShadows/JadeShadowsEventScore",
            Node: "SolNode723",
            MissionKeyName: "/Lotus/Types/Keys/JadeShadowsEventMission",
            ItemType: "/Lotus/Types/Gameplay/JadeShadows/Resources/AscensionEventResourceItem"
        });
    }
    if (config.worldState?.eightClaw) {
        worldState.Goals.push({
            _id: { $oid: "685c15f80000000000000000" },
            Activation: { $date: { $numberLong: "1750865400000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            Count: config.worldState.eightClawProgressOverride ?? 0,
            HealthPct: (config.worldState.eightClawProgressOverride ?? 0) / 100,
            Goal: 0,
            Personal: true,
            Community: true,
            ClanGoal: [72, 216, 648, 1944, 5832],
            Tag: "DuviriMurmurEvent",
            Faction: "FC_MITW",
            Desc: "/Lotus/Language/Isleweaver/DuviriMurmurEventTitle",
            ToolTip: "/Lotus/Language/Isleweaver/DuviriMurmurEventDescription",
            Icon: "/Lotus/Interface/Icons/WorldStatePanel/EightClawEventBadge.png",
            ScoreLocTag: "/Lotus/Language/Isleweaver/DuviriMurmurEventScore",
            Node: "SolNode236",
            MissionKeyName: "/Lotus/Types/Keys/DuviriMITW/DuviriMITWEventKey"
        });
    }

    if (config.worldState?.orphixVenom) {
        worldState.Goals.push(
            {
                _id: { $oid: "5fdcccb875d5ad500dc477d0" },
                Activation: { $date: { $numberLong: "1608320400000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 500,
                Success: 0,
                Personal: true,
                Best: true,
                Node: "EventNode17", // Incompatible with Proxy Rebellion
                MissionKeyName: "/Lotus/Types/Keys/MechSurvivalCorpusShip",
                Faction: "FC_SENTIENT",
                Desc: "/Lotus/Language/Events/MechEventMissionTier1",
                Icon: "/Lotus/Interface/Icons/Categories/IconMech256.png",
                Tag: "MechSurvivalA",
                ScoreVar: "MechSurvivalScore",
                Reward: {
                    items: ["/Lotus/StoreItems/Upgrades/Skins/Clan/MechEventEmblemItem"]
                }
            },
            {
                _id: { $oid: "5fdcccb875d5ad500dc477d1" },
                Activation: { $date: { $numberLong: "1608320400000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 1000,
                Success: 0,
                Personal: true,
                Best: true,
                Node: "EventNode28", // Incompatible with Galleon Of Ghouls, Wolf Hunt (2025)
                MissionKeyName: "/Lotus/Types/Keys/MechSurvivalGrineerGalleon",
                Faction: "FC_SENTIENT",
                Desc: "/Lotus/Language/Events/MechEventMissionTier2",
                Icon: "/Lotus/Interface/Icons/Categories/IconMech256.png",
                Tag: "MechSurvivalB",
                PrereqGoalTags: ["MechSurvivalA"],
                ScoreVar: "MechSurvivalScore",
                Reward: {
                    items: ["/Lotus/StoreItems/Types/Items/FusionTreasures/OroFusexJ"]
                }
            },
            {
                _id: { $oid: "5fdcccb875d5ad500dc477d2" },
                Activation: { $date: { $numberLong: "1608320400000" } },
                Expiry: { $date: { $numberLong: "2000000000000" } },
                Count: 0,
                Goal: 2000,
                Success: 0,
                Personal: true,
                Best: true,
                Node: "EventNode32",
                MissionKeyName: "/Lotus/Types/Keys/MechSurvivalGasCity",
                MissionKeyRotation: [
                    "/Lotus/Types/Keys/MechSurvivalGasCity",
                    "/Lotus/Types/Keys/MechSurvivalCorpusShipEndurance",
                    "/Lotus/Types/Keys/MechSurvivalGrineerGalleonEndurance"
                ],
                MissionKeyRotationInterval: 3600, // 1 hour
                Faction: "FC_SENTIENT",
                Desc: "/Lotus/Language/Events/MechEventMissionTier3",
                Icon: "/Lotus/Interface/Icons/Categories/IconMech256.png",
                Tag: "MechSurvival",
                PrereqGoalTags: ["MechSurvivalA", "MechSurvivalB"],
                ScoreVar: "MechSurvivalScore",
                ScoreMaxTag: "MechSurvivalScoreMax",
                Reward: {
                    items: [
                        "/Lotus/StoreItems/Types/Items/MiscItems/FormaAura",
                        "/Lotus/StoreItems/Upgrades/Skins/Necramech/MechWeapon/MechEventMausolonSkin"
                    ]
                }
            }
        );
    }

    const thermiaFracturesCycleDay = day % 32;
    const isThermiaFracturesActive = thermiaFracturesCycleDay < 14;
    if (config.worldState?.thermiaFracturesOverride ?? isThermiaFracturesActive) {
        const activeStartDay = day - thermiaFracturesCycleDay;

        const count = config.worldState?.thermiaFracturesProgressOverride ?? 0;
        const activation = config.worldState?.thermiaFracturesOverride ? 1740416400000 : getSortieTime(activeStartDay);
        const expiry = config.worldState?.thermiaFracturesOverride ? 2000000000000 : getSortieTime(activeStartDay + 14);

        worldState.Goals.push({
            _id: { $oid: "5c7cb0d00000000000000000" },
            Activation: { $date: { $numberLong: activation.toString() } },
            Expiry: { $date: { $numberLong: expiry.toString() } },
            Node: "SolNode129",
            ScoreVar: "FissuresClosed",
            ScoreLocTag: "/Lotus/Language/G1Quests/HeatFissuresEventScore",
            Count: count,
            HealthPct: count / 100,
            Regions: [1],
            Desc: "/Lotus/Language/G1Quests/HeatFissuresEventName",
            ToolTip: "/Lotus/Language/G1Quests/HeatFissuresEventDesc",
            OptionalInMission: true,
            Tag: "HeatFissure",
            UpgradeIds: [{ $oid: "5c81cefa4c4566791728eaa7" }, { $oid: "5c81cefa4c4566791728eaa6" }],
            Personal: true,
            Community: true,
            Goal: 100,
            Reward: {
                items: ["/Lotus/StoreItems/Weapons/Corpus/LongGuns/CrpBFG/Vandal/VandalCrpBFG"]
            },
            InterimGoals: [5, 25, 50, 75],
            InterimRewards: [
                { items: ["/Lotus/StoreItems/Upgrades/Skins/Clan/OrbBadgeItem"] },
                {
                    items: [
                        "/Lotus/StoreItems/Upgrades/Mods/DualSource/Shotgun/ShotgunMedicMod",
                        "/Lotus/StoreItems/Upgrades/Mods/DualSource/Rifle/SerratedRushMod"
                    ]
                },
                {
                    items: [
                        "/Lotus/StoreItems/Upgrades/Mods/DualSource/Pistol/MultishotDodgeMod",
                        "/Lotus/StoreItems/Upgrades/Mods/DualSource/Melee/CritDamageChargeSpeedMod"
                    ]
                },
                { items: ["/Lotus/StoreItems/Upgrades/Skins/Sigils/OrbSigil"] }
            ]
        });
        worldState.NodeOverrides.push({
            _id: { $oid: "5c7cb0d00000000000000000" },
            Activation: { $date: { $numberLong: activation.toString() } },
            Expiry: { $date: { $numberLong: expiry.toString() } },
            Node: "SolNode129",
            Faction: "FC_CORPUS",
            CustomNpcEncounters: ["/Lotus/Types/Gameplay/Venus/Encounters/Heists/ExploiterHeistFissure"]
        });
        if (count >= 35) {
            worldState.GlobalUpgrades.push({
                _id: { $oid: "5c81cefa4c4566791728eaa6" },
                Activation: { $date: { $numberLong: activation.toString() } },
                ExpiryDate: { $date: { $numberLong: expiry.toString() } },
                UpgradeType: "GAMEPLAY_MONEY_REWARD_AMOUNT",
                OperationType: "MULTIPLY",
                Value: 2,
                Nodes: ["SolNode129"]
            });
        }
        // Not sure about that
        if (count == 100) {
            worldState.GlobalUpgrades.push({
                _id: { $oid: "5c81cefa4c4566791728eaa7" },
                Activation: { $date: { $numberLong: activation.toString() } },
                ExpiryDate: { $date: { $numberLong: expiry.toString() } },
                UpgradeType: "GAMEPLAY_PICKUP_AMOUNT",
                OperationType: "MULTIPLY",
                Value: 2,
                Nodes: ["SolNode129"]
            });
        }
    }

    // Nightwave Challenges
    const nightwaveSyndicateTag = getNightwaveSyndicateTag(buildLabel);
    if (nightwaveSyndicateTag) {
        const nightwaveStartTimestamp = 1747851300000;
        const nightwaveSeason = nightwaveTagToSeason[nightwaveSyndicateTag];
        worldState.SeasonInfo = {
            Activation: { $date: { $numberLong: nightwaveStartTimestamp.toString() } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            AffiliationTag: nightwaveSyndicateTag,
            Season: nightwaveSeason,
            Phase: 0,
            Params: "",
            ActiveChallenges: []
        };
        const pools = getSeasonChallengePools(nightwaveSyndicateTag);
        worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(pools, day - 2));
        worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(pools, day - 1));
        worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(pools, day - 0));
        if (isBeforeNextExpectedWorldStateRefresh(timeMs, EPOCH + (day + 1) * 86400000)) {
            worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(pools, day + 1));
        }
        pushWeeklyActs(worldState.SeasonInfo.ActiveChallenges, pools, week, nightwaveStartTimestamp, nightwaveSeason);
        if (isBeforeNextExpectedWorldStateRefresh(timeMs, weekEnd)) {
            pushWeeklyActs(
                worldState.SeasonInfo.ActiveChallenges,
                pools,
                week + 1,
                nightwaveStartTimestamp,
                nightwaveSeason
            );
        }
    }

    // Elite Sanctuary Onslaught cycling every week
    worldState.NodeOverrides.find(x => x.Node == "SolNode802")!.Seed = new SRng(week).randomInt(0, 0xff_ffff);

    // Holdfast, Cavia, & Hex bounties cycling every 2.5 hours; unfaithful implementation
    let bountyCycle = Math.trunc(timeSecs / 9000);
    let bountyCycleEnd: number | undefined;
    do {
        const bountyCycleStart = bountyCycle * 9000000;
        bountyCycleEnd = bountyCycleStart + 9000000;
        worldState.SyndicateMissions.push({
            _id: { $oid: ((bountyCycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000029" },
            Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
            Tag: "ZarimanSyndicate",
            Seed: bountyCycle,
            Nodes: []
        });
        worldState.SyndicateMissions.push({
            _id: { $oid: ((bountyCycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000004" },
            Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
            Tag: "EntratiLabSyndicate",
            Seed: bountyCycle,
            Nodes: []
        });
        worldState.SyndicateMissions.push({
            _id: { $oid: ((bountyCycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000006" },
            Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
            Tag: "HexSyndicate",
            Seed: bountyCycle,
            Nodes: []
        });

        pushClassicBounties(worldState.SyndicateMissions, bountyCycle);
    } while (isBeforeNextExpectedWorldStateRefresh(timeMs, bountyCycleEnd) && ++bountyCycle);

    const ghoulsCycleDay = day % 21;
    const isGhoulEmergenceActive = ghoulsCycleDay >= 17 && ghoulsCycleDay <= 20; // 4 days for event and 17 days for break
    if (config.worldState?.ghoulEmergenceOverride ?? isGhoulEmergenceActive) {
        const ghoulPool = [...eidolonGhoulJobs];
        const pastGhoulPool = [...eidolonGhoulJobs];

        const seed = new SRng(bountyCycle).randomInt(0, 100_000);
        const pastSeed = new SRng(bountyCycle - 1).randomInt(0, 100_000);

        const rng = new SRng(seed);
        const pastRng = new SRng(pastSeed);

        const activeStartDay = day - ghoulsCycleDay + 17;
        const activeEndDay = activeStartDay + 5;
        const dayWithFraction = (timeMs - EPOCH) / 86400000;

        const progress = (dayWithFraction - activeStartDay) / (activeEndDay - activeStartDay);
        const healthPct = 1 - Math.min(Math.max(progress, 0), 1);

        worldState.Goals.push({
            _id: { $oid: "687ebbe6d1d17841c9c59f38" },
            Activation: {
                $date: {
                    $numberLong: config.worldState?.ghoulEmergenceOverride
                        ? "1753204900185"
                        : Date.UTC(
                              date.getUTCFullYear(),
                              date.getUTCMonth(),
                              date.getUTCDate() + activeStartDay
                          ).toString()
                }
            },
            Expiry: {
                $date: {
                    $numberLong: config.worldState?.ghoulEmergenceOverride
                        ? "2000000000000"
                        : Date.UTC(
                              date.getUTCFullYear(),
                              date.getUTCMonth(),
                              date.getUTCDate() + activeEndDay
                          ).toString()
                }
            },
            HealthPct: config.worldState?.ghoulEmergenceOverride ? 1 : healthPct,
            VictimNode: "SolNode228",
            Regions: [2],
            Success: 0,
            Desc: "/Lotus/Language/GameModes/RecurringGhoulAlert",
            ToolTip: "/Lotus/Language/GameModes/RecurringGhoulAlertDesc",
            Icon: "/Lotus/Interface/Icons/Categories/IconGhouls256.png",
            Tag: "GhoulEmergence",
            JobAffiliationTag: "CetusSyndicate",
            JobCurrentVersion: {
                $oid: ((bountyCycle * 9000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000008"
            },
            Jobs: [
                {
                    jobType: rng.randomElementPop(ghoulPool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/GhoulBountyTableARewards`,
                    masteryReq: 1,
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: [270, 270, 270, 400] // not faithful
                },
                {
                    jobType: rng.randomElementPop(ghoulPool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/GhoulBountyTableBRewards`,
                    masteryReq: 3,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 50,
                    xpAmounts: [480, 480, 480, 710] // not faithful
                }
            ],
            JobPreviousVersion: {
                $oid: (((bountyCycle - 1) * 9000) & 0xffffffff).toString(16).padStart(8, "0") + "0000000000000008"
            },
            PreviousJobs: [
                {
                    jobType: pastRng.randomElementPop(pastGhoulPool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/GhoulBountyTableARewards`,
                    masteryReq: 1,
                    minEnemyLevel: 15,
                    maxEnemyLevel: 25,
                    xpAmounts: [270, 270, 270, 400] // not faithful
                },
                {
                    jobType: pastRng.randomElementPop(pastGhoulPool),
                    rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/GhoulBountyTableBRewards`,
                    masteryReq: 3,
                    minEnemyLevel: 40,
                    maxEnemyLevel: 50,
                    xpAmounts: [480, 480, 480, 710] // not faithful
                }
            ]
        });
    }

    if (config.worldState?.creditBoost) {
        worldState.GlobalUpgrades.push({
            _id: { $oid: "5b23106f283a555109666672" },
            Activation: { $date: { $numberLong: "1740164400000" } },
            ExpiryDate: { $date: { $numberLong: "2000000000000" } },
            UpgradeType: "GAMEPLAY_MONEY_REWARD_AMOUNT",
            OperationType: "MULTIPLY",
            Value: 2,
            LocalizeTag: "",
            LocalizeDescTag: ""
        });
    }
    if (config.worldState?.affinityBoost) {
        worldState.GlobalUpgrades.push({
            _id: { $oid: "5b23106f283a555109666673" },
            Activation: { $date: { $numberLong: "1740164400000" } },
            ExpiryDate: { $date: { $numberLong: "2000000000000" } },
            UpgradeType: "GAMEPLAY_KILL_XP_AMOUNT",
            OperationType: "MULTIPLY",
            Value: 2,
            LocalizeTag: "",
            LocalizeDescTag: ""
        });
    }
    if (config.worldState?.resourceBoost) {
        worldState.GlobalUpgrades.push({
            _id: { $oid: "5b23106f283a555109666674" },
            Activation: { $date: { $numberLong: "1740164400000" } },
            ExpiryDate: { $date: { $numberLong: "2000000000000" } },
            UpgradeType: "GAMEPLAY_PICKUP_AMOUNT",
            OperationType: "MULTIPLY",
            Value: 2,
            LocalizeTag: "",
            LocalizeDescTag: ""
        });
    }

    // Rough outline of dynamic invasions.
    // TODO: Invasions chains, e.g. an infestation mission would soon lead to other nodes on that planet also having an infestation invasion.
    // TODO: Grineer/Corpus to fund their death stars with each invasion win.
    {
        worldState.Invasions.push(createInvasion(day, 0));
        worldState.Invasions.push(createInvasion(day, 1));
        worldState.Invasions.push(createInvasion(day, 2));

        // Completed invasions stay for up to 24 hours as the winner 'occupies' that node
        worldState.Invasions.push(createInvasion(day - 1, 0));
        worldState.Invasions.push(createInvasion(day - 1, 1));
        worldState.Invasions.push(createInvasion(day - 1, 2));
    }

    // Baro
    {
        const baroIndex = Math.trunc((Date.now() - 910800000) / (unixTimesInMs.day * 14));
        const baroStart = baroIndex * (unixTimesInMs.day * 14) + 910800000;
        const baroActualStart = baroStart + unixTimesInMs.day * (config.baroAlwaysAvailable ? 0 : 12);
        const baroEnd = baroStart + unixTimesInMs.day * 14;
        const baroNode = ["EarthHUB", "MercuryHUB", "SaturnHUB", "PlutoHUB"][baroIndex % 4];
        const vt: IVoidTrader = {
            _id: { $oid: ((baroStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "493c96d6067610bc" },
            Activation: { $date: { $numberLong: baroActualStart.toString() } },
            Expiry: { $date: { $numberLong: baroEnd.toString() } },
            Character: "Baro'Ki Teel",
            Node: baroNode,
            Manifest: []
        };
        worldState.VoidTraders.push(vt);
        if (isBeforeNextExpectedWorldStateRefresh(timeMs, baroActualStart)) {
            if (config.baroFullyStocked) {
                fullyStockBaro(vt);
            } else {
                const rng = new SRng(new SRng(baroIndex).randomInt(0, 100_000));
                // TOVERIFY: Constraint for upgrades amount?
                // TOVERIFY: Constraint for weapon amount?
                // TOVERIFY: Constraint for relics amount?
                let armorSet = rng.randomElement(baro.armorSets)!;
                if (Array.isArray(armorSet[0])) {
                    armorSet = rng.randomElement(baro.armorSets)!;
                }
                while (vt.Manifest.length + armorSet.length < 31) {
                    const item = rng.randomElement(baro.rest)!;
                    if (vt.Manifest.indexOf(item) == -1) {
                        const set = baro.allIfAny.find(set => set.indexOf(item.ItemType) != -1);
                        if (set) {
                            for (const itemType of set) {
                                vt.Manifest.push(baro.rest.find(x => x.ItemType == itemType)!);
                            }
                        } else {
                            vt.Manifest.push(item);
                        }
                    }
                }
                const overflow = 31 - (vt.Manifest.length + armorSet.length);
                if (overflow > 0) {
                    vt.Manifest.splice(0, overflow);
                }
                for (const armor of armorSet) {
                    vt.Manifest.push(armor as IVoidTraderOffer);
                }
            }
            for (const item of baro.evergreen) {
                vt.Manifest.push(item);
            }
        }
    }

    // Varzia
    {
        const pt: IPrimeVaultTrader = {
            _id: { $oid: ((weekStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "c36af423770eaa97" },
            Activation: { $date: { $numberLong: weekStart.toString() } },
            InitialStartDate: { $date: { $numberLong: "1662738144266" } },
            Node: "TradeHUB1",
            Manifest: [],
            Expiry: { $date: { $numberLong: weekEnd.toString() } },
            EvergreenManifest: varzia.evergreen,
            ScheduleInfo: []
        };
        worldState.PrimeVaultTraders.push(pt);
        const rotation = config.worldState?.varziaOverride || getVarziaRotation(week);
        pt.Manifest = config.worldState?.varziaFullyStocked ? getAllVarziaManifests() : getVarziaManifest(rotation);
        if (config.worldState?.varziaOverride || config.worldState?.varziaFullyStocked) {
            pt.Expiry = { $date: { $numberLong: "2000000000000" } };
        } else {
            pt.ScheduleInfo.push({
                Expiry: { $date: { $numberLong: (weekEnd + unixTimesInMs.week).toString() } },
                FeaturedItem: getVarziaRotation(week + 1)
            });
        }
    }

    // Sortie & syndicate missions cycling every day (at 16:00 or 17:00 UTC depending on if London, OT is observing DST)
    {
        const rollover = getSortieTime(day);

        if (timeMs < rollover) {
            worldState.Sorties.push(getSortie(day - 1));
        }
        if (isBeforeNextExpectedWorldStateRefresh(timeMs, rollover)) {
            worldState.Sorties.push(getSortie(day));
        }

        // The client does not seem to respect activation for classic syndicate missions, so only pushing current ones.
        const sdy = timeMs >= rollover ? day : day - 1;
        const rng = new SRng(sdy);
        pushSyndicateMissions(worldState, sdy, rng.randomInt(0, 100_000), "ba6f84724fa48049", "ArbitersSyndicate");
        pushSyndicateMissions(worldState, sdy, rng.randomInt(0, 100_000), "ba6f84724fa4804a", "CephalonSudaSyndicate");
        pushSyndicateMissions(worldState, sdy, rng.randomInt(0, 100_000), "ba6f84724fa4804e", "NewLokaSyndicate");
        pushSyndicateMissions(worldState, sdy, rng.randomInt(0, 100_000), "ba6f84724fa48050", "PerrinSyndicate");
        pushSyndicateMissions(worldState, sdy, rng.randomInt(0, 100_000), "ba6f84724fa4805e", "RedVeilSyndicate");
        pushSyndicateMissions(worldState, sdy, rng.randomInt(0, 100_000), "ba6f84724fa48061", "SteelMeridianSyndicate");
    }

    {
        const conclaveDayStart = EPOCH + day * unixTimesInMs.day + 5 * unixTimesInMs.hour + 30 * unixTimesInMs.minute;
        const conclaveDayEnd = conclaveDayStart + unixTimesInMs.day;
        const conclaveWeekStart = weekStart + 40 * unixTimesInMs.minute - 2 * unixTimesInMs.day;
        const conclaveWeekEnd = conclaveWeekStart + unixTimesInMs.week;

        pushConclaveWeakly(worldState.PVPChallengeInstances, week);
        pushConclaveDailys(worldState.PVPChallengeInstances, day);

        if (isBeforeNextExpectedWorldStateRefresh(timeMs, conclaveDayEnd)) {
            pushConclaveDailys(worldState.PVPChallengeInstances, day + 1);
        }
        if (isBeforeNextExpectedWorldStateRefresh(timeMs, conclaveWeekEnd)) {
            pushConclaveWeakly(worldState.PVPChallengeInstances, week + 1);
        }
    }

    // Archon Hunt cycling every week
    worldState.LiteSorties.push(getLiteSortie(week));
    if (isBeforeNextExpectedWorldStateRefresh(timeMs, weekEnd)) {
        worldState.LiteSorties.push(getLiteSortie(week + 1));
    }

    // Circuit choices cycling every week
    worldState.EndlessXpChoices.push({
        Category: "EXC_NORMAL",
        Choices: [
            ["Nidus", "Octavia", "Harrow"],
            ["Gara", "Khora", "Revenant"],
            ["Garuda", "Baruuk", "Hildryn"],
            ["Excalibur", "Trinity", "Ember"],
            ["Loki", "Mag", "Rhino"],
            ["Ash", "Frost", "Nyx"],
            ["Saryn", "Vauban", "Nova"],
            ["Nekros", "Valkyr", "Oberon"],
            ["Hydroid", "Mirage", "Limbo"],
            ["Mesa", "Chroma", "Atlas"],
            ["Ivara", "Inaros", "Titania"]
        ][week % 11]
    });
    worldState.EndlessXpChoices.push({
        Category: "EXC_HARD",
        Choices: [
            ["Boar", "Gammacor", "Angstrum", "Gorgon", "Anku"],
            ["Bo", "Latron", "Furis", "Furax", "Strun"],
            ["Lex", "Magistar", "Boltor", "Bronco", "CeramicDagger"],
            ["Torid", "DualToxocyst", "DualIchor", "Miter", "Atomos"],
            ["AckAndBrunt", "Soma", "Vasto", "NamiSolo", "Burston"],
            ["Zylok", "Sibear", "Dread", "Despair", "Hate"],
            ["Dera", "Sybaris", "Cestra", "Sicarus", "Okina"],
            ["Braton", "Lato", "Skana", "Paris", "Kunai"]
        ][week % 8]
    });

    // 1999 Calendar Season cycling every week + YearIteration every 4 weeks
    worldState.KnownCalendarSeasons.push(getCalendarSeason(week));
    if (isBeforeNextExpectedWorldStateRefresh(timeMs, weekEnd)) {
        worldState.KnownCalendarSeasons.push(getCalendarSeason(week + 1));
    }

    // Void Storms
    const hour = Math.trunc(timeMs / unixTimesInMs.hour);
    const overLastHourStormExpiry = hour * unixTimesInMs.hour + 10 * unixTimesInMs.minute;
    const thisHourStormActivation = hour * unixTimesInMs.hour + 40 * unixTimesInMs.minute;
    if (overLastHourStormExpiry > timeMs) {
        pushVoidStorms(worldState.VoidStorms, hour - 2);
    }
    pushVoidStorms(worldState.VoidStorms, hour - 1);
    if (isBeforeNextExpectedWorldStateRefresh(timeMs, thisHourStormActivation)) {
        pushVoidStorms(worldState.VoidStorms, hour);
    }

    // Sentient Anomaly + Xtra Cheese cycles
    const halfHour = Math.trunc(timeMs / (unixTimesInMs.hour / 2));
    const hourInSeconds = 3600;
    const cheeseInterval = hourInSeconds * 8;
    const cheeseDuration = hourInSeconds * 2;
    const cheeseIndex = Math.trunc(timeSecs / cheeseInterval);
    let cheeseStart = cheeseIndex * cheeseInterval;
    let cheeseEnd = cheeseStart + cheeseDuration;
    let cheeseNext = (cheeseIndex + 1) * cheeseInterval;
    // Live servers only update the start time once it happens, which makes the
    // client show a negative countdown during off-hours. Optionally adjust the
    // times so the next activation is always in the future.
    if (config.unfaithfulBugFixes?.fixXtraCheeseTimer && timeSecs >= cheeseEnd) {
        cheeseStart = cheeseNext;
        cheeseEnd = cheeseStart + cheeseDuration;
        cheeseNext += cheeseInterval;
    }
    const tmp: ITmp = {
        cavabegin: "1690761600",
        PurchasePlatformLockEnabled: true,
        pgr: {
            ts: "1732572900",
            en: "CUSTOM DECALS @ ZEVILA",
            fr: "DECALS CUSTOM @ ZEVILA",
            it: "DECALCOMANIE PERSONALIZZATE @ ZEVILA",
            de: "AUFKLEBER NACH WUNSCH @ ZEVILA",
            es: "CALCOMANÍAS PERSONALIZADAS @ ZEVILA",
            pt: "DECALQUES PERSONALIZADOS NA ZEVILA",
            ru: "ПОЛЬЗОВАТЕЛЬСКИЕ НАКЛЕЙКИ @ ЗеВиЛа",
            pl: "NOWE NAKLEJKI @ ZEVILA",
            uk: "КОРИСТУВАЦЬКІ ДЕКОЛІ @ ЗІВІЛА",
            tr: "ÖZEL ÇIKARTMALAR @ ZEVILA",
            ja: "カスタムデカール @ ゼビラ",
            zh: "定制贴花认准泽威拉",
            ko: "커스텀 데칼 @ ZEVILA",
            tc: "自訂貼花 @ ZEVILA",
            th: "รูปลอกสั่งทำที่ ZEVILA"
        },
        ennnd: true,
        mbrt: true,
        fbst: {
            a: cheeseStart,
            e: cheeseEnd,
            n: cheeseNext
        },
        sfn: [550, 553, 554, 555][halfHour % 4]
    };
    if (Array.isArray(config.worldState?.circuitGameModes)) {
        tmp.edg = config.worldState.circuitGameModes as TCircuitGameMode[];
    }
    worldState.Tmp = JSON.stringify(tmp);

    return worldState;
};

export const populateFissures = async (worldState: IWorldState): Promise<void> => {
    if (config.worldState?.allTheFissures) {
        let i = 0;
        for (const [tier, nodes] of Object.entries(fissureMissions)) {
            for (const node of nodes) {
                const meta = ExportRegions[node];
                worldState.ActiveMissions.push({
                    _id: { $oid: (i++).toString().padStart(8, "0") + "8e0c70ba050f1eb7" },
                    Region: meta.systemIndex + 1,
                    Seed: 1337,
                    Activation: { $date: { $numberLong: "1000000000000" } },
                    Expiry: { $date: { $numberLong: "2000000000000" } },
                    Node: node,
                    MissionType: eMissionType[meta.missionIndex].tag,
                    Modifier: tier,
                    Hard: config.worldState.allTheFissures == "hard"
                });
            }
        }
    } else {
        const fissures = await Fissure.find({});
        for (const fissure of fissures) {
            const meta = ExportRegions[fissure.Node];
            worldState.ActiveMissions.push({
                _id: toOid(fissure._id),
                Region: meta.systemIndex + 1,
                Seed: 1337,
                Activation:
                    fissure.Activation.getTime() < Date.now() // Activation is in the past?
                        ? { $date: { $numberLong: "1000000000000" } } // Let the client know 'explicitly' to avoid interference from time constraints.
                        : toMongoDate(fissure.Activation),
                Expiry: toMongoDate(fissure.Expiry),
                Node: fissure.Node,
                MissionType: eMissionType[meta.missionIndex].tag,
                Modifier: fissure.Modifier,
                Hard: fissure.Hard
            });
        }
    }
};

export const populateDailyDeal = async (worldState: IWorldState): Promise<void> => {
    const dailyDeals = await DailyDeal.find({});
    for (const dailyDeal of dailyDeals) {
        if (dailyDeal.Expiry.getTime() > Date.now()) {
            worldState.DailyDeals.push({
                StoreItem: dailyDeal.StoreItem,
                Activation: toMongoDate(dailyDeal.Activation),
                Expiry: toMongoDate(dailyDeal.Expiry),
                Discount: dailyDeal.Discount,
                OriginalPrice: dailyDeal.OriginalPrice,
                SalePrice: dailyDeal.SalePrice,
                AmountTotal: Math.round(dailyDeal.AmountTotal * (config.worldState?.darvoStockMultiplier ?? 1)),
                AmountSold: dailyDeal.AmountSold
            });
        }
    }
};

export const idToBountyCycle = (id: string): number => {
    return Math.trunc((parseInt(id.substring(0, 8), 16) * 1000) / 9000_000);
};

export const idToDay = (id: string): number => {
    return Math.trunc((parseInt(id.substring(0, 8), 16) * 1000 - EPOCH) / 86400_000);
};

export const idToWeek = (id: string): number => {
    return Math.trunc((parseInt(id.substring(0, 8), 16) * 1000 - EPOCH) / 604800_000);
};

export const getLiteSortie = (week: number): ILiteSortie => {
    const boss = (["SORTIE_BOSS_AMAR", "SORTIE_BOSS_NIRA", "SORTIE_BOSS_BOREAL"] as const)[week % 3];
    const showdownNode = ["SolNode99", "SolNode53", "SolNode24"][week % 3];
    const systemIndex = [3, 4, 2][week % 3]; // Mars, Jupiter, Earth

    const nodes: string[] = [];
    for (const [key, value] of Object.entries(ExportRegions)) {
        if (
            value.systemIndex === systemIndex &&
            value.factionIndex !== undefined &&
            value.factionIndex < 2 &&
            !isArchwingMission(value) &&
            value.missionIndex != 0 && // Exclude MT_ASSASSINATION
            value.missionIndex != 23 && // Exclude junctions
            value.missionIndex != 28 && // Exclude open worlds
            value.missionIndex != 32 // Exclude railjack
        ) {
            nodes.push(key);
        }
    }

    const seed = new SRng(week).randomInt(0, 100_000);
    const rng = new SRng(seed);
    const firstNodeIndex = rng.randomInt(0, nodes.length - 1);
    const firstNode = nodes[firstNodeIndex];
    nodes.splice(firstNodeIndex, 1);

    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    return {
        _id: {
            $oid: ((weekStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "5e23a244740a190c"
        },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Reward: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards",
        Seed: seed,
        Boss: boss,
        Missions: [
            {
                missionType: rng.randomElement([
                    "MT_INTEL",
                    "MT_MOBILE_DEFENSE",
                    "MT_EXTERMINATION",
                    "MT_SABOTAGE",
                    "MT_RESCUE"
                ])!,
                node: firstNode
            },
            {
                missionType: rng.randomElement([
                    "MT_DEFENSE",
                    "MT_TERRITORY",
                    "MT_ARTIFACT",
                    "MT_EXCAVATE",
                    "MT_SURVIVAL"
                ])!,
                node: rng.randomElement(nodes)!
            },
            {
                missionType: "MT_ASSASSINATION",
                node: showdownNode
            }
        ]
    };
};

export const isArchwingMission = (node: IRegion): boolean => {
    if (node.name.indexOf("Archwing") != -1) {
        return true;
    }
    // SettlementNode10
    if (node.missionIndex == 25) {
        return true;
    }
    return false;
};

export const getNightwaveSyndicateTag = (buildLabel: string | undefined): string | undefined => {
    if (config.worldState?.nightwaveOverride) {
        if (config.worldState.nightwaveOverride in nightwaveTagToSeason) {
            return config.worldState.nightwaveOverride;
        }
        logger.warn(`ignoring invalid config value for worldState.nightwaveOverride`, {
            value: config.worldState.nightwaveOverride,
            valid_values: Object.keys(nightwaveTagToSeason)
        });
    }
    if (!buildLabel || version_compare(buildLabel, "2025.05.20.10.18") >= 0) {
        return "RadioLegionIntermission13Syndicate";
    }
    if (version_compare(buildLabel, "2025.02.05.11.19") >= 0) {
        return "RadioLegionIntermission12Syndicate";
    }
    return undefined;
};

const nightwaveTagToSeason: Record<string, number> = {
    RadioLegionIntermission13Syndicate: 15, // Nora's Mix Vol. 9
    RadioLegionIntermission12Syndicate: 14, // Nora's Mix Vol. 8
    RadioLegionIntermission11Syndicate: 13, // Nora's Mix Vol. 7
    RadioLegionIntermission10Syndicate: 12, // Nora's Mix Vol. 6
    RadioLegionIntermission9Syndicate: 11, // Nora's Mix Vol. 5
    RadioLegionIntermission8Syndicate: 10, // Nora's Mix Vol. 4
    RadioLegionIntermission7Syndicate: 9, // Nora's Mix Vol. 3
    RadioLegionIntermission6Syndicate: 8, // Nora's Mix Vol. 2
    RadioLegionIntermission5Syndicate: 7, // Nora's Mix Vol. 1
    RadioLegionIntermission4Syndicate: 6, // Nora's Choice
    RadioLegionIntermission3Syndicate: 5, // Intermission III
    RadioLegion3Syndicate: 4, // Glassmaker
    RadioLegionIntermission2Syndicate: 3, // Intermission II
    RadioLegion2Syndicate: 2, // The Emissary
    RadioLegionIntermissionSyndicate: 1, // Intermission I
    RadioLegionSyndicate: 0 // The Wolf of Saturn Six
};

const updateFissures = async (): Promise<void> => {
    const fissures = await Fissure.find();

    const activeNodes = new Set<string>();
    const tierToFurthestExpiry: Record<string, number> = {
        VoidT1: 0,
        VoidT2: 0,
        VoidT3: 0,
        VoidT4: 0,
        VoidT5: 0,
        VoidT6: 0,
        VoidT1Hard: 0,
        VoidT2Hard: 0,
        VoidT3Hard: 0,
        VoidT4Hard: 0,
        VoidT5Hard: 0,
        VoidT6Hard: 0
    };
    for (const fissure of fissures) {
        activeNodes.add(fissure.Node);

        const key = fissure.Modifier + (fissure.Hard ? "Hard" : "");
        tierToFurthestExpiry[key] = Math.max(tierToFurthestExpiry[key], fissure.Expiry.getTime());
    }

    const deadline = Date.now() - 6 * unixTimesInMs.minute;
    for (const [tier, expiry] of Object.entries(tierToFurthestExpiry)) {
        if (expiry < deadline) {
            const numFissures = getRandomInt(1, 3);
            for (let i = 0; i != numFissures; ++i) {
                const modifier = tier.replace("Hard", "") as
                    | "VoidT1"
                    | "VoidT2"
                    | "VoidT3"
                    | "VoidT4"
                    | "VoidT5"
                    | "VoidT6";
                let node: string;
                do {
                    node = getRandomElement(fissureMissions[modifier])!;
                } while (activeNodes.has(node));
                activeNodes.add(node);
                await Fissure.insertOne({
                    Activation: new Date(),
                    Expiry: new Date(Date.now() + getRandomInt(60, 120) * unixTimesInMs.minute),
                    Node: node,
                    Modifier: modifier,
                    Hard: tier.indexOf("Hard") != -1 ? true : undefined
                });
            }
        }
    }
};

const updateDailyDeal = async (): Promise<void> => {
    let darvoIndex = Math.trunc((Date.now() - 25200000) / (26 * unixTimesInMs.hour));
    let darvoEnd;
    do {
        const darvoStart = darvoIndex * (26 * unixTimesInMs.hour) + 25200000;
        darvoEnd = darvoStart + 26 * unixTimesInMs.hour;
        const darvoOid = ((darvoStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") + "adc51a72f7324d95";
        if (!(await DailyDeal.findById(darvoOid))) {
            const seed = new SRng(darvoIndex).randomInt(0, 100_000);
            const rng = new SRng(seed);
            let deal;
            do {
                deal = rng.randomReward(darvoDeals)!; // Using an actual sampling collected over roughly a year because I can't extrapolate an algorithm from it with enough certainty.
                //const [storeItem, meta] = rng.randomElement(Object.entries(darvoDeals))!;
                //const discount = Math.min(rng.randomInt(1, 9) * 10, (meta as { MaxDiscount?: number }).MaxDiscount ?? 1);
            } while (await DailyDeal.exists({ StoreItem: deal.StoreItem }));
            await DailyDeal.insertOne({
                _id: darvoOid,
                StoreItem: deal.StoreItem,
                Activation: new Date(darvoStart),
                Expiry: new Date(darvoEnd),
                Discount: deal.Discount,
                OriginalPrice: deal.OriginalPrice,
                SalePrice: deal.SalePrice, //Math.trunc(deal.OriginalPrice * (1 - discount))
                AmountTotal: deal.AmountTotal,
                AmountSold: 0
            });
        }
    } while (darvoEnd < Date.now() + 6 * unixTimesInMs.minute && ++darvoIndex);
};

export const updateWorldStateCollections = async (): Promise<void> => {
    await Promise.all([updateFissures(), updateDailyDeal()]);
};

const pushConclaveDaily = (
    activeChallenges: IPVPChallengeInstance[],
    PVPMode: string,
    pool: {
        key: string;
        ScriptParamValue: number;
        PVPModeAllowed: string[];
        SyndicateXP: number;
        DuringSingleMatch?: boolean;
    }[],
    day: number,
    id: number
): void => {
    const conclaveDayStart = EPOCH + day * unixTimesInMs.day + 5 * unixTimesInMs.hour + 30 * unixTimesInMs.minute;
    const conclaveDayEnd = conclaveDayStart + unixTimesInMs.day;
    const challengeId = day * 8 + id;
    const rng = new SRng(new SRng(challengeId).randomInt(0, 100_000));
    let challenge: {
        key: string;
        ScriptParamValue: number;
        PVPModeAllowed?: string[];
        SyndicateXP?: number;
        DuringSingleMatch?: boolean;
    };
    do {
        challenge = rng.randomElement(pool)!;
    } while (
        activeChallenges.some(x => x.challengeTypeRefID == challenge.key) &&
        activeChallenges.some(x => x.PVPMode == PVPMode)
    );
    activeChallenges.push({
        _id: {
            $oid: "689ec5d985b55902" + challengeId.toString().padStart(8, "0")
        },
        challengeTypeRefID: challenge.key,
        startDate: { $date: { $numberLong: conclaveDayStart.toString() } },
        endDate: { $date: { $numberLong: conclaveDayEnd.toString() } },
        params: [{ n: "ScriptParamValue", v: challenge.ScriptParamValue }],
        isGenerated: true,
        PVPMode,
        subChallenges: [],
        Category: "PVPChallengeTypeCategory_DAILY"
    });
};

const pushConclaveDailys = (activeChallenges: IPVPChallengeInstance[], day: number): void => {
    const modes = [
        "PVPMODE_SPEEDBALL",
        "PVPMODE_CAPTURETHEFLAG",
        "PVPMODE_DEATHMATCH",
        "PVPMODE_TEAMDEATHMATCH"
    ] as const;

    const challengesMap: Record<
        string,
        {
            key: string;
            ScriptParamValue: number;
            PVPModeAllowed: string[];
            SyndicateXP: number;
            DuringSingleMatch?: boolean;
        }[]
    > = {};

    for (const mode of modes) {
        challengesMap[mode] = Object.entries(pvpChallenges)
            .filter(([_, challenge]) => challenge.PVPModeAllowed.includes(mode))
            .map(([key, challenge]) => ({ key, ...challenge }));
    }

    modes.forEach((mode, index) => {
        pushConclaveDaily(activeChallenges, mode, challengesMap[mode], day, index * 2);
        pushConclaveDaily(activeChallenges, mode, challengesMap[mode], day, index * 2 + 1);
    });
};

const pushConclaveWeakly = (activeChallenges: IPVPChallengeInstance[], week: number): void => {
    const weekStart = EPOCH + week * unixTimesInMs.week;
    const conclaveWeekStart = weekStart + 40 * unixTimesInMs.minute - 2 * unixTimesInMs.day;
    const conclaveWeekEnd = conclaveWeekStart + unixTimesInMs.week;
    const conclaveIdStart = ((conclaveWeekStart / 1000) & 0xffffffff).toString(16).padStart(8, "0").padEnd(23, "0");
    activeChallenges.push(
        {
            _id: { $oid: conclaveIdStart + "1" },
            challengeTypeRefID: "/Lotus/PVPChallengeTypes/PVPTimedChallengeGameModeWins",
            startDate: { $date: { $numberLong: conclaveWeekStart.toString() } },
            endDate: { $date: { $numberLong: conclaveWeekEnd.toString() } },
            params: [{ n: "ScriptParamValue", v: 6 }],
            isGenerated: true,
            PVPMode: "PVPMODE_ALL",
            subChallenges: [],
            Category: "PVPChallengeTypeCategory_WEEKLY"
        },
        {
            _id: { $oid: conclaveIdStart + "2" },
            challengeTypeRefID: "/Lotus/PVPChallengeTypes/PVPTimedChallengeGameModeComplete",
            startDate: { $date: { $numberLong: conclaveWeekStart.toString() } },
            endDate: { $date: { $numberLong: conclaveWeekEnd.toString() } },
            params: [{ n: "ScriptParamValue", v: 20 }],
            isGenerated: true,
            PVPMode: "PVPMODE_ALL",
            subChallenges: [],
            Category: "PVPChallengeTypeCategory_WEEKLY"
        },
        {
            _id: { $oid: conclaveIdStart + "3" },
            challengeTypeRefID: "/Lotus/PVPChallengeTypes/PVPTimedChallengeOtherChallengeCompleteANY",
            startDate: { $date: { $numberLong: conclaveWeekStart.toString() } },
            endDate: { $date: { $numberLong: conclaveWeekEnd.toString() } },
            params: [{ n: "ScriptParamValue", v: 10 }],
            isGenerated: true,
            PVPMode: "PVPMODE_ALL",
            subChallenges: [],
            Category: "PVPChallengeTypeCategory_WEEKLY"
        },
        {
            _id: { $oid: conclaveIdStart + "4" },
            challengeTypeRefID: "/Lotus/PVPChallengeTypes/PVPTimedChallengeWeeklyStandardSet",
            startDate: { $date: { $numberLong: conclaveWeekStart.toString() } },
            endDate: { $date: { $numberLong: conclaveWeekEnd.toString() } },
            params: [{ n: "ScriptParamValue", v: 0 }],
            isGenerated: true,
            PVPMode: "PVPMODE_NONE",
            subChallenges: [
                { $oid: conclaveIdStart + "1" },
                { $oid: conclaveIdStart + "2" },
                { $oid: conclaveIdStart + "3" }
            ],
            Category: "PVPChallengeTypeCategory_WEEKLY_ROOT"
        }
    );
};
