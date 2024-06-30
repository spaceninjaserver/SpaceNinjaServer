import { Types } from "mongoose";
import { IMongoDate, IOid } from "./commonTypes";

export interface ICountedAttDatabase {
    ItemType: string;
    ItemCount: number;
}

export interface IInboxArgDatabase {
    Key: string;
    Tag: number;
}

export interface IInboxDatabase {
    OwnerId: Types.ObjectId;
    sndr: string;
    msg: string;
    arg?: IInboxArgDatabase[];
    att?: string[];
    sub: string;
    icon: string;
    startDate?: Date;
    endDate?: Date;
    url?: string;
    highPriority: boolean;
    lowPrioNewPlayers?: boolean;
    CrossPlatform?: boolean;
    date: Date;
    r: boolean;
    countedAtt?: ICountedAttDatabase[];
}

export interface IInboxDatabaseDocument extends IInboxDatabase {
    id: string;
}

export interface IInboxReponseClient {
    messageId: IOid;
    sndr: string;
    msg: string;
    arg: IInboxArgDatabase[];
    att?: string[];
    sub: string;
    icon: string;
    startDate?: IMongoDate;
    endDate?: IMongoDate;
    url?: string;
    highPriority: boolean;
    lowPrioNewPlayers?: boolean;
    CrossPlatform?: boolean
    date: IMongoDate;
    r: boolean;
    countedAtt?: ICountedAttDatabase[];
}

export interface IInboxRequest {}

export interface IInboxReponse {
    Inbox: IInboxReponseClient[];
}
