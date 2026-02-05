import { getSubstringFromKeyword } from "../helpers/stringHelpers.ts";
import {
    addBooster,
    addItem,
    addItems,
    addMiscItems,
    combineInventoryChanges,
    updateCurrency,
    updateSlots
} from "./inventoryService.ts";
import { getRandomReward, getRandomWeightedRewardUc } from "./rngService.ts";
import { applyStandingToVendorManifest, getVendorManifestByOid } from "./serversideVendorsService.ts";
import type { IMiscItem } from "../types/inventoryTypes/inventoryTypes.ts";
import type {
    IPurchaseRequest,
    IPurchaseResponse,
    IInventoryChanges,
    IPurchaseParams,
    SlotNames
} from "../types/purchaseTypes.ts";
import { PurchaseSource } from "../types/purchaseTypes.ts";
import { logger } from "../utils/logger.ts";
import { getWorldState } from "./worldStateService.ts";
import {
    ExportBoosters,
    ExportBundles,
    ExportCreditBundles,
    ExportGear,
    ExportResources,
    ExportSyndicates,
    ExportVendors
} from "warframe-public-export-plus";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import { fromStoreItem, getBoosterPack, getBundle, getPrice, toStoreItem } from "./itemDataService.ts";
import { DailyDeal } from "../models/worldStateModel.ts";
import { fromMongoDate, toMongoDate } from "../helpers/inventoryHelpers.ts";
import { Guild } from "../models/guildModel.ts";
import { handleGuildGoalProgress } from "./guildService.ts";
import { Types } from "mongoose";

export const getStoreItemCategory = (storeItem: string): string => {
    const storeItemString = getSubstringFromKeyword(storeItem, "StoreItems/");
    const storeItemElements = storeItemString.split("/");
    return storeItemElements[1];
};

export const getStoreItemTypesCategory = (typesItem: string): string => {
    const typesString = getSubstringFromKeyword(typesItem, "Types");
    const typeElements = typesString.split("/");
    if (typesItem.includes("StoreItems")) {
        return typeElements[2];
    }
    return typeElements[1];
};

const tallyVendorPurchase = (
    inventory: TInventoryDatabaseDocument,
    inventoryChanges: IInventoryChanges,
    VendorType: string,
    ItemId: string,
    numPurchased: number,
    Expiry: Date
): void => {
    if (!inventory.noVendorPurchaseLimits) {
        inventory.RecentVendorPurchases ??= [];
        let vendorPurchases = inventory.RecentVendorPurchases.find(x => x.VendorType == VendorType);
        if (!vendorPurchases) {
            vendorPurchases =
                inventory.RecentVendorPurchases[
                    inventory.RecentVendorPurchases.push({
                        VendorType: VendorType,
                        PurchaseHistory: []
                    }) - 1
                ];
        }
        let historyEntry = vendorPurchases.PurchaseHistory.find(x => x.ItemId == ItemId);
        if (historyEntry) {
            if (Date.now() >= historyEntry.Expiry.getTime()) {
                historyEntry.NumPurchased = numPurchased;
                historyEntry.Expiry = Expiry;
            } else {
                historyEntry.NumPurchased += numPurchased;
            }
        } else {
            historyEntry =
                vendorPurchases.PurchaseHistory[
                    vendorPurchases.PurchaseHistory.push({
                        ItemId: ItemId,
                        NumPurchased: numPurchased,
                        Expiry: Expiry
                    }) - 1
                ];
        }
        inventoryChanges.NewVendorPurchase = {
            VendorType: VendorType,
            PurchaseHistory: [
                {
                    ItemId: ItemId,
                    NumPurchased: historyEntry.NumPurchased,
                    Expiry: toMongoDate(Expiry)
                }
            ]
        };
        inventoryChanges.RecentVendorPurchases = inventoryChanges.NewVendorPurchase;
    }
};

