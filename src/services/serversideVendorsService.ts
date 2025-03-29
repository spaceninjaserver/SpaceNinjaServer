import { CRng, mixSeeds } from "@/src/services/rngService";
import { IMongoDate } from "@/src/types/commonTypes";
import { IVendorManifest, IVendorManifestPreprocessed } from "@/src/types/vendorTypes";

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
    GuildAdvertisementVendorManifest, // uses preprocessing
    HubsIronwakeDondaVendorManifest, // uses preprocessing
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
    TeshinHardModeVendorManifest, // uses preprocessing
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

export const preprocessVendorManifest = (originalManifest: IVendorManifest): IVendorManifestPreprocessed => {
    if (Date.now() >= parseInt(originalManifest.VendorInfo.Expiry.$date.$numberLong)) {
        const manifest = structuredClone(originalManifest);
        const info = manifest.VendorInfo;
        refreshExpiry(info.Expiry);
        for (const offer of info.ItemManifest) {
            const iteration = refreshExpiry(offer.Expiry);
            if (offer.ItemPrices) {
                for (const price of offer.ItemPrices) {
                    if (typeof price.ItemType != "string") {
                        const itemSeed = parseInt(offer.Id.$oid.substring(16), 16);
                        const rng = new CRng(mixSeeds(itemSeed, iteration));
                        price.ItemType = rng.randomElement(price.ItemType);
                    }
                }
            }
        }
        return manifest as IVendorManifestPreprocessed;
    }
    return originalManifest as IVendorManifestPreprocessed;
};

const refreshExpiry = (expiry: IMongoDate): number => {
    const period = parseInt(expiry.$date.$numberLong);
    if (Date.now() >= period) {
        const epoch = 1734307200 * 1000; // Monday (for weekly schedules)
        const iteration = Math.trunc((Date.now() - epoch) / period);
        const start = epoch + iteration * period;
        const end = start + period;
        expiry.$date.$numberLong = end.toString();
        return iteration;
    }
    return 0;
};
