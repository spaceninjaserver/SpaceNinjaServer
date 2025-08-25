import type { Types } from "mongoose";
import type { IColor, IShipAttachments } from "@/src/types/inventoryTypes/commonInventoryTypes";

export interface IShipDatabase {
    ItemType: string;
    ShipOwnerId: Types.ObjectId;
    ShipExteriorColors?: IColor;
    AirSupportPower: string;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
}
