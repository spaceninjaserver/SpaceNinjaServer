import { RequestHandler } from "express";
import { config } from "@/src/services/configService";
import { getAccountForRequest, isAdministrator } from "@/src/services/loginService";

const getConfigDataController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (isAdministrator(account)) {
        res.json(config);
    } else {
        res.status(401).end();
    }
};

export { getConfigDataController };
