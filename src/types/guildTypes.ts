import { Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";

export interface IGuild {
    Name: string;
}

export interface IDatabaseGuild extends IGuild {
    _id: Types.ObjectId;
}

export interface IGuildResponse extends IGuild {
    _id: IOid;
}

export interface ICreateGuildRequest {
    guildName: string;
}
