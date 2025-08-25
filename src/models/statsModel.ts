import type { Document, Types } from "mongoose";
import { Schema, model } from "mongoose";
import type {
    IEnemy,
    IMission,
    IScan,
    ITutorial,
    IAbility,
    IWeapon,
    IStatsDatabase,
    IRace
} from "@/src/types/statTypes";

const abilitySchema = new Schema<IAbility>(
    {
        type: { type: String, required: true },
        used: { type: Number, required: true }
    },
    { _id: false }
);

const enemySchema = new Schema<IEnemy>(
    {
        type: { type: String, required: true },
        executions: Number,
        headshots: Number,
        kills: Number,
        assists: Number,
        deaths: Number,
        captures: Number
    },
    { _id: false }
);

const missionSchema = new Schema<IMission>(
    {
        type: { type: String, required: true },
        highScore: Number
    },
    { _id: false }
);

const scanSchema = new Schema<IScan>(
    {
        type: { type: String, required: true },
        scans: { type: Number, required: true }
    },
    { _id: false }
);

const tutorialSchema = new Schema<ITutorial>(
    {
        stage: Number
    },
    { _id: false }
);

const weaponSchema = new Schema<IWeapon>(
    {
        type: { type: String, required: true },
        equipTime: Number,
        hits: Number,
        kills: Number,
        xp: Number,
        assists: Number,
        headshots: Number,
        fired: Number
    },
    { _id: false }
);

const raceSchema = new Schema<IRace>(
    {
        highScore: Number
    },
    { _id: false }
);

const statsSchema = new Schema<IStatsDatabase>({
    accountOwnerId: { type: Schema.Types.ObjectId, required: true },
    CiphersSolved: Number,
    CiphersFailed: Number,
    CipherTime: Number,
    Weapons: { type: [weaponSchema], default: [] },
    Enemies: { type: [enemySchema], default: [] },
    MeleeKills: Number,
    MissionsCompleted: Number,
    MissionsQuit: Number,
    MissionsFailed: Number,
    MissionsInterrupted: Number,
    MissionsDumped: Number,
    TimePlayedSec: Number,
    PickupCount: Number,
    Tutorial: { type: Map, of: tutorialSchema, default: {} },
    Abilities: { type: [abilitySchema], default: [] },
    Rating: Number,
    Income: Number,
    Rank: Number,
    PlayerLevel: Number,
    Scans: { type: [scanSchema], default: [] },
    Missions: { type: [missionSchema], default: [] },
    Deaths: Number,
    HealCount: Number,
    ReviveCount: Number,
    Races: { type: Map, of: raceSchema, default: {} },
    ZephyrScore: Number,
    SentinelGameScore: Number,
    CaliberChicksScore: Number,
    OlliesCrashCourseScore: Number,
    DojoObstacleScore: Number,

    Halloween16: Number,
    AmalgamEventScoreMax: Number,
    Halloween19ScoreMax: Number,
    FlotillaEventScore: Number,
    FlotillaSpaceBadgesTier1: Number,
    FlotillaSpaceBadgesTier2: Number,
    FlotillaSpaceBadgesTier3: Number,
    FlotillaGroundBadgesTier1: Number,
    FlotillaGroundBadgesTier2: Number,
    FlotillaGroundBadgesTier3: Number,
    MechSurvivalScoreMax: Number
});

statsSchema.set("toJSON", {
    transform(_document, returnedObject: Record<string, any>) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.accountOwnerId;
    }
});

statsSchema.index({ accountOwnerId: 1 }, { unique: true });

export const Stats = model<IStatsDatabase>("Stats", statsSchema);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TStatsDatabaseDocument = Document<unknown, {}, IStatsDatabase> & {
    _id: Types.ObjectId;
    __v: number;
} & IStatsDatabase;
