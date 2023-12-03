import { IOid } from "@/src/types/commonTypes";
import { Document, Mongoose, Types } from "mongoose";

export interface ISaveLoadoutRequest {
    LoadOuts: ILoadoutRequest;
    LongGuns: IConfigEntry;
    OperatorAmps: IConfigEntry;
    Pistols: IConfigEntry;
    Suits: IConfigEntry;
    Melee: IConfigEntry;
    Sentinels: IConfigEntry;
    SentinelWeapons: IConfigEntry;
    KubrowPets: IConfigEntry;
    SpaceSuits: IConfigEntry;
    SpaceGuns: IConfigEntry;
    SpaceMelee: IConfigEntry;
    Scoops: IConfigEntry;
    SpecialItems: IConfigEntry;
    MoaPets: IConfigEntry;
    Hoverboards: IConfigEntry;
    DataKnives: IConfigEntry;
    MechSuits: IConfigEntry;
    CrewShipHarnesses: IConfigEntry;
    Horses: IConfigEntry;
    DrifterMelee: IConfigEntry;
    UpgradeVer: number;
    OperatorLoadOuts: IConfigEntry;
    AdultOperatorLoadOuts: IConfigEntry;
    KahlLoadOuts: IConfigEntry;
    CrewShips: IConfigEntry;
}

export interface ISaveLoadoutRequestNoUpgradeVer extends Omit<ISaveLoadoutRequest, "UpgradeVer"> {}

export interface IConfigEntry {
    [key: string]: Config;
}

export interface ILoadoutRequest extends Omit<ILoadoutDatabase, "_id"> {}

export interface ILoadoutResponse extends ILoadoutDatabase {
    ItemId: IOid;
}

export interface ILoadoutDatabase {
    NORMAL: ILoadoutConfigDatabase;
    SENTINEL: ILoadoutConfigDatabase;
    ARCHWING: ILoadoutConfigDatabase;
    NORMAL_PVP: ILoadoutConfigDatabase;
    LUNARO: ILoadoutConfigDatabase;
    OPERATOR: ILoadoutConfigDatabase;
    KDRIVE: ILoadoutConfigDatabase;
    DATAKNIFE: ILoadoutConfigDatabase;
    MECH: ILoadoutConfigDatabase;
    OPERATOR_ADULT: ILoadoutConfigDatabase;
    DRIFTER: ILoadoutConfigDatabase;
}

export interface ILoadoutKey {
    [key: string]: ILoadoutConfigClient;
}

// for request and response from and to client
export interface ILoadoutConfigClient {
    ItemId: IOid;
    n: string;
    PresetIcon: string;
    Favorite: boolean;
    s: IEquipmentSelection;
    p: IEquipmentSelection;
    l: IEquipmentSelection;
    m: IEquipmentSelection;
}

export interface ILoadoutConfigDatabase extends Omit<ILoadoutConfigClient, "ItemId"> {
    _id: Types.ObjectId;
}

export interface IEquipmentSelection {
    ItemId: IOid;
    mod: number;
    cus: number;
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

export type EquipmentCategories =
    | { LoadOuts: { [key in keyof ILoadoutRequest]: LoadOut } }
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
