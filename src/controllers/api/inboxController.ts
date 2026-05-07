import type { RequestHandler } from "express";
import { Inbox, type IMessageClient } from "../../models/inboxModel.ts";
import {
    createMessage,
    deleteAllMessagesRead,
    deleteAllMessagesReadNonCin,
    deleteMessageRead,
    exportInboxMessage,
    getMessagesSorted,
    type IMessageCreationTemplate
} from "../../services/inboxService.ts";
import {
    buildVersionToInt,
    getAccountForRequest,
    getAccountFromSuffixedName,
    getSuffixedName,
    type TAccountDocument
} from "../../services/loginService.ts";
import {
    addItems,
    combineInventoryChanges,
    getEffectiveAvatarImageType,
    getInventory,
    updateCurrency
} from "../../services/inventoryService.ts";
import { logger } from "../../utils/logger.ts";
import { ExportFlavour } from "warframe-public-export-plus";
import { handleStoreItemAcquisition } from "../../services/purchaseService.ts";
import { fromStoreItem, isStoreItem } from "../../services/itemDataService.ts";
import type { IOid } from "../../types/commonTypes.ts";
import { unixTimesInMs } from "../../constants/timeConstants.ts";
import { config } from "../../services/configService.ts";
import { Types } from "mongoose";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const inboxController: RequestHandler = async (req, res) => {
    const { deleteId, lastMessage: latestClientMessageId, messageId } = req.query;

    const account = await getAccountForRequest(req);
    const buildLabel = "ignoreBuildLabel" in req.query ? undefined : account.BuildLabel;

    if (deleteId) {
        if (deleteId === "DeleteAllRead") {
            await deleteAllMessagesRead(account._id);
        } else if (deleteId === "DeleteAllReadNonCin") {
            await deleteAllMessagesReadNonCin(account._id);
        } else {
            await deleteMessageRead(parseOid(deleteId as string));
        }
        res.status(200).end();
    } else if (messageId) {
        const message = await Inbox.findById(parseOid(messageId as string));
        if (!message) {
            // in this case, we must send a 200 response to avoid softlocking the client
            logger.warn(`client just read a message we don't know (anymore), attachments will not be received`);
            res.end();
            return;
        }
        message.r = true;
        await message.save();

        const attachmentItems = message.attVisualOnly ? undefined : message.att;
        const attachmentCountedItems = message.attVisualOnly ? undefined : message.countedAtt;

        if (!attachmentItems && !attachmentCountedItems && !message.gifts) {
            res.status(200).end();
            return;
        }

        const inventory = await getInventory(account._id, undefined);
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
                            icon: ExportFlavour[getEffectiveAvatarImageType(inventory)].icon,
                            highPriority: true
                        }
                    ]);
                }
            }
        }
        if (message.RegularCredits) {
            updateCurrency(inventory, -message.RegularCredits, false, inventoryChanges);
        }
        await inventory.save();
        res.json({ InventoryChanges: inventoryChanges });
    } else if (latestClientMessageId) {
        await createNewEventMessages(account);
        const newMessages = await getMessagesSorted(account._id, buildLabel, parseOid(latestClientMessageId as string));

        if (newMessages.length === 0) {
            res.send("no-new");
            return;
        }

        res.json({ Inbox: newMessages.map(x => exportInboxMessage(x, buildLabel)) satisfies IMessageClient[] });
    } else {
        //newly created event messages must be newer than account.LatestEventMessageDate
        await createNewEventMessages(account);
        const messages = await getMessagesSorted(account._id, buildLabel);
        const inbox = messages.map(x => exportInboxMessage(x, buildLabel));
        res.json({ Inbox: inbox satisfies IMessageClient[] });
    }
};

