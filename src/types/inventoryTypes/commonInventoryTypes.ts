import type { IOid } from "../commonTypes.ts";
import type { Types } from "mongoose";

export interface IPolarity {
    Slot: number;
    Value: ArtifactPolarity;
}

export enum ArtifactPolarity {
    Any = "AP_ANY",
    Attack = "AP_ATTACK",
    Defense = "AP_DEFENSE",
    Power = "AP_POWER",
    Precept = "AP_PRECEPT",
    Tactic = "AP_TACTIC",
    Umbra = "AP_UMBRA",
    Universal = "AP_UNIVERSAL",
    Ward = "AP_WARD"
}

export interface IColor {
    t0?: number;
    t1?: number;
    t2?: number;
    t3?: number;
    en?: number;
    e1?: number;
    m0?: number;
    m1?: number;
}

export interface IAbilityOverride {
    Ability: string;
    Index: number;
}

export interface ISlotsBin {
    Slots: number;
}

export interface IItemConfig {
    Skins?: string[];
    pricol?: IColor;
    attcol?: IColor;
    sigcol?: IColor;
    eyecol?: IColor;
    facial?: IColor;
    syancol?: IColor;
    cloth?: IColor;
    Upgrades?: string[] | { $id: string }[];
    Name?: string;
    OperatorAmp?: IOid;
    Songs?: ISong[];
    AbilityOverride?: IAbilityOverride;
    PvpUpgrades?: string[];
    ugly?: boolean;
    Colors?: number[]; // U16.0
    Customization?: IItemConfigCustomizationsLegacy; // U10-U15
}

export interface IItemConfigCustomizationsLegacy {
    CustomEmblems?: { EmblemId: string }[];
    Emblem?: string;
    Colors: number[];
    Skins: string[];
}

export interface IItemConfigDatabase extends Omit<IItemConfig, "Upgrades"> {
    Upgrades?: string[];
}

export interface ISong {
    m?: string;
    b?: string;
    p?: string;
    s: string;
}
export interface IOperatorConfigDatabase extends IItemConfigDatabase {
    _id: Types.ObjectId;
}

export interface IOperatorConfigClient extends Omit<IOperatorConfigDatabase, "_id"> {
    ItemId: IOid;
}

export interface ILotusCustomization extends IItemConfig {
    Persona: string;
}

export interface IFlavourItem {
    ItemType: string;
}

export interface IShipAttachments {
    HOOD_ORNAMENT?: string;
}

export interface IShipCustomization {
    SkinFlavourItem?: string;
    Colors?: IColor;
    ShipAttachments?: IShipAttachments;
}

export interface ICrewShipCustomization {
    CrewshipInterior: IShipCustomization;
}
