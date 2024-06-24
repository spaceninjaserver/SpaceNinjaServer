import { RequestHandler } from "express";
import { ISellRequest } from "@/src/types/sellTypes";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addMods, addRecipes } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const sellController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as ISellRequest;
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);

    // Give currency
    if (payload.SellCurrency == "SC_RegularCredits") {
        inventory.RegularCredits += payload.SellPrice;
    } else if (payload.SellCurrency == "SC_FusionPoints") {
        inventory.FusionPoints += payload.SellPrice;
    } else {
        throw new Error("Unknown SellCurrency: " + payload.SellCurrency);
    }

    // Remove item(s)
    if (payload.Items.Suits) {
        payload.Items.Suits.forEach(sellItem => {
            inventory.Suits.pull({ _id: sellItem.String });
        });
    }
    if (payload.Items.LongGuns) {
        payload.Items.LongGuns.forEach(sellItem => {
            inventory.LongGuns.pull({ _id: sellItem.String });
        });
    }
    if (payload.Items.Pistols) {
        payload.Items.Pistols.forEach(sellItem => {
            inventory.Pistols.pull({ _id: sellItem.String });
        });
    }
    if (payload.Items.Melee) {
        payload.Items.Melee.forEach(sellItem => {
            inventory.Melee.pull({ _id: sellItem.String });
        });
    }
    if (payload.Items.Recipes) {
        const recipeChanges = [];
        for (const sellItem of payload.Items.Recipes) {
            recipeChanges.push({
                ItemType: sellItem.String,
                ItemCount: sellItem.Count * -1
            });
        }
        addRecipes(inventory, recipeChanges);
    }
    if (payload.Items.Upgrades) {
        payload.Items.Upgrades.forEach(sellItem => {
            if (sellItem.Count == 0) {
                inventory.Upgrades.pull({ _id: sellItem.String });
            } else {
                addMods(inventory, [
                    {
                        ItemType: sellItem.String,
                        ItemCount: sellItem.Count * -1
                    }
                ]);
            }
        });
    }

    await inventory.save();
    res.json({});
};
