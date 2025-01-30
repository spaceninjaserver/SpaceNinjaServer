import { RequestHandler } from "express";
import { Inbox } from "@/src/models/inboxModel";
import { createNewEventMessages, getAllMessagesSorted, getMessage } from "@/src/services/inboxService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addItems, getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";

export const inboxController: RequestHandler = async (req, res) => {
    const { deleteId, lastMessage: latestClientMessageId, messageId } = req.query;

    const accountId = await getAccountIdForRequest(req);

    if (deleteId) {
        if (deleteId === "DeleteAllRead") {
            await Inbox.deleteMany({ ownerId: accountId, r: true });
            res.status(200).end();
            return;
        }

        await Inbox.findOneAndDelete({ _id: deleteId, r: true });
        res.status(200).end();
    } else if (messageId) {
        const message = await getMessage(messageId as string);
        message.r = true;
        const attachmentItems = message.att;
        const attachmentCountedItems = message.countedAtt;

        if (!attachmentItems && !attachmentCountedItems) {
            await message.save();

            res.status(200).end();
            return;
        }

        const inventory = await getInventory(accountId);
        const inventoryChanges = {};
        if (attachmentItems) {
            await addItems(
                inventory,
                attachmentItems.map(attItem => ({ ItemType: attItem, ItemCount: 1 })),
                inventoryChanges
            );
        }
        if (attachmentCountedItems) {
            await addItems(inventory, attachmentCountedItems, inventoryChanges);
        }
        await inventory.save();
        await message.save();

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
        res.json({ Inbox: messages });
    }
};
