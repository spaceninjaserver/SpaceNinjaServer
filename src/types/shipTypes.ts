import { Types } from "mongoose";
import { IColor } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IShipAttachments } from "./personalRoomsTypes";

export interface IShipDatabase {
    ItemType: string;
    ShipOwnerId: Types.ObjectId;
    ShipExteriorColors?: IColor;
    AirSupportPower: string;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
}
