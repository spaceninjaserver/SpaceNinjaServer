import fs from "fs";
import path from "path";
import { repoDir } from "@/src/helpers/pathHelper";
import { CRng, mixSeeds } from "@/src/services/rngService";
import { IMongoDate } from "@/src/types/commonTypes";
import { IItemManifestPreprocessed, IRawVendorManifest, IVendorManifestPreprocessed } from "@/src/types/vendorTypes";
import { JSONParse } from "json-with-bigint";
import { ExportVendors } from "warframe-public-export-plus";

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
    getVendorManifestJson("HubsPerrinSequenceWeaponVendorManifest"),
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

export const getVendorManifestByTypeName = (typeName: string): IVendorManifestPreprocessed | undefined => {
    for (const vendorManifest of rawVendorManifests) {
        if (vendorManifest.VendorInfo.TypeName == typeName) {
            return preprocessVendorManifest(vendorManifest);
        }
    }
    if (typeName == "/Lotus/Types/Game/VendorManifests/TheHex/InfestedLichWeaponVendorManifest") {
        return generateCodaWeaponVendorManifest();
    }
    return undefined;
};

export const getVendorManifestByOid = (oid: string): IVendorManifestPreprocessed | undefined => {
    for (const vendorManifest of rawVendorManifests) {
        if (vendorManifest.VendorInfo._id.$oid == oid) {
            return preprocessVendorManifest(vendorManifest);
        }
    }
    if (oid == "67dadc30e4b6e0e5979c8d84") {
        return generateCodaWeaponVendorManifest();
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
        const epoch = 1734307200 * 1000; // Monday (for weekly schedules)
        const iteration = Math.trunc((Date.now() - epoch) / period);
        const start = epoch + iteration * period;
        const end = start + period;
        expiry.$date.$numberLong = end.toString();
        return iteration;
    }
    return 0;
};

const generateCodaWeaponVendorManifest = (): IVendorManifestPreprocessed => {
    const EPOCH = 1740960000 * 1000;
    const DUR = 4 * 86400 * 1000;
    const cycle = Math.trunc((Date.now() - EPOCH) / DUR);
    const cycleStart = EPOCH + cycle * DUR;
    const cycleEnd = cycleStart + DUR;
    const binThisCycle = cycle % 2; // isOneBinPerCycle
    const items: IItemManifestPreprocessed[] = [];
    const manifest = ExportVendors["/Lotus/Types/Game/VendorManifests/TheHex/InfestedLichWeaponVendorManifest"];
    const rng = new CRng(cycle);
    for (const rawItem of manifest.items) {
        if (rawItem.bin != binThisCycle) {
            continue;
        }
        items.push({
            StoreItem: rawItem.storeItem,
            ItemPrices: rawItem.itemPrices!.map(item => ({ ...item, ProductCategory: "MiscItems" })),
            Bin: "BIN_" + rawItem.bin,
            QuantityMultiplier: 1,
            Expiry: { $date: { $numberLong: cycleEnd.toString() } },
            AllowMultipurchase: false,
            LocTagRandSeed: (BigInt(rng.randomInt(0, 0xffffffff)) << 32n) | BigInt(rng.randomInt(0, 0xffffffff)),
            Id: { $oid: "67e9da12793a120d" + rng.randomInt(0, 0xffffffff).toString(16).padStart(8, "0") }
        });
    }
    return {
        VendorInfo: {
            _id: { $oid: "67dadc30e4b6e0e5979c8d84" },
            TypeName: "/Lotus/Types/Game/VendorManifests/TheHex/InfestedLichWeaponVendorManifest",
            ItemManifest: items,
            PropertyTextHash: "77093DD05A8561A022DEC9A4B9BB4A56",
            RandomSeedType: "VRST_WEAPON",
            RequiredGoalTag: "",
            WeaponUpgradeValueAttenuationExponent: 2.25,
            Expiry: { $date: { $numberLong: cycleEnd.toString() } }
        }
    };
};
