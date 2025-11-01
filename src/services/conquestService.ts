import type { TFaction, TMissionType } from "warframe-public-export-plus";
import type { CalendarSeasonType, IConquest, IConquestMission, TConquestType } from "../types/worldStateTypes.ts";
import { mixSeeds, SRng } from "./rngService.ts";
import { EPOCH } from "../constants/timeConstants.ts";

const missionAndFactionTypes: Record<TConquestType, Partial<Record<TMissionType, TFaction[]>>> = {
    CT_LAB: {
        MT_EXTERMINATION: ["FC_MITW"],
        MT_SURVIVAL: ["FC_MITW"],
        MT_ALCHEMY: ["FC_MITW"],
        MT_DEFENSE: ["FC_MITW"],
        MT_ARTIFACT: ["FC_MITW"]
    },
    CT_HEX: {
        MT_EXTERMINATION: ["FC_SCALDRA", "FC_TECHROT"],
        MT_SURVIVAL: ["FC_SCALDRA", "FC_TECHROT"],
        MT_DEFENSE: ["FC_SCALDRA"],
        MT_ENDLESS_CAPTURE: ["FC_TECHROT"]
    }
};

const assassinationFactionOptions: Record<TConquestType, TFaction[]> = {
    CT_LAB: ["FC_MITW"],
    CT_HEX: ["FC_SCALDRA"]
};

type TConquestDifficulty = "CD_NORMAL" | "CD_HARD";

interface IConquestConditional {
    tag: string;
    missionType?: TMissionType;
    conquest?: TConquestType;
    difficulty?: TConquestDifficulty;
    season?: CalendarSeasonType;
}

const deviations: readonly IConquestConditional[] = [
    {
        tag: "AlchemicalShields",
        missionType: "MT_ALCHEMY"
    },
    {
        tag: "ContaminationZone",
        missionType: "MT_SURVIVAL",
        conquest: "CT_HEX"
    },
    {
        tag: "DoubleTrouble",
        missionType: "MT_ARTIFACT"
    },
    {
        tag: "EscalateImmediately",
        missionType: "MT_EXTERMINATION",
        conquest: "CT_HEX"
    },
    {
        tag: "EximusGrenadiers",
        missionType: "MT_ALCHEMY"
    },
    {
        tag: "FortifiedFoes",
        missionType: "MT_EXTERMINATION"
    },
    {
        tag: "FragileNodes",
        missionType: "MT_ARTIFACT"
    },
    {
        tag: "GrowingIncursion",
        missionType: "MT_EXTERMINATION",
        conquest: "CT_LAB"
    },
    {
        tag: "HarshWords",
        missionType: "MT_DEFENSE",
        conquest: "CT_LAB"
    },
    {
        tag: "HighScalingLegacyte",
        missionType: "MT_ENDLESS_CAPTURE",
        conquest: "CT_HEX"
    },
    {
        tag: "DoubleTroubleLegacyte",
        missionType: "MT_ENDLESS_CAPTURE",
        conquest: "CT_HEX"
    },
    {
        tag: "HostileSecurity",
        missionType: "MT_DEFENSE",
        conquest: "CT_LAB"
    },
    {
        tag: "InfiniteTide",
        missionType: "MT_ASSASSINATION",
        conquest: "CT_LAB"
    },
    {
        tag: "LostInTranslation",
        missionType: "MT_DEFENSE",
        conquest: "CT_LAB"
    },
    {
        tag: "MutatedEnemies",
        missionType: "MT_ENDLESS_CAPTURE",
        conquest: "CT_HEX"
    },
    {
        tag: "NecramechActivation",
        missionType: "MT_SURVIVAL",
        conquest: "CT_LAB"
    },
    {
        tag: "Reinforcements",
        missionType: "MT_ASSASSINATION",
        conquest: "CT_LAB"
    },
    {
        tag: "StickyFingers",
        missionType: "MT_ARTIFACT",
        conquest: "CT_LAB"
    },
    {
        tag: "TankStrongArmor",
        missionType: "MT_ASSASSINATION",
        conquest: "CT_HEX"
    },
    {
        tag: "TankReinforcements",
        missionType: "MT_ASSASSINATION",
        conquest: "CT_HEX"
    },
    {
        tag: "TankSuperToxic",
        missionType: "MT_ASSASSINATION",
        conquest: "CT_HEX"
    },
    {
        tag: "TechrotConjunction",
        missionType: "MT_SURVIVAL",
        conquest: "CT_HEX"
    },
    {
        tag: "UnpoweredCapsules",
        missionType: "MT_SURVIVAL",
        conquest: "CT_LAB"
    },
    {
        tag: "VolatileGrenades",
        missionType: "MT_ALCHEMY"
    },
    {
        tag: "GestatingTumors",
        missionType: "MT_SURVIVAL",
        conquest: "CT_HEX"
    },
    {
        tag: "ChemicalNoise",
        missionType: "MT_DEFENSE",
        conquest: "CT_HEX"
    },
    {
        tag: "ExplosiveEnergy",
        missionType: "MT_DEFENSE",
        conquest: "CT_HEX"
    },
    {
        tag: "DisruptiveSounds",
        missionType: "MT_DEFENSE",
        conquest: "CT_HEX"
    }
];

