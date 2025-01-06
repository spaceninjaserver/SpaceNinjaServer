import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addMods, addRecipes, addMiscItems, addConsumables } from "@/src/services/inventoryService";

export const sellController: RequestHandler = async (req, res) => {
    const payload = JSON.parse(String(req.body)) as ISellRequest;
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);

    // Give currency
    if (payload.SellCurrency == "SC_RegularCredits") {
        inventory.RegularCredits += payload.SellPrice;
    } else if (payload.SellCurrency == "SC_FusionPoints") {
        inventory.FusionPoints += payload.SellPrice;
    } else if (payload.SellCurrency == "SC_PrimeBucks") {
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/PrimeBucks",
                ItemCount: payload.SellPrice
            }
        ]);
    } else if (payload.SellCurrency == "SC_DistillPoints") {
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/DistillPoints",
                ItemCount: payload.SellPrice
            }
        ]);
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
    if (payload.Items.Consumables) {
        const consumablesChanges = [];
        for (const sellItem of payload.Items.Consumables) {
            consumablesChanges.push({
                ItemType: sellItem.String,
                ItemCount: sellItem.Count * -1
            });
        }
        addConsumables(inventory, consumablesChanges);
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
    if (payload.Items.MiscItems) {
        payload.Items.MiscItems.forEach(sellItem => {
            addMiscItems(inventory, [
                {
                    ItemType: sellItem.String,
                    ItemCount: sellItem.Count * -1
                }
            ]);
        });
    }

    await inventory.save();
    res.json({});
};

interface ISellRequest {
    Items: {
        Suits?: ISellItem[];
        LongGuns?: ISellItem[];
        Pistols?: ISellItem[];
        Melee?: ISellItem[];
        Consumables?: ISellItem[];
        Recipes?: ISellItem[];
        Upgrades?: ISellItem[];
        MiscItems?: ISellItem[];
    };
    SellPrice: number;
    SellCurrency:
        | "SC_RegularCredits"
        | "SC_PrimeBucks"
        | "SC_FusionPoints"
        | "SC_DistillPoints"
        | "SC_CrewShipFusionPoints"
        | "SC_Resources";
    buildLabel: string;
}

interface ISellItem {
    String: string; // oid or uniqueName
    Count: number;
}
