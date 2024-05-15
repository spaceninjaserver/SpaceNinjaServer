import { Types } from "mongoose";
import { IOid, IMongoDate } from "@/src/types/commonTypes";

export interface IGuild {
    Name: string;
}

export interface IGuildDatabase extends IGuild {
    _id: Types.ObjectId;
    DojoComponents?: IDojoComponentDatabase[];
}

export interface ICreateGuildRequest {
    guildName: string;
}

export interface IDojoClient {
    _id: IOid; // ID of the guild
    Name: string;
    Tier: number;
    FixedContributions: boolean;
    DojoRevision: number;
    RevisionTime: number;
    Energy: number;
    Capacity: number;
    DojoRequestStatus: number;
    DojoComponents: IDojoComponentClient[];
}

export interface IDojoComponentClient {
    id: IOid;
    pf: string;
    ppf: string;
    CompletionTime: IMongoDate;
    DecoCapacity: number;
}

export interface IDojoComponentDatabase {
    _id: Types.ObjectId;
    pf: string;
    ppf: string;
    CompletionTime: Date;
}
