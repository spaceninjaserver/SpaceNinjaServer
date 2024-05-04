import { Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";

export interface IGuild {
    Name: string;
}

export interface ICreateGuildRequest {
    guildName: string;
}
