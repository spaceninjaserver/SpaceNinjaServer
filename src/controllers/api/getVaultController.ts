import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAllianceVault, getGuildForRequestEx, getGuildVault } from "../../services/guildService.ts";
import { Alliance } from "../../models/guildModel.ts";
import type { IGuildVaultClient } from "../../types/guildTypes.ts";

export const getVaultController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, "GuildId");
    const guild = await getGuildForRequestEx(req, inventory);

    const allianceId = req.query.allianceId as string | undefined;
    const wantsGuildVault = !allianceId || "guildId" in req.query;

    const response: IGetVaultResponse = {};
    if (wantsGuildVault) {
        response.Vault = await getGuildVault(guild, buildLabel);
    }
    if (allianceId && guild.AllianceId?.equals(allianceId)) {
        const alliance = await Alliance.findById(guild.AllianceId);
        if (alliance) {
            response.AllianceVault = await getAllianceVault(alliance, buildLabel);
        }
    }

    if (!response.Vault && !response.AllianceVault) {
        res.end();
        return;
    }
    res.json(response);
};

interface IGetVaultResponse {
    Vault?: IGuildVaultClient;
    AllianceVault?: IGuildVaultClient;
}
