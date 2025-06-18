import { RequestHandler } from "express";
import { saveConfig } from "@/src/services/configWatcherService";
import { getAccountForRequest, isAdministrator } from "@/src/services/loginService";
import { config, IConfig } from "@/src/services/configService";

export const updateConfigDataController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        const data = req.body as IUpdateConfigDataRequest;
        config[data.key] = data.value;
        await saveConfig();
        res.end();
    } else {
        res.status(401).end();
    }
};

interface IUpdateConfigDataRequest {
    key: keyof IConfig;
    value: never;
}