export const handlePurchase = async (
    purchaseRequest: IPurchaseRequest,
    inventory: TInventoryDatabaseDocument
): Promise<IPurchaseResponse> => {
    logger.debug("purchase request", purchaseRequest);

    const prePurchaseInventoryChanges: IInventoryChanges = {};
    let seed: bigint | undefined;
    if (purchaseRequest.PurchaseParams.Source == PurchaseSource.Vendor) {
        let manifest = getVendorManifestByOid(purchaseRequest.PurchaseParams.SourceId!, purchaseRequest.buildLabel);
        if (manifest) {
            manifest = applyStandingToVendorManifest(manifest, inventory.Affiliations);
            let ItemId: string | undefined;
            if (purchaseRequest.PurchaseParams.ExtraPurchaseInfoJson) {
                ItemId = (JSON.parse(purchaseRequest.PurchaseParams.ExtraPurchaseInfoJson) as { ItemId: string })
                    .ItemId;
            }
            const offer = ItemId
                ? manifest.VendorInfo.ItemManifest.find(x => x.Id.$oid == ItemId)
                : manifest.VendorInfo.ItemManifest.find(x => x.StoreItem == purchaseRequest.PurchaseParams.StoreItem);
            if (!offer) {
                throw new Error(`unknown vendor offer: ${ItemId ? ItemId : purchaseRequest.PurchaseParams.StoreItem}`);
            }
            if (!inventory.dontSubtractPurchaseCreditCost) {
                if (offer.RegularPrice) {
                    updateCurrency(
                        inventory,
                        offer.RegularPrice[0] * purchaseRequest.PurchaseParams.Quantity,
                        false,
                        prePurchaseInventoryChanges
                    );
                }
            }
            if (!inventory.dontSubtractPurchasePlatinumCost) {
                if (offer.PremiumPrice) {
                    updateCurrency(
                        inventory,
                        offer.PremiumPrice[0] * purchaseRequest.PurchaseParams.Quantity,
                        true,
                        prePurchaseInventoryChanges
                    );
                }
            }
            if (
                inventory.GuildId &&
                offer.ItemPrices &&
                manifest.VendorInfo.TypeName ==
                    "/Lotus/Types/Game/VendorManifests/Events/DuviriMurmurInvasionVendorManifest"
            ) {
                const guild = await Guild.findById(inventory.GuildId, "GoalProgress Tier VaultDecoRecipes");
                const goal = getWorldState(purchaseRequest.buildLabel).Goals.find(x => x.Tag == "DuviriMurmurEvent");
                if (guild && goal) {
                    await handleGuildGoalProgress(guild, {
                        Count: offer.ItemPrices[0].ItemCount * purchaseRequest.PurchaseParams.Quantity,
                        Tag: goal.Tag,
                        goalId: new Types.ObjectId(goal._id.$oid)
                    });
                }
            }
            if (!inventory.dontSubtractPurchaseItemCost) {
                if (offer.ItemPrices) {
                    await handleItemPrices(
                        inventory,
                        offer.ItemPrices,
                        purchaseRequest.PurchaseParams.Quantity,
                        prePurchaseInventoryChanges
                    );
                }
            }
            if (offer.LocTagRandSeed !== undefined) {
                seed = BigInt(offer.LocTagRandSeed);
            }
            if (ItemId) {
                let expiry = parseInt(offer.Expiry.$date.$numberLong);
                if (purchaseRequest.PurchaseParams.IsWeekly) {
                    const EPOCH = 1734307200 * 1000; // Monday
                    const week = Math.trunc((Date.now() - EPOCH) / 604800000);
                    const weekStart = EPOCH + week * 604800000;
                    expiry = weekStart + 604800000;
                }
                tallyVendorPurchase(
                    inventory,
                    prePurchaseInventoryChanges,
                    manifest.VendorInfo.TypeName,
                    ItemId,
                    purchaseRequest.PurchaseParams.Quantity,
                    new Date(expiry)
                );
            }
            purchaseRequest.PurchaseParams.Quantity *= offer.QuantityMultiplier;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!ExportVendors[purchaseRequest.PurchaseParams.SourceId!]) {
                throw new Error(`unknown vendor: ${purchaseRequest.PurchaseParams.SourceId!}`);
            }
        }
    }

    const purchaseResponse = await handleStoreItemAcquisition(
        purchaseRequest.PurchaseParams.StoreItem,
        inventory,
        purchaseRequest.PurchaseParams.Quantity,
        undefined,
        false,
        purchaseRequest.PurchaseParams.UsePremium,
        seed,
        purchaseRequest.buildLabel
    );
    combineInventoryChanges(purchaseResponse.InventoryChanges, prePurchaseInventoryChanges);

    switch (purchaseRequest.PurchaseParams.Source) {
        case PurchaseSource.Market:
            if (!purchaseRequest.PurchaseParams.ExpectedPrice) {
                logger.debug(`client didn't provide ExpectedPrice, attempt to get it from PE+`);
                purchaseRequest.PurchaseParams.ExpectedPrice = getPrice(
                    purchaseRequest.PurchaseParams.StoreItem,
                    purchaseRequest.PurchaseParams.Quantity,
                    purchaseRequest.PurchaseParams.Durability,
                    purchaseRequest.PurchaseParams.UsePremium,
                    purchaseRequest.buildLabel
                );
            }
            break;
        case PurchaseSource.VoidTrader: {
            const worldState = getWorldState(purchaseRequest.buildLabel);
            if (purchaseRequest.PurchaseParams.SourceId! != worldState.VoidTraders[0]._id.$oid) {
                throw new Error("invalid request source");
            }
            const offer = worldState.VoidTraders[0].Manifest.find(
                x => x.ItemType == purchaseRequest.PurchaseParams.StoreItem
            );
            if (offer) {
                if (!inventory.dontSubtractPurchaseCreditCost) {
                    updateCurrency(inventory, offer.RegularPrice, false, purchaseResponse.InventoryChanges);
                }
                if (purchaseRequest.PurchaseParams.ExpectedPrice) {
                    throw new Error(`vendor purchase should not have an expected price`);
                }

                if (offer.PrimePrice && !inventory.dontSubtractPurchaseItemCost) {
                    const invItem: IMiscItem = {
                        ItemType: "/Lotus/Types/Items/MiscItems/PrimeBucks",
                        ItemCount: offer.PrimePrice * purchaseRequest.PurchaseParams.Quantity * -1
                    };
                    addMiscItems(inventory, [invItem]);
                    purchaseResponse.InventoryChanges.MiscItems ??= [];
                    purchaseResponse.InventoryChanges.MiscItems.push(invItem);
                }

                if (offer.Limit) {
                    tallyVendorPurchase(
                        inventory,
                        purchaseResponse.InventoryChanges,
                        "VoidTrader",
                        offer.ItemType,
                        purchaseRequest.PurchaseParams.Quantity,
                        fromMongoDate(worldState.VoidTraders[0].Expiry)
                    );
                }
            }
            break;
        }
        case PurchaseSource.SyndicateFavor:
            {
                const syndicateTag = purchaseRequest.PurchaseParams.SyndicateTag!;
                if (purchaseRequest.PurchaseParams.UseFreeFavor!) {
                    const affiliation = inventory.Affiliations.find(x => x.Tag == syndicateTag)!;
                    affiliation.FreeFavorsUsed ??= [];
                    const lastTitle = affiliation.FreeFavorsEarned![affiliation.FreeFavorsUsed.length];
                    affiliation.FreeFavorsUsed.push(lastTitle);
                    purchaseResponse.FreeFavorsUsed = [
                        {
                            Tag: syndicateTag,
                            Title: lastTitle
                        }
                    ];
                } else if (!inventory.dontSubtractPurchaseStandingCost) {
                    const syndicate = ExportSyndicates[syndicateTag];
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (syndicate) {
                        const favour = syndicate.favours.find(
                            x => x.storeItem == purchaseRequest.PurchaseParams.StoreItem
                        );
                        if (favour) {
                            const affiliation = inventory.Affiliations.find(x => x.Tag == syndicateTag);
                            if (affiliation) {
                                purchaseResponse.Standing = [
                                    {
                                        Tag: syndicateTag,
                                        Standing: favour.standingCost * purchaseRequest.PurchaseParams.Quantity
                                    }
                                ];
                                affiliation.Standing -= favour.standingCost * purchaseRequest.PurchaseParams.Quantity;
                            }
                        }
                    }
                }
            }
            break;
        case PurchaseSource.DailyDeal:
            if (purchaseRequest.PurchaseParams.ExpectedPrice) {
                throw new Error(`daily deal purchase should not have an expected price`);
            }
            await handleDailyDealPurchase(inventory, purchaseRequest.PurchaseParams, purchaseResponse);
            break;
        case PurchaseSource.Vendor:
            if (purchaseRequest.PurchaseParams.SourceId! in ExportVendors) {
                const vendor = ExportVendors[purchaseRequest.PurchaseParams.SourceId!];
                const offer = vendor.items.find(x => x.storeItem == purchaseRequest.PurchaseParams.StoreItem);
                if (offer) {
                    if (typeof offer.credits == "number" && !inventory.dontSubtractPurchaseCreditCost) {
                        updateCurrency(inventory, offer.credits, false, purchaseResponse.InventoryChanges);
                    }
                    if (typeof offer.platinum == "number" && !inventory.dontSubtractPurchasePlatinumCost) {
                        updateCurrency(inventory, offer.platinum, true, purchaseResponse.InventoryChanges);
                    }
                    if (offer.itemPrices && !inventory.dontSubtractPurchaseItemCost) {
                        await handleItemPrices(
                            inventory,
                            offer.itemPrices,
                            purchaseRequest.PurchaseParams.Quantity,
                            purchaseResponse.InventoryChanges
                        );
                    }
                }
            }
            if (purchaseRequest.PurchaseParams.ExpectedPrice) {
                throw new Error(`vendor purchase should not have an expected price`);
            }
            break;
        case PurchaseSource.PrimeVaultTrader: {
            const worldState = getWorldState(purchaseRequest.buildLabel);
            if (purchaseRequest.PurchaseParams.SourceId! != worldState.PrimeVaultTraders[0]._id.$oid) {
                throw new Error("invalid request source");
            }
            const offer =
                worldState.PrimeVaultTraders[0].Manifest.find(
                    x => x.ItemType == purchaseRequest.PurchaseParams.StoreItem
                ) ??
                worldState.PrimeVaultTraders[0].EvergreenManifest.find(
                    x => x.ItemType == purchaseRequest.PurchaseParams.StoreItem
                );
            if (offer) {
                if (offer.RegularPrice) {
                    if (!inventory.dontSubtractPurchaseItemCost) {
                        const invItem: IMiscItem = {
                            ItemType: "/Lotus/Types/Items/MiscItems/SchismKey",
                            ItemCount: offer.RegularPrice * purchaseRequest.PurchaseParams.Quantity * -1
                        };

                        addMiscItems(inventory, [invItem]);

                        purchaseResponse.InventoryChanges.MiscItems ??= [];
                        purchaseResponse.InventoryChanges.MiscItems.push(invItem);
                    }
                } else if (!inventory.infiniteRegalAya) {
                    inventory.PrimeTokens -= offer.PrimePrice! * purchaseRequest.PurchaseParams.Quantity;

                    purchaseResponse.InventoryChanges.PrimeTokens ??= 0;
                    purchaseResponse.InventoryChanges.PrimeTokens -=
                        offer.PrimePrice! * purchaseRequest.PurchaseParams.Quantity;
                }
            }
            break;
        }
    }

    if (purchaseRequest.PurchaseParams.ExpectedPrice) {
        updateCurrency(
            inventory,
            purchaseRequest.PurchaseParams.ExpectedPrice,
            purchaseRequest.PurchaseParams.UsePremium,
            purchaseResponse.InventoryChanges
        );
    }

    return purchaseResponse;
};

