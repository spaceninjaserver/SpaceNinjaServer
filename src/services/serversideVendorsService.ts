import { unixTimesInMs } from "@/src/constants/timeConstants";
import { catBreadHash } from "@/src/helpers/stringHelpers";
import { mixSeeds, SRng } from "@/src/services/rngService";
import { IMongoDate } from "@/src/types/commonTypes";
import { IItemManifest, IVendorInfo, IVendorManifest } from "@/src/types/vendorTypes";
import { ExportVendors, IRange } from "warframe-public-export-plus";

import ArchimedeanVendorManifest from "@/static/fixed_responses/getVendorInfo/ArchimedeanVendorManifest.json";
import DeimosEntratiFragmentVendorProductsManifest from "@/static/fixed_responses/getVendorInfo/DeimosEntratiFragmentVendorProductsManifest.json";
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
import HubsIronwakeDondaVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsIronwakeDondaVendorManifest.json";
import HubsRailjackCrewMemberVendorManifest from "@/static/fixed_responses/getVendorInfo/HubsRailjackCrewMemberVendorManifest.json";
import MaskSalesmanManifest from "@/static/fixed_responses/getVendorInfo/MaskSalesmanManifest.json";
import Nova1999ConquestShopManifest from "@/static/fixed_responses/getVendorInfo/Nova1999ConquestShopManifest.json";
import OstronPetVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronPetVendorManifest.json";
import OstronProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/OstronProspectorVendorManifest.json";
import RadioLegionIntermission12VendorManifest from "@/static/fixed_responses/getVendorInfo/RadioLegionIntermission12VendorManifest.json";
import SolarisDebtTokenVendorRepossessionsManifest from "@/static/fixed_responses/getVendorInfo/SolarisDebtTokenVendorRepossessionsManifest.json";
import SolarisProspectorVendorManifest from "@/static/fixed_responses/getVendorInfo/SolarisProspectorVendorManifest.json";
import Temple1999VendorManifest from "@/static/fixed_responses/getVendorInfo/Temple1999VendorManifest.json";
import TeshinHardModeVendorManifest from "@/static/fixed_responses/getVendorInfo/TeshinHardModeVendorManifest.json";
import ZarimanCommisionsManifestArchimedean from "@/static/fixed_responses/getVendorInfo/ZarimanCommisionsManifestArchimedean.json";

const rawVendorManifests: IVendorManifest[] = [
    ArchimedeanVendorManifest,
    DeimosEntratiFragmentVendorProductsManifest,
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
    HubsIronwakeDondaVendorManifest, // uses preprocessing
    HubsRailjackCrewMemberVendorManifest,
    MaskSalesmanManifest,
    Nova1999ConquestShopManifest,
    OstronPetVendorManifest,
    OstronProspectorVendorManifest,
    RadioLegionIntermission12VendorManifest,
    SolarisDebtTokenVendorRepossessionsManifest,
    SolarisProspectorVendorManifest,
    Temple1999VendorManifest,
    TeshinHardModeVendorManifest, // uses preprocessing
    ZarimanCommisionsManifestArchimedean
];

interface IGeneratableVendorInfo extends Omit<IVendorInfo, "ItemManifest" | "Expiry"> {
    cycleOffset?: number;
    cycleDuration: number;
}

const generatableVendors: IGeneratableVendorInfo[] = [
    {
        _id: { $oid: "67dadc30e4b6e0e5979c8d84" },
        TypeName: "/Lotus/Types/Game/VendorManifests/TheHex/InfestedLichWeaponVendorManifest",
        RandomSeedType: "VRST_WEAPON",
        RequiredGoalTag: "",
        WeaponUpgradeValueAttenuationExponent: 2.25,
        cycleOffset: 1740960000_000,
        cycleDuration: 4 * unixTimesInMs.day
    },
    {
        _id: { $oid: "60ad3b6ec96976e97d227e19" },
        TypeName: "/Lotus/Types/Game/VendorManifests/Hubs/PerrinSequenceWeaponVendorManifest",
        RandomSeedType: "VRST_WEAPON",
        WeaponUpgradeValueAttenuationExponent: 2.25,
        cycleOffset: 1744934400_000,
        cycleDuration: 4 * unixTimesInMs.day
    },
    {
        _id: { $oid: "61ba123467e5d37975aeeb03" },
        TypeName: "/Lotus/Types/Game/VendorManifests/Hubs/GuildAdvertisementVendorManifest",
        RandomSeedType: "VRST_FLAVOUR_TEXT",
        cycleDuration: unixTimesInMs.week // TODO: Auto-detect this based on the items, so we don't need to specify it explicitly.
    }
    // {
    //     _id: { $oid: "5dbb4c41e966f7886c3ce939" },
    //     TypeName: "/Lotus/Types/Game/VendorManifests/Hubs/IronwakeDondaVendorManifest"
    // }
];

