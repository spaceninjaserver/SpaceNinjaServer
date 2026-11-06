import type { RequestHandler } from "express";
import { eDojoRequestStatus, eGuildPermission } from "../../types/guildTypes.ts";
import {
    getAllianceVault,
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasAlliancePermission,
    hasGuildPermission
} from "../../services/guildService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getRecipe } from "../../services/itemDataService.ts";
import { Alliance } from "../../models/guildModel.ts";
import { Types } from "mongoose";

export const startGuildRecipeController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);
    const payload = getJSONfromString<IStartGuildRecipeRequest>(String(req.body));

    if (!hasAccessToDojo(inventory) || !(await hasGuildPermission(guild, account._id, eGuildPermission.Tactician))) {
        res.json({ DojoRequestStatus: eDojoRequestStatus.INVALID_PERMISSION });
        return;
    }

    const recipe = getRecipe(payload.Recipe, buildLabel);
    if (!recipe) {
        res.json({ DojoRequestStatus: eDojoRequestStatus.RECIPE_NOT_FOUND });
        return;
    }

    const alliance = guild.AllianceId ? await Alliance.findById(guild.AllianceId) : null;
    if (
        [guild, alliance].some(vault => vault?.VaultPendingRecipes?.some(r => r.ParentRoom.equals(payload.ParentRoom)))
    ) {
        res.json({ DojoRequestStatus: eDojoRequestStatus.CONSTRUCTION_STARTED });
        return;
    }

    if (
        payload.Alliance &&
        !(alliance && (await hasAlliancePermission(alliance._id, guild._id, eGuildPermission.Tactician)))
    ) {
        res.json({ DojoRequestStatus: eDojoRequestStatus.INVALID_PERMISSION });
        return;
    }

    const vault = payload.Alliance ? alliance! : guild;
    vault.VaultPendingRecipes ??= [];
    vault.VaultPendingRecipes.push({
        ParentRoom: new Types.ObjectId(payload.ParentRoom),
        ParentGuildId: guild._id,
        Type: recipe.resultType,
        RecipeType: payload.Recipe
    });
    await vault.save();

    res.json({
        ...(await getDojoClient(guild, eDojoRequestStatus.VALID_REQUEST, undefined, buildLabel)),
        ...(payload.Alliance && { AllianceVault: await getAllianceVault(alliance!, buildLabel) })
    });
};

interface IStartGuildRecipeRequest {
    Recipe: string; // /Lotus/Types/Game/SolarRails/BasicSolarRailBlueprint
    ParentRoom: string;
    Alliance?: true;
}
