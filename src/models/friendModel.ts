import { IFriendship } from "@/src/types/friendTypes";
import { model, Schema } from "mongoose";

const friendshipSchema = new Schema<IFriendship>({
    owner: { type: Schema.Types.ObjectId, required: true },
    friend: { type: Schema.Types.ObjectId, required: true },
    Note: String,
    Favorite: Boolean
});

friendshipSchema.index({ owner: 1 });
friendshipSchema.index({ friend: 1 });
friendshipSchema.index({ owner: 1, friend: 1 }, { unique: true });

export const Friendship = model<IFriendship>("Friendship", friendshipSchema);
