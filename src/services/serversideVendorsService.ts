import { IMongoDate, IOid } from "@/src/types/commonTypes";

import ArchimedeanVendorManifest from "@/static/fixed_responses/getVendorInfo/ArchimedeanVendorManifest.json";
import DeimosEntratiFragmentVendorProductsManifest from "@/static/fixed_responses/getVendorInfo/DeimosEntratiFragmentVendorProductsManifest.json";
import DeimosFishmongerVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosFishmongerVendorManifest.json";
import DeimosHivemindCommisionsManifestFishmonger from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestFishmonger.json";
import DeimosHivemindCommisionsManifestPetVendor from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestPetVendor.json";
import DeimosHivemindCommisionsManifestProspector from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestProspector.json";
import DeimosHivemindCommisionsManifestTokenVendor from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestTokenVendor.json";
import DeimosHivemindCommisionsManifestWeaponsmith from "@/static/fixed_responses/getVendorInfo/DeimosHivemindCommisionsManifestWeaponsmith.json";
import DeimosHivemindTokenVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosHivemindTokenVendorManifest.json";
import DeimosPetVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosPetVendorManifest.json";
import DeimosProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/DeimosProspectorVendorManifest.json";
import DuviriAcrithisVendorManifest from "@/static/fixed_responses/getVendorInfo/DuviriAcrithisVendorManifest.json";
import EntratiLabsEntratiLabsCommisionsManifest from "@/static/fixed_responses/getVendorInfo/EntratiLabsEntratiLabsCommisionsManifest.json";
import EntratiLabsEntratiLabVendorManifest from "@/static/fixed_responses/getVendorInfo/EntratiLabsEntratiLabVendorManifest.json";
import GuildAdvertisementVendorManifest from "@/static/fixed_responses/getVendorInfo/GuildAdvertisementVendorManifest.json";
import HubsIronwakeDondaVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsIronwakeDondaVendorManifest.json";
import HubsPerrinSequenceWeaponVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsPerrinSequenceWeaponVendorManifest.json";
import HubsRailjackCrewMemberVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsRailjackCrewMemberVendorManifest.json";
import MaskSalesmanManifest from "@/static/fixed_responses/getVendorInfo/MaskSalesmanManifest.json";
import Nova1999ConquestShopManifest from "@/static/fixed_responses/getVendorInfo/Nova1999ConquestShopManifest.json";
import OstronFishmongerVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronFishmongerVendorManifest.json";
import OstronPetVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronPetVendorManifest.json";
import OstronProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronProspectorVendorManifest.json";
import RadioLegionIntermission12VendorManifest from "@/static/fixed_responses/getVendorInfo/RadioLegionIntermission12VendorManifest.json";
import SolarisDebtTokenVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisDebtTokenVendorManifest.json";
import SolarisDebtTokenVendorRepossessionsManifest from "@/static/fixed_responses/getVendorInfo/SolarisDebtTokenVendorRepossessionsManifest.json";
import SolarisFishmongerVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisFishmongerVendorManifest.json";
import SolarisProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisProspectorVendorManifest.json";
import TeshinHardModeVendorManifest from "@/static/fixed_responses/getVendorInfo/TeshinHardModeVendorManifest.json";
import ZarimanCommisionsManifestArchimedean from "@/static/fixed_responses/getVendorInfo/ZarimanCommisionsManifestArchimedean.json";

interface IVendorManifest {
    VendorInfo: {
        _id: IOid;
        TypeName: string;
        ItemManifest: {
            StoreItem: string;
            ItemPrices?: { ItemType: string; ItemCount: number; ProductCategory: string }[];
            Bin: string;
            QuantityMultiplier: number;
            Expiry: IMongoDate;
            PurchaseQuantityLimit?: number;
            RotatedWeekly?: boolean;
            AllowMultipurchase: boolean;
            Id: IOid;
        }[];
        Expiry: IMongoDate;
    };
}

const vendorManifests: IVendorManifest[] = [
    ArchimedeanVendorManifest,
    DeimosEntratiFragmentVendorProductsManifest,
    DeimosFishmongerVendorManifest,
    DeimosHivemindCommisionsManifestFishmonger,
    DeimosHivemindCommisionsManifestPetVendor,
    DeimosHivemindCommisionsManifestProspector,
    DeimosHivemindCommisionsManifestTokenVendor,
    DeimosHivemindCommisionsManifestWeaponsmith,
    DeimosHivemindTokenVendorManifest,
    DeimosPetVendorManifest,
    DeimosProspectorVendorManifest,
    DuviriAcrithisVendorManifest,
    EntratiLabsEntratiLabsCommisionsManifest,
    EntratiLabsEntratiLabVendorManifest,
    GuildAdvertisementVendorManifest,
    HubsIronwakeDondaVendorManifest,
    HubsPerrinSequenceWeaponVendorManifest,
    HubsRailjackCrewMemberVendorManifest,
    MaskSalesmanManifest,
    Nova1999ConquestShopManifest,
    OstronFishmongerVendorManifest,
    OstronPetVendorManifest,
    OstronProspectorVendorManifest,
    RadioLegionIntermission12VendorManifest,
    SolarisDebtTokenVendorManifest,
    SolarisDebtTokenVendorRepossessionsManifest,
    SolarisFishmongerVendorManifest,
    SolarisProspectorVendorManifest,
    TeshinHardModeVendorManifest,
    ZarimanCommisionsManifestArchimedean
];

export const getVendorManifestByTypeName = (typeName: string): IVendorManifest | undefined => {
    for (const vendorManifest of vendorManifests) {
        if (vendorManifest.VendorInfo.TypeName == typeName) {
            return vendorManifest;
        }
    }
    return undefined;
};

export const getVendorManifestByOid = (oid: string): IVendorManifest | undefined => {
    for (const vendorManifest of vendorManifests) {
        if (vendorManifest.VendorInfo._id.$oid == oid) {
            return vendorManifest;
        }
    }
    return undefined;
};
