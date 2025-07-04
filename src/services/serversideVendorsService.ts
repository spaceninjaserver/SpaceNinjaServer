import { unixTimesInMs } from "@/src/constants/timeConstants";
import { args } from "@/src/helpers/commandLineArguments";
import { catBreadHash } from "@/src/helpers/stringHelpers";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { mixSeeds, SRng } from "@/src/services/rngService";
import { IItemManifest, IVendorInfo, IVendorManifest } from "@/src/types/vendorTypes";
import { logger } from "@/src/utils/logger";
import { ExportVendors, IRange, IVendor, IVendorOffer } from "warframe-public-export-plus";
import { config } from "./configService";

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
    }
];

const getVendorOid = (typeName: string): string => {
    return "5be4a159b144f3cd" + catBreadHash(typeName).toString(16).padStart(8, "0");
};

// https://stackoverflow.com/a/17445304
const gcd = (a: number, b: number): number => {
    return b ? gcd(b, a % b) : a;
};

const getCycleDuration = (manifest: IVendor): number => {
    let dur = 0;
    for (const item of manifest.items) {
        if (item.alwaysOffered) {
            continue;
        }
        const durationHours = item.rotatedWeekly ? 168 : item.durationHours;
        if (typeof durationHours != "number") {
            dur = 1;
            break;
        }
        if (dur != durationHours) {
            dur = gcd(dur, durationHours);
        }
    }
    return dur * unixTimesInMs.hour;
};

export const getVendorManifestByTypeName = (typeName: string, fullStock?: boolean): IVendorManifest | undefined => {
    for (const vendorInfo of generatableVendors) {
        if (vendorInfo.TypeName == typeName) {
            return generateVendorManifest(vendorInfo, fullStock ?? config.fullyStockedVendors);
        }
    }
    if (typeName in ExportVendors) {
        const manifest = ExportVendors[typeName];
        return generateVendorManifest(
            {
                _id: { $oid: getVendorOid(typeName) },
                TypeName: typeName,
                RandomSeedType: manifest.randomSeedType,
                cycleDuration: getCycleDuration(manifest)
            },
            fullStock ?? config.fullyStockedVendors
        );
    }
    return undefined;
};

export const getVendorManifestByOid = (oid: string): IVendorManifest | undefined => {
    for (const vendorInfo of generatableVendors) {
        if (vendorInfo._id.$oid == oid) {
            return generateVendorManifest(vendorInfo, config.fullyStockedVendors);
        }
    }
    for (const [typeName, manifest] of Object.entries(ExportVendors)) {
        const typeNameOid = getVendorOid(typeName);
        if (typeNameOid == oid) {
            return generateVendorManifest(
                {
                    _id: { $oid: typeNameOid },
                    TypeName: typeName,
                    RandomSeedType: manifest.randomSeedType,
                    cycleDuration: getCycleDuration(manifest)
                },
                config.fullyStockedVendors
            );
        }
    }
    return undefined;
};

export const applyStandingToVendorManifest = (
    inventory: TInventoryDatabaseDocument,
    vendorManifest: IVendorManifest
): IVendorManifest => {
    return {
        VendorInfo: {
            ...vendorManifest.VendorInfo,
            ItemManifest: [...vendorManifest.VendorInfo.ItemManifest].map(offer => {
                if (offer.Affiliation && offer.ReductionPerPositiveRank && offer.IncreasePerNegativeRank) {
                    const title: number = inventory.Affiliations.find(x => x.Tag == offer.Affiliation)?.Title ?? 0;
                    const factor =
                        1 + (title < 0 ? offer.IncreasePerNegativeRank : offer.ReductionPerPositiveRank) * title * -1;
                    //console.log(offer.Affiliation, title, factor);
                    if (factor) {
                        offer = { ...offer };
                        if (offer.RegularPrice) {
                            offer.RegularPriceBeforeDiscount = offer.RegularPrice;
                            offer.RegularPrice = [
                                Math.trunc(offer.RegularPriceBeforeDiscount[0] * factor),
                                Math.trunc(offer.RegularPriceBeforeDiscount[1] * factor)
                            ];
                        }
                        if (offer.ItemPrices) {
                            offer.ItemPricesBeforeDiscount = offer.ItemPrices;
                            offer.ItemPrices = [];
                            for (const item of offer.ItemPricesBeforeDiscount) {
                                offer.ItemPrices.push({ ...item, ItemCount: Math.trunc(item.ItemCount * factor) });
                            }
                        }
                    }
                }
                return offer;
            })
        }
    };
};

const toRange = (value: IRange | number): IRange => {
    if (typeof value == "number") {
        return { minValue: value, maxValue: value };
    }
    return value;
};