const createNewEventMessages = async (account: TAccountDocument): Promise<void> => {
    const newEventMessages: IMessageCreationTemplate[] = [];

    // Baro
    const baroIndex = Math.trunc((Date.now() - 910800000) / (unixTimesInMs.day * 14));
    const baroRelayOverride = config.worldState?.baroRelayOverride;
    const baroNodeIndex = baroRelayOverride && baroRelayOverride > 0 ? baroRelayOverride - 1 : baroIndex % 4;
    const baroNode = ["EarthHUB", "MercuryHUB", "SaturnHUB", "PlutoHUB"][baroNodeIndex];
    const baroStart = baroIndex * (unixTimesInMs.day * 14) + 910800000;
    const prevBaroEnd = (baroIndex - 1) * (unixTimesInMs.day * 14) + 910800000;
    const baroEnd = baroStart + unixTimesInMs.day * 14;
    const baroActualStart = baroStart + unixTimesInMs.day * (config.worldState?.baroAlwaysAvailable ? 0 : 12);
    const evilBaroStage =
        account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["40.0.0"]) < 0
            ? 0
            : (config.worldState?.evilBaroStage ?? 0);
    const evilBaroTransmission = [
        "",
        "/Lotus/Sounds/Dialog/BaroHalloween/Week1InboxMessage/DWeek1InboxMessage01290Baro",
        "/Lotus/Sounds/Dialog/BaroHalloween/Week2InboxMessage/DWeek2InboxMessage0060Baro",
        "/Lotus/Sounds/Dialog/BaroHalloween/Week3InboxMessage/DWeek3InboxMessage0120Baro",
        "/Lotus/Sounds/Dialog/BaroHalloween/Week4InboxMessage/DWeek4InboxMessage0170Baro"
    ][evilBaroStage];
    if (Date.now() >= baroActualStart && account.LatestEventMessageDate.getTime() < baroActualStart) {
        newEventMessages.push({
            sndr: "/Lotus/Language/G1Quests/VoidTraderName",
            sub:
                evilBaroStage > 0
                    ? "/Lotus/Language/BaroHalloween/HalloweenInboxTitle"
                    : "/Lotus/Language/CommunityMessages/VoidTraderAppearanceTitle",
            msg:
                evilBaroStage > 0
                    ? `/Lotus/Language/BaroHalloween/HalloweenInboxWeek${evilBaroStage}Body`
                    : "/Lotus/Language/CommunityMessages/VoidTraderAppearanceMessage",
            icon:
                evilBaroStage > 0
                    ? "/Lotus/Interface/Icons/Npcs/EvilBaro.png"
                    : "/Lotus/Interface/Icons/Npcs/BaroKiTeerPortrait.png",
            transmission: evilBaroTransmission,
            startDate: new Date(baroActualStart),
            endDate: new Date(baroEnd),
            CrossPlatform: true,
            arg: [
                {
                    Key: "NODE_NAME",
                    Tag: baroNode
                }
            ],
            date: new Date(baroActualStart),
            minBuildVersion:
                evilBaroStage > 0
                    ? buildVersionToInt(gameToBuildVersion["40.0.0"])
                    : buildVersionToInt(gameToBuildVersion["18.18.0"]) // Baro was introduced in U15.6. Unclear when exactly this inbox message was introduced, tho.
        });
    }
    if (Date.now() >= prevBaroEnd && account.LatestEventMessageDate.getTime() < prevBaroEnd && evilBaroStage == 4) {
        newEventMessages.push({
            sndr: "/Lotus/Language/G1Quests/VoidTraderName",
            sub: "/Lotus/Language/BaroHalloween/HalloweenInboxEndingTitle",
            msg: "/Lotus/Language/BaroHalloween/HalloweenInboxEndingBody",
            icon: "/Lotus/Interface/Icons/Npcs/BaroKiTeerPortrait.png",
            transmission: "/Lotus/Sounds/Dialog/BaroHalloween/EndingInboxMessage/DEndingInboxMessage0230Baro",
            startDate: new Date(prevBaroEnd),
            endDate: new Date(baroActualStart),
            att: ["/Lotus/Types/StoreItems/AvatarImages/ImageBaroKiteerEvil"],
            CrossPlatform: true,
            date: new Date(prevBaroEnd),
            minBuildVersion: buildVersionToInt(gameToBuildVersion["40.0.0"])
        });
    }

    if (config.worldState?.creditBoost && !account.receivedEventMessage_creditBoost) {
        account.receivedEventMessage_creditBoost = true;
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
    if (config.worldState?.affinityBoost && !account.receivedEventMessage_affinityBoost) {
        account.receivedEventMessage_affinityBoost = true;
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
    if (config.worldState?.resourceBoost && !account.receivedEventMessage_resourceBoost) {
        account.receivedEventMessage_resourceBoost = true;
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
    if (config.worldState?.galleonOfGhouls && !account.receivedEventMessage_galleonOfGhouls) {
        account.receivedEventMessage_galleonOfGhouls = true;
        newEventMessages.push({
            sndr: "/Lotus/Language/Bosses/BossCouncilorVayHek",
            sub: "/Lotus/Language/Events/GalleonRobberyIntroMsgTitle",
            msg: "/Lotus/Language/Events/GalleonRobberyIntroMsgDesc",
            icon: "/Lotus/Interface/Icons/Npcs/VayHekPortrait.png",
            transmission: "/Lotus/Sounds/Dialog/GalleonOfGhouls/DGhoulsWeekOneInbox0010VayHek",
            att: ["/Lotus/Upgrades/Skins/Events/OgrisOldSchool"],
            startDate: new Date(),
            goalTag: "GalleonRobbery",
            minBuildVersion: buildVersionToInt(gameToBuildVersion["38.5.11"])
        });
    }
    if (config.worldState?.bloodOfPerita && !account.receivedEventMessage_bloodOfPerita) {
        account.receivedEventMessage_bloodOfPerita = true;
        newEventMessages.push({
            sndr: "/Lotus/Language/1999/MessengerRoatheName",
            sub: "/Lotus/Language/TauPrequel/TauPrequelFinal/RoathesValorIntroInboxTitle",
            msg: "/Lotus/Language/TauPrequel/TauPrequelFinal/RoathesValorIntroInbox",
            icon: "/Lotus/Interface/Icons/Npcs/Roathe.png",
            startDate: new Date(),
            transmission: "/Lotus/Sounds/Dialog/Tau/RoatheEventOutroInbox/DRoatheEventIntroInbox0010Roathe",
            QuestReq: "/Lotus/Types/Keys/TauPrequel/TauPrequelQuestKeyChain",
            minBuildVersion: buildVersionToInt(gameToBuildVersion["41.0.0"])
        });
    }
    if (config.worldState?.longShadow && !account.receivedEventMessage_longShadow) {
        account.receivedEventMessage_longShadow = true;
        newEventMessages.push({
            sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
            sub: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertCommunityMsgTitle",
            msg: "/Lotus/Language/G1Quests/ProjectNightwatchTacAlertCommunityMsgDesc",
            icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
            startDate: new Date(),
            goalTag: "NightwatchTacAlert"
        });
    }
    if (config.worldState?.operationAtramentum && !account.receivedEventMessage_operationAtramentum) {
        account.receivedEventMessage_operationAtramentum = true;
        newEventMessages.push({
            sndr: "/Lotus/Language/Shadowgrapher/ZorbaName",
            sub: "/Lotus/Language/Shadowgrapher/ShadowgrapherEventInboxSubject",
            msg: "/Lotus/Language/Shadowgrapher/ShadowgrapherEventInboxBody",
            icon: "/Lotus/Interface/Icons/Npcs/Syndicates/Zorba.png",
            transmission: "/Lotus/Sounds/Dialog/Shadowgrapher/Vendor/DSGInbox0011AspirantZorba",
            startDate: new Date(),
            QuestReq: "/Lotus/Types/Keys/PriestFrameQuest/PriestQuestKeyChain",
            CrossPlatform: true,
            minBuildVersion: buildVersionToInt(gameToBuildVersion["42.0.0"])
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

// 33.6.0 has query arguments like lastMessage={"$oid":"68112baebf192e786d1502bb"} instead of lastMessage=68112baebf192e786d1502bb
const parseOid = (oid: string): string => {
    if (oid[0] == "{") {
        return (JSON.parse(oid) as IOid).$oid;
    }
    return oid;
};
