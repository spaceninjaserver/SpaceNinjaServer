import { RequestHandler } from "express";
import {
    addGuildMemberMiscItemContribution,
    getGuildForRequestEx,
    getGuildVault,
    hasAccessToDojo,
    hasGuildPermission,
    processFundedGuildTechProject,
    processGuildTechProjectContributionsUpdate,
    removePigmentsFromGuildMembers,
    scaleRequiredCount,
    setGuildTechLogState
} from "@/src/services/guildService";
import { ExportDojoRecipes } from "warframe-public-export-plus";
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
import { GuildPermission, ITechProjectClient } from "@/src/types/guildTypes";
import { GuildMember } from "@/src/models/guildModel";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { logger } from "@/src/utils/logger";

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
                        needSave ||= setGuildTechLogState(guild, project.ItemType, 4, project.CompletionDate);
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
                        ReqCredits: config.noDojoResearchCosts ? 0 : scaleRequiredCount(guild.Tier, recipe.price),
                        ReqItems: recipe.ingredients.map(x => ({
                            ItemType: x.ItemType,
                            ItemCount: config.noDojoResearchCosts ? 0 : scaleRequiredCount(guild.Tier, x.ItemCount)
                        })),
                        State: 0
                    }) - 1
                ];
            setGuildTechLogState(guild, techProject.ItemType, 5);
            if (config.noDojoResearchCosts) {
                processFundedGuildTechProject(guild, techProject, recipe);
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

        const guildMember = (await GuildMember.findOne(
            { accountId, guildId: guild._id },
            "RegularCreditsContributed MiscItemsContributed"
        ))!;

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

        guildMember.RegularCreditsContributed ??= 0;
        guildMember.RegularCreditsContributed += contributions.RegularCredits;

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

                addGuildMemberMiscItemContribution(guildMember, miscItem);
            }
        }
        addMiscItems(inventory, miscItemChanges);
        const inventoryChanges: IInventoryChanges = updateCurrency(inventory, contributions.RegularCredits, false);
        inventoryChanges.MiscItems = miscItemChanges;

        // Check if research is fully funded now.
        await processGuildTechProjectContributionsUpdate(guild, techProject);

        await guild.save();
        await inventory.save();
        await guildMember.save();
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
        combineInventoryChanges(inventoryChanges, await addItem(inventory, recipe.resultType));
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
        await guild.save();
        res.end();
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unknown guildTech action: ${data.Action}`);
    }
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