const getCycleDurationRange = (manifest: IVendor): IRange | undefined => {
    const res: IRange = { minValue: Number.MAX_SAFE_INTEGER, maxValue: 0 };
    for (const offer of manifest.items) {
        if (offer.durationHours) {
            const range = toRange(offer.durationHours);
            if (res.minValue > range.minValue) {
                res.minValue = range.minValue;
            }
            if (res.maxValue < range.maxValue) {
                res.maxValue = range.maxValue;
            }
        }
    }
    return res.maxValue != 0 ? res : undefined;
};

type TOfferId = string;

const getOfferId = (offer: IVendorOffer | IItemManifest): TOfferId => {
    if ("storeItem" in offer) {
        // IVendorOffer
        return offer.storeItem + "x" + offer.quantity;
    } else {
        // IItemManifest
        return offer.StoreItem + "x" + offer.QuantityMultiplier;
    }
};

let vendorManifestsUsingFullStock = false;
const vendorManifestCache: Record<string, IVendorManifest> = {};

const clearVendorCache = (): void => {
    for (const k of Object.keys(vendorManifestCache)) {
        delete vendorManifestCache[k];
    }
};

const generateVendorManifest = (
    vendorInfo: IGeneratableVendorInfo,
    fullStock: boolean | undefined
): IVendorManifest => {
    fullStock ??= config.fullyStockedVendors;
    fullStock ??= false;
    if (vendorManifestsUsingFullStock != fullStock) {
        vendorManifestsUsingFullStock = fullStock;
        clearVendorCache();
    }

    if (!(vendorInfo.TypeName in vendorManifestCache)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { cycleOffset, cycleDuration, ...clientVendorInfo } = vendorInfo;
        vendorManifestCache[vendorInfo.TypeName] = {
            VendorInfo: {
                ...clientVendorInfo,
                ItemManifest: [],
                Expiry: { $date: { $numberLong: "0" } }
            }
        };
    }
    const cacheEntry = vendorManifestCache[vendorInfo.TypeName];
    const info = cacheEntry.VendorInfo;
    const manifest = ExportVendors[vendorInfo.TypeName];
    const cycleDurationRange = getCycleDurationRange(manifest);
    let now = Date.now();
    if (cycleDurationRange && cycleDurationRange.minValue != cycleDurationRange.maxValue) {
        now -= (cycleDurationRange.maxValue - 1) * unixTimesInMs.hour;
    }
    while (Date.now() >= parseInt(info.Expiry.$date.$numberLong)) {
        // Remove expired offers
        for (let i = 0; i != info.ItemManifest.length; ) {
            if (now >= parseInt(info.ItemManifest[i].Expiry.$date.$numberLong)) {
                info.ItemManifest.splice(i, 1);
            } else {
                ++i;
            }
        }

        // Add new offers
        const vendorSeed = parseInt(vendorInfo._id.$oid.substring(16), 16);
        const cycleOffset = vendorInfo.cycleOffset ?? 1734307200_000;
        const cycleDuration = vendorInfo.cycleDuration;
        const cycleIndex = Math.trunc((now - cycleOffset) / cycleDuration);
        const rng = new SRng(mixSeeds(vendorSeed, cycleIndex));
        const offersToAdd: IVendorOffer[] = [];
        if (manifest.isOneBinPerCycle) {
            if (fullStock) {
                for (const rawItem of manifest.items) {
                    offersToAdd.push(rawItem);
                }
            } else {
                const binThisCycle = cycleIndex % 2; // Note: May want to check the actual number of bins, but this is only used for coda weapons right now.
                for (const rawItem of manifest.items) {
                    if (rawItem.bin == binThisCycle) {
                        offersToAdd.push(rawItem);
                    }
                }
            }
        } else {
            // Compute vendor requirements, subtracting existing offers
            const remainingItemCapacity: Record<TOfferId, number> = {};
            const missingItemsPerBin: Record<number, number> = {};
            let numOffersThatNeedToMatchABin = 0;
            if (manifest.numItemsPerBin) {
                for (let bin = 0; bin != manifest.numItemsPerBin.length; ++bin) {
                    missingItemsPerBin[bin] = manifest.numItemsPerBin[bin];
                    numOffersThatNeedToMatchABin += manifest.numItemsPerBin[bin];
                }
            }
            for (const item of manifest.items) {
                remainingItemCapacity[getOfferId(item)] = 1 + item.duplicates;
            }
            for (const offer of info.ItemManifest) {
                remainingItemCapacity[getOfferId(offer)] -= 1;
                const bin = parseInt(offer.Bin.substring(4));
                if (missingItemsPerBin[bin]) {
                    missingItemsPerBin[bin] -= 1;
                    numOffersThatNeedToMatchABin -= 1;
                }
            }

            // Add permanent offers
            let numUncountedOffers = 0;
            let numCountedOffers = 0;
            let offset = 0;
            for (const item of manifest.items) {
                if (item.alwaysOffered || item.rotatedWeekly) {
                    ++numUncountedOffers;
                    const id = getOfferId(item);
                    if (remainingItemCapacity[id] != 0) {
                        remainingItemCapacity[id] -= 1;
                        offersToAdd.push(item);
                        ++offset;
                    }
                    if (missingItemsPerBin[item.bin]) {
                        missingItemsPerBin[item.bin] -= 1;
                        numOffersThatNeedToMatchABin -= 1;
                    }
                } else {
                    numCountedOffers += 1 + item.duplicates;
                }
            }

            // Add counted offers
            const useRng =
                manifest.numItems &&
                (manifest.numItems.minValue != manifest.numItems.maxValue ||
                    manifest.numItems.minValue != numCountedOffers);
            const numItemsTarget = fullStock
                ? numUncountedOffers + numCountedOffers
                : manifest.numItems
                  ? numUncountedOffers +
                    Math.min(
                        Object.values(remainingItemCapacity).reduce((a, b) => a + b, 0),
                        useRng
                            ? rng.randomInt(manifest.numItems.minValue, manifest.numItems.maxValue)
                            : manifest.numItems.minValue
                    )
                  : manifest.items.length;
            let i = 0;
            const rollableOffers = manifest.items.filter(x => x.probability !== undefined) as (Omit<
                IVendorOffer,
                "probability"
            > & { probability: number })[];
            while (info.ItemManifest.length + offersToAdd.length < numItemsTarget) {
                const item = useRng ? rng.randomReward(rollableOffers)! : rollableOffers[i++];
                if (
                    remainingItemCapacity[getOfferId(item)] != 0 &&
                    (numOffersThatNeedToMatchABin == 0 || missingItemsPerBin[item.bin])
                ) {
                    remainingItemCapacity[getOfferId(item)] -= 1;
                    if (missingItemsPerBin[item.bin]) {
                        missingItemsPerBin[item.bin] -= 1;
                        numOffersThatNeedToMatchABin -= 1;
                    }
                    offersToAdd.splice(offset, 0, item);
                }
                if (i == rollableOffers.length) {
                    i = 0;
                }
            }
        }
        const cycleStart = cycleOffset + cycleIndex * cycleDuration;
        for (const rawItem of offersToAdd) {
            const durationHoursRange = toRange(rawItem.durationHours ?? cycleDuration);
            const expiry = rawItem.alwaysOffered
                ? 2051240400_000
                : cycleStart +
                  (rawItem.rotatedWeekly
                      ? unixTimesInMs.week
                      : rng.randomInt(durationHoursRange.minValue, durationHoursRange.maxValue) * unixTimesInMs.hour);
            const item: IItemManifest = {
                StoreItem: rawItem.storeItem,
                ItemPrices: rawItem.itemPrices?.map(itemPrice => ({ ...itemPrice, ProductCategory: "MiscItems" })),
                Bin: "BIN_" + rawItem.bin,
                QuantityMultiplier: rawItem.quantity,
                Expiry: { $date: { $numberLong: expiry.toString() } },
                PurchaseQuantityLimit: rawItem.purchaseLimit,
                RotatedWeekly: rawItem.rotatedWeekly,
                AllowMultipurchase: rawItem.purchaseLimit !== 1,
                Id: {
                    $oid:
                        ((cycleStart / 1000) & 0xffffffff).toString(16).padStart(8, "0") +
                        vendorInfo._id.$oid.substring(8, 16) +
                        rng.randomInt(0, 0xffff_ffff).toString(16).padStart(8, "0")
                }
            };
            if (rawItem.numRandomItemPrices) {
                item.ItemPrices ??= [];
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
            info.ItemManifest.push(item);
        }

        if (manifest.numItemsPerBin) {
            info.ItemManifest.sort((a, b) => {
                const aBin = parseInt(a.Bin.substring(4));
                const bBin = parseInt(b.Bin.substring(4));
                return aBin == bBin ? 0 : aBin < bBin ? +1 : -1;
            });
        }

        // Update vendor expiry
        let soonestOfferExpiry: number = Number.MAX_SAFE_INTEGER;
        for (const offer of info.ItemManifest) {
            const offerExpiry = parseInt(offer.Expiry.$date.$numberLong);
            if (soonestOfferExpiry > offerExpiry) {
                soonestOfferExpiry = offerExpiry;
            }
        }
        info.Expiry.$date.$numberLong = soonestOfferExpiry.toString();

        now += unixTimesInMs.hour;
    }
    return cacheEntry;
};

if (args.dev) {
    if (
        getCycleDuration(ExportVendors["/Lotus/Types/Game/VendorManifests/Hubs/TeshinHardModeVendorManifest"]) !=
        unixTimesInMs.week
    ) {
        logger.warn(`getCycleDuration self test failed`);
    }

    for (let i = 0; i != 2; ++i) {
        const fullStock = !!i;

        const ads = getVendorManifestByTypeName(
            "/Lotus/Types/Game/VendorManifests/Hubs/GuildAdvertisementVendorManifest",
            fullStock
        )!.VendorInfo.ItemManifest;
        if (
            ads.length != 5 ||
            ads[0].Bin != "BIN_4" ||
            ads[1].Bin != "BIN_3" ||
            ads[2].Bin != "BIN_2" ||
            ads[3].Bin != "BIN_1" ||
            ads[4].Bin != "BIN_0"
        ) {
            logger.warn(`self test failed for /Lotus/Types/Game/VendorManifests/Hubs/GuildAdvertisementVendorManifest`);
        }

        const pall = getVendorManifestByTypeName(
            "/Lotus/Types/Game/VendorManifests/Hubs/IronwakeDondaVendorManifest",
            fullStock
        )!.VendorInfo.ItemManifest;
        if (
            pall.length != 5 ||
            pall[0].StoreItem != "/Lotus/StoreItems/Types/Items/ShipDecos/HarrowQuestKeyOrnament" ||
            pall[1].StoreItem != "/Lotus/StoreItems/Types/BoosterPacks/RivenModPack" ||
            pall[2].StoreItem != "/Lotus/StoreItems/Types/StoreItems/CreditBundles/150000Credits" ||
            pall[3].StoreItem != "/Lotus/StoreItems/Types/Items/MiscItems/Kuva" ||
            pall[4].StoreItem != "/Lotus/StoreItems/Types/BoosterPacks/RivenModPack"
        ) {
            logger.warn(`self test failed for /Lotus/Types/Game/VendorManifests/Hubs/IronwakeDondaVendorManifest`);
        }
    }

    const cms = getVendorManifestByTypeName(
        "/Lotus/Types/Game/VendorManifests/Hubs/RailjackCrewMemberVendorManifest",
        false
    )!.VendorInfo.ItemManifest;
    if (
        cms.length != 9 ||
        cms[0].Bin != "BIN_2" ||
        cms[8].Bin != "BIN_0" ||
        cms.reduce((a, x) => a + (x.Bin == "BIN_2" ? 1 : 0), 0) < 2 ||
        cms.reduce((a, x) => a + (x.Bin == "BIN_1" ? 1 : 0), 0) < 2 ||
        cms.reduce((a, x) => a + (x.Bin == "BIN_0" ? 1 : 0), 0) < 4
    ) {
        logger.warn(`self test failed for /Lotus/Types/Game/VendorManifests/Hubs/RailjackCrewMemberVendorManifest`);
    }

    const temple = getVendorManifestByTypeName(
        "/Lotus/Types/Game/VendorManifests/TheHex/Temple1999VendorManifest",
        false
    )!.VendorInfo.ItemManifest;
    if (!temple.find(x => x.StoreItem == "/Lotus/StoreItems/Types/Items/MiscItems/Kuva")) {
        logger.warn(`self test failed for /Lotus/Types/Game/VendorManifests/TheHex/Temple1999VendorManifest`);
    }

    const nakak = getVendorManifestByTypeName("/Lotus/Types/Game/VendorManifests/Ostron/MaskSalesmanManifest", false)!
        .VendorInfo.ItemManifest;
    if (
        nakak.length != 10 ||
        nakak[0].StoreItem != "/Lotus/StoreItems/Upgrades/Skins/Ostron/RevenantMask" ||
        nakak[1].StoreItem != "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyThumper" ||
        nakak[1].ItemPrices?.length != 4 ||
        nakak[2].StoreItem != "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyThumperMedium" ||
        nakak[2].ItemPrices?.length != 4 ||
        nakak[3].StoreItem != "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyThumperLarge" ||
        nakak[3].ItemPrices?.length != 4
        // The remaining offers should be computed by weighted RNG.
    ) {
        logger.warn(`self test failed for /Lotus/Types/Game/VendorManifests/Ostron/MaskSalesmanManifest`);
    }

    // strange case where numItems is 5 even tho only 3 offers can possibly be generated
    const loid = getVendorManifestByTypeName(
        "/Lotus/Types/Game/VendorManifests/EntratiLabs/EntratiLabsCommisionsManifest",
        false
    )!.VendorInfo.ItemManifest;
    if (loid.length != 3) {
        logger.warn(`self test failed for /Lotus/Types/Game/VendorManifests/EntratiLabs/EntratiLabsCommisionsManifest`);
    }
}
