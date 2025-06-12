import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { RequestHandler } from "express";
import { ExportBoosters } from "warframe-public-export-plus";

const I32_MAX = 0x7fffffff;

export const setBoosterController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as { ItemType: string; ExpiryDate: number }[];
    const inventory = await getInventory(accountId, "Boosters");
    const boosters = inventory.Boosters;
    if (
        requests.some(request => {
            if (typeof request.ItemType !== "string") return true;
            if (Object.entries(ExportBoosters).find(([_, item]) => item.typeName === request.ItemType) === undefined)
                return true;
            if (typeof request.ExpiryDate !== "number") return true;
            if (request.ExpiryDate < 0 || request.ExpiryDate > I32_MAX) return true;
            return false;
        })
    ) {
        res.status(400).send("Invalid ItemType provided.");
        return;
    }
    const now = Math.floor(Date.now() / 1000);
    for (const { ItemType, ExpiryDate } of requests) {
        if (ExpiryDate < now) {
            // remove expired boosters
            const index = boosters.findIndex(item => item.ItemType === ItemType);
            if (index !== -1) {
                boosters.splice(index, 1);
            }
        } else {
            const boosterItem = boosters.find(item => item.ItemType === ItemType);
            if (boosterItem) {
                boosterItem.ExpiryDate = ExpiryDate;
            } else {
                boosters.push({ ItemType, ExpiryDate });
            }
        }
    }
    await inventory.save();
    res.end();
};
