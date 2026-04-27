import type { IMessageCreationTemplate } from "../../services/inboxService.ts";
import { createMessage } from "../../services/inboxService.ts";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const createMessageController: RequestHandler = async (req, res) => {
    const message = req.body as (IMessageCreationTemplate & { ownerId: string })[] | undefined;

    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) {
        res.status(401).end();
        return;
    }

    if (!Array.isArray(message) || message.length === 0) {
        res.status(400).send("No message provided");
        return;
    }
    await createMessage(message[0].ownerId, message);

    res.status(204).end();
};
