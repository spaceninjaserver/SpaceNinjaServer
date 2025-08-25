import type { IOid } from "@/src/types/commonTypes";
import type {
    ICrewShipCustomization,
    IFlavourItem,
    IItemConfig,
    ILotusCustomization,
    IOperatorConfigClient
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import type { Types } from "mongoose";
import type {
    ICrewShipMembersClient,
    ICrewShipWeaponClient,
    IEquipmentSelectionClient,
    IEquipmentSelectionDatabase
} from "@/src/types/equipmentTypes";

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
    AdultOperatorLoadOuts: IOperatorConfigEntry;
    OperatorLoadOuts: IOperatorConfigEntry;
    KahlLoadOuts: IOperatorConfigEntry;
    CrewShips: IItemEntry;
    CurrentLoadOutIds: IOid[];
    ValidNewLoadoutId: string;
    ActiveCrewShip: IOid;
    EquippedGear: string[];
    EquippedEmotes: string[];
    UseAdultOperatorLoadout: boolean;
    WeaponSkins: IItemEntry;
    LotusCustomization: ILotusCustomization;
}

export type ISaveLoadoutRequestNoUpgradeVer = Omit<ISaveLoadoutRequest, "UpgradeVer">;

export interface IOperatorConfigEntry {
    [configId: string]: IOperatorConfigClient;
}

// client
export interface IItemEntry {
    [itemId: string]: IConfigEntry;
}

// client
export type IConfigEntry = {
    [configId in "0" | "1" | "2" | "3" | "4" | "5"]: IItemConfig;
} & {
    Favorite?: boolean;
    IsNew?: boolean;
    // Railjack
    ItemName?: string;
    RailjackImage?: IFlavourItem;
    Customization?: ICrewShipCustomization;
    Weapon?: ICrewShipWeaponClient;
    CrewMembers?: ICrewShipMembersClient;
};

export type ILoadoutClient = Omit<ILoadoutDatabase, "_id" | "loadoutOwnerId">;

export interface ILoadoutDatabase {
    NORMAL: ILoadoutConfigDatabase[];
    SENTINEL: ILoadoutConfigDatabase[];
    ARCHWING: ILoadoutConfigDatabase[];
    NORMAL_PVP: ILoadoutConfigDatabase[];
    LUNARO: ILoadoutConfigDatabase[];
    OPERATOR: ILoadoutConfigDatabase[];
    GEAR?: ILoadoutConfigDatabase[];
    KDRIVE: ILoadoutConfigDatabase[];
    DATAKNIFE: ILoadoutConfigDatabase[];
    MECH: ILoadoutConfigDatabase[];
    OPERATOR_ADULT: ILoadoutConfigDatabase[];
    DRIFTER: ILoadoutConfigDatabase[];
    _id: Types.ObjectId;
    loadoutOwnerId: Types.ObjectId;
}

export interface ILoadOutPresets {
    NORMAL: ILoadoutConfigClient[];
    NORMAL_PVP: ILoadoutConfigClient[];
    LUNARO: ILoadoutConfigClient[];
    ARCHWING: ILoadoutConfigClient[];
    SENTINEL: ILoadoutConfigClient[];
    OPERATOR: ILoadoutConfigClient[];
    GEAR?: ILoadoutConfigClient[];
    KDRIVE: ILoadoutConfigClient[];
    DATAKNIFE: ILoadoutConfigClient[];
    MECH: ILoadoutConfigClient[];
    OPERATOR_ADULT: ILoadoutConfigClient[];
    DRIFTER: ILoadoutConfigClient[];
}

export interface ILoadoutEntry {
    [key: string]: ILoadoutConfigClient;
}

export enum FocusSchool {
    Attack = "AP_ATTACK",
    Defense = "AP_DEFENSE",
    Power = "AP_POWER",
    Tactic = "AP_TACTIC",
    Ward = "AP_WARD"
}

export interface ILoadoutConfigClient {
    FocusSchool?: FocusSchool;
    PresetIcon?: string;
    Favorite?: boolean;
    n?: string; // Loadout name
    s?: IEquipmentSelectionClient; // Suit
    p?: IEquipmentSelectionClient; // Secondary weapon
    l?: IEquipmentSelectionClient; // Primary weapon
    m?: IEquipmentSelectionClient; // Melee weapon
    h?: IEquipmentSelectionClient; // Gravimag weapon
    a?: IEquipmentSelectionClient; // Necromech exalted weapon
    ItemId: IOid;
    Remove?: boolean; // when client wants to remove a config, it only includes ItemId & Remove.
}

export interface ILoadoutConfigDatabase
    extends Omit<ILoadoutConfigClient, "ItemId" | "s" | "p" | "l" | "m" | "h" | "a"> {
    _id: Types.ObjectId;
    s?: IEquipmentSelectionDatabase;
    p?: IEquipmentSelectionDatabase;
    l?: IEquipmentSelectionDatabase;
    m?: IEquipmentSelectionDatabase;
    h?: IEquipmentSelectionDatabase;
    a?: IEquipmentSelectionDatabase;
}