const handleItemPrices = async (
    inventory: TInventoryDatabaseDocument,
    itemPrices: IMiscItem[],
    purchaseQuantity: number,
    inventoryChanges: IInventoryChanges
): Promise<void> => {
    const items: IMiscItem[] = itemPrices.map(({ ItemType, ItemCount }) => ({
        ItemType,
        ItemCount: ItemCount * purchaseQuantity * -1
    }));
    await addItems(inventory, items, inventoryChanges);
};

export const handleDailyDealPurchase = async (
    inventory: TInventoryDatabaseDocument,
    purchaseParams: IPurchaseParams,
    purchaseResponse: IPurchaseResponse
): Promise<void> => {
    const dailyDeal = (await DailyDeal.findOne({ StoreItem: purchaseParams.StoreItem }))!;
    dailyDeal.AmountSold += 1;
    await dailyDeal.save();

    if (!inventory.dontSubtractPurchasePlatinumCost) {
        updateCurrency(inventory, dailyDeal.SalePrice, true, purchaseResponse.InventoryChanges);
    }

    if (!inventory.noVendorPurchaseLimits) {
        inventory.UsedDailyDeals.push(purchaseParams.StoreItem);
        purchaseResponse.DailyDealUsed = purchaseParams.StoreItem;
    }
};

