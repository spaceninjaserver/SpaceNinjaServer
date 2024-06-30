import { Schema, Types, model } from "mongoose";
import { ICountedAttDatabase, IInboxDatabase, IInboxReponseClient } from "@/src/types/inboxTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";

const countedAttSchema = new Schema<ICountedAttDatabase>(
    {
        ItemType: String,
        ItemCount: Number
    },
    { _id: false }
);

countedAttSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const inboxSchema = new Schema<IInboxDatabase>(
    {
        OwnerId: Types.ObjectId,
        sndr: String,
        msg: String,
        sub: String,
        icon: String,
        highPriority: Boolean,
        date: Date,
        r: Boolean,
        countedAtt: [countedAttSchema]
    },
    { id: false }
);

inboxSchema.virtual("messageId").get(function () {
    return toOid(this._id);
});

inboxSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.OwnerId;
        const inboxDatabase = returnedObject as IInboxDatabase;
        const inboxReponse = returnedObject as IInboxReponseClient;
        if (inboxDatabase.date) inboxReponse.date = toMongoDate(inboxDatabase.date);
        if (inboxDatabase.startDate) inboxReponse.startDate = toMongoDate(inboxDatabase.startDate);
        if (inboxDatabase.endDate) inboxReponse.endDate = toMongoDate(inboxDatabase.endDate);
    }
});

inboxSchema.set("toObject", {
    virtuals: true
});

export const Inbox = model("Inbox", inboxSchema);
