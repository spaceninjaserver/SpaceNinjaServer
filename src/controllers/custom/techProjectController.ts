import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import {
    getGuildForRequestEx,
    setGuildTechLogState,
    processFundedGuildTechProject,
    scaleRequiredCount,
    hasGuildPermission,
    addGuildMemberMiscItemContribution,
    processGuildTechProjectContributionsUpdate,
    processCompletedGuildTechProject
} from "../../services/guildService.ts";
import { ExportDojoRecipes } from "warframe-public-export-plus";
import { GuildPermission } from "../../types/guildTypes.ts";
import { GuildMember } from "../../models/guildModel.ts";

export const addTechProjectController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as ITechProjectRequest[];
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
        res.status(400).send("-1").end();
        return;
    }
    guild.TechProjects ??= [];
    for (const request of requests) {
        const recipe = ExportDojoRecipes.research[request.ItemType];
        if (!guild.TechProjects.find(x => x.ItemType == request.ItemType)) {
            const techProject =
                guild.TechProjects[
                    guild.TechProjects.push({
                        ItemType: request.ItemType,
                        ReqCredits: guild.noDojoResearchCosts ? 0 : scaleRequiredCount(guild.Tier, recipe.price),
                        ReqItems: recipe.ingredients.map(x => ({
                            ItemType: x.ItemType,
                            ItemCount: guild.noDojoResearchCosts ? 0 : scaleRequiredCount(guild.Tier, x.ItemCount)
                        })),
                        State: 0
                    }) - 1
                ];
            setGuildTechLogState(guild, techProject.ItemType, 5);
            if (guild.noDojoResearchCosts) {
                processFundedGuildTechProject(guild, techProject, recipe);
            }
        }
    }
    await guild.save();
    res.end();
};

export const removeTechProjectController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as ITechProjectRequest[];
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
        res.status(400).send("-1").end();
        return;
    }
    guild.TechProjects ??= [];
    for (const request of requests) {
        const index = guild.TechProjects.findIndex(x => x.ItemType === request.ItemType);
        if (index !== -1) {
            guild.TechProjects.splice(index, 1);
        }
    }
    await guild.save();
    res.end();
};

export const fundTechProjectController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as ITechProjectRequest[];
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    const guildMember = (await GuildMember.findOne(
        { accountId, guildId: guild._id },
        "RegularCreditsContributed MiscItemsContributed"
    ))!;
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
        res.status(400).send("-1").end();
        return;
    }
    for (const request of requests) {
        const techProject = guild.TechProjects!.find(x => x.ItemType == request.ItemType)!;

        guildMember.RegularCreditsContributed ??= 0;
        guildMember.RegularCreditsContributed += techProject.ReqCredits;
        techProject.ReqCredits = 0;

        for (const reqItem of techProject.ReqItems) {
            addGuildMemberMiscItemContribution(guildMember, reqItem);
            reqItem.ItemCount = 0;
        }

        await processGuildTechProjectContributionsUpdate(guild, techProject);
    }
    await Promise.all([guild.save(), guildMember.save()]);
    res.end();
};

export const completeTechProjectsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as ITechProjectRequest[];
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Tech))) {
        res.status(400).send("-1").end();
        return;
    }
    for (const request of requests) {
        const techProject = guild.TechProjects!.find(x => x.ItemType == request.ItemType)!;
        techProject.CompletionDate = new Date();

        if (setGuildTechLogState(guild, techProject.ItemType, 4, techProject.CompletionDate)) {
            processCompletedGuildTechProject(guild, techProject.ItemType);
        }
    }
    await guild.save();
    res.end();
};

interface ITechProjectRequest {
    ItemType: string;
}