export const handleBundleAcquisition = async (
    storeItemName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number = 1,
    inventoryChanges: IInventoryChanges = {},
    buildLabel?: string
): Promise<IInventoryChanges> => {
    const bundle = getBundle(storeItemName, buildLabel)!;
    logger.debug("acquiring bundle", bundle);
    for (const component of bundle.components) {
        combineInventoryChanges(
            inventoryChanges,
            (
                await handleStoreItemAcquisition(
                    component.typeName,
                    inventory,
                    component.purchaseQuantity * quantity,
                    component.durabilityDays,
                    true,
                    true,
                    undefined,
                    buildLabel
                )
            ).InventoryChanges
        );
    }
    return inventoryChanges;
};

export const handleStoreItemAcquisition = async (
    storeItemName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number = 1,
    durabilityDays: number = 3,
    ignorePurchaseQuantity: boolean = false,
    premiumPurchase: boolean = true,
    seed?: bigint,
    buildLabel?: string
): Promise<IPurchaseResponse> => {
    let purchaseResponse = {
        InventoryChanges: {}
    };
    logger.debug(`handling acquisition of ${storeItemName}`);
    if (storeItemName in ExportBundles) {
        await handleBundleAcquisition(
            storeItemName,
            inventory,
            quantity,
            purchaseResponse.InventoryChanges,
            buildLabel
        );
    } else {
        const storeCategory = getStoreItemCategory(storeItemName);
        const internalName = fromStoreItem(storeItemName);
        if (!ignorePurchaseQuantity) {
            if (internalName in ExportGear) {
                quantity *= ExportGear[internalName].purchaseQuantity || 1;
                logger.debug(`factored quantity is ${quantity}`);
            } else if (internalName in ExportResources) {
                quantity *= ExportResources[internalName].purchaseQuantity || 1;
                logger.debug(`factored quantity is ${quantity}`);
            }
        }
        logger.debug(`store category ${storeCategory}`);
        switch (storeCategory) {
            default: {
                purchaseResponse = {
                    InventoryChanges: await addItem(
                        inventory,
                        internalName,
                        quantity,
                        premiumPurchase,
                        seed,
                        undefined,
                        true
                    )
                };
                break;
            }
            case "Types":
                purchaseResponse = await handleTypesPurchase(
                    internalName,
                    inventory,
                    quantity,
                    ignorePurchaseQuantity,
                    premiumPurchase,
                    seed,
                    buildLabel
                );
                break;
            case "Boosters":
                purchaseResponse = handleBoostersPurchase(storeItemName, inventory, durabilityDays);
                break;
        }
    }
    return purchaseResponse;
};

