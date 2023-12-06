import { IOid } from "@/src/types/commonTypes";
import { IAbilityOverride, IColor, IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Types } from "mongoose";

export interface ISuitClient extends ISuitDatabase {
    ItemId: IOid;
}

export interface ISuitDatabase {
    ItemType: string;
    Configs: IItemConfig[];
    UpgradeVer?: number;
    XP?: number;
    InfestationDate?: Date;
    Features?: number;
    Polarity?: IPolarity[];
    Polarized?: number;
    ModSlotPurchases?: number;
    FocusLens?: string;
    UnlockLevel?: number;
    _id: Types.ObjectId;
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