const getVendorOid = (typeName: string): string => {
    return "5be4a159b144f3cd" + catBreadHash(typeName).toString(16).padStart(8, "0");
};

export const getVendorManifestByTypeName = (typeName: string): IVendorManifest | undefined => {
    for (const vendorManifest of rawVendorManifests) {
        if (vendorManifest.VendorInfo.TypeName == typeName) {
            return preprocessVendorManifest(vendorManifest);
        }
    }
    for (const vendorInfo of generatableVendors) {
        if (vendorInfo.TypeName == typeName) {
            return generateVendorManifest(vendorInfo);
        }
    }
    if (typeName in ExportVendors) {
        return generateVendorManifest({
            _id: { $oid: getVendorOid(typeName) },
            TypeName: typeName,
            RandomSeedType: ExportVendors[typeName].randomSeedType,
            cycleDuration: unixTimesInMs.hour
        });
    }
    return undefined;
};

export const getVendorManifestByOid = (oid: string): IVendorManifest | undefined => {
    for (const vendorManifest of rawVendorManifests) {
        if (vendorManifest.VendorInfo._id.$oid == oid) {
            return preprocessVendorManifest(vendorManifest);
        }
    }
    for (const vendorInfo of generatableVendors) {
        if (vendorInfo._id.$oid == oid) {
            return generateVendorManifest(vendorInfo);
        }
    }
    for (const [typeName, manifest] of Object.entries(ExportVendors)) {
        const typeNameOid = getVendorOid(typeName);
        if (typeNameOid == oid) {
            return generateVendorManifest({
                _id: { $oid: typeNameOid },
                TypeName: typeName,
                RandomSeedType: manifest.randomSeedType,
                cycleDuration: unixTimesInMs.hour
            });
        }
    }
    return undefined;
};

const preprocessVendorManifest = (originalManifest: IVendorManifest): IVendorManifest => {
    if (Date.now() >= parseInt(originalManifest.VendorInfo.Expiry.$date.$numberLong)) {
        const manifest = structuredClone(originalManifest);
        const info = manifest.VendorInfo;
        refreshExpiry(info.Expiry);
        for (const offer of info.ItemManifest) {
            refreshExpiry(offer.Expiry);
        }
        return manifest;
    }
    return originalManifest;
};

const refreshExpiry = (expiry: IMongoDate): void => {
    const period = parseInt(expiry.$date.$numberLong);
    if (Date.now() >= period) {
        const epoch = 1734307200_000; // Monday (for weekly schedules)
        const iteration = Math.trunc((Date.now() - epoch) / period);
        const start = epoch + iteration * period;
        const end = start + period;
        expiry.$date.$numberLong = end.toString();
    }
};

const toRange = (value: IRange | number): IRange => {
    if (typeof value == "number") {
        return { minValue: value, maxValue: value };
    }
    return value;
};

const vendorInfoCache: Record<string, IVendorInfo> = {};

