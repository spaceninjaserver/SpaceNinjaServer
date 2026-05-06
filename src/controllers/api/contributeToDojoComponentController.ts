import type { TGuildDatabaseDocument } from "../../models/guildModel.ts";
import { GuildMember } from "../../models/guildModel.ts";
import type { TInventoryDatabaseDocument } from "../../models/inventoryModels/inventoryModel.ts";
import {
    addGuildMemberMiscItemContribution,
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    processDojoBuildMaterialsGathered,
    scaleRequiredCount,
    setDojoRoomLogFunded
} from "../../services/guildService.ts";
import { addMiscItems, getInventory2, updateCredits } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { IDojoContributable, IGuildMemberDatabase } from "../../types/guildTypes.ts";
import type { IMiscItem } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import type { RequestHandler } from "express";
import type { IDojoBuild } from "warframe-public-export-plus";
import { ExportDojoRecipes } from "warframe-public-export-plus";
import { getRecipe } from "../../services/itemDataService.ts";

interface IContributeToDojoComponentRequest {
    ComponentId?: string; // req.query.componentId in U10
    DecoId?: string;
    DecoType?: string;

    // credit contributions
    RegularCredits: number;
    VaultCredits: number;

    // 'ingredient' contributions are just MiscItems in U10; unsure when it changed.
    MiscItems?: IMiscItem[];
    VaultMiscItems?: IMiscItem[];
    IngredientContributions?: IMiscItem[];
    VaultIngredientContributions?: IMiscItem[];

    ResultType?: string;
}

export const contributeToDojoComponentController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory2(
        account._id,
        "LevelKeys",
        "GuildId",
        "infiniteCredits",
        "RegularCredits",
        "MiscItems"
    );
    // Any clan member should have permission to contribute although notably permission is denied if they have not crafted the dojo key and were simply invited in.
    if (!hasAccessToDojo(inventory)) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }
    const guild = await getGuildForRequestEx(req, inventory);
    const guildMember = (await GuildMember.findOne(
        { accountId: account._id, guildId: guild._id },
        "RegularCreditsContributed MiscItemsContributed"
    ))!;
    const request = JSON.parse(String(req.body)) as IContributeToDojoComponentRequest;
    if (!request.ComponentId) {
        request.ComponentId = req.query.componentId as string;
    }
    request.DecoId ??= req.query.decoId as string | undefined;
    request.IngredientContributions ??= request.MiscItems;
    request.VaultIngredientContributions ??= request.VaultMiscItems;
    const component = guild.DojoComponents.id(request.ComponentId)!;
    const inventoryChanges: IInventoryChanges = {};
    if (request.ResultType) {
        guild.VaultPendingRecipes ??= [];
        if (!guild.VaultPendingRecipes.find(r => String(r.ParentRoom) == request.ComponentId)) {
            throw new Error("attempt to contribute to non-existent vault recipe?!");
        }

        const cRecipe = guild.VaultPendingRecipes.find(r => String(r.ParentRoom) == request.ComponentId)!;
        const recipe = getRecipe(cRecipe.RecipeType)!;
        const meta: IDojoBuild = {
            name: "",
            description: "",
            icon: "",
            time: recipe.buildTime,
            price: recipe.buildPrice,
            ingredients: recipe.ingredients,
            resultType: recipe.resultType,
            skipTimePrice: recipe.skipBuildTimePrice
        };
        processContribution(guild, guildMember, request, inventory, inventoryChanges, meta, cRecipe, true);
    } else if (!component.CompletionTime) {
        // Room is in "Collecting Materials" state
        if (request.DecoId) {
            throw new Error("attempt to contribute to a deco in an unfinished room?!");
        }
        const meta = Object.values(ExportDojoRecipes.rooms).find(x => x.resultType == component.pf)!;
        processContribution(guild, guildMember, request, inventory, inventoryChanges, meta, component);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (component.CompletionTime) {
            setDojoRoomLogFunded(guild, component);
        }
    } else {
        // Room is past "Collecting Materials"
        if (request.DecoId) {
            const deco = component.Decos!.find(x => x._id.equals(request.DecoId))!;
            const meta = Object.values(ExportDojoRecipes.decos).find(x => x.resultType == deco.Type)!;
            processContribution(guild, guildMember, request, inventory, inventoryChanges, meta, deco);
        }
    }

    await Promise.all([guild.save(), inventory.save(), guildMember.save()]);
    res.json({
        ...(await getDojoClient(guild, 0, component._id, account.BuildLabel)),
        InventoryChanges: inventoryChanges
    });
};

