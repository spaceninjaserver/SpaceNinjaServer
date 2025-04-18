import staticWorldState from "@/static/fixed_responses/worldState/worldState.json";
import { buildConfig } from "@/src/services/buildConfigService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { config } from "@/src/services/configService";
import { CRng } from "@/src/services/rngService";
import { eMissionType, ExportNightwave, ExportRegions } from "warframe-public-export-plus";
import {
    ICalendarDay,
    ICalendarSeason,
    ILiteSortie,
    ISeasonChallenge,
    ISortie,
    IWorldState
} from "../types/worldStateTypes";

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
];

const sortieBossToFaction: Record<string, string> = {
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
    SORTIE_BOSS_CORRUPTED_VOR: "FC_CORRUPTED"
};

const sortieFactionToSystemIndexes: Record<string, number[]> = {
    FC_GRINEER: [0, 2, 3, 5, 6, 9, 11, 18],
    FC_CORPUS: [1, 4, 7, 8, 12, 15],
    FC_INFESTATION: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15],
    FC_CORRUPTED: [14]
};

const sortieFactionToFactionIndexes: Record<string, number[]> = {
    FC_GRINEER: [0],
    FC_CORPUS: [1],
    FC_INFESTATION: [0, 1, 2],
    FC_CORRUPTED: [3]
};

const sortieBossNode: Record<string, string> = {
    SORTIE_BOSS_HYENA: "SolNode127",
    SORTIE_BOSS_KELA: "SolNode193",
    SORTIE_BOSS_VOR: "SolNode108",
    SORTIE_BOSS_RUK: "SolNode32",
    SORTIE_BOSS_HEK: "SolNode24",
    SORTIE_BOSS_KRIL: "SolNode99",
    SORTIE_BOSS_TYL: "SolNode105",
    SORTIE_BOSS_JACKAL: "SolNode104",
    SORTIE_BOSS_ALAD: "SolNode53",
    SORTIE_BOSS_AMBULAS: "SolNode51",
    SORTIE_BOSS_NEF: "SettlementNode20",
    SORTIE_BOSS_RAPTOR: "SolNode210",
    SORTIE_BOSS_LEPHANTIS: "SolNode712",
    SORTIE_BOSS_INFALAD: "SolNode705"
};

const eidolonJobs = [
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

const eidolonNarmerJobs = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AssassinateBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AttritionBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/ReclamationBountyTheft",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AttritionBountyLib"
];

