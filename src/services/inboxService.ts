import { Inbox } from "@/src/models/inboxModel";
import { IInboxDatabase, IInboxReponseClient } from "@/src/types/inboxTypes";

export const getInboxList = async (accountId: string) => {
    const inboxList = await Inbox.find({ OwnerId: accountId });
    return inboxList;
};

export const getInboxReponse = async (accountId: string): Promise<{ Inbox: IInboxReponseClient[] }> => {
    const inboxList = await getInboxList(accountId);
    const list: IInboxReponseClient[] = [];
    inboxList.forEach(inbox => {
        list.push(inbox.toJSON());
    });
    return { Inbox: list };
};

export const readInbox = async (inboxId: string) => {
    const inbox = await Inbox.findByIdAndUpdate(inboxId, { r: true });
    if (!inbox) {
        throw new Error("inbox not found");
    }
    return inbox.toJSON();
};

export const addInbox = async (inboxData: IInboxDatabase) => {
    console.log(inboxData);
    const inbox = new Inbox(inboxData);
    try {
        await inbox.save();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("error creating inbox that is not of instance Error");
    }
};

export const deleteInbox = async (inboxId: string) => {
    const inbox = await Inbox.findByIdAndDelete(inboxId);
    if (!inbox) {
        throw new Error("inbox not found");
    }
    return inbox;
};

export const deleteAllReadInbox = async (accountId: string): Promise<void> => {
    await Inbox.deleteMany({ OwnerId: accountId, r: true });
};
