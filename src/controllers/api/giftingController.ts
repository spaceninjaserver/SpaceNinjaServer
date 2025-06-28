import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Account } from "@/src/models/loginModel";
import { areFriends } from "@/src/services/friendService";
import { createMessage } from "@/src/services/inboxService";
import {
    combineInventoryChanges,
    getEffectiveAvatarImageType,
    getInventory,
    updateCurrency
} from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { handleDailyDealPurchase, handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { IOid } from "@/src/types/commonTypes";
import { IPurchaseParams, IPurchaseResponse, PurchaseSource } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { ExportBundles, ExportFlavour } from "warframe-public-export-plus";

const checkPurchaseParams = (params: IPurchaseParams): boolean => {
    switch (params.Source) {
        case PurchaseSource.Market:
            return params.UsePremium;

        case PurchaseSource.DailyDeal:
            return true;
    }
    return false;
};

export const giftingController: RequestHandler = async (req, res) => {
    const data = getJSONfromString<IGiftingRequest>(String(req.body));
    if (!checkPurchaseParams(data.PurchaseParams)) {
        throw new Error(`unexpected purchase params in gifting request: ${String(req.body)}`);
    }

    const account = await Account.findOne(
        data.RecipientId ? { _id: data.RecipientId.$oid } : { DisplayName: data.Recipient }
    );
    if (!account) {
        res.status(400).send("9").end();
        return;
    }
    const inventory = await getInventory(account._id.toString(), "Suits Settings");

    // Cannot gift items to players that have not completed the tutorial.
    if (inventory.Suits.length == 0) {
        res.status(400).send("14").end();
        return;
    }

    // Cannot gift to players who have gifting disabled.
    const senderAccount = await getAccountForRequest(req);
    if (
        inventory.Settings?.GiftMode == "GIFT_MODE_NONE" ||
        (inventory.Settings?.GiftMode == "GIFT_MODE_FRIENDS" && !(await areFriends(account._id, senderAccount._id)))
    ) {
        res.status(400).send("17").end();
        return;
    }

    // TODO: Cannot gift items with mastery requirement to players who are too low level. (Code 2)
    // TODO: Cannot gift archwing items to players that have not completed the archwing quest. (Code 7)
    // TODO: Cannot gift necramechs to players that have not completed heart of deimos. (Code 20)

    const senderInventory = await getInventory(senderAccount._id.toString());

    if (senderInventory.GiftsRemaining == 0) {
        res.status(400).send("10").end();
        return;
    }
    senderInventory.GiftsRemaining -= 1;

    const response: IPurchaseResponse = {
        InventoryChanges: {}
    };
    if (data.PurchaseParams.Source == PurchaseSource.DailyDeal) {
        await handleDailyDealPurchase(senderInventory, data.PurchaseParams, response);
    } else {
        updateCurrency(senderInventory, data.PurchaseParams.ExpectedPrice, true, response.InventoryChanges);
    }
    if (data.PurchaseParams.StoreItem in ExportBundles) {
        const bundle = ExportBundles[data.PurchaseParams.StoreItem];
        if (bundle.giftingBonus) {
            combineInventoryChanges(
                response.InventoryChanges,
                (await handleStoreItemAcquisition(bundle.giftingBonus, senderInventory)).InventoryChanges
            );
        }
    }
    await senderInventory.save();

    const senderName = getSuffixedName(senderAccount);
    await createMessage(account._id, [
        {
            sndr: senderName,
            msg: data.Message || "/Lotus/Language/Menu/GiftReceivedBody_NoCustomMessage",
            arg: [
                {
                    Key: "GIFTER_NAME",
                    Tag: senderName
                },
                {
                    Key: "GIFT_QUANTITY",
                    Tag: data.PurchaseParams.Quantity
                }
            ],
            sub: "/Lotus/Language/Menu/GiftReceivedSubject",
            icon: ExportFlavour[getEffectiveAvatarImageType(senderInventory)].icon,
            gifts: [
                {
                    GiftType: data.PurchaseParams.StoreItem
                }
            ]
        }
    ]);

    res.json(response);
};

interface IGiftingRequest {
    PurchaseParams: IPurchaseParams;
    Message?: string;
    Recipient?: string;
    RecipientId?: IOid;
    buildLabel: string;
}
