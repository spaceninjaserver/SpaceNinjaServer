import type { RequestHandler } from "express";
import { configIdToIndexable } from "../../services/configService.ts";
import { syncConfigWithDatabase } from "../../services/configWatcherService.ts";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import { saveConfig } from "../../services/configWriterService.ts";
import { sendWsBroadcastEx, sendWsBroadcast } from "../../services/wsService.ts";

export const getConfigController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        const responseData: Record<string, boolean | string | number | null> = {};
        for (const id of req.body as string[]) {
            const [obj, idx] = configIdToIndexable(id);
            responseData[id] = obj[idx] ?? null;
        }
        res.json(responseData);
    } else {
        res.json(null);
    }
};

export const setConfigController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        let isWorldStateUpdate = false;
        for (const [id, value] of Object.entries(req.body as Record<string, boolean | string | number>)) {
            if (id.startsWith("worldState")) isWorldStateUpdate = true;
            const [obj, idx] = configIdToIndexable(id);
            obj[idx] = value;
        }
        await saveConfig();
        sendWsBroadcastEx({ config_reloaded: true }, undefined, parseInt(String(req.query.wsid)));
        if (isWorldStateUpdate) sendWsBroadcast({ sync_world_state: true });
        syncConfigWithDatabase();
        res.end();
    } else {
        res.status(401).end();
    }
};
