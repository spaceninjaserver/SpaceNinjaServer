import { toMongoDate2, toOid2 } from "../helpers/inventoryHelpers.ts";
import type { IMessage, IMessageClient, IMessageDatabase } from "../types/inboxTypes.ts";
import type { TMessageDocument } from "../models/inboxModel.ts";
import { Inbox } from "../models/inboxModel.ts";
import type { QueryFilter, Types } from "mongoose";
import { wikiDateToBuildVersionInt } from "../helpers/versionHelper.ts";
import {
    ExportFlavour,
    ExportRecipes,
    ExportRelics,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import { fromStoreItem, isStoreItem, supplementalSuits, toStoreItem } from "./itemDataService.ts";
import type { IInventoryChanges } from "../types/purchaseTypes.ts";
import { getAccountFromSuffixedName, getSuffixedName, type TAccountDocument } from "./loginService.ts";
import {
    addItems,
    combineInventoryChanges,
    CurrencyType,
    getEffectiveAvatarImageType,
    getInventory,
    updateCurrency
} from "./inventoryService.ts";
import { handleStoreItemAcquisition } from "./purchaseService.ts";

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
    buildVersion: number
): QueryFilter<IMessageDatabase> => {
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
    buildVersion: number,
    afterId?: string | Types.ObjectId
): Promise<TMessageDocument[]> => {
    const query = getInboxFilter(accountId, buildVersion);
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

export const exportInboxMessage = (messageDatabase: TMessageDocument, buildVersion: number): IMessageClient => {
    const messageClient = messageDatabase.toJSON<IMessageClient>();

    if (messageDatabase.globaUpgradeId) {
        messageClient.globaUpgradeId = toOid2(messageDatabase.globaUpgradeId, buildVersion);
    }

    messageClient.date = toMongoDate2(messageDatabase.date, buildVersion);

    if (messageDatabase.startDate && messageDatabase.endDate) {
        messageClient.startDate = toMongoDate2(messageDatabase.startDate, buildVersion);
        messageClient.endDate = toMongoDate2(messageDatabase.endDate, buildVersion);
    } else {
        delete messageClient.startDate;
        delete messageClient.endDate;
    }

    return messageClient;
};

export const goalEventMessagesByTag: Record<string, { start: IMessage; end: IMessage }> = {
    GrineerFomorian: {
        start: {
            sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
            sub: "/Lotus/Language/G1Quests/FomorianRevengeAnnounceTitle",
            msg: "/Lotus/Language/G1Quests/FomorianRevengeAnnounceBody",
            att: ["/Lotus/Types/StoreItems/Consumables/Restoratives/FomorianNegatorBlueprint"],
            icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
            CrossPlatform: true
        },
        end: {
            sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
            sub: "/Lotus/Language/G1Quests/GenericTacAlertSmallRewardMsgTitle",
            msg: "/Lotus/Language/G1Quests/FomorianRevengeDestroyedBody",
            icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
            CrossPlatform: true
        }
    },
    FriendlyFireTacAlert: {
        start: {
            sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
            sub: "/Lotus/Language/G1Quests/RazorbackArmadaAnnounceTitle",
            msg: "/Lotus/Language/G1Quests/RazorbackArmadaAnnounceBody",
            att: ["/Lotus/Types/StoreItems/Consumables/Restoratives/RazorbackCipherBlueprint"],
            icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
            CrossPlatform: true
        },
        end: {
            sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
            sub: "/Lotus/Language/G1Quests/GenericTacAlertSmallRewardMsgTitle",
            msg: "/Lotus/Language/G1Quests/RazorbackArmadaDestroyedBody",
            icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
            CrossPlatform: true
        }
    }
};

export const readMessage = async (
    account: TAccountDocument,
    message: TMessageDocument
): Promise<IInventoryChanges | undefined> => {
    message.r = true;
    await message.save();

    const attachmentItems = message.attVisualOnly ? undefined : message.att;
    const attachmentCountedItems = message.attVisualOnly ? undefined : message.countedAtt;
    if (
        attachmentItems ||
        attachmentCountedItems ||
        message.gifts ||
        message.RegularCredits ||
        message.PremiumCredits
    ) {
        const inventory = await getInventory(account._id, undefined);
        const inventoryChanges: IInventoryChanges = {};
        if (attachmentItems) {
            await addItems(
                inventory,
                attachmentItems.map(attItem => ({
                    ItemType: isStoreItem(attItem) ? fromStoreItem(attItem) : attItem,
                    ItemCount: 1
                })),
                inventoryChanges
            );
        }
        if (attachmentCountedItems) {
            await addItems(inventory, attachmentCountedItems, inventoryChanges);
        }
        if (message.gifts) {
            const sender = await getAccountFromSuffixedName(message.sndr);
            const recipientName = getSuffixedName(account);
            const giftQuantity = message.arg!.find(x => x.Key == "GIFT_QUANTITY")!.Tag as number;
            for (const gift of message.gifts) {
                combineInventoryChanges(
                    inventoryChanges,
                    (await handleStoreItemAcquisition(gift.GiftType, inventory, giftQuantity)).InventoryChanges
                );
                if (sender) {
                    await createMessage(sender._id, [
                        {
                            sndr: recipientName,
                            msg: "/Lotus/Language/Menu/GiftReceivedConfirmationBody",
                            arg: [
                                {
                                    Key: "RECIPIENT_NAME",
                                    Tag: recipientName
                                },
                                {
                                    Key: "GIFT_TYPE",
                                    Tag: gift.GiftType
                                },
                                {
                                    Key: "GIFT_QUANTITY",
                                    Tag: giftQuantity
                                }
                            ],
                            sub: "/Lotus/Language/Menu/GiftReceivedConfirmationSubject",
                            icon: ExportFlavour[getEffectiveAvatarImageType(inventory)].icon,
                            highPriority: true
                        }
                    ]);
                }
            }
        }
        if (message.RegularCredits) {
            updateCurrency(inventory, -message.RegularCredits, CurrencyType.CREDITS, inventoryChanges);
        }
        if (message.PremiumCredits) {
            updateCurrency(inventory, -message.PremiumCredits, CurrencyType.PLATINUM, inventoryChanges);
        }
        await inventory.save();
        return inventoryChanges;
    }
    return undefined;
};
