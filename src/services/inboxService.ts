import { IMessageDatabase, Inbox } from "@/src/models/inboxModel";
import { getAccountForRequest } from "@/src/services/loginService";
import { HydratedDocument, Types } from "mongoose";
import { Request } from "express";
import { unixTimesInMs } from "../constants/timeConstants";
import { config } from "./configService";

export const getAllMessagesSorted = async (accountId: string): Promise<HydratedDocument<IMessageDatabase>[]> => {
    const inbox = await Inbox.find({ ownerId: accountId }).sort({ date: -1 });
    return inbox;
};

export const getMessage = async (messageId: string): Promise<HydratedDocument<IMessageDatabase>> => {
    const message = await Inbox.findById(messageId);

    if (!message) {
        throw new Error(`Message not found ${messageId}`);
    }
    return message;
};

export const deleteMessageRead = async (messageId: string): Promise<void> => {
    await Inbox.findOneAndDelete({ _id: messageId, r: true });
};

export const deleteAllMessagesRead = async (accountId: string): Promise<void> => {
    await Inbox.deleteMany({ ownerId: accountId, r: true });
};

export const createNewEventMessages = async (req: Request): Promise<void> => {
    const account = await getAccountForRequest(req);
    const newEventMessages: IMessageCreationTemplate[] = [];

    // Baro
    const baroIndex = Math.trunc((Date.now() - 910800000) / (unixTimesInMs.day * 14));
    const baroStart = baroIndex * (unixTimesInMs.day * 14) + 910800000;
    const baroActualStart = baroStart + unixTimesInMs.day * (config.baroAlwaysAvailable ? 0 : 12);
    if (account.LatestEventMessageDate.getTime() < baroActualStart) {
        newEventMessages.push({
            sndr: "/Lotus/Language/G1Quests/VoidTraderName",
            sub: "/Lotus/Language/CommunityMessages/VoidTraderAppearanceTitle",
            msg: "/Lotus/Language/CommunityMessages/VoidTraderAppearanceMessage",
            icon: "/Lotus/Interface/Icons/Npcs/BaroKiTeerPortrait.png",
            startDate: new Date(baroActualStart),
            endDate: new Date(baroStart + unixTimesInMs.day * 14),
            CrossPlatform: true,
            arg: [
                {
                    Key: "NODE_NAME",
                    Tag: ["EarthHUB", "MercuryHUB", "SaturnHUB", "PlutoHUB"][baroIndex % 4]
                }
            ],
            date: new Date(baroActualStart)
        });
    }

    if (newEventMessages.length === 0) {
        return;
    }

    await createMessage(account._id, newEventMessages);

    const latestEventMessage = newEventMessages.reduce((prev, current) =>
        prev.startDate! > current.startDate! ? prev : current
    );
    account.LatestEventMessageDate = new Date(latestEventMessage.startDate!);
    await account.save();
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
