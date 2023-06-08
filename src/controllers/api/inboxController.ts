import { RequestHandler } from "express";
import inbox from "@/static/fixed_responses/inbox.json";
import { Inbox } from "@/src/models/inboxModel";
import { DeleteInbox, UpdateInbox } from "@/src/services/inboxService";
import { parseString } from "@/src/helpers/general";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const inboxController: RequestHandler = async (req, res) => {
    const accountId = req.query["accountId"];
    const deleteId = req.query["deleteId"];
    const messageId = req.query["messageId"];
    const lastMessage = req.query["lastMessage"];

    if (!deleteId && !messageId && !lastMessage) {
        const inbox = await Inbox.find({ OwnerId: accountId });
        if (!inbox) {
            res.status(400).json({ error: "inbox was undefined" });
            return;
        }
        res.json({ Inbox: inbox });
        return;
    }
    if (deleteId && !messageId && !lastMessage) {
        const newInbox = await DeleteInbox(parseString(accountId), parseString(messageId));
        res.json({ Inbox: newInbox });
        return;
    }
    if (!deleteId && messageId && !lastMessage) {
        const newInbox = await UpdateInbox(parseString(accountId), parseString(messageId));
        res.json({ Inbox: newInbox });
        return;
    }
    if (!deleteId && !messageId && lastMessage) {
        console.log(lastMessage);
    }
    res.json(inbox);
};

export { inboxController };
