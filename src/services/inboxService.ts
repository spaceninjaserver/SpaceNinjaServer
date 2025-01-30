import { IMessageDatabase, Inbox } from "@/src/models/inboxModel";
import { getAccountForRequest } from "@/src/services/loginService";
import { HydratedDocument } from "mongoose";
import { Request } from "express";
import messages from "@/static/fixed_responses/messages.json";
import { getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";

export const getAllMessagesSorted = async (accountId: string): Promise<IMessageDatabase[]> => {
    const inbox = await Inbox.find({ ownerId: accountId }).sort({ date: -1 });
    return inbox.map(message => message.toJSON());
};

export const getMessage = async (messageId: string): Promise<HydratedDocument<IMessageDatabase>> => {
    const message = await Inbox.findOne({ _id: messageId });

    if (!message) {
        throw new Error(`Message not found ${messageId}`);
    }
    return message;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
    await Inbox.findOneAndDelete({ _id: messageId });
};

export const deleteAllMessages = async (accountId: string): Promise<void> => {
    await Inbox.deleteMany({ ownerId: accountId, r: true });
};

export const createNewEventMessages = async (req: Request) => {
    const account = await getAccountForRequest(req);
    const latestEventMessageDate = account.LatestEventMessageDate;

    //TODO: is baroo there? send message
    const newEventMessages = messages.Messages.filter(m => new Date(m.eventMessageDate) > latestEventMessageDate);

    if (newEventMessages.length === 0) {
        logger.debug(`No new event messages. Latest event message date: ${latestEventMessageDate.toISOString()}`);
        return;
    }

    const newEventMessagesSorted = newEventMessages.sort(
        (a, b) => new Date(a.eventMessageDate).getTime() - new Date(b.eventMessageDate).getTime()
    );
    const savedEventMessages = await createMessage(account._id.toString(), newEventMessages);
    logger.debug("created event messages", savedEventMessages);

    const latestEventMessage = savedEventMessages.reduce((prev, current) =>
        prev.date > current.date ? prev : current
    );

    account.LatestEventMessageDate = latestEventMessage.date;
    await account.save();
};

export const createMessage = async (accountId: string, message: IMessageCreationTemplate[]) => {
    //TODO: createmany
    const savedMessages = [];
    for (const msg of message) {
        const savedMessage = await Inbox.create({
            ...msg,
            ownerId: accountId
        });
        savedMessages.push(savedMessage);
    }
    return savedMessages;
};

export interface IMessageCreationTemplate extends Omit<IMessageDatabase, "_id" | "date" | "ownerId"> {
    ownerId?: string;
}
