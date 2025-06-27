import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import { getAccountForRequest, isAdministrator } from "@/src/services/loginService";
import { saveConfig } from "@/src/services/configWatcherService";

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
        res.status(401).end();
    }
};

export const setConfigController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        for (const [id, value] of Object.entries(req.body as Record<string, boolean | string | number>)) {
            const [obj, idx] = configIdToIndexable(id);
            obj[idx] = value;
        }
        await saveConfig();
        res.end();
    } else {
        res.status(401).end();
    }
};

const configIdToIndexable = (id: string): [Record<string, boolean | string | number | undefined>, string] => {
    let obj = config as unknown as Record<string, never>;
    const arr = id.split(".");
    while (arr.length > 1) {
        obj = obj[arr[0]];
        arr.splice(0, 1);
    }
    return [obj, arr[0]];
};
