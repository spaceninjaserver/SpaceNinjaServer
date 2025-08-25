import type { Types } from "mongoose";
import type { IColor, IShipAttachments } from "./inventoryTypes/commonInventoryTypes.ts";

export interface IShipDatabase {
    ItemType: string;
    ShipOwnerId: Types.ObjectId;
    ShipExteriorColors?: IColor;
    AirSupportPower: string;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
}
