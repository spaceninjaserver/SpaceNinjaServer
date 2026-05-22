import { model, Schema, Types } from "mongoose";
import type { IPendingTradeDatabase, ITradeOffer } from "../types/tradingTypes.ts";

const tradeOfferSchema = new Schema<ITradeOffer>(
    {
        RandomUpgrades: Schema.Types.Mixed,
        Upgrades: Schema.Types.Mixed,
        RawUpgrades: Schema.Types.Mixed,
        MiscItems: Schema.Types.Mixed,
        Recipes: Schema.Types.Mixed,
        LongGuns: Schema.Types.Mixed,
        Pistols: Schema.Types.Mixed,
        Melee: Schema.Types.Mixed,
        FusionTreasures: Schema.Types.Mixed,
        NemesisHistory: Schema.Types.Mixed,
        PremiumCredits: Number,
        _SlotOrderInfo: { type: [String] }
    },
    { _id: false }
);
const defaultTradeOffer: ITradeOffer = { _SlotOrderInfo: ["", "", "", "", "", ""] };

const pendingTradeSchema = new Schema<IPendingTradeDatabase>({
    a: { type: Types.ObjectId, required: true },
    b: { type: Types.ObjectId, required: true },
    aOffer: { type: tradeOfferSchema, default: defaultTradeOffer },
    bOffer: { type: tradeOfferSchema, default: defaultTradeOffer },
    aReady: { type: Boolean, default: false },
    bReady: { type: Boolean, default: false },
    aAccepted: { type: Boolean, default: false },
    bAccepted: { type: Boolean, default: false },
    revision: { type: Number, default: 0 },
    clanTax: { type: Number, required: true }
});

pendingTradeSchema.index({ a: 1, b: 1 }, { unique: true });

export const PendingTrade = model<IPendingTradeDatabase>("PendingTrade", pendingTradeSchema);
