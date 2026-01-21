import type { IMessageDatabase } from "../models/inboxModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { HydratedDocument, Types } from "mongoose";

export const getAllMessagesSorted = async (accountId: string): Promise<HydratedDocument<IMessageDatabase>[]> => {
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
