import type { RequestHandler } from "express";
import { getAccountForRequest, isAdministrator, isNameTaken } from "../../services/loginService.ts";
import { config } from "../../services/configService.ts";
import { saveConfig } from "../../services/configWriterService.ts";
import { MAX_NAME_LENGTH } from "../../models/loginModel.ts";

export const renameAccountController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (typeof req.query.newname == "string") {
        if (req.query.newname.length > MAX_NAME_LENGTH) {
            res.status(400).send("Name too long").end();
        } else if (await isNameTaken(req.query.newname)) {
            res.status(409).send("Name already in use").end();
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
        res.sendStatus(400).end();
    }
};
