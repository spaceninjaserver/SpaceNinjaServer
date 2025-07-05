import { RequestHandler } from "express";
import { getAccountForRequest, isAdministrator, isNameTaken } from "@/src/services/loginService";
import { config } from "@/src/services/configService";
import { saveConfig } from "@/src/services/configWriterService";

export const renameAccountController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (typeof req.query.newname == "string") {
        if (await isNameTaken(req.query.newname)) {
            res.status(409).json("Name already in use");
        } else {
            if (isAdministrator(account)) {
                for (let i = 0; i != config.administratorNames!.length; ++i) {
                    if (config.administratorNames![i] == account.DisplayName) {
                        config.administratorNames![i] = req.query.newname;
                    }
                }
                await saveConfig();
            }

            account.DisplayName = req.query.newname;
            await account.save();

            res.end();
        }
    } else {
        res.status(400).end();
    }
};
