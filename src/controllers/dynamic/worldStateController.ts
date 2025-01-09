import { RequestHandler } from "express";
import staticWorldState from "@/static/fixed_responses/worldState/worldState.json";
import static1999FallDays from "@/static/fixed_responses/worldState/1999_fall_days.json";
import static1999SpringDays from "@/static/fixed_responses/worldState/1999_spring_days.json";
import static1999SummerDays from "@/static/fixed_responses/worldState/1999_summer_days.json";
import static1999WinterDays from "@/static/fixed_responses/worldState/1999_winter_days.json";
import { buildConfig } from "@/src/services/buildConfigService";
import { IMongoDate, IOid } from "@/src/types/commonTypes";

export const worldStateController: RequestHandler = (req, res) => {
    const worldState: IWorldState = {
        BuildLabel:
            typeof req.query.buildLabel == "string"
                ? req.query.buildLabel.split(" ").join("+")
                : buildConfig.buildLabel,
        Time: Math.round(Date.now() / 1000),
        EndlessXpChoices: [],
        ...staticWorldState
    };

    const day = Math.trunc(new Date().getTime() / 86400000);
    const week = Math.trunc((day + 4) / 7); // week begins on mondays
    const weekStart = week * 604800000;
    const weekEnd = weekStart + 604800000;

    // Elite Sanctuary Onslaught cycling every week
    worldState.NodeOverrides.find(x => x.Node == "SolNode802")!.Seed = week; // unfaithful

    // Holdfast, Cavia, & Hex bounties cycling every 2.5 hours; unfaithful implementation
    const bountyCycle = Math.trunc(new Date().getTime() / 9000000);
    const bountyCycleStart = bountyCycle * 9000000;
    const bountyCycleEnd = bountyCycleStart + 9000000;
    worldState.SyndicateMissions[worldState.SyndicateMissions.findIndex(x => x.Tag == "ZarimanSyndicate")] = {
        _id: { $oid: bountyCycleStart.toString(16) + "0000000000000029" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
        Tag: "ZarimanSyndicate",
        Seed: bountyCycle,
        Nodes: []
    };
    worldState.SyndicateMissions[worldState.SyndicateMissions.findIndex(x => x.Tag == "EntratiLabSyndicate")] = {
        _id: { $oid: bountyCycleStart.toString(16) + "0000000000000004" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
        Tag: "EntratiLabSyndicate",
        Seed: bountyCycle,
        Nodes: []
    };
    worldState.SyndicateMissions[worldState.SyndicateMissions.findIndex(x => x.Tag == "HexSyndicate")] = {
        _id: { $oid: bountyCycleStart.toString(16) + "0000000000000006" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
        Tag: "HexSyndicate",
        Seed: bountyCycle,
        Nodes: []
    };

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
            ["Brunt", "Soma", "Vasto", "Solo", "Burston"],
            ["Zylok", "Sibear", "Dread", "Despair", "Hate"],
            ["Dera", "Sybaris", "Cestra", "Sicarus", "Okina"],
            ["Braton", "Lato", "Skana", "Paris", "Kunai"],
            ["Boar", "Gammacor", "Angstrum", "Gorgon", "Anku"],
            ["Bo", "Latron", "Furis", "Furax", "Strun"],
            ["Lex", "Magistar", "Boltor", "Bronco", "Dagger"],
            ["Torid", "Toxocyst", "Ichor", "Miter", "Atomos"]
        ][week % 8]
    });

    // 1999 Calendar Season cycling every week
    worldState.KnownCalendarSeasons[0].Activation = { $date: { $numberLong: weekStart.toString() } };
    worldState.KnownCalendarSeasons[0].Expiry = { $date: { $numberLong: weekEnd.toString() } };
    worldState.KnownCalendarSeasons[0].Season = ["CST_WINTER", "CST_SPRING", "CST_SUMMER", "CST_FALL"][week % 4];
    worldState.KnownCalendarSeasons[0].Days = [
        static1999WinterDays,
        static1999SpringDays,
        static1999SummerDays,
        static1999FallDays
    ][week % 4];

    res.json(worldState);
};

interface IWorldState {
    BuildLabel: string;
    Time: number;
    SyndicateMissions: ISyndicateMission[];
    NodeOverrides: INodeOverride[];
    EndlessXpChoices: IEndlessXpChoice[];
    KnownCalendarSeasons: ICalendarSeason[];
}

interface ISyndicateMission {
    _id: IOid;
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Tag: string;
    Seed: number;
    Nodes: string[];
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

interface IEndlessXpChoice {
    Category: string;
    Choices: string[];
}

interface ICalendarSeason {
    Activation: IMongoDate;
    Expiry: IMongoDate;
    Season: string; // "CST_UNDEFINED" | "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL"
    Days: {
        day: number;
    }[];
}
