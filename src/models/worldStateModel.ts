import type { IDailyDealDatabase, IFissureDatabase } from "../types/worldStateTypes.ts";
import { model, Schema } from "mongoose";

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
