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

    //TODO: is baroo there? create these kind of messages too (periodical messages)
    const newEventMessages = messages.Messages.filter(m => new Date(m.eventMessageDate) > latestEventMessageDate);

    if (newEventMessages.length === 0) {
        logger.debug(`No new event messages. Latest event message date: ${latestEventMessageDate.toISOString()}`);
        return;
    }

    const savedEventMessages = await createMessage(account._id.toString(), newEventMessages);
    logger.debug("created event messages", savedEventMessages);

    const latestEventMessage = newEventMessages.reduce((prev, current) =>
        prev.eventMessageDate > current.eventMessageDate ? prev : current
    );

    console.log("latestEventMessage", latestEventMessage);
    account.LatestEventMessageDate = new Date(latestEventMessage.eventMessageDate);
    await account.save();
};

export const createMessage = async (accountId: string, messages: IMessageCreationTemplate[]) => {
    const ownerIdMessages = messages.map(m => ({
        ...m,
        ownerId: accountId
    }));

    const savedMessages = await Inbox.insertMany(ownerIdMessages);
    return savedMessages;
};

export interface IMessageCreationTemplate extends Omit<IMessageDatabase, "_id" | "date" | "ownerId"> {
    ownerId?: string;
}
