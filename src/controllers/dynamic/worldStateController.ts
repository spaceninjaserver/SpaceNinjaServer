import { RequestHandler } from "express";
import staticWorldState from "@/static/fixed_responses/worldState/worldState.json";
import static1999FallDays from "@/static/fixed_responses/worldState/1999_fall_days.json";
import static1999SpringDays from "@/static/fixed_responses/worldState/1999_spring_days.json";
import static1999SummerDays from "@/static/fixed_responses/worldState/1999_summer_days.json";
import static1999WinterDays from "@/static/fixed_responses/worldState/1999_winter_days.json";
import { buildConfig } from "@/src/services/buildConfigService";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { config } from "@/src/services/configService";
import { CRng } from "@/src/services/rngService";
import { ExportNightwave, ExportRegions } from "warframe-public-export-plus";

const EPOCH = 1734307200 * 1000; // Monday, Dec 16, 2024 @ 00:00 UTC+0; should logically be winter in 1999 iteration 0

export const worldStateController: RequestHandler = (req, res) => {
    const day = Math.trunc((Date.now() - EPOCH) / 86400000);
    const week = Math.trunc(day / 7);
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;

    const worldState: IWorldState = {
        BuildLabel:
            typeof req.query.buildLabel == "string"
                ? req.query.buildLabel.split(" ").join("+")
                : buildConfig.buildLabel,
        Time: Math.round(Date.now() / 1000),
        Goals: [],
        GlobalUpgrades: [],
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

    if (config.events?.starDays) {
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

    if (config.events?.creditBoost) {
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
    if (config.events?.affinityBoost) {
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
    if (config.events?.resourceBoost) {
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

    res.json(worldState);
};

interface IWorldState {
    Version: number; // for goals
    BuildLabel: string;
    Time: number;
    Goals: IGoal[];
    SyndicateMissions: ISyndicateMission[];
    GlobalUpgrades: IGlobalUpgrade[];
    LiteSorties: ILiteSortie[];
    NodeOverrides: INodeOverride[];
    EndlessXpChoices: IEndlessXpChoice[];
    SeasonInfo: {
        Activation: IMongoDate;
        Expiry: IMongoDate;
        AffiliationTag: string;
        Season: number;
        Phase: number;
        Params: string;
        ActiveChallenges: ISeasonChallenge[];
    };
    KnownCalendarSeasons: ICalendarSeason[];
    Tmp?: string;
}

interface IGoal {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Count: number;
    Goal: number;
    Success: number;
    Personal: boolean;
    Desc: string;
    ToolTip: string;
    Icon: string;
    Tag: string;
    Node: string;
}

interface ISyndicateMission {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Tag: string;
    Seed: number;
    Nodes: string[];
}

interface IGlobalUpgrade {
    _id: IOid;
    Activation: IMongoDate;
    ExpiryDate: IMongoDate;
    UpgradeType: string;
    OperationType: string;
    Value: number;
    LocalizeTag: string;
    LocalizeDescTag: string;
}

interface INodeOverride {
    _id: IOid;
    Activation?: IMongoDate;
    Expiry?: IMongoDate;
    Node: string;
    Hide?: boolean;
    Seed?: number;
    LevelOverride?: string;
    Faction?: string;
    CustomNpcEncounters?: string;
}

interface ILiteSortie {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Reward: "/Lotus/Types/Game/MissionDecks/ArchonSortieRewards";
    Seed: number;
    Boss: string; // "SORTIE_BOSS_AMAR" | "SORTIE_BOSS_NIRA" | "SORTIE_BOSS_BOREAL"
    Missions: {
        missionType: string;
        node: string;
    }[];
}

interface IEndlessXpChoice {
    Category: string;
    Choices: string[];
}

interface ISeasonChallenge {
    _id: IOid;
    Daily?: boolean;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Challenge: string;
}

interface ICalendarSeason {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Season: string; // "CST_UNDEFINED" | "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL"
    Days: {
        day: number;
    }[];
    YearIteration: number;
}

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
