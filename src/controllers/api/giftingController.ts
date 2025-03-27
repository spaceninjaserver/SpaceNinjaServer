import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Account } from "@/src/models/loginModel";
import { createMessage } from "@/src/services/inboxService";
import { getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { IPurchaseParams } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { ExportFlavour } from "warframe-public-export-plus";

export const giftingController: RequestHandler = async (req, res) => {
    const data = getJSONfromString<IGiftingRequest>(String(req.body));
    if (data.PurchaseParams.Source != 0 || !data.PurchaseParams.UsePremium) {
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
    // TODO: Also consider GIFT_MODE_FRIENDS once friends are implemented
    if (inventory.Settings?.GiftMode == "GIFT_MODE_NONE") {
        res.status(400).send("17").end();
        return;
    }

    // TODO: Cannot gift items with mastery requirement to players who are too low level. (Code 2)
    // TODO: Cannot gift archwing items to players that have not completed the archwing quest. (Code 7)
    // TODO: Cannot gift necramechs to players that have not completed heart of deimos. (Code 20)

    const senderAccount = await getAccountForRequest(req);
    const senderInventory = await getInventory(
        senderAccount._id.toString(),
        "PremiumCredits PremiumCreditsFree ActiveAvatarImageType GiftsRemaining"
    );

    if (senderInventory.GiftsRemaining == 0) {
        res.status(400).send("10").end();
        return;
    }
    senderInventory.GiftsRemaining -= 1;

    updateCurrency(senderInventory, data.PurchaseParams.ExpectedPrice, true);
    await senderInventory.save();

    const senderName = getSuffixedName(senderAccount);
    await createMessage(account._id.toString(), [
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
            icon: ExportFlavour[senderInventory.ActiveAvatarImageType].icon,
            gifts: [
                {
                    GiftType: data.PurchaseParams.StoreItem
                }
            ]
        }
    ]);

    res.end();
};

interface IGiftingRequest {
    PurchaseParams: IPurchaseParams;
    Message?: string;
    Recipient?: string;
    RecipientId?: IOid;
    buildLabel: string;
}
