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
import { buildConfig } from "@/src/services/buildConfigService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { config } from "@/src/services/configService";
import { getRandomElement, getRandomInt, sequentiallyUniqueRandomElement, SRng } from "@/src/services/rngService";
import { eMissionType, ExportRegions, ExportSyndicates, IMissionReward, IRegion } from "warframe-public-export-plus";
import {
    ICalendarDay,
    ICalendarEvent,
    ICalendarSeason,
    IInvasion,
    ILiteSortie,
    IPrimeVaultTrader,
    IPrimeVaultTraderOffer,
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
        GlobalUpgrades: [],
        Invasions: [],
        VoidTraders: [],
        PrimeVaultTraders: [],
        VoidStorms: [],
        DailyDeals: [],
        EndlessXpChoices: [],
        KnownCalendarSeasons: [],
        ...staticWorldState,
        SyndicateMissions: [...staticWorldState.SyndicateMissions]
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
            Node: "EventNode28",
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
        ][week % 12]
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
