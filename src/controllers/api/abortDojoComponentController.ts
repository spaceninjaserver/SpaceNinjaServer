import {
    getAllianceVault,
    getDojoClient,
    getGuildForRequestEx,
    hasAccessToDojo,
    hasGuildPermission,
    hasPermissionToDecorateComponent,
    removeDojoDeco,
    removeVaultPendingRecipe,
    removeDojoRoom
} from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import {
    eDojoRequestStatus,
    eGuildPermission,
    type IDojoClient,
    type IGuildVaultClient,
    type TDojoRequestStatus
} from "../../types/guildTypes.ts";
import { Alliance } from "../../models/guildModel.ts";
import type { Request, RequestHandler } from "express";

export const abortDojoComponentGetController: RequestHandler = async (req, res) => {
    res.json(await abortDojoComponent(req, req.query.componentId as string, req.query.decoId as string | undefined));
};

export const abortDojoComponentPostController: RequestHandler = async (req, res) => {
    const request = JSON.parse(String(req.body)) as IAbortDojoComponentRequest;
    res.json(await abortDojoComponent(req, request.ComponentId, request.DecoId, request.ResultType, request.Alliance));
};

const abortDojoComponent = async (
    req: Request,
    componentId: string,
    decoId?: string,
    resultType?: string,
    isAlliance?: boolean
): Promise<{ DojoRequestStatus: TDojoRequestStatus } | (IDojoClient & { AllianceVault?: IGuildVaultClient })> => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const inventory = await getInventory(account._id, "GuildId LevelKeys");
    const guild = await getGuildForRequestEx(req, inventory);

    if (resultType) {
        if (
            !hasAccessToDojo(inventory) ||
            !(await hasGuildPermission(guild, account._id, eGuildPermission.Tactician))
        ) {
            return { DojoRequestStatus: eDojoRequestStatus.INVALID_PERMISSION };
        }

        if (isAlliance) {
            const alliance = (await Alliance.findById(guild.AllianceId))!;
            removeVaultPendingRecipe(alliance, componentId, resultType);
            await alliance.save();
            return {
                ...(await getDojoClient(guild, eDojoRequestStatus.VALID_REQUEST, undefined, buildLabel)),
                AllianceVault: await getAllianceVault(alliance, buildLabel)
            };
        }
        removeVaultPendingRecipe(guild, componentId, resultType);
        await guild.save();
        return await getDojoClient(guild, eDojoRequestStatus.VALID_REQUEST, undefined, buildLabel);
    } else if (decoId) {
        if (
            !hasAccessToDojo(inventory) ||
            !(await hasPermissionToDecorateComponent(guild, account._id.toString(), componentId))
        ) {
            return { DojoRequestStatus: eDojoRequestStatus.INVALID_PERMISSION };
        }

        removeDojoDeco(guild, componentId, decoId);
        await guild.save();
        return await getDojoClient(guild, eDojoRequestStatus.VALID_REQUEST, componentId, buildLabel);
    } else {
        if (
            !hasAccessToDojo(inventory) ||
            !(await hasGuildPermission(guild, account._id, eGuildPermission.Architect))
        ) {
            return { DojoRequestStatus: eDojoRequestStatus.INVALID_PERMISSION };
        }

        removeDojoRoom(guild, componentId);
        await guild.save();
        return await getDojoClient(guild, eDojoRequestStatus.VALID_REQUEST, undefined, buildLabel);
    }
};

interface IAbortDojoComponentRequest {
    DecoType?: string;
    ComponentId: string;
    DecoId?: string;
    ResultType?: string;
    Alliance?: boolean;
}
