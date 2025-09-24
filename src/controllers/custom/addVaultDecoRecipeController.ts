import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { getGuildForRequestEx, hasGuildPermission } from "../../services/guildService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { ITypeCount } from "../../types/commonTypes.ts";

export const addVaultDecoRecipeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const requests = req.body as ITypeCount[];
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Architect))) {
        res.status(400).send("-1").end();
        return;
    }
    guild.VaultDecoRecipes ??= [];
    for (const request of requests) {
        const index = guild.VaultDecoRecipes.findIndex(x => x.ItemType === request.ItemType);

        if (index == -1) {
            guild.VaultDecoRecipes.push({
                ItemType: request.ItemType,
                ItemCount: request.ItemCount
            });
        } else {
            guild.VaultDecoRecipes[index].ItemCount += request.ItemCount;

            if (guild.VaultDecoRecipes[index].ItemCount < 1) {
                guild.VaultDecoRecipes.splice(index, 1);
            }
        }
    }
    await guild.save();
    res.end();
};
