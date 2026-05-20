import type { Types } from "mongoose";
import type { IMongoDateWithLegacySupport, IOid, IOidWithLegacySupport, ITypeCount } from "./commonTypes.ts";

export interface IMessageClient extends Omit<
    IMessageDatabase,
    | "_id"
    | "globaUpgradeId"
    | "date"
    | "startDate"
    | "endDate"
    | "ownerId"
    | "attVisualOnly"
    | "expiry"
    | "minBuildVersion"
> {
    _id?: IOid;
    globaUpgradeId?: IOidWithLegacySupport; // [sic]
    date: IMongoDateWithLegacySupport;
    startDate?: IMongoDateWithLegacySupport;
    endDate?: IMongoDateWithLegacySupport;
    messageId: IOid;
}

export interface IMessageDatabase extends IMessage {
    ownerId: Types.ObjectId; // SNS-specific
    globaUpgradeId?: Types.ObjectId; // [sic]
    date: Date; //created at
    attVisualOnly?: boolean; // SNS-specific
    minBuildVersion?: number; // SNS-specific
    _id: Types.ObjectId;
}

export interface IMessage {
    sndr: string;
    msg: string;
    cinematic?: string;
    sub: string;
    customData?: string;
    icon?: string;
    highPriority?: boolean;
    lowPrioNewPlayers?: boolean;
    transmission?: string;
    att?: string[];
    countedAtt?: ITypeCount[];
    startDate?: Date;
    endDate?: Date;
    QuestReq?: string;
    goalTag?: string;
    CrossPlatform?: boolean;
    arg?: Arg[];
    gifts?: IGift[];
    r?: boolean;
    contextInfo?: string;
    acceptAction?: string;
    declineAction?: string;
    hasAccountAction?: boolean;
    RegularCredits?: number;
    PremiumCredits?: number;
}

interface Arg {
    Key: string;
    Tag: string | number;
}

export interface IGift {
    GiftType: string;
}

//types are wrong
// export interface IMessageDatabase {
//     _id: Types.ObjectId;
//     messageId: string;
//     sub: string;
//     sndr: string;
//     msg: string;
//     startDate: Date;
//     endDate: Date;
//     date: Date;
//     contextInfo: string;
//     icon: string;
//     att: string[];
//     modPacks: string[];
//     countedAtt: string[];
//     attSpecial: string[];
//     transmission: string;
//     ordisReactionTransmission: string;
//     arg: string[];
//     r: string;
//     acceptAction: string;
//     declineAction: string;
//     highPriority: boolean;
//     lowPrioNewPlayers: boolean
//     gifts: string[];
//     teleportLoc: string;
//     RegularCredits: string;
//     PremiumCredits: string;
//     PrimeTokens: string;
//     Coupons: string[];
//     syndicateAttachment: string[];
//     tutorialTag: string;
//     url: string;
//     urlButtonText: string;
//     cinematic: string;
//     requiredLevel: string;
// }
