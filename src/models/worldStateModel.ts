import type {
    IAlertDatabase,
    IDailyDealDatabase,
    IFissureDatabase,
    IIceBladeChampionDatabase,
    IInvasionDatabase
} from "../types/worldStateTypes.ts";
import { model, Schema } from "mongoose";
import { typeCountSchema } from "./inventoryModels/inventoryModel.ts";

const fissureSchema = new Schema<IFissureDatabase>({
    Activation: Date,
    Expiry: Date,
    Node: String, // must be unique
    Modifier: String,
    Hard: Boolean
});

fissureSchema.index({ Expiry: 1 }, { expireAfterSeconds: 0 }); // With this, MongoDB will automatically delete expired entries.

export const Fissure = model<IFissureDatabase>("Fissure", fissureSchema);

const dailyDealSchema = new Schema<IDailyDealDatabase>({
    StoreItem: { type: String, required: true },
    Activation: { type: Date, required: true },
    Expiry: { type: Date, required: true },
    Discount: { type: Number, required: true },
    OriginalPrice: { type: Number, required: true },
    SalePrice: { type: Number, required: true },
    AmountTotal: { type: Number, required: true },
    AmountSold: { type: Number, required: true }
});

dailyDealSchema.index({ StoreItem: 1 }, { unique: true });
dailyDealSchema.index({ Expiry: 1 }, { expireAfterSeconds: 86400 });

export const DailyDeal = model<IDailyDealDatabase>("DailyDeal", dailyDealSchema);

const alertSchema = new Schema<IAlertDatabase>({
    Activation: { type: Date, required: true },
    Expiry: { type: Date, required: true },
    MissionInfo: {
        location: { type: String, required: true },
        missionType: { type: String, required: true },
        faction: { type: String, required: true },
        difficulty: { type: Number, required: true },
        missionReward: {
            credits: { type: Number, required: true },
            items: [String],
            countedItems: [typeCountSchema]
        },
        levelOverride: String,
        enemySpec: String,
        extraEnemySpec: String,
        minEnemyLevel: { type: Number, required: true },
        maxEnemyLevel: { type: Number, required: true },
        descText: String,
        nightmare: Boolean
    }
});

alertSchema.index({ Expiry: 1 }, { expireAfterSeconds: 0 });

const invasionSchema = new Schema<IInvasionDatabase>({
    Slot: { type: Number, required: true },
    Node: { type: String, required: true },
    Faction: { type: String, required: true },
    DefenderFaction: { type: String, required: true },
    Count: { type: Number, required: true },
    Goal: { type: Number, required: true },
    GoalScale: Number,
    AttackerReward: [typeCountSchema],
    DefenderReward: [typeCountSchema],
    AttackerSeed: { type: Number, required: true },
    DefenderSeed: { type: Number, required: true },
    SimulatedSide: { type: Number, required: true },
    LastSimulated: { type: Date, required: true },
    Activation: { type: Date, required: true },
    CompletedAt: Date,
    ChainID: Schema.Types.ObjectId,
    SpreadAt: Date,
    FollowedUp: Boolean
});

// Completed invasions are only needed for a few days, e.g. while the winner occupies the node.
invasionSchema.index({ CompletedAt: 1 }, { expireAfterSeconds: 7 * 86400 });

export const Invasion = model<IInvasionDatabase>("Invasion", invasionSchema);

const iceBladeChampionSchema = new Schema<IIceBladeChampionDatabase>({
    PlayerId: { type: Schema.Types.ObjectId, required: true },
    Loadout: { type: Schema.Types.Mixed, required: true },
    Date: { type: Date, required: true }
});

export const IceBladeChampion = model<IIceBladeChampionDatabase>("IceBladeChampion", iceBladeChampionSchema);
