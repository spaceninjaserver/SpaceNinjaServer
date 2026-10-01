import { toMongoDate2, toOid2 } from "../helpers/inventoryHelpers.ts";
import type { IMessageClient, IMessageDatabase } from "../types/inboxTypes.ts";
import type { TMessageDocument } from "../models/inboxModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { QueryFilter, Types } from "mongoose";
import { buildVersionToInt, wikiDateToBuildVersionInt } from "../helpers/versionHelper.ts";
import {
    ExportRecipes,
    ExportRelics,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import { supplementalSuits, toStoreItem } from "./itemDataService.ts";

const unknownItemsCache = new Map<number, string[]>();
const getItemsUnknownToBuild = (buildVersion: number): string[] => {
    let items = unknownItemsCache.get(buildVersion);
    if (!items) {
        const unknown = new Set<string>();
        const exports: Record<string, { introducedAt?: number }>[] = [
            ExportWarframes,
            supplementalSuits,
            ExportWeapons,
            ExportUpgrades,
            ExportRelics
        ];
        for (const exp of exports) {
            for (const [uniqueName, item] of Object.entries(exp)) {
                if (item.introducedAt && wikiDateToBuildVersionInt(item.introducedAt) > buildVersion) {
                    unknown.add(uniqueName);
                }
            }
        }
        for (const [uniqueName, recipe] of Object.entries(ExportRecipes)) {
            if (unknown.has(recipe.resultType)) {
                unknown.add(uniqueName);
            }
        }
        items = [];
        for (const uniqueName of unknown) {
            items.push(uniqueName, toStoreItem(uniqueName));
        }
        unknownItemsCache.set(buildVersion, items);
    }
    return items;
};

export const getInboxFilter = (
    accountId: string | Types.ObjectId,
    buildLabel: string
): QueryFilter<IMessageDatabase> => {
    const buildVersion = buildVersionToInt(buildLabel);
    const filter: QueryFilter<IMessageDatabase> = {
        ownerId: accountId,
        $or: [{ minBuildVersion: { $exists: false } }, { minBuildVersion: { $lte: buildVersion } }]
    };
    const unknownItems = getItemsUnknownToBuild(buildVersion);
    if (unknownItems.length != 0) {
        filter.$nor = [
            { att: { $in: unknownItems } },
            { "countedAtt.ItemType": { $in: unknownItems } },
            { "gifts.GiftType": { $in: unknownItems } }
        ];
    }
    return filter;
};

export const getMessagesSorted = async (
    accountId: string | Types.ObjectId,
    buildLabel: string,
    afterId?: string | Types.ObjectId
): Promise<TMessageDocument[]> => {
    const query = getInboxFilter(accountId, buildLabel);
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

export const exportInboxMessage = (messageDatabase: TMessageDocument, buildLabel: string): IMessageClient => {
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
