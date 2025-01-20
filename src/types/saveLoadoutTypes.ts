import { IOid } from "@/src/types/commonTypes";
import { IItemConfig, IOperatorConfigClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Types } from "mongoose";
import { ILoadoutConfigClient } from "./inventoryTypes/inventoryTypes";

export interface ISaveLoadoutRequest {
    LoadOuts: ILoadoutClient;
    LongGuns: IItemEntry;
    OperatorAmps: IItemEntry;
    Pistols: IItemEntry;
    Suits: IItemEntry;
    Melee: IItemEntry;
    Sentinels: IItemEntry;
    SentinelWeapons: IItemEntry;
    KubrowPets: IItemEntry;
    SpaceSuits: IItemEntry;
    SpaceGuns: IItemEntry;
    SpaceMelee: IItemEntry;
    Scoops: IItemEntry;
    SpecialItems: IItemEntry;
    MoaPets: IItemEntry;
    Hoverboards: IItemEntry;
    DataKnives: IItemEntry;
    Motorcycles: IItemEntry;
    MechSuits: IItemEntry;
    CrewShipHarnesses: IItemEntry;
    Horses: IItemEntry;
    DrifterMelee: IItemEntry;
    UpgradeVer: number;
    OperatorLoadOuts: IOperatorConfigEntry;
    AdultOperatorLoadOuts: IOperatorConfigEntry;
    KahlLoadOuts: IItemEntry;
    CrewShips: IItemEntry;
    CurrentLoadOutIds: IOid[];
    ValidNewLoadoutId: string;
    EquippedGear: string[];
    EquippedEmotes: string[];
    UseAdultOperatorLoadout: boolean;
}

export interface ISaveLoadoutRequestNoUpgradeVer extends Omit<ISaveLoadoutRequest, "UpgradeVer"> {}

export interface IOperatorConfigEntry {
    [configId: string]: IOperatorConfigClient;
}

export interface IItemEntry {
    [itemId: string]: IConfigEntry;
}

export interface IConfigEntry {
    [configId: string]: IItemConfig;
}

export interface ILoadoutClient extends Omit<ILoadoutDatabase, "_id" | "loadoutOwnerId"> {}

// keep in sync with ILoadOutPresets
export interface ILoadoutDatabase {
    NORMAL: ILoadoutConfigDatabase[];
    SENTINEL: ILoadoutConfigDatabase[];
    ARCHWING: ILoadoutConfigDatabase[];
    NORMAL_PVP: ILoadoutConfigDatabase[];
    LUNARO: ILoadoutConfigDatabase[];
    OPERATOR: ILoadoutConfigDatabase[];
    KDRIVE: ILoadoutConfigDatabase[];
    DATAKNIFE: ILoadoutConfigDatabase[];
    MECH: ILoadoutConfigDatabase[];
    OPERATOR_ADULT: ILoadoutConfigDatabase[];
    DRIFTER: ILoadoutConfigDatabase[];
    _id: Types.ObjectId;
    loadoutOwnerId: Types.ObjectId;
}

export interface ILoadoutEntry {
    [key: string]: ILoadoutConfigClient;
}
export interface ILoadoutConfigDatabase extends Omit<ILoadoutConfigClient, "ItemId"> {
    _id: Types.ObjectId;
}
