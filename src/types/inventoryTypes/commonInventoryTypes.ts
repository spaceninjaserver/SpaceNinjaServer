import type { IOid } from "../commonTypes.ts";
import type { Types } from "mongoose";

export type TArtifactPolarity =
    | "AP_POWER"
    | "AP_DEFENSE"
    | "AP_TACTIC"
    | "AP_ATTACK"
    | "AP_WARD"
    | "AP_UNIVERSAL"
    | "AP_UMBRA"
    | "AP_PRECEPT"
    | "AP_ANY";

export interface IPolarity {
    Slot: number;
    Value: TArtifactPolarity;
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

interface ISong {
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
