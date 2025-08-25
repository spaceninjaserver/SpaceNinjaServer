import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { createMessage } from "@/src/services/inboxService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";

export const sendMsgToInBoxController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<ISendMsgToInBoxRequest>(String(req.body));
    await createMessage(accountId, [
        {
            sub: data.title,
            msg: data.message,
            sndr: data.sender ?? "/Lotus/Language/Bosses/Ordis",
            icon: data.senderIcon,
            highPriority: data.highPriority,
            transmission: data.transmission,
            att: data.attachments
        }
    ]);
    res.end();
};

interface ISendMsgToInBoxRequest {
    title: string;
    message: string;
    sender?: string;
    senderIcon?: string;
    highPriority?: boolean;
    transmission?: string;
    attachments?: string[];
}