const venusJobs = [
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

const venusNarmerJobs = [
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusCullJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusCullJobExterminate",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusPreservationJobDefense",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusTheftJobExcavation"
];

const microplanetJobs = [
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosAreaDefenseBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosAssassinateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosCrpSurvivorBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosGrnSurvivorBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosKeyPiecesBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosExcavateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosPurifyBounty"
];

const microplanetEndlessJobs = [
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndlessAreaDefenseBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndlessExcavateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndlessPurifyBounty"
];

const EPOCH = 1734307200 * 1000; // Monday, Dec 16, 2024 @ 00:00 UTC+0; should logically be winter in 1999 iteration 0

const isBeforeNextExpectedWorldStateRefresh = (date: number): boolean => {
    return Date.now() + 300_000 > date;
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

const pushSortieIfRelevant = (out: ISortie[], day: number): void => {
    const dayStart = getSortieTime(day);
    if (!isBeforeNextExpectedWorldStateRefresh(dayStart)) {
        return;
    }
    const dayEnd = getSortieTime(day + 1);
    if (Date.now() >= dayEnd) {
        return;
    }

    const rng = new CRng(day);

    const boss = rng.randomElement(sortieBosses);

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
        "SORTIE_MODIFIER_GAS",
        "SORTIE_MODIFIER_FIRE",
        "SORTIE_MODIFIER_EXPLOSION",
        "SORTIE_MODIFIER_FREEZE",
        "SORTIE_MODIFIER_TOXIN",
        "SORTIE_MODIFIER_POISON",
        "SORTIE_MODIFIER_HAZARD_RADIATION",
        "SORTIE_MODIFIER_HAZARD_MAGNETIC",
        "SORTIE_MODIFIER_HAZARD_FOG", // TODO: push this if the mission tileset is Grineer Forest
        "SORTIE_MODIFIER_HAZARD_FIRE", // TODO: push this if the mission tileset is Corpus Ship or Grineer Galleon
        "SORTIE_MODIFIER_HAZARD_ICE",
        "SORTIE_MODIFIER_HAZARD_COLD",
        "SORTIE_MODIFIER_SECONDARY_ONLY",
        "SORTIE_MODIFIER_SHOTGUN_ONLY",
        "SORTIE_MODIFIER_SNIPER_ONLY",
        "SORTIE_MODIFIER_RIFLE_ONLY",
        "SORTIE_MODIFIER_MELEE_ONLY",
        "SORTIE_MODIFIER_BOW_ONLY"
    ];

    if (sortieBossToFaction[boss] == "FC_CORPUS") modifiers.push("SORTIE_MODIFIER_SHIELDS");
    if (sortieBossToFaction[boss] != "FC_CORPUS") modifiers.push("SORTIE_MODIFIER_ARMOR");

    const nodes: string[] = [];
    const availableMissionIndexes: number[] = [];
    for (const [key, value] of Object.entries(ExportRegions)) {
        if (
            sortieFactionToSystemIndexes[sortieBossToFaction[boss]].includes(value.systemIndex) &&
            sortieFactionToFactionIndexes[sortieBossToFaction[boss]].includes(value.factionIndex!) &&
            value.name.indexOf("Archwing") == -1 &&
            value.missionIndex != 0 && // Exclude MT_ASSASSINATION
            value.missionIndex != 5 && // Exclude MT_CAPTURE
            value.missionIndex != 21 && // Exclude MT_PURIFY
            value.missionIndex != 23 && // Exclude MT_JUNCTION
            value.missionIndex <= 28
        ) {
            if (!availableMissionIndexes.includes(value.missionIndex)) {
                availableMissionIndexes.push(value.missionIndex);
            }
            nodes.push(key);
        }
    }

    const selectedNodes: { missionType: string; modifierType: string; node: string }[] = [];
    const missionTypes = new Set();

    for (let i = 0; i < 3; i++) {
        const randomIndex = rng.randomInt(0, nodes.length - 1);
        const node = nodes[randomIndex];
        let missionIndex = ExportRegions[node].missionIndex;

        if (
            !["SolNode404", "SolNode411"].includes(node) && // for some reason the game doesn't like missionType changes for these missions
            missionIndex != 28 &&
            rng.randomInt(0, 2) == 2
        ) {
            missionIndex = rng.randomElement(availableMissionIndexes);
        }

        if (i == 2 && rng.randomInt(0, 2) == 2) {
            const filteredModifiers = modifiers.filter(mod => mod !== "SORTIE_MODIFIER_MELEE_ONLY");
            const modifierType = rng.randomElement(filteredModifiers);

            if (boss == "SORTIE_BOSS_PHORID") {
                selectedNodes.push({ missionType: "MT_ASSASSINATION", modifierType, node });
                nodes.splice(randomIndex, 1);
                continue;
            } else if (sortieBossNode[boss]) {
                selectedNodes.push({ missionType: "MT_ASSASSINATION", modifierType, node: sortieBossNode[boss] });
                continue;
            }
        }

        const missionType = eMissionType[missionIndex].tag;

        if (missionTypes.has(missionType)) {
            i--;
            continue;
        }

        const filteredModifiers =
            missionType === "MT_TERRITORY"
                ? modifiers.filter(mod => mod != "SORTIE_MODIFIER_HAZARD_RADIATION")
                : modifiers;

        const modifierType = rng.randomElement(filteredModifiers);

        selectedNodes.push({ missionType, modifierType, node });
        nodes.splice(randomIndex, 1);
        missionTypes.add(missionType);
    }

    out.push({
        _id: { $oid: Math.trunc(dayStart / 1000).toString(16) + "d4d932c97c0a3acd" },
        Activation: { $date: { $numberLong: dayStart.toString() } },
        Expiry: { $date: { $numberLong: dayEnd.toString() } },
        Reward: "/Lotus/Types/Game/MissionDecks/SortieRewards",
        Seed: day,
        Boss: boss,
        Variants: selectedNodes
    });
};

const dailyChallenges = Object.keys(ExportNightwave.challenges).filter(x =>
    x.startsWith("/Lotus/Types/Challenges/Seasons/Daily/")
);

const getSeasonDailyChallenge = (day: number): ISeasonChallenge => {
    const dayStart = EPOCH + day * 86400000;
    const dayEnd = EPOCH + (day + 3) * 86400000;
    const rng = new CRng(day);
    return {
        _id: { $oid: "67e1b5ca9d00cb47" + day.toString().padStart(8, "0") },
        Daily: true,
        Activation: { $date: { $numberLong: dayStart.toString() } },
        Expiry: { $date: { $numberLong: dayEnd.toString() } },
        Challenge: rng.randomElement(dailyChallenges)
    };
};

const weeklyChallenges = Object.keys(ExportNightwave.challenges).filter(
    x =>
        x.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/") &&
        !x.startsWith("/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanent")
);

const getSeasonWeeklyChallenge = (week: number, id: number): ISeasonChallenge => {
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    const challengeId = week * 7 + id;
    const rng = new CRng(challengeId);
    return {
        _id: { $oid: "67e1bb2d9d00cb47" + challengeId.toString().padStart(8, "0") },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Challenge: rng.randomElement(weeklyChallenges)
    };
};

const weeklyHardChallenges = Object.keys(ExportNightwave.challenges).filter(x =>
    x.startsWith("/Lotus/Types/Challenges/Seasons/WeeklyHard/")
);

const getSeasonWeeklyHardChallenge = (week: number, id: number): ISeasonChallenge => {
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    const challengeId = week * 7 + id;
    const rng = new CRng(challengeId);
    return {
        _id: { $oid: "67e1bb2d9d00cb47" + challengeId.toString().padStart(8, "0") },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Challenge: rng.randomElement(weeklyHardChallenges)
    };
};

const pushWeeklyActs = (worldState: IWorldState, week: number): void => {
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;

    worldState.SeasonInfo.ActiveChallenges.push(getSeasonWeeklyChallenge(week, 0));
    worldState.SeasonInfo.ActiveChallenges.push(getSeasonWeeklyChallenge(week, 1));
    worldState.SeasonInfo.ActiveChallenges.push(getSeasonWeeklyHardChallenge(week, 2));
    worldState.SeasonInfo.ActiveChallenges.push(getSeasonWeeklyHardChallenge(week, 3));
    worldState.SeasonInfo.ActiveChallenges.push({
        _id: { $oid: "67e1b96e9d00cb47" + (week * 7 + 0).toString().padStart(8, "0") },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Challenge: "/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentCompleteMissions" + (week - 12)
    });
    worldState.SeasonInfo.ActiveChallenges.push({
        _id: { $oid: "67e1b96e9d00cb47" + (week * 7 + 1).toString().padStart(8, "0") },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Challenge: "/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentKillEximus" + (week - 12)
    });
    worldState.SeasonInfo.ActiveChallenges.push({
        _id: { $oid: "67e1b96e9d00cb47" + (week * 7 + 2).toString().padStart(8, "0") },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Challenge: "/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentKillEnemies" + (week - 12)
    });
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
    const seasonDay1 = seasonIndex * 90 + 1;
    const seasonDay91 = seasonIndex * 90 + 91;
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
    const rng = new CRng(week);
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

        const challengeIndex = rng.randomInt(0, challenges.length - 1);
        const challenge = challenges[challengeIndex];
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
        const rewardIndex = rng.randomInt(0, rewards.length - 1);
        const reward = rewards[rewardIndex];
        rewards.splice(rewardIndex, 1);

        //logger.debug(`trying to fit a reward between day ${rewardRanges[i]} and ${rewardRanges[i + 1]}`);
        let day: number;
        do {
            day = rng.randomInt(rewardRanges[i] + 1, rewardRanges[i + 1] - 1);
        } while (eventDays.find(x => x.day == day));
        eventDays.push({ day, events: [{ type: "CET_REWARD", reward }] });
    }

    const upgrades = [
        "/Lotus/Upgrades/Calendar/MeleeCritChance",
        "/Lotus/Upgrades/Calendar/MeleeAttackSpeed",
        "/Lotus/Upgrades/Calendar/EnergyOrbToAbilityRange",
        "/Lotus/Upgrades/Calendar/AbilityStrength",
        "/Lotus/Upgrades/Calendar/Armor",
        "/Lotus/Upgrades/Calendar/RadiationProcOnTakeDamage",
        "/Lotus/Upgrades/Calendar/CompanionDamage",
        "/Lotus/Upgrades/Calendar/GasChanceToPrimaryAndSecondary",
        "/Lotus/Upgrades/Calendar/MagazineCapacity",
        "/Lotus/Upgrades/Calendar/PunchToPrimary",
        "/Lotus/Upgrades/Calendar/HealingEffects",
        "/Lotus/Upgrades/Calendar/EnergyRestoration",
        "/Lotus/Upgrades/Calendar/OvershieldCap",
        "/Lotus/Upgrades/Calendar/ElectricStatusDamageAndChance",
        "/Lotus/Upgrades/Calendar/FinisherChancePerComboMultiplier",
        "/Lotus/Upgrades/Calendar/MagnetStatusPull",
        "/Lotus/Upgrades/Calendar/CompanionsBuffNearbyPlayer",
        "/Lotus/Upgrades/Calendar/StatusChancePerAmmoSpent",
        "/Lotus/Upgrades/Calendar/OrbsDuplicateOnPickup",
        "/Lotus/Upgrades/Calendar/AttackAndMovementSpeedOnCritMelee",
        "/Lotus/Upgrades/Calendar/RadialJavelinOnHeavy",
        "/Lotus/Upgrades/Calendar/MagnitizeWithinRangeEveryXCasts",
        "/Lotus/Upgrades/Calendar/CompanionsRadiationChance",
        "/Lotus/Upgrades/Calendar/BlastEveryXShots",
        "/Lotus/Upgrades/Calendar/GenerateOmniOrbsOnWeakKill",
        "/Lotus/Upgrades/Calendar/ElectricDamagePerDistance",
        "/Lotus/Upgrades/Calendar/MeleeSlideFowardMomentumOnEnemyHit",
        "/Lotus/Upgrades/Calendar/SharedFreeAbilityEveryXCasts",
        "/Lotus/Upgrades/Calendar/ReviveEnemyAsSpectreOnKill",
        "/Lotus/Upgrades/Calendar/RefundBulletOnStatusProc",
        "/Lotus/Upgrades/Calendar/ExplodingHealthOrbs",
        "/Lotus/Upgrades/Calendar/SpeedBuffsWhenAirborne",
        "/Lotus/Upgrades/Calendar/EnergyWavesOnCombo",
        "/Lotus/Upgrades/Calendar/PowerStrengthAndEfficiencyPerEnergySpent",
        "/Lotus/Upgrades/Calendar/CloneActiveCompanionForEnergySpent",
        "/Lotus/Upgrades/Calendar/GuidingMissilesChance",
        "/Lotus/Upgrades/Calendar/EnergyOrbsGrantShield",
        "/Lotus/Upgrades/Calendar/ElectricalDamageOnBulletJump"
    ];
    for (let i = 0; i != upgradeRanges.length - 1; ++i) {
        const upgradeIndex = rng.randomInt(0, upgrades.length - 1);
        const upgrade = upgrades[upgradeIndex];
        upgrades.splice(upgradeIndex, 1);

        //logger.debug(`trying to fit an upgrade between day ${upgradeRanges[i]} and ${upgradeRanges[i + 1]}`);
        let day: number;
        do {
            day = rng.randomInt(upgradeRanges[i] + 1, upgradeRanges[i + 1] - 1);
        } while (eventDays.find(x => x.day == day));
        eventDays.push({ day, events: [{ type: "CET_UPGRADE", upgrade }] });
    }

    eventDays.sort((a, b) => a.day - b.day);

    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    return {
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Days: eventDays,
        Season: ["CST_WINTER", "CST_SPRING", "CST_SUMMER", "CST_FALL"][seasonIndex],
        YearIteration: Math.trunc(week / 4),
        Version: 19,
        UpgradeAvaliabilityRequirements: ["/Lotus/Upgrades/Calendar/1999UpgradeApplicationRequirement"]
    };
};

