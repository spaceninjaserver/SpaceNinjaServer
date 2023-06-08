import { Inbox } from "../models/inboxModel";

const UpdateInbox = async (accountId: string, messageId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const inbox = await Inbox.findOne({ _id: messageId });
    if (inbox) inbox.r = true;
    if (inbox) await inbox.updateOne(inbox);
    return await Inbox.find({ OwnerId: accountId });
};

const DeleteInbox = async (accountId: string, messageId: string) => {
    const inbox = await Inbox.findOne({ _id: messageId });
    if (inbox) await inbox.deleteOne();
    return await Inbox.find({ OwnerId: accountId });
};

export { UpdateInbox, DeleteInbox };
