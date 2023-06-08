import { Document } from "mongoose";
import { Oid } from "./commonTypes";

export interface IInboxDocument extends IInboxDatabase, Document {
    Id: Oid;
    MessageId: string;
}

export interface IInboxDatabase extends IInboxResponse {
    OwnerId: string;
}

export interface IInboxResponse {
    globaUpgradeId?: Oid;
    sndr: string;
    sub: string;
    msg: string;
    att?: string[];
    icon: string;
    url?: string;
    highPriority: boolean;
    lowPrioNewPlayers?: boolean;
    CrossPlatform?: boolean;
    date: number;
    startDate?: number;
    endDate?: number;
    r?: boolean;
}
