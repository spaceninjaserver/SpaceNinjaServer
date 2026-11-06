import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { toStoreItem } from "../../services/itemDataService.ts";
import { handlePurchase } from "../../services/purchaseService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import { ePurchaseSource } from "../../types/purchaseTypes.ts";
import type { IPurchaseRequest } from "../../types/purchaseTypes.ts";
import { logger } from "../../utils/logger.ts";

export const syndicateFavorController: RequestHandler = async (req, res) => {
    const { AffiliationTag, ProductName } = getJSONfromString<ISyndicateFavorRequest>(String(req.body));
    const account = await getAccountForRequest(req);
    const purchaseRequest: IPurchaseRequest = {
        PurchaseParams: {
            Source: ePurchaseSource.SyndicateFavor,
            StoreItem: toStoreItem(ProductName),
            Quantity: 1,
            UsePremium: false,
            SyndicateTag: AffiliationTag
        },
        buildLabel: getBuildLabel(req, account)
    };
    const inventory = await getInventory(account._id, undefined);
    const response = await handlePurchase(purchaseRequest, inventory);
    await inventory.save();
    logger.trace("purchase response:", response);
    res.json({ AffiliationTag, ProductName });
    sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
};

interface ISyndicateFavorRequest {
    AffiliationTag: string;
    ProductName: string;
}
