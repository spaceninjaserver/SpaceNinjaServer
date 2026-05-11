import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAllianceVault, getGuildForRequestEx, getGuildVault } from "../../services/guildService.ts";
import { Alliance } from "../../models/guildModel.ts";

export const getVaultController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);

    const allianceId = req.query.allianceId as string;
    if (!allianceId) {
        const buildLabel = getBuildLabel(req, account);
        res.json({ Vault: await getGuildVault(guild, buildLabel) });
        return;
    }

    if (guild.AllianceId?.toString() === allianceId) {
        const alliance = await Alliance.findById(allianceId);
        if (alliance) {
            const buildLabel = getBuildLabel(req, account);
            res.json({ AllianceVault: await getAllianceVault(alliance, buildLabel) });
            return;
        }
    }

    res.end();
};
