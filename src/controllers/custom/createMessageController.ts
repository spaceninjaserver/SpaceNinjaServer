import type { IMessageCreationTemplate } from "../../services/inboxService.ts";
import { createMessage } from "../../services/inboxService.ts";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const createMessageController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) {
        res.status(401).end();
        return;
    }

    const data = req.body as ICreateMessageRequest;
    for (const targetId of data.targetIds) {
        await createMessage(targetId, data.messages);
    }

    res.status(204).end();
};

interface ICreateMessageRequest {
    targetIds: string[];
    messages: IMessageCreationTemplate[];
}
