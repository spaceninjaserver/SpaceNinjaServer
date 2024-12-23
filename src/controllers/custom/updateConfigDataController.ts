import { RequestHandler } from "express";
import { updateConfig } from "@/src/services/configService";
import { getAccountForRequest, isAdministrator } from "@/src/services/loginService";

const updateConfigDataController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        await updateConfig(String(req.body));
        res.end();
    } else {
        res.status(401).end();
    }
};

export { updateConfigDataController };