const processContribution = (
    guild: TGuildDatabaseDocument,
    guildMember: IGuildMemberDatabase,
    request: IContributeToDojoComponentRequest,
    inventory: Pick<TInventoryDatabaseDocument, "infiniteCredits" | "RegularCredits" | "MiscItems">,
    inventoryChanges: IInventoryChanges,
    meta: IDojoBuild,
    component: IDojoContributable,
    disableScaling?: boolean
): void => {
    component.RegularCredits ??= 0;
    if (request.RegularCredits) {
        component.RegularCredits += request.RegularCredits;
        inventoryChanges.RegularCredits = -request.RegularCredits;
        updateCredits(inventory, request.RegularCredits);

        guildMember.RegularCreditsContributed ??= 0;
        guildMember.RegularCreditsContributed += request.RegularCredits;
    }
    if (request.VaultCredits) {
        component.RegularCredits += request.VaultCredits;
        guild.VaultRegularCredits! -= request.VaultCredits;
    }
    if (component.RegularCredits > scaleRequiredCount(guild.Tier, meta.price, disableScaling)) {
        guild.VaultRegularCredits ??= 0;
        guild.VaultRegularCredits +=
            component.RegularCredits - scaleRequiredCount(guild.Tier, meta.price, disableScaling);
        component.RegularCredits = scaleRequiredCount(guild.Tier, meta.price, disableScaling);
    }

    component.MiscItems ??= [];
    if (request.VaultIngredientContributions!.length) {
        for (const ingredientContribution of request.VaultIngredientContributions!) {
            const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredientContribution.ItemType);
            if (componentMiscItem) {
                const ingredientMeta = meta.ingredients.find(x => x.ItemType == ingredientContribution.ItemType)!;
                if (
                    componentMiscItem.ItemCount + ingredientContribution.ItemCount >
                    scaleRequiredCount(guild.Tier, ingredientMeta.ItemCount, disableScaling)
                ) {
                    ingredientContribution.ItemCount =
                        scaleRequiredCount(guild.Tier, ingredientMeta.ItemCount, disableScaling) -
                        componentMiscItem.ItemCount;
                }
                componentMiscItem.ItemCount += ingredientContribution.ItemCount;
            } else {
                component.MiscItems.push(ingredientContribution);
            }
            const vaultMiscItem = guild.VaultMiscItems!.find(x => x.ItemType == ingredientContribution.ItemType)!;
            vaultMiscItem.ItemCount -= ingredientContribution.ItemCount;
        }
    }
    if (request.IngredientContributions!.length) {
        const miscItemChanges: IMiscItem[] = [];
        for (const ingredientContribution of request.IngredientContributions!) {
            const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredientContribution.ItemType);
            if (componentMiscItem) {
                const ingredientMeta = meta.ingredients.find(x => x.ItemType == ingredientContribution.ItemType)!;
                if (
                    componentMiscItem.ItemCount + ingredientContribution.ItemCount >
                    scaleRequiredCount(guild.Tier, ingredientMeta.ItemCount, disableScaling)
                ) {
                    ingredientContribution.ItemCount =
                        scaleRequiredCount(guild.Tier, ingredientMeta.ItemCount, disableScaling) -
                        componentMiscItem.ItemCount;
                }
                componentMiscItem.ItemCount += ingredientContribution.ItemCount;
            } else {
                component.MiscItems.push(ingredientContribution);
            }
            miscItemChanges.push({
                ItemType: ingredientContribution.ItemType,
                ItemCount: ingredientContribution.ItemCount * -1
            });

            addGuildMemberMiscItemContribution(guildMember, ingredientContribution);
        }
        addMiscItems(inventory, miscItemChanges);
        inventoryChanges.MiscItems = miscItemChanges;
    }

    if (component.RegularCredits >= scaleRequiredCount(guild.Tier, meta.price, disableScaling)) {
        let fullyFunded = true;
        for (const ingredient of meta.ingredients) {
            const componentMiscItem = component.MiscItems.find(x => x.ItemType == ingredient.ItemType);
            if (
                !componentMiscItem ||
                componentMiscItem.ItemCount < scaleRequiredCount(guild.Tier, ingredient.ItemCount, disableScaling)
            ) {
                fullyFunded = false;
                break;
            }
        }
        if (fullyFunded) {
            component.CompletionTime = new Date(Date.now() + meta.time * 1000);
            processDojoBuildMaterialsGathered(guild, meta);
        }
    }
};
