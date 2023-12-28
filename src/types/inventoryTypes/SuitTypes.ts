import { IOid } from "@/src/types/commonTypes";
import { IPolarity } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Types } from "mongoose";
import { IItemConfig } from "./commonInventoryTypes";

export interface ISuitClient extends Omit<ISuitDatabase, "_id"> {
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
    ItemId?: IOid; // only in response
}
