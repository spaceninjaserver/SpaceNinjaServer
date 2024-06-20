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

export interface ILoadoutDatabase {
    NORMAL: ILoadoutEntry;
    SENTINEL: ILoadoutEntry;
    ARCHWING: ILoadoutEntry;
    NORMAL_PVP: ILoadoutEntry;
    LUNARO: ILoadoutEntry;
    OPERATOR: ILoadoutEntry;
    KDRIVE: ILoadoutEntry;
    DATAKNIFE: ILoadoutEntry;
    MECH: ILoadoutEntry;
    OPERATOR_ADULT: ILoadoutEntry;
    DRIFTER: ILoadoutEntry;
    _id: Types.ObjectId;
    loadoutOwnerId: Types.ObjectId;
}

export interface ILoadoutEntry {
    [key: string]: ILoadoutConfigClient;
}
export interface ILoadoutConfigDatabase extends Omit<ILoadoutConfigClient, "ItemId"> {
    _id: Types.ObjectId;
}
