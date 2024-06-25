import { IQuestKeyDatabase } from "@/src/types/inventoryTypes/inventoryTypes";

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

export interface IGiveKeyChainTriggeredMessageGroup {
    experiment: string;
    experimentGroup: string;
}

export interface IGiveKeyChainTriggeredMessageRequest {
    KeyChain: string;
    ChainStage: number;
    Groups: IGiveKeyChainTriggeredMessageGroup[];
}