import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { addMiscItem, getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { logger } from "../../utils/logger.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";

export const feedPrinceController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "MiscItems NokkoColony NodeIntrosCompleted");
    const payload = getJSONfromString<IFeedPrinceRequest>(String(req.body));

    switch (payload.Mode) {
        case "r": {
            inventory.NokkoColony ??= {
                FeedLevel: 0,
                JournalEntries: []
            };
            const InventoryChanges: IInventoryChanges = {};
            inventory.NokkoColony.FeedLevel += payload.Amount;
            if (
                (!inventory.NodeIntrosCompleted.includes("CompletedVision1") && inventory.NokkoColony.FeedLevel > 20) ||
                (!inventory.NodeIntrosCompleted.includes("CompletedVision2") && inventory.NokkoColony.FeedLevel > 60)
            ) {
                res.json({
                    FeedSucceeded: false,
                    FeedLevel: inventory.NokkoColony.FeedLevel - payload.Amount,
                    InventoryChanges
                } satisfies IFeedPrinceResponse);
            } else {
                addMiscItem(
                    inventory,
                    "/Lotus/Types/Items/MiscItems/MushroomFood",
                    payload.Amount * -1,
                    InventoryChanges
                );
                await inventory.save();
                res.json({
                    FeedSucceeded: true,
                    FeedLevel: inventory.NokkoColony.FeedLevel,
                    InventoryChanges
                } satisfies IFeedPrinceResponse);
            }
            break;
        }

        default:
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
            throw new Error(`unknown feedPrince mode: ${payload.Mode}`);
    }
};

interface IFeedPrinceRequest {
    Mode: string; // r
    Amount: number;
}

interface IFeedPrinceResponse {
    FeedSucceeded: boolean;
    FeedLevel: number;
    InventoryChanges: IInventoryChanges;
}
