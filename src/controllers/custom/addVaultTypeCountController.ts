import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { getGuildForRequestEx, hasGuildPermission } from "../../services/guildService.ts";
import { GuildPermission } from "../../types/guildTypes.ts";
import type { ITypeCount } from "../../types/commonTypes.ts";

export const addVaultTypeCountController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const { vaultType, items } = req.body as {
        vaultType: keyof typeof vaultConfig;
        items: ITypeCount[];
    };
    const inventory = await getInventory(accountId, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);
    if (!(await hasGuildPermission(guild, accountId, vaultConfig[vaultType]))) {
        res.status(400).send("-1").end();
        return;
    }
    guild[vaultType] ??= [];
    for (const item of items) {
        const index = guild[vaultType].findIndex(x => x.ItemType === item.ItemType);
        if (index === -1) {
            guild[vaultType].push({
                ItemType: item.ItemType,
                ItemCount: item.ItemCount
            });
        } else {
            guild[vaultType][index].ItemCount += item.ItemCount;
            if (guild[vaultType][index].ItemCount < 1) {
                guild[vaultType].splice(index, 1);
            }
        }
    }

    await guild.save();
    res.end();
};
const vaultConfig = {
    VaultShipDecorations: GuildPermission.Treasurer,
    VaultMiscItems: GuildPermission.Treasurer,
    VaultDecoRecipes: GuildPermission.Architect
} as const;
