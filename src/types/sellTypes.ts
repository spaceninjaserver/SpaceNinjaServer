export interface ISellRequest {
    Items: {
        Suits?: ISellItem[];
        LongGuns?: ISellItem[];
        Pistols?: ISellItem[];
        Melee?: ISellItem[];
        Consumables?: ISellItem[];
        Recipes?: ISellItem[];
        Upgrades?: ISellItem[];
    };
    SellPrice: number;
    SellCurrency:
        | "SC_RegularCredits"
        | "SC_PrimeBucks"
        | "SC_FusionPoints"
        | "SC_DistillPoints"
        | "SC_CrewShipFusionPoints"
        | "SC_Resources";
    buildLabel: string;
}

export interface ISellItem {
    String: string; // oid or uniqueName
    Count: number;
}
