import { IOid } from "@/src/types/commonTypes";
import { IItemConfig } from "./commonInventoryTypes";
import { IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Types } from "mongoose";

export interface IWeaponClient extends Omit<IWeaponDatabase, "_id"> {
    ItemId: IOid;
}

export interface IWeaponDatabase {
    ItemType: string;
    Configs: IItemConfig[];
    UpgradeVer?: number;
    XP?: number;
    Features?: number;
    Polarized?: number;
    Polarity?: IPolarity[];
    FocusLens?: string;
    ModSlotPurchases?: number;
    UpgradeType?: string;
    UpgradeFingerprint?: string;
    ItemName?: string;
    ModularParts?: string[];
    UnlockLevel?: number;
    _id: Types.ObjectId;
}

export interface IOperatorLoadOutSigcol {
    t0?: number;
    t1?: number;
    en?: number;
}
