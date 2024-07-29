import { Schema, model } from "mongoose";
import { IEnemy, IMission, IScan, ITutorial, IAbility, IWeapon, IStatsView } from "@/src/types/statTypes";

const abilitySchema = new Schema<IAbility>(
    {
        used: Number,
        type: { type: String, required: true }
    },
    { _id: false }
);

const enemySchema = new Schema<IEnemy>(
    {
        executions: Number,
        headshots: Number,
        kills: Number,
        type: { type: String, required: true },
        assists: Number,
        deaths: Number
    },
    { _id: false }
);

const missionSchema = new Schema<IMission>(
    {
        highScore: Number,
        type: { type: String, required: true }
    },
    { _id: false }
);

const scanSchema = new Schema<IScan>(
    {
        scans: Number,
        type: { type: String, required: true }
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
        equipTime: Number,
        hits: Number,
        kills: Number,
        xp: Number,
        assists: Number,
        type: { type: String, required: true },
        headshots: Number,
        fired: Number
    },
    { _id: false }
);

const statsSchema = new Schema<IStatsView>({
    accountOwnerId: Schema.Types.ObjectId,
    CiphersSolved: Number,
    CiphersFailed: Number,
    CipherTime: Number,
    Weapons: [weaponSchema],
    Enemies: [enemySchema],
    MeleeKills: Number,
    MissionsCompleted: Number,
    MissionsQuit: Number,
    MissionsFailed: Number,
    TimePlayedSec: Number,
    PickupCount: Number,
    Tutorial: { type: Map, of: tutorialSchema },
    Abilities: [abilitySchema],
    Rating: Number,
    Income: Number,
    Rank: Number,
    PlayerLevel: Number,
    Scans: [scanSchema],
    Missions: [missionSchema],
    Deaths: Number,
    HealCount: Number,
    ReviveCount: Number
});

const Stats = model<IStatsView>("Stats", statsSchema);

export default Stats;
