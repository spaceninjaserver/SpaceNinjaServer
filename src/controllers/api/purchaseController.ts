import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { PurchaseSource } from "../../types/purchaseTypes.ts";
import type { IPurchaseRequest } from "../../types/purchaseTypes.ts";
import { handlePurchase } from "../../services/purchaseService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import { toStoreItem } from "../../services/itemDataService.ts";
import { ExportBundles } from "warframe-public-export-plus";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const purchasePostController: RequestHandler = async (req, res) => {
    const purchaseRequest = JSON.parse(String(req.body)) as IPurchaseRequest;
    const account = await getAccountForRequest(req);
    if (!purchaseRequest.buildLabel && account.BuildLabel) purchaseRequest.buildLabel = account.BuildLabel;
    if (purchaseRequest.buildLabel && account.BuildLabel && purchaseRequest.buildLabel != account.BuildLabel) {
        throw new Error(
            `account logged into ${account.BuildLabel} but is now attempting a purchase in ${purchaseRequest.buildLabel} ?!`
        );
    }
    const accountId = account._id.toString();
    const inventory = await getInventory(accountId);
    const response = await handlePurchase(purchaseRequest, inventory);
    await inventory.save();
    //console.log(JSON.stringify(response, null, 2));
    res.json(response);
    sendWsBroadcastTo(accountId, { update_inventory: true });
};

export const purchaseGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const accountId = account._id.toString();
    let internalName = String(req.query.productName);
    if (!(internalName in ExportBundles)) internalName = toStoreItem(internalName);
    const purchaseRequest: IPurchaseRequest = {
        PurchaseParams: {
            Source: PurchaseSource.Market,
            StoreItem: internalName,
            Quantity: 1,
            UsePremium: Boolean(Number(req.query.usePremium))
        },
        buildLabel: account.BuildLabel!
    };
    if (req.query.durability) purchaseRequest.PurchaseParams.Durability = Number(req.query.durability);
    const inventory = await getInventory(accountId);
    const response = await handlePurchase(purchaseRequest, inventory);
    await inventory.save();
    if (response.Body) {
        let body = response.Body.replace(/\/StoreItems/g, "");
        if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["8.3.0"]) <= 0) {
            body = body.replace(/lvl=\d+;/g, "");
        }
        res.send(body);
    } else {
        if (account.BuildLabel && version_compare(account.BuildLabel, gameToBuildVersion["8.0.0"]) > 0) {
            res.send(String(req.query.productName));
        } else {
            res.json(1);
        }
    }
    sendWsBroadcastTo(accountId, { update_inventory: true });
};
