import { IOid, IMongoDate } from "@/src/types/commonTypes";

export interface IGuild {
    Name: string;
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
    pf: string;
    ppf: string;
    id: IOid;
    CompletionTime: IMongoDate;
    DecoCapacity: number;
}
