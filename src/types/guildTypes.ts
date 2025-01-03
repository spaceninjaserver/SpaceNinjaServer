import { Types } from "mongoose";
import { IOid, IMongoDate } from "@/src/types/commonTypes";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";

export interface IGuild {
    Name: string;
}

export interface IGuildDatabase extends IGuild {
    _id: Types.ObjectId;
    DojoComponents?: IDojoComponentDatabase[];
    DojoCapacity: number;
    DojoEnergy: number;
    TechProjects?: ITechProjectDatabase[];
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
    pf: string; // Prefab (.level)
    ppf: string;
    pi?: IOid; // Parent ID. N/A to root.
    op?: string; // "Open Portal"? N/A to root.
    pp?: string; // "Parent Portal"? N/A to root.
    RegularCredits?: number; // "Collecting Materials" state: Number of credits that were donated.
    MiscItems?: IMiscItem[]; // "Collecting Materials" state: Resources that were donated.
    CompletionTime?: IMongoDate;
    DecoCapacity?: number;
}

export interface IDojoComponentDatabase
    extends Omit<IDojoComponentClient, "id" | "pi" | "CompletionTime" | "DecoCapacity"> {
    _id: Types.ObjectId;
    pi?: Types.ObjectId;
    CompletionTime?: Date;
}

export interface ITechProjectClient {
    ItemType: string;
    ReqCredits: number;
    ReqItems: IMiscItem[];
    State: number; // 0 = pending, 1 = complete
    CompletionDate?: IMongoDate;
}

export interface ITechProjectDatabase extends Omit<ITechProjectClient, "CompletionDate"> {
    CompletionDate?: Date;
}
