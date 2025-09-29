import type { IMessageDatabase } from "../models/inboxModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import { getAccountForRequest } from "./loginService.ts";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import type { Request } from "express";
import { unixTimesInMs } from "../constants/timeConstants.ts";
import { config } from "./configService.ts";

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

export const deleteAllMessagesReadNonCin = async (accountId: string): Promise<void> => {
    await Inbox.deleteMany({ ownerId: accountId, r: true, cinematic: null });
};

export const createNewEventMessages = async (req: Request): Promise<void> => {
    const account = await getAccountForRequest(req);
    const newEventMessages: IMessageCreationTemplate[] = [];

    // Baro
    const baroIndex = Math.trunc((Date.now() - 910800000) / (unixTimesInMs.day * 14));
    const baroStart = baroIndex * (unixTimesInMs.day * 14) + 910800000;
    const baroActualStart = baroStart + unixTimesInMs.day * (config.worldState?.baroAlwaysAvailable ? 0 : 12);
    if (Date.now() >= baroActualStart && account.LatestEventMessageDate.getTime() < baroActualStart) {
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

    // BUG: Deleting the inbox message manually means it'll just be automatically re-created. This is because we don't use startDate/endDate for these config-toggled events.
    const promises = [];
    if (config.worldState?.creditBoost) {
        promises.push(
            (async (): Promise<void> => {
                if (!(await Inbox.exists({ ownerId: account._id, globaUpgradeId: "5b23106f283a555109666672" }))) {
                    newEventMessages.push({
                        globaUpgradeId: new Types.ObjectId("5b23106f283a555109666672"),
                        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
                        sub: "/Lotus/Language/Items/EventDoubleCreditsName",
                        msg: "/Lotus/Language/Items/EventDoubleCreditsDesc",
                        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
                        startDate: new Date(),
                        CrossPlatform: true
                    });
                }
            })()
        );
    }
    if (config.worldState?.affinityBoost) {
        promises.push(
            (async (): Promise<void> => {
                if (!(await Inbox.exists({ ownerId: account._id, globaUpgradeId: "5b23106f283a555109666673" }))) {
                    newEventMessages.push({
                        globaUpgradeId: new Types.ObjectId("5b23106f283a555109666673"),
                        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
                        sub: "/Lotus/Language/Items/EventDoubleAffinityName",
                        msg: "/Lotus/Language/Items/EventDoubleAffinityDesc",
                        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
                        startDate: new Date(),
                        CrossPlatform: true
                    });
                }
            })()
        );
    }
    if (config.worldState?.resourceBoost) {
        promises.push(
            (async (): Promise<void> => {
                if (!(await Inbox.exists({ ownerId: account._id, globaUpgradeId: "5b23106f283a555109666674" }))) {
                    newEventMessages.push({
                        globaUpgradeId: new Types.ObjectId("5b23106f283a555109666674"),
                        sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
                        sub: "/Lotus/Language/Items/EventDoubleResourceName",
                        msg: "/Lotus/Language/Items/EventDoubleResourceDesc",
                        icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
                        startDate: new Date(),
                        CrossPlatform: true
                    });
                }
            })()
        );
    }
    if (config.worldState?.galleonOfGhouls) {
        promises.push(
            (async (): Promise<void> => {
                if (!(await Inbox.exists({ ownerId: account._id, goalTag: "GalleonRobbery" }))) {
                    newEventMessages.push({
                        sndr: "/Lotus/Language/Bosses/BossCouncilorVayHek",
                        sub: "/Lotus/Language/Events/GalleonRobberyIntroMsgTitle",
                        msg: "/Lotus/Language/Events/GalleonRobberyIntroMsgDesc",
                        icon: "/Lotus/Interface/Icons/Npcs/VayHekPortrait.png",
                        transmission: "/Lotus/Sounds/Dialog/GalleonOfGhouls/DGhoulsWeekOneInbox0010VayHek",
                        att: ["/Lotus/Upgrades/Skins/Events/OgrisOldSchool"],
                        startDate: new Date(),
                        goalTag: "GalleonRobbery"
                    });
                }
            })()
        );
    }
    await Promise.all(promises);

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
