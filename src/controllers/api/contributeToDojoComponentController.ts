import { getDojoClient, getGuildForRequestEx, scaleRequiredCount } from "@/src/services/guildService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { ExportDojoRecipes } from "warframe-public-export-plus";

export const contributeToDojoComponentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    // Any clan member should have permission to contribute although notably permission is denied if they have not crafted the dojo key and were simply invited in.
    const request = JSON.parse(String(req.body)) as IContributeToDojoComponentRequest;
    const component = guild.DojoComponents.id(request.ComponentId)!;
    const componentMeta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf)!;

    component.RegularCredits ??= 0;
    if (component.RegularCredits + request.RegularCredits > scaleRequiredCount(componentMeta.price)) {
        request.RegularCredits = scaleRequiredCount(componentMeta.price) - component.RegularCredits;
    }
    component.RegularCredits += request.RegularCredits;
    const inventoryChanges: IInventoryChanges = updateCurrency(inventory, request.RegularCredits, false);

    component.MiscItems ??= [];
    const miscItemChanges: IMiscItem[] = [];
    for (const ingredientContribution of request.IngredientContributions) {
        const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredientContribution.ItemType);
        if (componentMiscItem) {
            const ingredientMeta = componentMeta.ingredients.find(x => x.ItemType == ingredientContribution.ItemType)!;
            if (
                componentMiscItem.ItemCount + ingredientContribution.ItemCount >
                scaleRequiredCount(ingredientMeta.ItemCount)
            ) {
                ingredientContribution.ItemCount =
                    scaleRequiredCount(ingredientMeta.ItemCount) - componentMiscItem.ItemCount;
            }
            componentMiscItem.ItemCount += ingredientContribution.ItemCount;
        } else {
            component.MiscItems.push(ingredientContribution);
        }
        miscItemChanges.push({
            ItemType: ingredientContribution.ItemType,
            ItemCount: ingredientContribution.ItemCount * -1
        });
    }
    addMiscItems(inventory, miscItemChanges);
    inventoryChanges.MiscItems = miscItemChanges;

    if (component.RegularCredits >= scaleRequiredCount(componentMeta.price)) {
        let fullyFunded = true;
        for (const ingredient of componentMeta.ingredients) {
            const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredient.ItemType);
            if (!componentMiscItem || componentMiscItem.ItemCount < scaleRequiredCount(ingredient.ItemCount)) {
                fullyFunded = false;
                break;
            }
        }
        if (fullyFunded) {
            component.RegularCredits = undefined;
            component.MiscItems = undefined;
            component.CompletionTime = new Date(Date.now() + componentMeta.time * 1000);
        }
    }

    await guild.save();
    await inventory.save();
    res.json({
        ...getDojoClient(guild, 0, component._id),
        InventoryChanges: inventoryChanges
    });
};

export interface IContributeToDojoComponentRequest {
    ComponentId: string;
    IngredientContributions: {
        ItemType: string;
        ItemCount: number;
    }[];
    RegularCredits: number;
    VaultIngredientContributions: [];
    VaultCredits: number;
}