const risks: readonly IConquestConditional[] = [
    {
        tag: "Voidburst"
    },
    {
        tag: "RegeneratingEnemies"
    },
    {
        tag: "VoidAberration"
    },
    {
        tag: "ShieldedFoes"
    },
    {
        tag: "PointBlank"
    },
    {
        tag: "Deflectors",
        conquest: "CT_LAB"
    },
    {
        tag: "AcceleratedEnemies"
    },
    {
        tag: "DrainingResiduals"
    },
    {
        tag: "Quicksand"
    },
    {
        tag: "AntiMaterialWeapons",
        conquest: "CT_LAB"
    },
    {
        tag: "ExplosiveCrawlers",
        conquest: "CT_LAB"
    },
    {
        tag: "EMPBlackHole",
        conquest: "CT_LAB"
    },
    {
        tag: "ArtilleryBeacons",
        conquest: "CT_HEX"
    },
    {
        tag: "InfectedTechrot",
        conquest: "CT_HEX"
    },
    {
        tag: "BalloonFest",
        conquest: "CT_HEX"
    },
    {
        tag: "MiasmiteHive",
        conquest: "CT_HEX"
    },
    {
        tag: "CompetitionSpillover",
        conquest: "CT_HEX"
    },
    {
        tag: "HostileOvergrowth",
        conquest: "CT_HEX"
    },
    {
        tag: "MurmurIncursion",
        conquest: "CT_HEX"
    },
    {
        tag: "FactionSwarm_Techrot",
        conquest: "CT_HEX",
        difficulty: "CD_NORMAL"
    },
    {
        tag: "FactionSwarm_Scaldra",
        conquest: "CT_HEX",
        difficulty: "CD_NORMAL"
    },
    {
        tag: "HeavyWarfare",
        conquest: "CT_HEX"
    },
    {
        tag: "ArcadeAutomata",
        conquest: "CT_HEX",
        difficulty: "CD_NORMAL"
    },
    {
        tag: "EfervonFog",
        conquest: "CT_HEX"
    },
    {
        tag: "WinterFrost",
        conquest: "CT_HEX",
        season: "CST_WINTER"
    },
    {
        tag: "JadeSpring",
        conquest: "CT_HEX",
        season: "CST_SPRING"
    },
    {
        tag: "ExplosiveSummer",
        conquest: "CT_HEX",
        season: "CST_SUMMER"
    },
    {
        tag: "FallFog",
        conquest: "CT_HEX",
        season: "CST_FALL"
    }
];

const filterConditionals = (
    arr: readonly IConquestConditional[],
    missionType: TMissionType | null,
    conquest: TConquestType | null,
    difficulty: TConquestDifficulty | null,
    season: CalendarSeasonType | null
): string[] => {
    const applicable = [];
    for (const cond of arr) {
        if (
            (!cond.missionType || cond.missionType == missionType) &&
            (!cond.conquest || cond.conquest == conquest) &&
            (!cond.difficulty || cond.difficulty == difficulty) &&
            (!cond.season || cond.season == season)
        ) {
            applicable.push(cond.tag);
        }
    }
    return applicable;
};

