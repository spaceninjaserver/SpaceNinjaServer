import type { RequestHandler } from "express";
import { Guild } from "../../models/guildModel.ts";
import { getDojoClient } from "../../services/guildService.ts";
import { Account } from "../../models/loginModel.ts";

export const getGuildDojoController: RequestHandler = async (req, res) => {
    const guildId = req.query.guildId as string;

    const guild = await Guild.findById(guildId);
    if (!guild) {
        res.status(404).end();
        return;
    }

    const payload: IGetGuildDojoRequest = req.body ? (JSON.parse(String(req.body)) as IGetGuildDojoRequest) : {};
    const account = await Account.findById(req.query.accountId as string);
    res.json(
        await getDojoClient(
            guild,
            0,
            payload.ComponentId ?? (req.query.componentId as string | undefined),
            account?.BuildLabel
        )
    );
};

interface IGetGuildDojoRequest {
    ComponentId?: string;
}
