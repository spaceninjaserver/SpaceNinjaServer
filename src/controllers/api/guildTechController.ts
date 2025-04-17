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
    addCrewShipWeaponSkin,
    addEquipment,
    addItem,
    addMiscItems,
    addRecipes,
    combineInventoryChanges,
    getInventory,
    occupySlot,
    updateCurrency
} from "@/src/services/inventoryService";
import { IMiscItem, InventorySlot } from "@/src/types/inventoryTypes/inventoryTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { config } from "@/src/services/configService";
import { GuildPermission, ITechProjectClient } from "@/src/types/guildTypes";
import { GuildMember } from "@/src/models/guildModel";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { logger } from "@/src/utils/logger";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";

export const guildTechController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const data = JSON.parse(String(req.body)) as TGuildTechRequest;
    if (data.Action == "Sync") {
        let needSave = false;
        const techProjects: ITechProjectClient[] = [];
        const guild = await getGuildForRequestEx(req, inventory);
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
        if (data.Mode == "Guild") {
            const guild = await getGuildForRequestEx(req, inventory);
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
        } else {
            const recipe = ExportDojoRecipes.research[data.RecipeType];
            const techProject =
                inventory.PersonalTechProjects[
                    inventory.PersonalTechProjects.push({
                        State: 0,
                        ReqCredits: recipe.price,
                        ItemType: data.RecipeType,
                        ProductCategory: data.TechProductCategory,
                        CategoryItemId: data.CategoryItemId,
                        ReqItems: recipe.ingredients
                    }) - 1
                ];
            await inventory.save();
            res.json({
                isPersonal: true,
                action: "Start",
                personalTech: techProject.toJSON()
            });
        }
    } else if (data.Action == "Contribute") {
        if ((req.query.guildId as string) == "000000000000000000000000") {
            const techProject = inventory.PersonalTechProjects.id(data.ResearchId)!;

            techProject.ReqCredits -= data.RegularCredits;
            const inventoryChanges: IInventoryChanges = updateCurrency(inventory, data.RegularCredits, false);

            const miscItemChanges = [];
            for (const miscItem of data.MiscItems) {
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
            inventoryChanges.MiscItems = miscItemChanges;

            techProject.HasContributions = true;

            if (techProject.ReqCredits == 0 && !techProject.ReqItems.find(x => x.ItemCount > 0)) {
                techProject.State = 1;
                const recipe = ExportDojoRecipes.research[techProject.ItemType];
                techProject.CompletionDate = new Date(Date.now() + recipe.time * 1000);
            }

            await inventory.save();
            res.json({
                InventoryChanges: inventoryChanges,
                PersonalResearch: { $oid: data.ResearchId },
                PersonalResearchDate: techProject.CompletionDate ? toMongoDate(techProject.CompletionDate) : undefined
            });
        } else {
            if (!hasAccessToDojo(inventory)) {
                res.status(400).send("-1").end();
                return;
            }

            const guild = await getGuildForRequestEx(req, inventory);
            const guildMember = (await GuildMember.findOne(
                { accountId, guildId: guild._id },
                "RegularCreditsContributed MiscItemsContributed"
            ))!;

            const techProject = guild.TechProjects!.find(x => x.ItemType == data.RecipeType)!;

            if (data.VaultCredits) {
                if (data.VaultCredits > techProject.ReqCredits) {
                    data.VaultCredits = techProject.ReqCredits;
                }
                techProject.ReqCredits -= data.VaultCredits;
                guild.VaultRegularCredits! -= data.VaultCredits;
            }

            if (data.RegularCredits > techProject.ReqCredits) {
                data.RegularCredits = techProject.ReqCredits;
            }
            techProject.ReqCredits -= data.RegularCredits;

            guildMember.RegularCreditsContributed ??= 0;
            guildMember.RegularCreditsContributed += data.RegularCredits;

            if (data.VaultMiscItems.length) {
                for (const miscItem of data.VaultMiscItems) {
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
            for (const miscItem of data.MiscItems) {
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
            const inventoryChanges: IInventoryChanges = updateCurrency(inventory, data.RegularCredits, false);
            inventoryChanges.MiscItems = miscItemChanges;

            // Check if research is fully funded now.
            await processGuildTechProjectContributionsUpdate(guild, techProject);

            await Promise.all([guild.save(), inventory.save(), guildMember.save()]);
            res.json({
                InventoryChanges: inventoryChanges,
                Vault: getGuildVault(guild)
            });
        }
    } else if (data.Action.split(",")[0] == "Buy") {
        const purchase = data as IGuildTechBuyRequest;
        if (purchase.Mode == "Guild") {
            const guild = await getGuildForRequestEx(req, inventory);
            if (
                !hasAccessToDojo(inventory) ||
                !(await hasGuildPermission(guild, accountId, GuildPermission.Fabricator))
            ) {
                res.status(400).send("-1").end();
                return;
            }
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
        } else {
            const inventoryChanges = claimSalvagedComponent(inventory, purchase.CategoryItemId!);
            await inventory.save();
            res.json({
                inventoryChanges: inventoryChanges
            });
        }
    } else if (data.Action == "Fabricate") {
        const guild = await getGuildForRequestEx(req, inventory);
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
        const guild = await getGuildForRequestEx(req, inventory);
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
        const guild = await getGuildForRequestEx(req, inventory);
        if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
            res.status(400).send("-1").end();
            return;
        }
        const project = guild.TechProjects!.find(x => x.ItemType == data.RecipeType)!;
        project.State = 0;
        guild.ActiveDojoColorResearch = data.RecipeType;
        await guild.save();
        res.end();
    } else if (data.Action == "Cancel" && data.CategoryItemId) {
        const personalTechProjectIndex = inventory.PersonalTechProjects.findIndex(x =>
            x.CategoryItemId?.equals(data.CategoryItemId)
        );
        const personalTechProject = inventory.PersonalTechProjects[personalTechProjectIndex];
        inventory.PersonalTechProjects.splice(personalTechProjectIndex, 1);

        const meta = ExportDojoRecipes.research[personalTechProject.ItemType];
        const contributedCredits = meta.price - personalTechProject.ReqCredits;
        const inventoryChanges = updateCurrency(inventory, contributedCredits * -1, false);
        inventoryChanges.MiscItems = [];
        for (const ingredient of meta.ingredients) {
            const reqItem = personalTechProject.ReqItems.find(x => x.ItemType == ingredient.ItemType);
            if (reqItem) {
                const contributedItems = ingredient.ItemCount - reqItem.ItemCount;
                inventoryChanges.MiscItems.push({
                    ItemType: ingredient.ItemType,
                    ItemCount: contributedItems
                });
            }
        }
        addMiscItems(inventory, inventoryChanges.MiscItems);

        await inventory.save();
        res.json({
            action: "Cancel",
            isPersonal: true,
            inventoryChanges: inventoryChanges,
            personalTech: {
                ItemId: toOid(personalTechProject._id)
            }
        });
    } else if (data.Action == "Rush" && data.CategoryItemId) {
        const inventoryChanges: IInventoryChanges = {
            ...updateCurrency(inventory, 20, true),
            ...claimSalvagedComponent(inventory, data.CategoryItemId)
        };
        await inventory.save();
        res.json({
            inventoryChanges: inventoryChanges
        });
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unhandled guildTech request`);
    }
};

type TGuildTechRequest =
    | { Action: "Sync" | "SomethingElseThatWeMightNotKnowAbout" }
    | IGuildTechBasicRequest
    | IGuildTechContributeRequest;

interface IGuildTechBasicRequest {
    Action: "Start" | "Fabricate" | "Pause" | "Unpause" | "Cancel" | "Rush";
    Mode: "Guild" | "Personal";
    RecipeType: string;
    TechProductCategory?: string;
    CategoryItemId?: string;
}

interface IGuildTechBuyRequest extends Omit<IGuildTechBasicRequest, "Action"> {
    Action: string;
}

interface IGuildTechContributeRequest {
    Action: "Contribute";
    ResearchId: string;
    RecipeType: string;
    RegularCredits: number;
    MiscItems: IMiscItem[];
    VaultCredits: number;
    VaultMiscItems: IMiscItem[];
}

const claimSalvagedComponent = (inventory: TInventoryDatabaseDocument, itemId: string): IInventoryChanges => {
    // delete personal tech project
    const personalTechProjectIndex = inventory.PersonalTechProjects.findIndex(x => x.CategoryItemId?.equals(itemId));
    const personalTechProject = inventory.PersonalTechProjects[personalTechProjectIndex];
    inventory.PersonalTechProjects.splice(personalTechProjectIndex, 1);

    const category = personalTechProject.ProductCategory! as "CrewShipWeapons" | "CrewShipWeaponSkins";
    const salvageCategory = category == "CrewShipWeapons" ? "CrewShipSalvagedWeapons" : "CrewShipSalvagedWeaponSkins";

    // find salved part & delete it
    const salvageIndex = inventory[salvageCategory].findIndex(x => x._id.equals(itemId));
    const salvageItem = inventory[category][salvageIndex];
    inventory[salvageCategory].splice(salvageIndex, 1);

    // add final item
    const inventoryChanges = {
        ...(category == "CrewShipWeaponSkins"
            ? addCrewShipWeaponSkin(inventory, salvageItem.ItemType, salvageItem.UpgradeFingerprint)
            : addEquipment(
                  inventory,
                  category,
                  salvageItem.ItemType,
                  undefined,
                  {},
                  {
                      UpgradeFingerprint: salvageItem.UpgradeFingerprint
                  }
              )),
        ...occupySlot(inventory, InventorySlot.RJ_COMPONENT_AND_ARMAMENTS, false)
    };

    inventoryChanges.RemovedIdItems = [
        {
            ItemId: { $oid: itemId }
        }
    ];

    return inventoryChanges;
};
