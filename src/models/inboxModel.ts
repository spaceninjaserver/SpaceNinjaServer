import type { Document, Types } from "mongoose";
import { model, Schema } from "mongoose";
import { toOid } from "../helpers/inventoryHelpers.ts";
import { typeCountSchema } from "./inventoryModels/inventoryModel.ts";
import type { IMongoDateWithLegacySupport, IOid, IOidWithLegacySupport, ITypeCount } from "../types/commonTypes.ts";

export interface IMessageClient extends Omit<
    IMessageDatabase,
    "_id" | "globaUpgradeId" | "date" | "startDate" | "endDate" | "ownerId" | "attVisualOnly" | "expiry"
> {
    _id?: IOid;
    globaUpgradeId?: IOidWithLegacySupport; // [sic]
    date: IMongoDateWithLegacySupport;
    startDate?: IMongoDateWithLegacySupport;
    endDate?: IMongoDateWithLegacySupport;
    messageId: IOid;
}

export interface IMessageDatabase extends IMessage {
    ownerId: Types.ObjectId;
    globaUpgradeId?: Types.ObjectId; // [sic]
    date: Date; //created at
    attVisualOnly?: boolean;
    _id: Types.ObjectId;
}

export interface IMessage {
    sndr: string;
    msg: string;
    cinematic?: string;
    sub: string;
    customData?: string;
    icon?: string;
    highPriority?: boolean;
    lowPrioNewPlayers?: boolean;
    transmission?: string;
    att?: string[];
    countedAtt?: ITypeCount[];
    startDate?: Date;
    endDate?: Date;
    goalTag?: string;
    CrossPlatform?: boolean;
    arg?: Arg[];
    gifts?: IGift[];
    r?: boolean;
    contextInfo?: string;
    acceptAction?: string;
    declineAction?: string;
    hasAccountAction?: boolean;
    RegularCredits?: number;
}

export interface Arg {
    Key: string;
    Tag: string | number;
}

export interface IGift {
    GiftType: string;
}

//types are wrong
// export interface IMessageDatabase {
//     _id: Types.ObjectId;
//     messageId: string;
//     sub: string;
//     sndr: string;
//     msg: string;
//     startDate: Date;
//     endDate: Date;
//     date: Date;
//     contextInfo: string;
//     icon: string;
//     att: string[];
//     modPacks: string[];
//     countedAtt: string[];
//     attSpecial: string[];
//     transmission: string;
//     ordisReactionTransmission: string;
//     arg: string[];
//     r: string;
//     acceptAction: string;
//     declineAction: string;
//     highPriority: boolean;
//     lowPrioNewPlayers: boolean
//     gifts: string[];
//     teleportLoc: string;
//     RegularCredits: string;
//     PremiumCredits: string;
//     PrimeTokens: string;
//     Coupons: string[];
//     syndicateAttachment: string[];
//     tutorialTag: string;
//     url: string;
//     urlButtonText: string;
//     cinematic: string;
//     requiredLevel: string;
// }

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
        RegularCredits: Number
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

        // oid & date conversions done in inboxService's exportInboxMessage
    }
});

messageSchema.index({ ownerId: 1 });
messageSchema.index({ endDate: 1 }, { expireAfterSeconds: 0 });

export const Inbox = model<IMessageDatabase>("Inbox", messageSchema, "inbox");

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TMessageDocument = Document<unknown, {}, IMessageDatabase> &
    IMessageDatabase & { _id: Types.ObjectId; __v: number };
