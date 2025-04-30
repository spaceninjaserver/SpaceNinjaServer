import { RequestHandler } from "express";
import { Inbox } from "@/src/models/inboxModel";
import {
    createMessage,
    createNewEventMessages,
    deleteAllMessagesRead,
    deleteMessageRead,
    getAllMessagesSorted,
    getMessage
} from "@/src/services/inboxService";
import { getAccountForRequest, getAccountFromSuffixedName, getSuffixedName } from "@/src/services/loginService";
import { addItems, combineInventoryChanges, getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";
import { ExportFlavour } from "warframe-public-export-plus";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { fromStoreItem, isStoreItem } from "@/src/services/itemDataService";

export const inboxController: RequestHandler = async (req, res) => {
    const { deleteId, lastMessage: latestClientMessageId, messageId } = req.query;

    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();

    if (deleteId) {
        if (deleteId === "DeleteAllRead") {
            await deleteAllMessagesRead(accountId);
            res.status(200).end();
            return;
        }

        await deleteMessageRead(deleteId as string);
        res.status(200).end();
    } else if (messageId) {
        const message = await getMessage(messageId as string);
        message.r = true;
        await message.save();

        const attachmentItems = message.attVisualOnly ? undefined : message.att;
        const attachmentCountedItems = message.attVisualOnly ? undefined : message.countedAtt;

        if (!attachmentItems && !attachmentCountedItems && !message.gifts) {
            res.status(200).end();
            return;
        }

        const inventory = await getInventory(accountId);
        const inventoryChanges = {};
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
                            icon: ExportFlavour[inventory.ActiveAvatarImageType].icon,
                            highPriority: true
                        }
                    ]);
                }
            }
        }
        await inventory.save();
        res.json({ InventoryChanges: inventoryChanges });
    } else if (latestClientMessageId) {
        await createNewEventMessages(req);
        const messages = await Inbox.find({ ownerId: accountId }).sort({ date: 1 });

        const latestClientMessage = messages.find(m => m._id.toString() === latestClientMessageId);

        if (!latestClientMessage) {
            logger.debug(`this should only happen after DeleteAllRead `);
            res.json({ Inbox: messages });
            return;
        }
        const newMessages = messages.filter(m => m.date > latestClientMessage.date);

        if (newMessages.length === 0) {
            res.send("no-new");
            return;
        }

        res.json({ Inbox: newMessages });
    } else {
        //newly created event messages must be newer than account.LatestEventMessageDate
        await createNewEventMessages(req);
        const messages = await getAllMessagesSorted(accountId);
        const inbox = messages.map(m => m.toJSON());
        res.json({ Inbox: inbox });
    }
};
