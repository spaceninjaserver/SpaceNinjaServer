import { Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";
import { toOid } from "@/src/helpers/inventoryHelpers";

export interface IGuild {
    Name: string;
}

export interface IDatabaseGuild extends IGuild {
    _id: Types.ObjectId;
}

export interface IGuildResponse extends IGuild {
    _id: IOid;
}

export function guildDbToResponse(guild: IDatabaseGuild): IGuildResponse {
    (guild as IGuild as IGuildResponse)._id = toOid(guild._id);
    return guild as IGuild as IGuildResponse;
}
