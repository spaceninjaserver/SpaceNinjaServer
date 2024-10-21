import { IOid } from "./commonTypes";
import { IQuestKeyDatabase } from "./inventoryTypes/inventoryTypes";

export interface ISetActiveQuestKey {
    ItemType: string;
}

export interface ISetActiveQuestHerse extends ISetActiveQuestKey {
    ItemId: IOid;
}

export interface ISetActiveQuestResponse {
    inventoryChanges: {
        QuestKey: ISetActiveQuestKey[];
        Herses: ISetActiveQuestHerse[];
        PremiumCreditsFree: number;
        PremiumCredits: number;
        RegularCredits: number;
    };
}

export interface IUpdateQuestRequest {
    QuestKeys: IQuestKeyDatabase[];
    PS: string;
    questCompletion: boolean;
    PlayerShipEvents: [];
    crossPlaySetting: string;
}

export interface IUpdateQuestResponse {
    CustomData?: string;
    MissionRewards: [];
}

export interface IGiveKeyChainTriggeredItemsRequest {
    KeyChain: string;
    ChainStage: number;
}

export interface IGiveKeyChainTriggeredItemsResponse {
    WishlistChanges?: [string];
    MiscItems?: [{ ItemType: string; ItemCount: number }];
    Recipes?: [{ ItemType: string; ItemCount: number }];
    MissionRewards?: [];
}
