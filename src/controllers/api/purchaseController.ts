/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from "express";
import Items from "warframe-items";

import { parseString } from "@/src/helpers/general";
import { PurchaseItem } from "@/src/services/tradeService";

import purchase from "@/static/fixed_responses/purchase.json";

const purchaseController = async (req: Request, res: Response): Promise<void> => {
    const accountId = req.query.accountId;
    if (!accountId) {
        res.status(400).json({ error: "accountId was not provided" });
        return;
    }
    console.log(accountId);
    const body = JSON.parse(req.body);
    const purchaseParams = body.PurchaseParams;
    const storeItem = purchaseParams.StoreItem;
    const quantity = purchaseParams.Quantity;
    const usePremium = purchaseParams.UsePremium;
    const price = purchaseParams.ExpectedPrice;
    const items = new Items({ category: ["All"] });
    const item = items.find(i => {
        return i.uniqueName == storeItem;
    });
    if (item) {
        const response = await PurchaseItem(parseString(accountId), item, quantity, usePremium, price);
        res.json({ InventoryChanges: response });
        return;
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const item_name = storeItem.replace("StoreItems/", "");
        const new_item = items.find(i => {
            return i.uniqueName == item_name;
        });
        if (new_item) {
            const response = await PurchaseItem(parseString(accountId), new_item, quantity, usePremium, price);
            res.json({ InventoryChanges: response });
            return;
        }
    }
    res.json(purchase);
};

export { purchaseController };
