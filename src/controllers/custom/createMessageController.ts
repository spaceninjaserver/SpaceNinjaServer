import type { IMessageCreationTemplate } from "@/src/services/inboxService";
import { createMessage } from "@/src/services/inboxService";
import type { RequestHandler } from "express";

export const createMessageController: RequestHandler = async (req, res) => {
    const message = req.body as (IMessageCreationTemplate & { ownerId: string })[] | undefined;

    if (!message) {
        res.status(400).send("No message provided");
        return;
    }
    const savedMessages = await createMessage(message[0].ownerId, message);

    res.json(savedMessages);
};
