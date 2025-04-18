import fs from "fs";
import path from "path";
import { repoDir } from "@/src/helpers/pathHelper";
import { CRng, mixSeeds } from "@/src/services/rngService";
import { IMongoDate } from "@/src/types/commonTypes";
import {
    IItemManifestPreprocessed,
    IRawVendorManifest,
    IVendorInfo,
    IVendorManifestPreprocessed
} from "@/src/types/vendorTypes";
import { JSONParse } from "json-with-bigint";
import { ExportVendors } from "warframe-public-export-plus";
import { unixTimesInMs } from "../constants/timeConstants";

const getVendorManifestJson = (name: string): IRawVendorManifest => {
    return JSONParse(fs.readFileSync(path.join(repoDir, `static/fixed_responses/getVendorInfo/${name}.json`), "utf-8"));
};

const rawVendorManifests: IRawVendorManifest[] = [
    getVendorManifestJson("ArchimedeanVendorManifest"),
    getVendorManifestJson("DeimosEntratiFragmentVendorProductsManifest"),
    getVendorManifestJson("DeimosFishmongerVendorManifest"),
    getVendorManifestJson("DeimosHivemindCommisionsManifestFishmonger"),
    getVendorManifestJson("DeimosHivemindCommisionsManifestPetVendor"),
    getVendorManifestJson("DeimosHivemindCommisionsManifestProspector"),
    getVendorManifestJson("DeimosHivemindCommisionsManifestTokenVendor"),
    getVendorManifestJson("DeimosHivemindCommisionsManifestWeaponsmith"),
    getVendorManifestJson("DeimosHivemindTokenVendorManifest"),
    getVendorManifestJson("DeimosPetVendorManifest"),
    getVendorManifestJson("DeimosProspectorVendorManifest"),
    getVendorManifestJson("DuviriAcrithisVendorManifest"),
    getVendorManifestJson("EntratiLabsEntratiLabsCommisionsManifest"),
    getVendorManifestJson("EntratiLabsEntratiLabVendorManifest"),
    getVendorManifestJson("GuildAdvertisementVendorManifest"), // uses preprocessing
    getVendorManifestJson("HubsIronwakeDondaVendorManifest"), // uses preprocessing
    getVendorManifestJson("HubsRailjackCrewMemberVendorManifest"),
    getVendorManifestJson("MaskSalesmanManifest"),
    getVendorManifestJson("Nova1999ConquestShopManifest"),
    getVendorManifestJson("OstronFishmongerVendorManifest"),
    getVendorManifestJson("OstronPetVendorManifest"),
    getVendorManifestJson("OstronProspectorVendorManifest"),
    getVendorManifestJson("RadioLegionIntermission12VendorManifest"),
    getVendorManifestJson("SolarisDebtTokenVendorManifest"),
    getVendorManifestJson("SolarisDebtTokenVendorRepossessionsManifest"),
    getVendorManifestJson("SolarisFishmongerVendorManifest"),
    getVendorManifestJson("SolarisProspectorVendorManifest"),
    getVendorManifestJson("TeshinHardModeVendorManifest"), // uses preprocessing
    getVendorManifestJson("ZarimanCommisionsManifestArchimedean")
];

interface IGeneratableVendorInfo extends Omit<IVendorInfo, "ItemManifest" | "Expiry"> {
    cycleStart: number;
    cycleDuration: number;
}

const generatableVendors: IGeneratableVendorInfo[] = [
    {
        _id: { $oid: "67dadc30e4b6e0e5979c8d84" },
        TypeName: "/Lotus/Types/Game/VendorManifests/TheHex/InfestedLichWeaponVendorManifest",
        PropertyTextHash: "77093DD05A8561A022DEC9A4B9BB4A56",
        RandomSeedType: "VRST_WEAPON",
        RequiredGoalTag: "",
        WeaponUpgradeValueAttenuationExponent: 2.25,
        cycleStart: 1740960000_000,
        cycleDuration: 4 * unixTimesInMs.day
    },
    {
        _id: { $oid: "60ad3b6ec96976e97d227e19" },
        TypeName: "/Lotus/Types/Game/VendorManifests/Hubs/PerrinSequenceWeaponVendorManifest",
        PropertyTextHash: "34F8CF1DFF745F0D67433A5EF0A03E70",
        RandomSeedType: "VRST_WEAPON",
        WeaponUpgradeValueAttenuationExponent: 2.25,
        cycleStart: 1744934400_000,
        cycleDuration: 4 * unixTimesInMs.day
    }
    // {
    //     _id: { $oid: "5dbb4c41e966f7886c3ce939" },
    //     TypeName: "/Lotus/Types/Game/VendorManifests/Hubs/IronwakeDondaVendorManifest",
    //     PropertyTextHash: "62B64A8065B7C0FA345895D4BC234621"
    // }
];

