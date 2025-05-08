import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Friendship } from "@/src/models/friendModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const setFriendNoteController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<ISetFriendNoteRequest>(String(req.body));
    const friendship = await Friendship.findOne({ owner: accountId, friend: payload.FriendId }, "Note Favorite");
    if (friendship) {
        if ("Note" in payload) {
            friendship.Note = payload.Note;
        } else {
            friendship.Favorite = payload.Favorite;
        }
        await friendship.save();
    }
    res.json({
        Id: payload.FriendId,
        SetNote: "Note" in payload,
        Note: friendship?.Note,
        Favorite: friendship?.Favorite
    });
};

interface ISetFriendNoteRequest {
    FriendId: string;
    Note?: string;
    Favorite?: boolean;
}
