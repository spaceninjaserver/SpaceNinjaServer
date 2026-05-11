import type { RequestHandler } from "express";
import { eGuildPermission } from "../../types/guildTypes.ts";
import {
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission
} from "../../services/guildService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getRecipe } from "../../services/itemDataService.ts";
import { Alliance, type TGuildDatabaseDocument } from "../../models/guildModel.ts";
import { Types } from "mongoose";

export const startGuildRecipeController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    const payload = getJSONfromString<IStartGuildRecipeRequest>(String(req.body));

    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, account._id, eGuildPermission.Tactician))) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }

    if (await isRoomCrafting(guild, payload.ParentRoom, payload.Alliance)) {
        res.json({ DojoRequestStatus: -1 });
        return;
    }

    const buildLabel = getBuildLabel(req, account);
    const recipe = getRecipe(payload.Recipe, buildLabel)!;
    if (payload.Alliance) {
        res.json({ DojoRequestStatus: -1 });
        return;
        // Alliance crafting for some reason softlocks client
        // const alliance = (await Alliance.findById(guild.AllianceId))!;
        // const allianceMember = await AllianceMember.findOne({
        //     guildId: guild._id,
        //     Pending: false
        // });

        // if (!allianceMember || !(allianceMember.Permissions & GuildPermission.Tactician)) {
        //     res.json({ DojoRequestStatus: -1 });
        //     return;
        // }

        // alliance.VaultPendingRecipes ??= [];
        // alliance.VaultPendingRecipes.push({
        //     ParentRoom: new Types.ObjectId(payload.ParentRoom),
        //     ParentGuildId: guild._id,
        //     Type: recipe.resultType,
        //     RecipeType: payload.Recipe;
        // });
        // await alliance.save();
        // res.json(await getDojoClient(guild, 0, undefined, account.BuildLabel));
    } else {
        guild.VaultPendingRecipes ??= [];
        guild.VaultPendingRecipes.push({
            ParentRoom: new Types.ObjectId(payload.ParentRoom),
            ParentGuildId: guild._id,
            Type: recipe.resultType,
            RecipeType: payload.Recipe
        });
        await guild.save();
        res.json(await getDojoClient(guild, 0, undefined, buildLabel));
    }
};

const isRoomCrafting = async (
    guild: TGuildDatabaseDocument,
    ParentRoom: string,
    isAlliance?: true
): Promise<boolean> => {
    guild.VaultPendingRecipes ??= [];
    if (guild.VaultPendingRecipes.find(r => String(r.ParentRoom) == ParentRoom)) {
        return true;
    }
    if (isAlliance) {
        const alliance = (await Alliance.findById(guild.AllianceId))!;
        alliance.VaultPendingRecipes ??= [];
        if (alliance.VaultPendingRecipes.find(r => String(r.ParentRoom) == ParentRoom)) {
            return true;
        }
    }
    return false;
};

interface IStartGuildRecipeRequest {
    Recipe: string; // /Lotus/Types/Game/SolarRails/BasicSolarRailBlueprint
    ParentRoom: string;
    Alliance?: true;
}