const slotPurchaseNameToSlotName: Record<string, { name: SlotNames; purchaseQuantity: number }> = {
    SuitSlotItem: { name: "SuitBin", purchaseQuantity: 1 },
    TwoSentinelSlotItem: { name: "SentinelBin", purchaseQuantity: 2 },
    WeaponSlotItem: { name: "WeaponBin", purchaseQuantity: 1 },
    TwoWeaponSlotItem: { name: "WeaponBin", purchaseQuantity: 2 },
    SpaceSuitSlotItem: { name: "SpaceSuitBin", purchaseQuantity: 1 },
    TwoSpaceWeaponSlotItem: { name: "SpaceWeaponBin", purchaseQuantity: 2 },
    MechSlotItem: { name: "MechBin", purchaseQuantity: 1 },
    TwoOperatorWeaponSlotItem: { name: "OperatorAmpBin", purchaseQuantity: 2 },
    RandomModSlotItem: { name: "RandomModBin", purchaseQuantity: 3 },
    TwoCrewShipSalvageSlotItem: { name: "CrewShipSalvageBin", purchaseQuantity: 2 },
    CrewMemberSlotItem: { name: "CrewMemberBin", purchaseQuantity: 1 },
    PvPLoadoutSlotItem: { name: "PvpBonusLoadoutBin", purchaseQuantity: 1 },
    KubrowSlotItem: { name: "PetBin", purchaseQuantity: 1 }
};