export const getWorldState = (buildLabel?: string): IWorldState => {
    const day = Math.trunc((Date.now() - EPOCH) / 86400000);
    const week = Math.trunc(day / 7);
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;

    const worldState: IWorldState = {
        BuildLabel: typeof buildLabel == "string" ? buildLabel.split(" ").join("+") : buildConfig.buildLabel,
        Time: config.worldState?.lockTime || Math.round(Date.now() / 1000),
        Goals: [],
        Alerts: [],
        Sorties: [],
        LiteSorties: [],
        GlobalUpgrades: [],
        EndlessXpChoices: [],
        SeasonInfo: {
            Activation: { $date: { $numberLong: "1715796000000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            AffiliationTag: "RadioLegionIntermission12Syndicate",
            Season: 14,
            Phase: 0,
            Params: "",
            ActiveChallenges: []
        },
        KnownCalendarSeasons: [],
        ...staticWorldState,
        SyndicateMissions: [...staticWorldState.SyndicateMissions]
    };

    if (config.worldState?.starDays) {
        worldState.Goals.push({
            _id: { $oid: "67a4dcce2a198564d62e1647" },
            Activation: { $date: { $numberLong: "1738868400000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
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

    // Nightwave Challenges
    worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(day - 2));
    worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(day - 1));
    worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(day - 0));
    if (isBeforeNextExpectedWorldStateRefresh(EPOCH + (day + 1) * 86400000)) {
        worldState.SeasonInfo.ActiveChallenges.push(getSeasonDailyChallenge(day + 1));
    }
    pushWeeklyActs(worldState, week);
    if (isBeforeNextExpectedWorldStateRefresh(weekEnd)) {
        pushWeeklyActs(worldState, week + 1);
    }

    // Elite Sanctuary Onslaught cycling every week
    worldState.NodeOverrides.find(x => x.Node == "SolNode802")!.Seed = week; // unfaithful

    // Holdfast, Cavia, & Hex bounties cycling every 2.5 hours; unfaithful implementation
    let bountyCycle = Math.trunc(Date.now() / 9000000);
    let bountyCycleEnd: number | undefined;
    do {
        const bountyCycleStart = bountyCycle * 9000000;
        bountyCycleEnd = bountyCycleStart + 9000000;
        worldState.SyndicateMissions.push({
            _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000029" },
            Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
            Tag: "ZarimanSyndicate",
            Seed: bountyCycle,
            Nodes: []
        });
        worldState.SyndicateMissions.push({
            _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000004" },
            Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
            Tag: "EntratiLabSyndicate",
            Seed: bountyCycle,
            Nodes: []
        });
        worldState.SyndicateMissions.push({
            _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000006" },
            Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
            Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
            Tag: "HexSyndicate",
            Seed: bountyCycle,
            Nodes: []
        });

        const table = String.fromCharCode(65 + (bountyCycle % 3));
        const vaultTable = String.fromCharCode(65 + ((bountyCycle + 1) % 3));
        const deimosDTable = String.fromCharCode(65 + (bountyCycle % 2));

        // TODO: xpAmounts need to be calculated based on the jobType somehow?

        {
            const rng = new CRng(bountyCycle);
            worldState.SyndicateMissions.push({
                _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000008" },
                Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
                Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
                Tag: "CetusSyndicate",
                Seed: bountyCycle,
                Nodes: [],
                Jobs: [
                    {
                        jobType: rng.randomElement(eidolonJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierATable${table}Rewards`,
                        masteryReq: 0,
                        minEnemyLevel: 5,
                        maxEnemyLevel: 15,
                        xpAmounts: [430, 430, 430]
                    },
                    {
                        jobType: rng.randomElement(eidolonJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierBTable${table}Rewards`,
                        masteryReq: 1,
                        minEnemyLevel: 10,
                        maxEnemyLevel: 30,
                        xpAmounts: [620, 620, 620]
                    },
                    {
                        jobType: rng.randomElement(eidolonJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierCTable${table}Rewards`,
                        masteryReq: 2,
                        minEnemyLevel: 20,
                        maxEnemyLevel: 40,
                        xpAmounts: [670, 670, 670, 990]
                    },
                    {
                        jobType: rng.randomElement(eidolonJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierDTable${table}Rewards`,
                        masteryReq: 3,
                        minEnemyLevel: 30,
                        maxEnemyLevel: 50,
                        xpAmounts: [570, 570, 570, 570, 1110]
                    },
                    {
                        jobType: rng.randomElement(eidolonJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/EidolonJobMissionRewards/TierETable${table}Rewards`,
                        masteryReq: 5,
                        minEnemyLevel: 40,
                        maxEnemyLevel: 60,
                        xpAmounts: [740, 740, 740, 740, 1450]
                    },
                    {
                        jobType: rng.randomElement(eidolonJobs),
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
                        xpAmounts: [840, 840, 840, 840, 1650]
                    }
                ]
            });
        }

        {
            const rng = new CRng(bountyCycle);
            worldState.SyndicateMissions.push({
                _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000025" },
                Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
                Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
                Tag: "SolarisSyndicate",
                Seed: bountyCycle,
                Nodes: [],
                Jobs: [
                    {
                        jobType: rng.randomElement(venusJobs),
                        rewards: `Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierATable${table}Rewards`,
                        masteryReq: 0,
                        minEnemyLevel: 5,
                        maxEnemyLevel: 15,
                        xpAmounts: [340, 340, 340]
                    },
                    {
                        jobType: rng.randomElement(venusJobs),
                        rewards: `Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierBTable${table}Rewards`,
                        masteryReq: 1,
                        minEnemyLevel: 10,
                        maxEnemyLevel: 30,
                        xpAmounts: [660, 660, 660]
                    },
                    {
                        jobType: rng.randomElement(venusJobs),
                        rewards: `Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierCTable${table}Rewards`,
                        masteryReq: 2,
                        minEnemyLevel: 20,
                        maxEnemyLevel: 40,
                        xpAmounts: [610, 610, 610, 900]
                    },
                    {
                        jobType: rng.randomElement(venusJobs),
                        rewards: `Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierDTable${table}Rewards`,
                        masteryReq: 3,
                        minEnemyLevel: 30,
                        maxEnemyLevel: 50,
                        xpAmounts: [600, 600, 600, 600, 1170]
                    },
                    {
                        jobType: rng.randomElement(venusJobs),
                        rewards: `Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${table}Rewards`,
                        masteryReq: 5,
                        minEnemyLevel: 40,
                        maxEnemyLevel: 60,
                        xpAmounts: [690, 690, 690, 690, 1350]
                    },
                    {
                        jobType: rng.randomElement(venusJobs),
                        rewards: `Lotus/Types/Game/MissionDecks/VenusJobMissionRewards/VenusTierETable${table}Rewards`,
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
                        xpAmounts: [780, 780, 780, 780, 1540]
                    }
                ]
            });
        }

        {
            const rng = new CRng(bountyCycle);
            worldState.SyndicateMissions.push({
                _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000002" },
                Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
                Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
                Tag: "EntratiSyndicate",
                Seed: bountyCycle,
                Nodes: [],
                Jobs: [
                    {
                        jobType: rng.randomElement(microplanetJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierATable${table}Rewards`,
                        masteryReq: 0,
                        minEnemyLevel: 5,
                        maxEnemyLevel: 15,
                        xpAmounts: [5, 5, 5]
                    },
                    {
                        jobType: rng.randomElement(microplanetJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierCTable${table}Rewards`,
                        masteryReq: 1,
                        minEnemyLevel: 15,
                        maxEnemyLevel: 25,
                        xpAmounts: [12, 12, 12]
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
                        jobType: rng.randomElement(microplanetJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierDTable${deimosDTable}Rewards`,
                        masteryReq: 2,
                        minEnemyLevel: 30,
                        maxEnemyLevel: 40,
                        xpAmounts: [17, 17, 17, 25]
                    },
                    {
                        jobType: rng.randomElement(microplanetJobs),
                        rewards: `/Lotus/Types/Game/MissionDecks/DeimosMissionRewards/TierETableARewards`,
                        masteryReq: 3,
                        minEnemyLevel: 40,
                        maxEnemyLevel: 60,
                        xpAmounts: [22, 22, 22, 22, 43]
                    },
                    {
                        jobType: rng.randomElement(microplanetJobs),
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
    } while (isBeforeNextExpectedWorldStateRefresh(bountyCycleEnd) && ++bountyCycle);

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

    // Sortie cycling every day
    pushSortieIfRelevant(worldState.Sorties, day - 1);
    pushSortieIfRelevant(worldState.Sorties, day);

    // Archon Hunt cycling every week
    worldState.LiteSorties.push(getLiteSortie(week));
    if (isBeforeNextExpectedWorldStateRefresh(weekEnd)) {
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
    if (isBeforeNextExpectedWorldStateRefresh(weekEnd)) {
        worldState.KnownCalendarSeasons.push(getCalendarSeason(week + 1));
    }

    // Sentient Anomaly cycling every 30 minutes
    const halfHour = Math.trunc(Date.now() / (unixTimesInMs.hour / 2));
    const tmp = {
        cavabegin: "1690761600",
        PurchasePlatformLockEnabled: true,
        tcsn: true,
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
        sfn: [550, 553, 554, 555][halfHour % 4]
    };
    worldState.Tmp = JSON.stringify(tmp);

    return worldState;
};

export const idToWeek = (id: string): number => {
    return (parseInt(id.substring(0, 8), 16) * 1000 - EPOCH) / 604800000;
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
            value.name.indexOf("Archwing") == -1 &&
            value.missionIndex != 0 // Exclude MT_ASSASSINATION
        ) {
            nodes.push(key);
        }
    }

    const rng = new CRng(week);
    const firstNodeIndex = rng.randomInt(0, nodes.length - 1);
    const firstNode = nodes[firstNodeIndex];
    nodes.splice(firstNodeIndex, 1);

    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    return {
        _id: {
            $oid: Math.trunc(weekStart / 1000).toString(16) + "5e23a244740a190c"
        },
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Reward: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards",
        Seed: week,
        Boss: boss,
        Missions: [
            {
                missionType: rng.randomElement([
                    "MT_INTEL",
                    "MT_MOBILE_DEFENSE",
                    "MT_EXTERMINATION",
                    "MT_SABOTAGE",
                    "MT_RESCUE"
                ]),
                node: firstNode
            },
            {
                missionType: rng.randomElement([
                    "MT_DEFENSE",
                    "MT_TERRITORY",
                    "MT_ARTIFACT",
                    "MT_EXCAVATE",
                    "MT_SURVIVAL"
                ]),
                node: rng.randomElement(nodes)
            },
            {
                missionType: "MT_ASSASSINATION",
                node: showdownNode
            }
        ]
    };
};
