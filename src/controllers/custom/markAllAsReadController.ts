import type { RequestHandler } from "express";
import { getMessagesSorted, readMessage } from "../../services/inboxService.ts";
import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const markAllAsReadController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const messages = await getMessagesSorted(account._id, getBuildVersion(req, account));
    let count = 0;
    for (const message of messages) {
        if (!message.r) {
            await readMessage(account, message);
            ++count;
        }
    }
    if (count != 0) {
        broadcastInventoryUpdate(req);
    }
    res.json({ count });
};
