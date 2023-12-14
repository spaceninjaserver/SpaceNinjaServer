import { IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";

export interface IPolarity {
    Slot: number;
    Value: FocusSchool;
}

export enum FocusSchool {
    ApAny = "AP_ANY",
    ApAttack = "AP_ATTACK",
    ApDefense = "AP_DEFENSE",
    ApPower = "AP_POWER",
    ApPrecept = "AP_PRECEPT",
    ApTactic = "AP_TACTIC",
    ApUmbra = "AP_UMBRA",
    ApUniversal = "AP_UNIVERSAL",
    ApWard = "AP_WARD"
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

// ISigCol? IsIgCoL? ISIGCOL!
export interface Isigcol {
    t0: number;
    t1: number;
    en: number;
}

interface IItemConfigBase {
    Skins: string[];
    pricol?: IColor;
    attcol?: IColor;
    sigcol?: IColor;
    eyecol?: IColor;
    facial?: IColor;
    syancol?: IColor;
    cloth?: IColor;
    Upgrades?: string[];
    Name?: string;
    ugly?: boolean;
}

//TODO: Proper names for the different config types, this should be something like
//IItemConfigPlayable
export interface IItemConfig extends IItemConfigBase {
    Songs?: ISong[];
    AbilityOverride?: IAbilityOverride;
    PvpUpgrades?: string[];
    ugly?: boolean;
}

export interface ISong {
    m?: string;
    b?: string;
    p?: string;
    s: string;
}

//TODO: Consider renaming it to loadout instead of config
export interface IOperatorConfigDatabase extends IItemConfigBase {
    _id: Types.ObjectId;
    AbilityOverride?: IAbilityOverride; // not present in adultOperator
    OperatorAmp?: IOid; // not present in adultOperator
}

export interface IOperatorConfigClient extends Omit<IOperatorConfigDatabase, "_id"> {
    ItemId: IOid;
}
