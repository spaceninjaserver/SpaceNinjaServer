import staticWorldState from "@/static/fixed_responses/worldState/worldState.json";
import static1999FallDays from "@/static/fixed_responses/worldState/1999_fall_days.json";
import static1999SpringDays from "@/static/fixed_responses/worldState/1999_spring_days.json";
import static1999SummerDays from "@/static/fixed_responses/worldState/1999_summer_days.json";
import static1999WinterDays from "@/static/fixed_responses/worldState/1999_winter_days.json";
import { buildConfig } from "@/src/services/buildConfigService";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { config } from "@/src/services/configService";
import { CRng } from "@/src/services/rngService";
import { eMissionType, ExportNightwave, ExportRegions } from "warframe-public-export-plus";
import { ISeasonChallenge, IWorldState } from "../types/worldStateTypes";

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

const EPOCH = 1734307200 * 1000; // Monday, Dec 16, 2024 @ 00:00 UTC+0; should logically be winter in 1999 iteration 0

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

export const getWorldState = (buildLabel?: string): IWorldState => {
    const day = Math.trunc((Date.now() - EPOCH) / 86400000);
    const week = Math.trunc(day / 7);
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;

    const worldState: IWorldState = {
        BuildLabel: typeof buildLabel == "string" ? buildLabel.split(" ").join("+") : buildConfig.buildLabel,
        Time: config.worldState?.lockTime || Math.round(Date.now() / 1000),
        Goals: [],
        GlobalUpgrades: [],
        Sorties: [],
        LiteSorties: [],
        EndlessXpChoices: [],
        SeasonInfo: {
            Activation: { $date: { $numberLong: "1715796000000" } },
            Expiry: { $date: { $numberLong: "2000000000000" } },
            AffiliationTag: "RadioLegionIntermission12Syndicate",
            Season: 14,
            Phase: 0,
            Params: "",
            ActiveChallenges: [
                getSeasonDailyChallenge(day - 2),
                getSeasonDailyChallenge(day - 1),
                getSeasonDailyChallenge(day - 0),
                getSeasonWeeklyChallenge(week, 0),
                getSeasonWeeklyChallenge(week, 1),
                getSeasonWeeklyHardChallenge(week, 2),
                getSeasonWeeklyHardChallenge(week, 3),
                {
                    _id: { $oid: "67e1b96e9d00cb47" + (week * 7 + 0).toString().padStart(8, "0") },
                    Activation: { $date: { $numberLong: weekStart.toString() } },
                    Expiry: { $date: { $numberLong: weekEnd.toString() } },
                    Challenge:
                        "/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentCompleteMissions" + (week - 12)
                },
                {
                    _id: { $oid: "67e1b96e9d00cb47" + (week * 7 + 1).toString().padStart(8, "0") },
                    Activation: { $date: { $numberLong: weekStart.toString() } },
                    Expiry: { $date: { $numberLong: weekEnd.toString() } },
                    Challenge: "/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentKillEximus" + (week - 12)
                },
                {
                    _id: { $oid: "67e1b96e9d00cb47" + (week * 7 + 2).toString().padStart(8, "0") },
                    Activation: { $date: { $numberLong: weekStart.toString() } },
                    Expiry: { $date: { $numberLong: weekEnd.toString() } },
                    Challenge: "/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentKillEnemies" + (week - 12)
                }
            ]
        },
        ...staticWorldState
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

    // Elite Sanctuary Onslaught cycling every week
    worldState.NodeOverrides.find(x => x.Node == "SolNode802")!.Seed = week; // unfaithful

    // Holdfast, Cavia, & Hex bounties cycling every 2.5 hours; unfaithful implementation
    const bountyCycle = Math.trunc(Date.now() / 9000000);
    const bountyCycleStart = bountyCycle * 9000000;
    const bountyCycleEnd = bountyCycleStart + 9000000;
    worldState.SyndicateMissions[worldState.SyndicateMissions.findIndex(x => x.Tag == "ZarimanSyndicate")] = {
        _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000029" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
        Tag: "ZarimanSyndicate",
        Seed: bountyCycle,
        Nodes: []
    };
    worldState.SyndicateMissions[worldState.SyndicateMissions.findIndex(x => x.Tag == "EntratiLabSyndicate")] = {
        _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000004" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
        Tag: "EntratiLabSyndicate",
        Seed: bountyCycle,
        Nodes: []
    };
    worldState.SyndicateMissions[worldState.SyndicateMissions.findIndex(x => x.Tag == "HexSyndicate")] = {
        _id: { $oid: Math.trunc(bountyCycleStart / 1000).toString(16) + "0000000000000006" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
        Tag: "HexSyndicate",
        Seed: bountyCycle,
        Nodes: []
    };

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
    {
        let genDay;
        let dayStart;
        let dayEnd;
        const sortieRolloverToday = getSortieTime(day);
        if (Date.now() < sortieRolloverToday) {
            // Early in the day, generate sortie for `day - 1`, expiring at `sortieRolloverToday`.
            genDay = day - 1;
            dayStart = getSortieTime(genDay);
            dayEnd = sortieRolloverToday;
        } else {
            // Late in the day, generate sortie for `day`, expiring at `getSortieTime(day + 1)`.
            genDay = day;
            dayStart = sortieRolloverToday;
            dayEnd = getSortieTime(day + 1);
        }

        const rng = new CRng(genDay);

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

        worldState.Sorties.push({
            _id: { $oid: Math.trunc(dayStart / 1000).toString(16) + "d4d932c97c0a3acd" },
            Activation: { $date: { $numberLong: dayStart.toString() } },
            Expiry: { $date: { $numberLong: dayEnd.toString() } },
            Reward: "/Lotus/Types/Game/MissionDecks/SortieRewards",
            Seed: genDay,
            Boss: boss,
            Variants: selectedNodes
        });
    }

    // Archon Hunt cycling every week
    {
        const boss = ["SORTIE_BOSS_AMAR", "SORTIE_BOSS_NIRA", "SORTIE_BOSS_BOREAL"][week % 3];
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
        worldState.LiteSorties.push({
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
        });
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
    worldState.KnownCalendarSeasons[0].Activation = { $date: { $numberLong: weekStart.toString() } };
    worldState.KnownCalendarSeasons[0].Expiry = { $date: { $numberLong: weekEnd.toString() } };
    worldState.KnownCalendarSeasons[0].Season = ["CST_WINTER", "CST_SPRING", "CST_SUMMER", "CST_FALL"][week % 4];
    worldState.KnownCalendarSeasons[0].Days = [
        static1999WinterDays,
        static1999SpringDays,
        static1999SummerDays,
        static1999FallDays
    ][week % 4];
    worldState.KnownCalendarSeasons[0].YearIteration = Math.trunc(week / 4);

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