const generateVendorManifest = (vendorInfo: IGeneratableVendorInfo): IVendorManifest => {
    if (!(vendorInfo.TypeName in vendorInfoCache)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cycleOffset, cycleDuration, ...clientVendorInfo } = vendorInfo;
        vendorInfoCache[vendorInfo.TypeName] = {
            ...clientVendorInfo,
            ItemManifest: [],
            Expiry: { $date: { $numberLong: "0" } }
        };
    }
    const processed = vendorInfoCache[vendorInfo.TypeName];
    if (Date.now() >= parseInt(processed.Expiry.$date.$numberLong)) {
        // Remove expired offers
        for (let i = 0; i != processed.ItemManifest.length; ) {
            if (Date.now() >= parseInt(processed.ItemManifest[i].Expiry.$date.$numberLong)) {
                processed.ItemManifest.splice(i, 1);
            } else {
                ++i;
            }
        }

        // Add new offers
        const vendorSeed = parseInt(vendorInfo._id.$oid.substring(16), 16);
        const cycleOffset = vendorInfo.cycleOffset ?? 1734307200_000;
        const cycleDuration = vendorInfo.cycleDuration;
        const cycleIndex = Math.trunc((Date.now() - cycleOffset) / cycleDuration);
        const rng = new SRng(mixSeeds(vendorSeed, cycleIndex));
        const manifest = ExportVendors[vendorInfo.TypeName];
        const offersToAdd = [];
        if (
            manifest.numItems &&
            (manifest.numItems.minValue != manifest.numItems.maxValue ||
                manifest.items.length != manifest.numItems.minValue) &&
            !manifest.isOneBinPerCycle
        ) {
            const numItemsTarget = rng.randomInt(manifest.numItems.minValue, manifest.numItems.maxValue);
            while (processed.ItemManifest.length + offersToAdd.length < numItemsTarget) {
                // TODO: Consider per-bin item limits
                // TODO: Consider item probability weightings
                offersToAdd.push(rng.randomElement(manifest.items)!);
            }
        } else {
            let binThisCycle;
            if (manifest.isOneBinPerCycle) {
                binThisCycle = cycleIndex % 2; // Note: May want to auto-compute the bin size, but this is only used for coda weapons right now.
            }
            for (const rawItem of manifest.items) {
                if (!manifest.isOneBinPerCycle || rawItem.bin == binThisCycle) {
                    offersToAdd.push(rawItem);
                }
            }

            // For most vendors, the offers seem to roughly be in reverse order from the manifest. Coda weapons are an odd exception.
            if (!manifest.isOneBinPerCycle) {
                offersToAdd.reverse();
            }
        }
        const cycleStart = cycleOffset + cycleIndex * cycleDuration;
        for (const rawItem of offersToAdd) {
            const durationHoursRange = toRange(rawItem.durationHours);
            const expiry =
                cycleStart +
                rng.randomInt(durationHoursRange.minValue, durationHoursRange.maxValue) * unixTimesInMs.hour;
            const item: IItemManifest = {
                StoreItem: rawItem.storeItem,
                ItemPrices: rawItem.itemPrices?.map(itemPrice => ({ ...itemPrice, ProductCategory: "MiscItems" })),
                Bin: "BIN_" + rawItem.bin,
                QuantityMultiplier: 1,
                Expiry: { $date: { $numberLong: expiry.toString() } },
                AllowMultipurchase: false,
                Id: {
                    $oid:
                        ((cycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") +
                        vendorInfo._id.$oid.substring(8, 16) +
                        rng.randomInt(0, 0xffff_ffff).toString(16).padStart(8, "0")
                }
            };
            if (rawItem.numRandomItemPrices) {
                item.ItemPrices = [];
                for (let i = 0; i != rawItem.numRandomItemPrices; ++i) {
                    let itemPrice: { type: string; count: IRange };
                    do {
                        itemPrice = rng.randomElement(manifest.randomItemPricesPerBin![rawItem.bin])!;
                    } while (item.ItemPrices.find(x => x.ItemType == itemPrice.type));
                    item.ItemPrices.push({
                        ItemType: itemPrice.type,
                        ItemCount: rng.randomInt(itemPrice.count.minValue, itemPrice.count.maxValue),
                        ProductCategory: "MiscItems"
                    });
                }
            }
            if (rawItem.credits) {
                const value =
                    typeof rawItem.credits == "number"
                        ? rawItem.credits
                        : rng.randomInt(
                              rawItem.credits.minValue / rawItem.credits.step,
                              rawItem.credits.maxValue / rawItem.credits.step
                          ) * rawItem.credits.step;
                item.RegularPrice = [value, value];
            }
            if (rawItem.platinum) {
                const value =
                    typeof rawItem.platinum == "number"
                        ? rawItem.platinum
                        : rng.randomInt(rawItem.platinum.minValue, rawItem.platinum.maxValue);
                item.PremiumPrice = [value, value];
            }
            if (vendorInfo.RandomSeedType) {
                item.LocTagRandSeed = rng.randomInt(0, 0xffff_ffff);
                if (vendorInfo.RandomSeedType == "VRST_WEAPON") {
                    const highDword = rng.randomInt(0, 0xffff_ffff);
                    item.LocTagRandSeed = (BigInt(highDword) << 32n) | (BigInt(item.LocTagRandSeed) & 0xffffffffn);
                }
            }
            processed.ItemManifest.push(item);
        }

        // Update vendor expiry
        let soonestOfferExpiry: number = Number.MAX_SAFE_INTEGER;
        for (const offer of processed.ItemManifest) {
            const offerExpiry = parseInt(offer.Expiry.$date.$numberLong);
            if (soonestOfferExpiry > offerExpiry) {
                soonestOfferExpiry = offerExpiry;
            }
        }
        processed.Expiry.$date.$numberLong = soonestOfferExpiry.toString();
    }
    return {
        VendorInfo: processed
    };
};
