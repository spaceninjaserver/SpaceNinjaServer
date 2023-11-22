export interface ISaveLoadoutRequest {
    LoadOuts: { [key: string]: LoadOut };
    LongGuns: { [key: string]: Config };
    OperatorAmps: { [key: string]: Config };
    Pistols: { [key: string]: Config };
    Suits: { [key: string]: Config };
    Melee: {};
    Sentinels: {};
    SentinelWeapons: {};
    KubrowPets: {};
    SpaceSuits: {};
    SpaceGuns: {};
    SpaceMelee: {};
    Scoops: {};
    SpecialItems: {};
    MoaPets: {};
    Hoverboards: {};
    DataKnives: {};
    MechSuits: {};
    CrewShipHarnesses: {};
    Horses: {};
    DrifterMelee: {};
    UpgradeVer: number;
    OperatorLoadOuts: {};
    AdultOperatorLoadOuts: {};
    KahlLoadOuts: {};
    CrewShips: {};
}

export interface Config {
    Upgrades: any[];
    PvpUpgrades: any[];
    Skins: string[];
    pricol: Pricol;
    attcol: Pricol;
    sigcol: Sigcol;
    eyecol: Pricol;
    facial: Pricol;
    cloth: Pricol;
    syancol: Pricol;
    Songs: any[];
}

export interface Pricol {
    t0: number;
    t1: number;
    t2: number;
    t3: number;
    m0: number;
    m1: number;
    en: number;
}

export interface Sigcol {
    t0: number;
    t1: number;
    m0: number;
    en: number;
}

export interface Col {
    t0: number;
    t1: number;
    t2: number;
    t3: number;
    m0?: number;
    m1?: number;
    en: number;
    e1?: number;
}

export interface LoadOuts {
    NORMAL: LoadOut;
    SENTINEL: LoadOut;
    ARCHWING: LoadOut;
    NORMAL_PVP: LoadOut;
    LUNARO: LoadOut;
    OPERATOR: LoadOut;
    KDRIVE: LoadOut;
    DATAKNIFE: LoadOut;
    MECH: LoadOut;
    OPERATOR_ADULT: LoadOut;
    DRIFTER: LoadOut;
}

type LoadOut = {
    Upgrades: Config[];
    PvpUpgrades: Config[];
    Skins: string[];
    pricol: { [key: string]: number };
    attcol: Config;
    sigcol: Config;
    eyecol: Config;
    facial: Config;
    cloth: Config;
    syancol: Config;
    Songs: Config[];
};

export type EquipmentCategories =
    | { LoadOuts: { [key in keyof LoadOuts]: LoadOut } }
    | { LongGuns: Config }
    | { OperatorAmps: Config } // Replace 'any' with the actual type
    | { Pistols: Config } // Replace 'any' with the actual type
    | { Suits: { [key: string]: Config } }
    | { Melee: Config } // Replace 'any' with the actual type
    | { Sentinels: Config } // Replace 'any' with the actual type
    | { SentinelWeapons: Config } // Replace 'any' with the actual type
    // Add other categories based on your needs
    | { UpgradeVer: number }
    | { OperatorLoadOuts: Config } // Replace 'any' with the actual type
    | { AdultOperatorLoadOuts: Config } // Replace 'any' with the actual type
    | { KahlLoadOuts: Config } // Replace 'any' with the actual type
    | { CrewShips: Config }; // Replace 'any' with the actual type
