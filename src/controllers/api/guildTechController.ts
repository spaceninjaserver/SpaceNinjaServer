import { RequestHandler } from "express";
import { getGuildForRequestEx, getGuildVault, scaleRequiredCount } from "@/src/services/guildService";
import { ExportDojoRecipes, IDojoResearch } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addMiscItems, addRecipes, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { config } from "@/src/services/configService";
import { ITechProjectDatabase } from "@/src/types/guildTypes";
import { TGuildDatabaseDocument } from "@/src/models/guildModel";

export const guildTechController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    const data = JSON.parse(String(req.body)) as TGuildTechRequest;
    const action = data.Action.split(",")[0];
    if (action == "Sync") {
        res.json({
            TechProjects: guild.toJSON().TechProjects
        });
    } else if (action == "Start") {
        const recipe = ExportDojoRecipes.research[data.RecipeType!];
        guild.TechProjects ??= [];
        if (!guild.TechProjects.find(x => x.ItemType == data.RecipeType)) {
            const techProject =
                guild.TechProjects[
                    guild.TechProjects.push({
                        ItemType: data.RecipeType!,
                        ReqCredits: config.noDojoResearchCosts ? 0 : scaleRequiredCount(recipe.price),
                        ReqItems: recipe.ingredients.map(x => ({
                            ItemType: x.ItemType,
                            ItemCount: config.noDojoResearchCosts ? 0 : scaleRequiredCount(x.ItemCount)
                        })),
                        State: 0
                    }) - 1
                ];
            if (config.noDojoResearchCosts) {
                processFundedProject(guild, techProject, recipe);
            }
        }
        await guild.save();
        res.end();
    } else if (action == "Contribute") {
        const contributions = data as IGuildTechContributeFields;
        const techProject = guild.TechProjects!.find(x => x.ItemType == contributions.RecipeType)!;

        if (contributions.VaultCredits) {
            if (contributions.VaultCredits > techProject.ReqCredits) {
                contributions.VaultCredits = techProject.ReqCredits;
            }
            techProject.ReqCredits -= contributions.VaultCredits;
            guild.VaultRegularCredits! -= contributions.VaultCredits;
        }

        if (contributions.RegularCredits > techProject.ReqCredits) {
            contributions.RegularCredits = techProject.ReqCredits;
        }
        techProject.ReqCredits -= contributions.RegularCredits;

        if (contributions.VaultMiscItems.length) {
            for (const miscItem of contributions.VaultMiscItems) {
                const reqItem = techProject.ReqItems.find(x => x.ItemType == miscItem.ItemType);
                if (reqItem) {
                    if (miscItem.ItemCount > reqItem.ItemCount) {
                        miscItem.ItemCount = reqItem.ItemCount;
                    }
                    reqItem.ItemCount -= miscItem.ItemCount;

                    const vaultMiscItem = guild.VaultMiscItems!.find(x => x.ItemType == miscItem.ItemType)!;
                    vaultMiscItem.ItemCount -= miscItem.ItemCount;
                }
            }
        }

        const miscItemChanges = [];
        for (const miscItem of contributions.MiscItems) {
            const reqItem = techProject.ReqItems.find(x => x.ItemType == miscItem.ItemType);
            if (reqItem) {
                if (miscItem.ItemCount > reqItem.ItemCount) {
                    miscItem.ItemCount = reqItem.ItemCount;
                }
                reqItem.ItemCount -= miscItem.ItemCount;
                miscItemChanges.push({
                    ItemType: miscItem.ItemType,
                    ItemCount: miscItem.ItemCount * -1
                });
            }
        }
        addMiscItems(inventory, miscItemChanges);
        const inventoryChanges: IInventoryChanges = updateCurrency(inventory, contributions.RegularCredits, false);
        inventoryChanges.MiscItems = miscItemChanges;

        if (techProject.ReqCredits == 0 && !techProject.ReqItems.find(x => x.ItemCount > 0)) {
            // This research is now fully funded.
            const recipe = ExportDojoRecipes.research[data.RecipeType!];
            processFundedProject(guild, techProject, recipe);
        }

        await guild.save();
        await inventory.save();
        res.json({
            InventoryChanges: inventoryChanges,
            Vault: getGuildVault(guild)
        });
    } else if (action == "Buy") {
        const purchase = data as IGuildTechBuyFields;
        const quantity = parseInt(data.Action.split(",")[1]);
        const inventory = await getInventory(accountId);
        const recipeChanges = [
            {
                ItemType: purchase.RecipeType,
                ItemCount: quantity
            }
        ];
        addRecipes(inventory, recipeChanges);
        const currencyChanges = updateCurrency(
            inventory,
            ExportDojoRecipes.research[purchase.RecipeType].replicatePrice,
            false
        );
        await inventory.save();
        // Not a mistake: This response uses `inventoryChanges` instead of `InventoryChanges`.
        res.json({
            inventoryChanges: {
                ...currencyChanges,
                Recipes: recipeChanges
            }
        });
    } else {
        throw new Error(`unknown guildTech action: ${data.Action}`);
    }
};

const processFundedProject = (
    guild: TGuildDatabaseDocument,
    techProject: ITechProjectDatabase,
    recipe: IDojoResearch
): void => {
    techProject.State = 1;
    techProject.CompletionDate = new Date(new Date().getTime() + (config.noDojoResearchTime ? 0 : recipe.time) * 1000);
    if (recipe.guildXpValue) {
        guild.XP += recipe.guildXpValue;
    }
};

type TGuildTechRequest = {
    Action: string;
} & Partial<IGuildTechStartFields> &
    Partial<IGuildTechContributeFields>;

interface IGuildTechStartFields {
    Mode: "Guild";
    RecipeType: string;
}

type IGuildTechBuyFields = IGuildTechStartFields;

interface IGuildTechContributeFields {
    ResearchId: "";
    RecipeType: string;
    RegularCredits: number;
    MiscItems: IMiscItem[];
    VaultCredits: number;
    VaultMiscItems: IMiscItem[];
}
