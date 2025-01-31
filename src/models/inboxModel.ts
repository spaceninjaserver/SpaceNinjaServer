import { model, Schema, Types } from "mongoose";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { typeCountSchema } from "@/src/models/inventoryModels/inventoryModel";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";

export interface IMessageClient extends Omit<IMessageDatabase, "_id" | "date" | "startDate" | "endDate" | "ownerId"> {
    _id?: IOid;
    date: IMongoDate;
    startDate?: IMongoDate;
    endDate?: IMongoDate;
    messageId: IOid;
}

export interface IMessageDatabase {
    ownerId: Types.ObjectId;
    date: Date;
    _id: Types.ObjectId;
    sndr: string;
    msg: string;
    sub: string;
    icon: string;
    highPriority?: boolean;
    lowPrioNewPlayers?: boolean;
    startDate?: Date;
    endDate?: Date;
    r?: boolean;
    att?: string[];
    countedAtt?: ITypeCount[];
    transmission?: string;
    arg?: Arg[];
}

export interface Arg {
    Key: string;
    Tag: string;
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
const messageSchema = new Schema<IMessageDatabase>(
    {
        ownerId: Schema.Types.ObjectId,
        sndr: String,
        msg: String,
        sub: String,
        icon: String,
        highPriority: Boolean,
        lowPrioNewPlayers: Boolean,
        startDate: Date,
        endDate: Date,
        r: Boolean,
        att: { type: [String], default: undefined },
        countedAtt: { type: [typeCountSchema], default: undefined },
        transmission: String,
        arg: {
            type: [
                {
                    Key: String,
                    Tag: String,
                    _id: false
                }
            ],
            default: undefined
        }
    },
    { timestamps: { createdAt: "date", updatedAt: false }, id: false }
);

messageSchema.virtual("messageId").get(function (this: IMessageDatabase) {
    return toOid(this._id);
});

messageSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject.ownerId;

        const messageDatabase = returnedObject as IMessageDatabase;
        const messageClient = returnedObject as IMessageClient;

        delete returnedObject._id;
        delete returnedObject.__v;

        messageClient.date = toMongoDate(messageDatabase.date);

        if (messageDatabase.startDate && messageDatabase.endDate) {
            messageClient.startDate = toMongoDate(messageDatabase.startDate);

            messageClient.endDate = toMongoDate(messageDatabase.endDate);
        }
    }
});

export const Inbox = model<IMessageDatabase>("Inbox", messageSchema, "inbox");