// // extra = everything above the base +2 slots (depending on slot type)
// // new slot above base = extra + 1 and slots +1
// // new frame = slots -1
// // number of frames = extra - slots + 2
const handleSlotPurchase = (
    slotPurchaseNameFull: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number,
    ignorePurchaseQuantity: boolean
): IPurchaseResponse => {
    logger.debug(`slot name ${slotPurchaseNameFull}`);
    const slotPurchaseName = slotPurchaseNameFull.substring(slotPurchaseNameFull.lastIndexOf("/") + 1);
    if (!(slotPurchaseName in slotPurchaseNameToSlotName)) {
        throw new Error(`invalid slot purchase name ${slotPurchaseName}`);
    }
    logger.debug(`slot purchase name ${slotPurchaseName}`);

    const slotName = slotPurchaseNameToSlotName[slotPurchaseName].name;
    let slotsPurchased = quantity;
    if (!ignorePurchaseQuantity) {
        slotsPurchased *= slotPurchaseNameToSlotName[slotPurchaseName].purchaseQuantity;
    }

    updateSlots(inventory, slotName, slotsPurchased, slotsPurchased);

    logger.debug(`added ${slotsPurchased} slot ${slotName}`);

    const inventoryChanges: IInventoryChanges = {};
    inventoryChanges[slotName] = {
        count: 0,
        platinum: 1,
        Slots: slotsPurchased,
        Extra: slotsPurchased
    };
    return { InventoryChanges: inventoryChanges };
};

