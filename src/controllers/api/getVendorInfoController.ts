import { RequestHandler } from "express";
import GuildAdvertisementVendorManifest from "@/static/fixed_responses/getVendorInfo/GuildAdvertisementVendorManifest.json";
import ZarimanCommisionsManifestArchimedean from "@/static/fixed_responses/getVendorInfo/ZarimanCommisionsManifestArchimedean.json";
import { ExportVendors } from "warframe-public-export-plus";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import { toMongoDate } from "@/src/helpers/inventoryHelpers";

export interface VendorInfo {
    _id: IOid;
    TypeName: string;
    ItemManifest: ItemManifestItem[];
    PropertyTextHash: string;
    Expiry: IMongoDate;
}

export interface ItemManifestItem {
    StoreItem: string;
    ItemPrices: ItemManifestItemPrice[];
    Bin: string;
    QuantityMultiplier: number;
    Expiry: IMongoDate;
    AllowMultipurchase: boolean;
    Id: IOid;
}

export interface ItemManifestItemPrice {
    ItemType: string;
    ItemCount: number;
    ProductCategory: string;
}

export const getVendorInfoController: RequestHandler = (req, res) => {
    const vendor = String(req.query.vendor);
    const dateTime = new Date();
    dateTime.setDate(dateTime.getDate() + 1);
    if (vendor in ExportVendors) {
        const v = ExportVendors[vendor];
        const result: VendorInfo = {
            _id: { $oid: new Types.ObjectId().toString() },
            TypeName: vendor,
            ItemManifest: [],
            PropertyTextHash: "DB7BF03C3FE6D0036A4DC30066A9A17E",
            Expiry: toMongoDate(new Date(dateTime))
        };
        v.items.forEach(item => {
            const i = item.itemPrices[0];
            result.ItemManifest.push({
                StoreItem: item.storeItem,
                ItemPrices: [{ ItemType: i.ItemType, ItemCount: i.ItemCount, ProductCategory: "MiscItems" }],
                Bin: "BIN_0",
                QuantityMultiplier: 1,
                Expiry: toMongoDate(new Date(dateTime)),
                AllowMultipurchase: true,
                Id: { $oid: new Types.ObjectId().toString() }
            });
        });
        res.json({ VendorInfo: result });
    } else {
        switch (req.query.vendor as string) {
            case "/Lotus/Types/Game/VendorManifests/Hubs/GuildAdvertisementVendorManifest":
                res.json(GuildAdvertisementVendorManifest);
                break;
            case "/Lotus/Types/Game/VendorManifests/Zariman/ZarimanCommisionsManifestArchimedean":
                res.json(ZarimanCommisionsManifestArchimedean);
                break;
            default:
                throw new Error(`Unknown vendor: ${vendor}`);
        }
    }
};
