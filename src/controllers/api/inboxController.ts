import { RequestHandler } from "express";
import { deleteAllReadInbox, deleteInbox, getInboxReponse, readInbox } from "@/src/services/inboxService";
import { getAccountIdForRequest } from "@/src/services/loginService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const inboxController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const messageId = req.query.messageId as string;
    const deleteId = req.query.deleteId as string;
    const lastMessage = req.query.lastMessage as string;

    if (messageId) {
        const inbox = await readInbox(messageId);
        res.json({ Inbox: [inbox] });
    }

    if (deleteId) {
        if (deleteId == "DeleteAllRead") {
            await deleteAllReadInbox(accountId);
        } else {
            await deleteInbox(deleteId);
        }
        const result = await getInboxReponse(accountId);
        res.json(result);
    }

    if (lastMessage) {
        /* empty */
    }

    const result = await getInboxReponse(accountId);
    res.json(result);
};

export { inboxController };
