import { toMongoDate2, toOid2 } from "../helpers/inventoryHelpers.ts";
import type { IMessageClient, IMessageDatabase, TMessageDocument } from "../models/inboxModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { QueryFilter, Types } from "mongoose";
import { buildVersionToInt } from "./loginService.ts";

export const getMessagesSorted = async (
    accountId: string | Types.ObjectId,
    buildLabel: string | undefined,
    afterId?: string | Types.ObjectId
): Promise<TMessageDocument[]> => {
    const query: QueryFilter<IMessageDatabase> = { ownerId: accountId };
    if (buildLabel) {
        query.$or = [
            { minBuildVersion: { $exists: false } },
            { minBuildVersion: { $lte: buildVersionToInt(buildLabel) } }
        ];
    }
    if (afterId) {
        query._id = { $gt: afterId };
    }
    return await Inbox.find(query).sort({ date: -1 });
};

export const deleteMessageRead = async (messageId: string | Types.ObjectId): Promise<void> => {
    await Inbox.findOneAndDelete({ _id: messageId, r: true });
};

export const deleteAllMessagesRead = async (accountId: string | Types.ObjectId): Promise<void> => {
    await Inbox.deleteMany({ ownerId: accountId, r: true });
};

export const deleteAllMessagesReadNonCin = async (accountId: string | Types.ObjectId): Promise<void> => {
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
