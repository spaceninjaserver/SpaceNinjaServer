import { RequestHandler } from "express";
import {
    getGuildForRequestEx,
    getGuildVault,
    hasAccessToDojo,
    hasGuildPermission,
    removePigmentsFromGuildMembers,
    scaleRequiredCount
} from "@/src/services/guildService";
import { ExportDojoRecipes, IDojoResearch } from "warframe-public-export-plus";
import { getAccountIdForRequest } from "@/src/services/loginService";
import {
    addItem,
    addMiscItems,
    addRecipes,
    combineInventoryChanges,
    getInventory,
    updateCurrency
} from "@/src/services/inventoryService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { config } from "@/src/services/configService";
import { GuildPermission, ITechProjectClient, ITechProjectDatabase } from "@/src/types/guildTypes";
import { TGuildDatabaseDocument } from "@/src/models/guildModel";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";

export const guildTechController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const guild = await getGuildForRequestEx(req, inventory);
    const data = JSON.parse(String(req.body)) as TGuildTechRequest;
    if (data.Action == "Sync") {
        let needSave = false;
        const techProjects: ITechProjectClient[] = [];
        if (guild.TechProjects) {
            for (const project of guild.TechProjects) {
                const techProject: ITechProjectClient = {
                    ItemType: project.ItemType,
                    ReqCredits: project.ReqCredits,
                    ReqItems: project.ReqItems,
                    State: project.State
                };
                if (project.CompletionDate) {
                    techProject.CompletionDate = toMongoDate(project.CompletionDate);
                    if (Date.now() >= project.CompletionDate.getTime()) {
                        needSave ||= setTechLogState(guild, project.ItemType, 4, project.CompletionDate);
                    }
                }
                techProjects.push(techProject);
            }
        }
        if (needSave) {
            await guild.save();
        }
        res.json({ TechProjects: techProjects });
    } else if (data.Action == "Start") {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
            res.status(400).send("-1").end();
            return;
        }
        const recipe = ExportDojoRecipes.research[data.RecipeType];
        guild.TechProjects ??= [];
        if (!guild.TechProjects.find(x => x.ItemType == data.RecipeType)) {
            const techProject =
                guild.TechProjects[
                    guild.TechProjects.push({
                        ItemType: data.RecipeType,
                        ReqCredits: config.noDojoResearchCosts ? 0 : scaleRequiredCount(recipe.price),
                        ReqItems: recipe.ingredients.map(x => ({
                            ItemType: x.ItemType,
                            ItemCount: config.noDojoResearchCosts ? 0 : scaleRequiredCount(x.ItemCount)
                        })),
                        State: 0
                    }) - 1
                ];
            setTechLogState(guild, techProject.ItemType, 5);
            if (config.noDojoResearchCosts) {
                processFundedProject(guild, techProject, recipe);
            } else {
                if (data.RecipeType.substring(0, 39) == "/Lotus/Types/Items/Research/DojoColors/") {
                    guild.ActiveDojoColorResearch = data.RecipeType;
                }
            }
        }
        await guild.save();
        res.end();
    } else if (data.Action == "Contribute") {
        if (!hasAccessToDojo(inventory)) {
            res.status(400).send("-1").end();
            return;
        }
        const contributions = data;
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
            const recipe = ExportDojoRecipes.research[data.RecipeType];
            processFundedProject(guild, techProject, recipe);
            if (data.RecipeType.substring(0, 39) == "/Lotus/Types/Items/Research/DojoColors/") {
                guild.ActiveDojoColorResearch = "";
                await removePigmentsFromGuildMembers(guild._id);
            }
        }

        await guild.save();
        await inventory.save();
        res.json({
            InventoryChanges: inventoryChanges,
            Vault: getGuildVault(guild)
        });
    } else if (data.Action.split(",")[0] == "Buy") {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Fabricator))) {
            res.status(400).send("-1").end();
            return;
        }
        const purchase = data as IGuildTechBuyRequest;
        const quantity = parseInt(data.Action.split(",")[1]);
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
    } else if (data.Action == "Fabricate") {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Fabricator))) {
            res.status(400).send("-1").end();
            return;
        }
        const recipe = ExportDojoRecipes.fabrications[data.RecipeType];
        const inventoryChanges: IInventoryChanges = updateCurrency(inventory, recipe.price, false);
        inventoryChanges.MiscItems = recipe.ingredients.map(x => ({
            ItemType: x.ItemType,
            ItemCount: x.ItemCount * -1
        }));
        addMiscItems(inventory, inventoryChanges.MiscItems);
        combineInventoryChanges(inventoryChanges, (await addItem(inventory, recipe.resultType)).InventoryChanges);
        await inventory.save();
        // Not a mistake: This response uses `inventoryChanges` instead of `InventoryChanges`.
        res.json({ inventoryChanges: inventoryChanges });
    } else if (data.Action == "Pause") {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
            res.status(400).send("-1").end();
            return;
        }
        const project = guild.TechProjects!.find(x => x.ItemType == data.RecipeType)!;
        project.State = -2;
        guild.ActiveDojoColorResearch = "";
        await guild.save();
        await removePigmentsFromGuildMembers(guild._id);
        res.end();
    } else if (data.Action == "Unpause") {
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
            res.status(400).send("-1").end();
            return;
        }
        const project = guild.TechProjects!.find(x => x.ItemType == data.RecipeType)!;
        project.State = 0;
        guild.ActiveDojoColorResearch = data.RecipeType;
        const entry = guild.TechChanges?.find(x => x.details == data.RecipeType);
        if (entry) {
            entry.dateTime = new Date();
        }
        await guild.save();
        res.end();
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
    techProject.CompletionDate = new Date(Date.now() + (config.noDojoResearchTime ? 0 : recipe.time) * 1000);
    if (recipe.guildXpValue) {
        guild.XP += recipe.guildXpValue;
    }
    setTechLogState(guild, techProject.ItemType, config.noDojoResearchTime ? 4 : 3, techProject.CompletionDate);
};

const setTechLogState = (
    guild: TGuildDatabaseDocument,
    type: string,
    state: number,
    dateTime: Date | undefined = undefined
): boolean => {
    guild.TechChanges ??= [];
    const entry = guild.TechChanges.find(x => x.details == type);
    if (entry) {
        if (entry.entryType == state) {
            return false;
        }
        entry.dateTime = dateTime ?? new Date();
        entry.entryType = state;
    } else {
        guild.TechChanges.push({
            dateTime: dateTime ?? new Date(),
            entryType: state,
            details: type
        });
    }
    return true;
};

type TGuildTechRequest =
    | { Action: "Sync" | "SomethingElseThatWeMightNotKnowAbout" }
    | IGuildTechBasicRequest
    | IGuildTechContributeRequest;

interface IGuildTechBasicRequest {
    Action: "Start" | "Fabricate" | "Pause" | "Unpause";
    Mode: "Guild";
    RecipeType: string;
}

interface IGuildTechBuyRequest {
    Action: string;
    Mode: "Guild";
    RecipeType: string;
}

interface IGuildTechContributeRequest {
    Action: "Contribute";
    ResearchId: "";
    RecipeType: string;
    RegularCredits: number;
    MiscItems: IMiscItem[];
    VaultCredits: number;
    VaultMiscItems: IMiscItem[];
}
