import { RequestHandler } from "express";
import staticWorldState from "@/static/fixed_responses/worldState.json";
import { buildConfig } from "@/src/services/buildConfigService";
import { IMongoDate, IOid } from "@/src/types/commonTypes";

export const worldStateController: RequestHandler = (req, res) => {
    const worldState: IWorldState = {
        ...staticWorldState,
        BuildLabel:
            typeof req.query.buildLabel == "string"
                ? req.query.buildLabel.split(" ").join("+")
                : buildConfig.buildLabel,
        Time: Math.round(Date.now() / 1000)
    };

    const week = Math.trunc(new Date().getTime() / 604800000);

    // Elite Sanctuary Onslaught cycling every week
    worldState.NodeOverrides.push({
        _id: { $oid: "5ad9f9bb6df82a56eabf3d44" },
        Node: "SolNode802",
        Seed: week // unfaithful
    });

    // Holdfast & Hex bounties cycling every 2.5 hours; unfaithful implementation
    const bountyCycle = Math.trunc(new Date().getTime() / 9000000);
    const bountyCycleStart = bountyCycle * 9000000;
    const bountyCycleEnd = bountyCycleStart + 9000000;
    worldState.SyndicateMissions.push({
        _id: { $oid: bountyCycleStart.toString(16) + "0000000000000029" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString() } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString() } },
        Tag: "ZarimanSyndicate",
        Seed: bountyCycle,
        Nodes: []
    });
    worldState.SyndicateMissions.push({
        _id: { $oid: bountyCycleStart.toString(16) + "0000000000000006" },
        Activation: { $date: { $numberLong: bountyCycleStart.toString(10) } },
        Expiry: { $date: { $numberLong: bountyCycleEnd.toString(10) } },
        Tag: "HexSyndicate",
        Seed: bountyCycle,
        Nodes: []
    });

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

    res.json(worldState);
};

interface IWorldState {
    BuildLabel: string;
    Time: number;
    SyndicateMissions: ISyndicateMission[];
    NodeOverrides: INodeOverride[];
    EndlessXpChoices: IEndlessXpChoice[];
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