const handleBoosterPackPurchase = async (
    typeName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number,
    buildLabel?: string
): Promise<IPurchaseResponse> => {
    const pack = getBoosterPack(typeName, buildLabel);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!pack) {
        throw new Error(`unknown booster pack: ${typeName}`);
    }
    const purchaseResponse: IPurchaseResponse = {
        BoosterPackItems: "",
        Body: "",
        InventoryChanges: {}
    };
    if (quantity < 1) {
        throw new Error(`invalid quantity for booster pack purchase: ${quantity}`);
    }
    if (quantity > 100) {
        throw new Error(
            "attempt to roll over 100 booster packs in a single go. possible but unlikely to be desirable for the user or the server."
        );
    }
    const specialItemReward = pack.components.find(x => x.PityIncreaseRate);
    for (let i = 0; i != quantity; ++i) {
        if (specialItemReward) {
            {
                const normalComponents = [];
                for (const comp of pack.components) {
                    if (!comp.PityIncreaseRate) {
                        const { Probability, ...rest } = comp;
                        normalComponents.push({
                            ...rest,
                            probability: Probability!
                        });
                    }
                }
                const result = getRandomReward(normalComponents)!;
                logger.debug(`booster pack rolled`, result);
                purchaseResponse.BoosterPackItems += toStoreItem(result.Item) + ',{"lvl":0};';
                combineInventoryChanges(
                    purchaseResponse.InventoryChanges,
                    await addItem(inventory, result.Item, result.Amount)
                );
            }

            if (!inventory.WeaponSkins.some(x => x.ItemType == specialItemReward.Item)) {
                inventory.SpecialItemRewardAttenuation ??= [];
                let atten = inventory.SpecialItemRewardAttenuation.find(x => x.Tag == specialItemReward.Item);
                if (!atten) {
                    atten =
                        inventory.SpecialItemRewardAttenuation[
                            inventory.SpecialItemRewardAttenuation.push({
                                Tag: specialItemReward.Item,
                                Atten: specialItemReward.Probability!
                            }) - 1
                        ];
                }
                if (Math.random() < atten.Atten) {
                    purchaseResponse.BoosterPackItems += toStoreItem(specialItemReward.Item) + ',{"lvl":0};';
                    combineInventoryChanges(
                        purchaseResponse.InventoryChanges,
                        await addItem(inventory, specialItemReward.Item)
                    );
                    atten.Atten = 0;
                } else {
                    atten.Atten += specialItemReward.PityIncreaseRate!;
                }
            }
        } else {
            const disallowedItems = new Set();
            for (let roll = 0; roll != pack.rarityWeightsPerRoll.length; ) {
                const weights = pack.rarityWeightsPerRoll[roll];
                const result = getRandomWeightedRewardUc(pack.components, weights)!;
                logger.debug(`booster pack rolled`, result);
                if (disallowedItems.has(result.Item)) {
                    logger.debug(`oops, can't use that one; trying again`);
                    continue;
                }
                if (!pack.canGiveDuplicates) {
                    disallowedItems.add(result.Item);
                }
                const fingerprint = { lvl: 0 };
                if (result.Item.startsWith("/Lotus/Upgrades/Mods/Fusers/")) {
                    if (result.Item.endsWith("RareModFuser")) {
                        fingerprint.lvl = Math.floor(Math.random() * 4) + 2;
                    } else if (result.Item.endsWith("CommonModFuser") || result.Item.endsWith("UncommonModFuser")) {
                        fingerprint.lvl = Math.floor(Math.random() * 3) + 1;
                    }
                }
                const stringifiedFingerprint = JSON.stringify(fingerprint);
                purchaseResponse.BoosterPackItems += toStoreItem(result.Item) + `,${stringifiedFingerprint};`;
                combineInventoryChanges(
                    purchaseResponse.InventoryChanges,
                    await addItem(inventory, result.Item, result.Amount, false, undefined, stringifiedFingerprint)
                );
                ++roll;
            }
        }
    }
    if (purchaseResponse.BoosterPackItems)
        purchaseResponse.Body = purchaseResponse.BoosterPackItems.replace(/[{}"]/g, "").replace(/:/g, "=");
    return purchaseResponse;
};

const handleCreditBundlePurchase = async (
    typeName: string,
    inventory: TInventoryDatabaseDocument
): Promise<IPurchaseResponse> => {
    if (typeName && typeName in ExportCreditBundles) {
        const creditsAmount = ExportCreditBundles[typeName].credits;

        inventory.RegularCredits += creditsAmount;
        await inventory.save();

        return { InventoryChanges: { RegularCredits: creditsAmount } };
    } else {
        throw new Error(`unknown credit bundle: ${typeName}`);
    }
};

//TODO: change to getInventory, apply changes then save at the end
const handleTypesPurchase = async (
    typesName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number,
    ignorePurchaseQuantity: boolean,
    premiumPurchase: boolean = true,
    seed?: bigint,
    buildLabel?: string
): Promise<IPurchaseResponse> => {
    const typeCategory = getStoreItemTypesCategory(typesName);
    logger.debug(`type category ${typeCategory}`);
    switch (typeCategory) {
        default:
            return {
                InventoryChanges: await addItem(inventory, typesName, quantity, premiumPurchase, seed, undefined, true)
            };
        case "BoosterPacks":
            return handleBoosterPackPurchase(typesName, inventory, quantity, buildLabel);
        case "SlotItems":
            return handleSlotPurchase(typesName, inventory, quantity, ignorePurchaseQuantity);
        case "CreditBundles":
            return handleCreditBundlePurchase(typesName, inventory);
    }
};

const handleBoostersPurchase = (
    boosterStoreName: string,
    inventory: TInventoryDatabaseDocument,
    durabilityDays: number
): { InventoryChanges: IInventoryChanges } => {
    if (!(boosterStoreName in ExportBoosters)) {
        logger.error(`unknown booster type: ${boosterStoreName}`);
        return { InventoryChanges: {} };
    }

    const ItemType = ExportBoosters[boosterStoreName].typeName;
    const ExpiryDate = durabilityDays * 86400;

    addBooster(ItemType, ExpiryDate, inventory);

    return {
        InventoryChanges: {
            Boosters: [{ ItemType, ExpiryDate }]
        }
    };
};
