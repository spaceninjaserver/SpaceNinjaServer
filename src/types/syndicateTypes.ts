export interface ISyndicateSacrifice {
    AffiliationTag: string;
    SacrificeLevel: number;
    AllowMultiple: boolean;
}

export interface ISyndicateSacrificeResponse {
    AffiliationTag: string;
    Level: number;
    LevelIncrease: number;
    InventoryChanges: any[];
    NewEpisodeReward: boolean;
}
