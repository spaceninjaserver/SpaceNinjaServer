import type { IMongoDate, IOid, ITypeCount } from "./commonTypes.ts";
import type { INemesisBaseClient } from "./inventoryTypes/inventoryTypes.ts";
import type { IAffiliationMods, IInventoryChanges } from "./purchaseTypes.ts";

export interface IMissionReward {
    StoreItem: string;
    TypeName?: string;
    UpgradeLevel?: number;
    ItemCount: number;
    DailyCooldown?: boolean;
    Rarity?: number;
    TweetText?: string;
    ProductCategory?: string;
    FromEnemyCache?: boolean;
    IsStrippedItem?: boolean;
}

export interface IMissionCredits {
    MissionCredits: [number, number];
    CreditsBonus: [number, number]; // "Credit Reward"; `CreditsBonus[1]` is `CreditsBonus[0] * 2` if DailyMissionBonus
    TotalCredits: [number, number]; // TotalCredits[0] - TaxedCredits = TotalCredits[1]
    DailyMissionBonus?: boolean;
}

// These fields will only be respected by the client when completing a showdown mission.
export interface INemsisEndBody {
    WeaponRecipes?: {
        ItemType: string;
        CompletionDate: IMongoDate;
        TargetFingerprint: string;
        ItemId: IOid;
    }[]; // TODO: We should probably send this sometimes when defeating a nemesis?
    RecoveredItemInfo?: IRecoveredItemInfo;
    EphemeraReward?: string; // TODO: We should probably send this sometimes when defeating a nemesis?
    BaitReward?: "/Lotus/StoreItems/Types/Restoratives/Consumable/NemesisBait"; // TODO: We should probably send this sometimes when defeating a nemesis?
    history?: INemesisBaseClient; // TODO: We should probably send this sometimes when defeating a nemesis?
}

export interface IMissionInventoryUpdateResponseRailjackInterstitial extends Partial<IMissionCredits>, INemsisEndBody {
    ConquestCompletedMissionsCount?: number;
    MissionRewards?: IMissionReward[];
    InventoryChanges?: IInventoryChanges;
    FusionPoints?: number;
    SyndicateXPItemReward?: number;
    AffiliationMods?: IAffiliationMods[];
    NemesisTaxInfo?: INemesisTaxInfo;
}

export interface IMissionInventoryUpdateResponse extends IMissionInventoryUpdateResponseRailjackInterstitial {
    InventoryJson?: string;
    CompletedSortie?: true;
}

export interface IMissionInventoryUpdateResponseBackToDryDock {
    InventoryJson: string;
}

export interface INemesisTaxInfo {
    TaxRate: number; // client errors if this field is not given
    TaxCreditsOnly: boolean; // always given in the response on live, but not used by the client
    TaxedCredits?: number;
    TaxedFusionPoints?: number;
    TaxedCrewShipFusionPoints?: number;
    TaxedCollectedItems?: IMissionReward[]; // these must also be present in MissionRewards array
    TaxedMiscItems?: ITypeCount[]; // can also contain upgrade types
}

export interface IRecoveredItemInfo {
    RecoveredMiscItems: ITypeCount[];
    RecoveredCredits?: number;
    RecoveredFusionPoints?: number;
    RecoveredCollectedItems?: ITypeCount[]; // not added to MissionRewards in this case
}
