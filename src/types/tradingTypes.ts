import type { Types } from "mongoose";
import type { IOid, ITypeCount } from "./commonTypes.ts";
import type { IFusionTreasure, INemesisClient, IRawUpgrade, IUpgradeClient } from "./inventoryTypes/inventoryTypes.ts";

export interface ITradeOffer {
    RandomUpgrades?: IUpgradeClient[];
    Upgrades?: IUpgradeClient[];
    RawUpgrades?: IRawUpgrade[];
    MiscItems?: ITypeCount[];
    Recipes?: ITypeCount[];
    FusionTreasures?: IFusionTreasure[];
    NemesisHistory?: INemesisClient;
    PremiumCredits?: number;
    _SlotOrderInfo: string[];
}

export interface IPendingTradeClient {
    State: number;
    SelfReady: boolean;
    BuddyReady: boolean;
    Giving?: ITradeOffer;
    Revision: number;
    Getting: ITradeOffer;
    ItemId: IOid;
    ClanTax?: number;
}

export interface IPendingTradeDatabase {
    a: Types.ObjectId;
    b: Types.ObjectId;
    aOffer: ITradeOffer;
    bOffer: ITradeOffer;
    aReady: boolean;
    bReady: boolean;
    aAccepted: boolean;
    bAccepted: boolean;
    revision: number;
    clanTax: number;
    _id: Types.ObjectId;
}
