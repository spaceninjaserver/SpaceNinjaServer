import { toMongoDate2, toOid2 } from "../helpers/inventoryHelpers.ts";
import type { IMessageClient, IMessageDatabase, TMessageDocument } from "../models/inboxModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { Types } from "mongoose";

export const getAllMessagesSorted = async (accountId: string): Promise<TMessageDocument[]> => {
    const inbox = await Inbox.find({ ownerId: accountId }).sort({ date: -1 });
    return inbox;
};

export const deleteMessageRead = async (messageId: string): Promise<void> => {
    await Inbox.findOneAndDelete({ _id: messageId, r: true });
};

export const deleteAllMessagesRead = async (accountId: string): Promise<void> => {
    await Inbox.deleteMany({ ownerId: accountId, r: true });
};

export const deleteAllMessagesReadNonCin = async (accountId: string): Promise<void> => {
    await Inbox.deleteMany({ ownerId: accountId, r: true, cinematic: null });
};

export const createMessage = async (
    accountId: string | Types.ObjectId,
    messages: IMessageCreationTemplate[]
): Promise<void> => {
    const ownerIdMessages = messages.map(m => ({
        ...m,
        date: m.date ?? new Date(),
        ownerId: accountId
    }));
    await Inbox.insertMany(ownerIdMessages);
};

export interface IMessageCreationTemplate extends Omit<IMessageDatabase, "_id" | "date" | "ownerId"> {
    date?: Date;
}

export const exportInboxMessage = (messageDatabase: TMessageDocument, buildLabel?: string): IMessageClient => {
    const messageClient = messageDatabase.toJSON<IMessageClient>();

    if (messageDatabase.globaUpgradeId) {
        messageClient.globaUpgradeId = toOid2(messageDatabase.globaUpgradeId, buildLabel);
    }

    messageClient.date = toMongoDate2(messageDatabase.date, buildLabel);

    if (messageDatabase.startDate && messageDatabase.endDate) {
        messageClient.startDate = toMongoDate2(messageDatabase.startDate, buildLabel);
        messageClient.endDate = toMongoDate2(messageDatabase.endDate, buildLabel);
    } else {
        delete messageClient.startDate;
        delete messageClient.endDate;
    }

    return messageClient;
};
