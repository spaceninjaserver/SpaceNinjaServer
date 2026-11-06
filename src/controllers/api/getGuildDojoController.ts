import type { RequestHandler } from "express";
import { Guild } from "../../models/guildModel.ts";
import { getDojoClient } from "../../services/guildService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { eDojoRequestStatus } from "../../types/guildTypes.ts";

export const getGuildDojoController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const guildId = req.query.guildId as string;

    const guild = await Guild.findById(guildId);
    if (!guild) {
        res.status(404).end();
        return;
    }

    const payload: IGetGuildDojoRequest = req.body ? (JSON.parse(String(req.body)) as IGetGuildDojoRequest) : {};
    res.json(
        await getDojoClient(
            guild,
            eDojoRequestStatus.VALID_REQUEST,
            payload.ComponentId ?? (req.query.componentId as string | undefined),
            buildLabel
        )
    );
};

interface IGetGuildDojoRequest {
    ComponentId?: string;
}