export const getVendorManifestByTypeName = (typeName: string): IVendorManifestPreprocessed | undefined => {
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
    return undefined;
};

export const getVendorManifestByOid = (oid: string): IVendorManifestPreprocessed | undefined => {
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
    return undefined;
};

const preprocessVendorManifest = (originalManifest: IRawVendorManifest): IVendorManifestPreprocessed => {
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
        const epoch = 1734307200_000; // Monday (for weekly schedules)
        const iteration = Math.trunc((Date.now() - epoch) / period);
        const start = epoch + iteration * period;
        const end = start + period;
        expiry.$date.$numberLong = end.toString();
        return iteration;
    }
    return 0;
};

const generateVendorManifest = (vendorInfo: IGeneratableVendorInfo): IVendorManifestPreprocessed => {
    const EPOCH = vendorInfo.cycleStart;
    const manifest = ExportVendors[vendorInfo.TypeName];
    let binThisCycle;
    if (manifest.isOneBinPerCycle) {
        const cycleDuration = vendorInfo.cycleDuration; // manifest.items[0].durationHours! * 3600_000;
        const cycleIndex = Math.trunc((Date.now() - EPOCH) / cycleDuration);
        binThisCycle = cycleIndex % 2; // Note: May want to auto-compute the bin size, but this is only used for coda weapons right now.
    }
    const items: IItemManifestPreprocessed[] = [];
    let soonestOfferExpiry: number = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i != manifest.items.length; ++i) {
        const rawItem = manifest.items[i];
        if (manifest.isOneBinPerCycle && rawItem.bin != binThisCycle) {
            continue;
        }
        const cycleDuration = vendorInfo.cycleDuration; // rawItem.durationHours! * 3600_000;
        const cycleIndex = Math.trunc((Date.now() - EPOCH) / cycleDuration);
        const cycleStart = EPOCH + cycleIndex * cycleDuration;
        const cycleEnd = cycleStart + cycleDuration;
        if (soonestOfferExpiry > cycleEnd) {
            soonestOfferExpiry = cycleEnd;
        }
        const rng = new CRng(cycleIndex);
        rng.churnSeed(i);
        /*for (let j = -1; j != rawItem.duplicates; ++j)*/ {
            const item: IItemManifestPreprocessed = {
                StoreItem: rawItem.storeItem,
                ItemPrices: rawItem.itemPrices!.map(itemPrice => ({ ...itemPrice, ProductCategory: "MiscItems" })),
                Bin: "BIN_" + rawItem.bin,
                QuantityMultiplier: 1,
                Expiry: { $date: { $numberLong: cycleEnd.toString() } },
                AllowMultipurchase: false,
                Id: {
                    $oid:
                        i.toString(16).padStart(8, "0") +
                        vendorInfo._id.$oid.substring(8, 16) +
                        rng.randomInt(0, 0xffffffff).toString(16).padStart(8, "0")
                }
            };
            if (vendorInfo.RandomSeedType) {
                item.LocTagRandSeed =
                    (BigInt(rng.randomInt(0, 0xffffffff)) << 32n) | BigInt(rng.randomInt(0, 0xffffffff));
            }
            items.push(item);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cycleStart, cycleDuration, ...clientVendorInfo } = vendorInfo;
    return {
        VendorInfo: {
            ...clientVendorInfo,
            ItemManifest: items,
            Expiry: { $date: { $numberLong: soonestOfferExpiry.toString() } }
        }
    };
};
