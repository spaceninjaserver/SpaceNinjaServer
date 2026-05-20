import type { Document, Types } from "mongoose";
import { model, Schema } from "mongoose";
import { toOid } from "../helpers/inventoryHelpers.ts";
import { typeCountSchema } from "./inventoryModels/inventoryModel.ts";
import type { IGift, IMessageDatabase } from "../types/inboxTypes.ts";

const giftSchema = new Schema<IGift>(
    {
        GiftType: String
    },
    { _id: false }
);

const messageSchema = new Schema<IMessageDatabase>(
    {
        ownerId: Schema.Types.ObjectId,
        globaUpgradeId: Schema.Types.ObjectId,
        sndr: String,
        msg: String,
        cinematic: String,
        sub: String,
        customData: String,
        icon: String,
        highPriority: Boolean,
        QuestReq: String,
        lowPrioNewPlayers: Boolean,
        startDate: Date,
        endDate: Date,
        goalTag: String,
        date: { type: Date, required: true },
        r: Boolean,
        CrossPlatform: Boolean,
        att: { type: [String], default: undefined },
        gifts: { type: [giftSchema], default: undefined },
        countedAtt: { type: [typeCountSchema], default: undefined },
        attVisualOnly: Boolean,
        transmission: String,
        arg: {
            type: [
                {
                    Key: String,
                    Tag: Schema.Types.Mixed,
                    _id: false
                }
            ],
            default: undefined
        },
        contextInfo: String,
        acceptAction: String,
        declineAction: String,
        hasAccountAction: Boolean,
        RegularCredits: Number,
        PremiumCredits: Number,
        minBuildVersion: Number
    },
    { id: false }
);

messageSchema.virtual("messageId").get(function (this: IMessageDatabase) {
    return toOid(this._id);
});

messageSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject: Record<string, any>) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.ownerId;
        delete returnedObject.attVisualOnly;
        delete returnedObject.expiry;
        delete returnedObject.minBuildVersion;

        // oid & date conversions done in inboxService's exportInboxMessage
    }
});

messageSchema.index({ ownerId: 1 });
messageSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

export const Inbox = model<IMessageDatabase>("Inbox", messageSchema, "inbox");

export type TMessageDocument = Document<unknown, {}, IMessageDatabase> &
    IMessageDatabase & { _id: Types.ObjectId; __v: number };
