import { TGuildDatabaseDocument } from "@/src/models/guildModel";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { getDojoClient, getGuildForRequestEx, scaleRequiredCount } from "@/src/services/guildService";
import { addMiscItems, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IDojoContributable } from "@/src/types/guildTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { ExportDojoRecipes, IDojoRecipe } from "warframe-public-export-plus";

interface IContributeToDojoComponentRequest {
    ComponentId: string;
    DecoId?: string;
    DecoType?: string;
    IngredientContributions: {
        ItemType: string;
        ItemCount: number;
    }[];
    RegularCredits: number;
    VaultIngredientContributions: [];
    VaultCredits: number;
}

export const contributeToDojoComponentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    // Any clan member should have permission to contribute although notably permission is denied if they have not crafted the dojo key and were simply invited in.
    const request = JSON.parse(String(req.body)) as IContributeToDojoComponentRequest;
    const component = guild.DojoComponents.id(request.ComponentId)!;

    const inventoryChanges: IInventoryChanges = {};
    if (!component.CompletionTime) {
        // Room is in "Collecting Materials" state
        if (request.DecoId) {
            throw new Error("attempt to contribute to a deco in an unfinished room?!");
        }
        const meta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf)!;
        await processContribution(guild, request, inventory, inventoryChanges, meta, component);
    } else {
        // Room is past "Collecting Materials"
        if (request.DecoId) {
            const deco = component.Decos!.find(x => x._id.equals(request.DecoId))!;
            const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == deco.Type)!;
            await processContribution(guild, request, inventory, inventoryChanges, meta, deco);
        }
    }

    await guild.save();
    await inventory.save();
    res.json({
        ...getDojoClient(guild, 0, component._id),
        InventoryChanges: inventoryChanges
    });
};

const processContribution = async (
    guild: TGuildDatabaseDocument,
    request: IContributeToDojoComponentRequest,
    inventory: TInventoryDatabaseDocument,
    inventoryChanges: IInventoryChanges,
    meta: IDojoRecipe,
    component: IDojoContributable
): Promise<void> => {
    component.RegularCredits ??= 0;
    if (component.RegularCredits + request.RegularCredits > scaleRequiredCount(meta.price)) {
        request.RegularCredits = scaleRequiredCount(meta.price) - component.RegularCredits;
    }
    component.RegularCredits += request.RegularCredits;
    inventoryChanges.RegularCredits = -request.RegularCredits;
    updateCurrency(inventory, request.RegularCredits, false);

    component.MiscItems ??= [];
    const miscItemChanges: IMiscItem[] = [];
    for (const ingredientContribution of request.IngredientContributions) {
        const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredientContribution.ItemType);
        if (componentMiscItem) {
            const ingredientMeta = meta.ingredients.find(x => x.ItemType == ingredientContribution.ItemType)!;
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

    if (component.RegularCredits >= scaleRequiredCount(meta.price)) {
        let fullyFunded = true;
        for (const ingredient of meta.ingredients) {
            const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredient.ItemType);
            if (!componentMiscItem || componentMiscItem.ItemCount < scaleRequiredCount(ingredient.ItemCount)) {
                fullyFunded = false;
                break;
            }
        }
        if (fullyFunded) {
            if (request.IngredientContributions.length) {
                // We've already updated subpaths of MiscItems, we need to allow MongoDB to save this before we remove MiscItems.
                await guild.save();
            }
            component.RegularCredits = undefined;
            component.MiscItems = undefined;
            component.CompletionTime = new Date(Date.now() + meta.time * 1000);
        }
    }
};
