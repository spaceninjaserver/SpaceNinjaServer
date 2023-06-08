import { model, Schema } from "mongoose";
import { IInboxDocument } from "../types/inboxTypes";
import { ODate, Oid } from "../types/commonTypes";

const databaseInboxSchema = new Schema<IInboxDocument>({
    OwnerId: String,
    globaUpgradeId: String,
    sndr: String,
    sub: String,
    msg: String,
    att: [String],
    icon: String,
    url: String,
    highPriority: Boolean,
    lowPrioNewPlayers: Boolean,
    CrossPlatform: Boolean,
    date: Number,
    startDate: Number,
    endDate: Number,
    r: Boolean
});

databaseInboxSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject.messageId = _document._id.toString();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject._id = { $oid: returnedObject._id.toString() } satisfies Oid;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject.date = { $date: { $numberLong: returnedObject.date.toString() } } satisfies ODate;
        if (returnedObject.startDate)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            returnedObject.startDate = { $date: { $numberLong: returnedObject.startDate.toString() } } satisfies ODate;
        if (returnedObject.endDate)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            returnedObject.endDate = { $date: { $numberLong: returnedObject.endDate.toString() } } satisfies ODate;
        delete returnedObject.OwnerId;
        delete returnedObject.__v;
    }
});

const Inbox = model<IInboxDocument>("Inbox", databaseInboxSchema);

export { Inbox };