const buildMission = (
    rng: SRng,
    conquest: TConquestType,
    missionType: TMissionType,
    faction: TFaction,
    season: CalendarSeasonType | null
): IConquestMission => {
    const deviation = rng.randomElement(filterConditionals(deviations, missionType, conquest, null, season))!;
    const easyRisk = rng.randomElement(filterConditionals(risks, missionType, conquest, "CD_NORMAL", season))!;
    const hardRiskOptions = filterConditionals(risks, missionType, conquest, "CD_HARD", season);
    {
        const i = hardRiskOptions.indexOf(easyRisk);
        if (i != -1) {
            hardRiskOptions.splice(i, 1);
        }
    }
    const hardRisk = rng.randomElement(hardRiskOptions)!;
    return {
        faction,
        missionType,
        difficulties: [
            {
                type: "CD_NORMAL",
                deviation,
                risks: [easyRisk]
            },
            {
                type: "CD_HARD",
                deviation,
                risks: [easyRisk, hardRisk]
            }
        ]
    };
};

const conquestStartingDay: Record<TConquestType, number> = {
    CT_LAB: 3703,
    CT_HEX: 4053
};

// This function produces identical results to clients pre-40.0.0.
const getFrameVariables = (conquestType: TConquestType, time: number): [string, string, string, string] => {
    const day = Math.floor((time - 1391990400_000) / 86400_000) - conquestStartingDay[conquestType];
    const week = Math.floor(day / 7) + 1;
    const frameVariables = [
        "Framecurse",
        "Knifestep",
        "Exhaustion",
        "Gearless",
        "TimeDilation",
        "Armorless",
        "Starvation",
        "ShieldDelay",
        "Withering",
        "ContactDamage",
        "AbilityLockout",
        "OperatorLockout",
        "EnergyStarved",
        "OverSensitive",
        "AntiGuard",
        "DecayingFlesh",
        "VoidEnergyOverload",
        "DullBlades",
        "Undersupplied"
    ];
    const mag = Math.floor(frameVariables.length / 4);
    const rng = new SRng(conquestStartingDay[conquestType] + Math.floor(week / mag));
    rng.shuffleArray(frameVariables);
    const i = week % mag;
    return [frameVariables[i], frameVariables[i + 1], frameVariables[i + 2], frameVariables[i + 3]];
};

export const getConquest = (
    conquestType: TConquestType,
    week: number,
    season: CalendarSeasonType | null
): IConquest => {
    const rng = new SRng(mixSeeds(conquestStartingDay[conquestType], week));

    const missions: IConquestMission[] = [];
    {
        const missionOptions = Object.entries(missionAndFactionTypes[conquestType]);
        {
            const i = rng.randomInt(0, missionOptions.length - 1);
            const [missionType, factionOptions] = missionOptions.splice(i, 1)[0];
            missions.push(
                buildMission(rng, conquestType, missionType as TMissionType, rng.randomElement(factionOptions)!, season)
            );
        }
        {
            const i = rng.randomInt(0, missionOptions.length - 1);
            const [missionType, factionOptions] = missionOptions.splice(i, 1)[0];
            missions.push(
                buildMission(rng, conquestType, missionType as TMissionType, rng.randomElement(factionOptions)!, season)
            );
        }
        missionOptions.push(["MT_ASSASSINATION", assassinationFactionOptions[conquestType]]);
        {
            const i = rng.randomInt(0, missionOptions.length - 1);
            const [missionType, factionOptions] = missionOptions.splice(i, 1)[0];
            missions.push(
                buildMission(rng, conquestType, missionType as TMissionType, rng.randomElement(factionOptions)!, season)
            );
        }
    }

    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    return {
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        Type: conquestType,
        Missions: missions,
        Variables: getFrameVariables(conquestType, weekStart),
        RandomSeed: rng.randomInt(0, 1_000_000)
    };
};
