import { model, Schema, Types } from "mongoose";
import type { IPendingTradeDatabase, ITradeOffer } from "../types/tradingTypes.ts";

const defaultTradeOffer: ITradeOffer = { _SlotOrderInfo: ["", "", "", "", "", ""] };

const pendingTradeSchema = new Schema<IPendingTradeDatabase>({
    a: { type: Types.ObjectId, required: true },
    b: { type: Types.ObjectId, required: true },
    aOffer: { type: Schema.Types.Mixed, default: defaultTradeOffer },
    bOffer: { type: Schema.Types.Mixed, default: defaultTradeOffer },
    aReady: { type: Boolean, default: false },
    bReady: { type: Boolean, default: false },
    aAccepted: { type: Boolean, default: false },
    bAccepted: { type: Boolean, default: false },
    revision: { type: Number, default: 0 },
    clanTax: { type: Number, required: true }
});

pendingTradeSchema.index({ a: 1, b: 1 }, { unique: true });

export const PendingTrade = model<IPendingTradeDatabase>("PendingTrade", pendingTradeSchema);
