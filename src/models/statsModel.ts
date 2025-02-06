import { Document, Schema, Types, model } from "mongoose";
import { IEnemy, IMission, IScan, ITutorial, IAbility, IWeapon, IStatsDatabase } from "@/src/types/statTypes";

const abilitySchema = new Schema<IAbility>(
    {
        type: { type: String, required: true },
        used: Number
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
        deaths: Number
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
        scans: Number
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
    ReviveCount: Number
});

statsSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.accountOwnerId;
    }
});

export const Stats = model<IStatsDatabase>("Stats", statsSchema);

// eslint-disable-next-line @typescript-eslint/ban-types
export type TStatsDatabaseDocument = Document<unknown, {}, IStatsDatabase> & {
    _id: Types.ObjectId;
    __v: number;
} & IStatsDatabase;
