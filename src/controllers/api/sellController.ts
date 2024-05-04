import { RequestHandler } from "express";
import { ISellRequest } from "@/src/types/sellTypes";
import { getInventory } from "@/src/services/inventoryService";

export const sellController: RequestHandler = async (req, res) => {
    const payload: ISellRequest = JSON.parse(req.body.toString());
    const inventory = await getInventory(req.query.accountId as string);

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
        // TODO
        // Note: sellItem.String is a uniqueName in this case
    }
    if (payload.Items.Upgrades) {
        // TODO
    }

    await inventory.save();
    res.json({});
};
