import { parseSlotPurchaseName, slotPurchaseNameToSlotName } from "@/src/helpers/purchaseHelpers";
import { getSubstringFromKeyword } from "@/src/helpers/stringHelpers";
import {
    addBooster,
    addItem,
    addMiscItems,
    combineInventoryChanges,
    updateCurrency,
    updateSlots
} from "@/src/services/inventoryService";
import { getRandomReward, getRandomWeightedRewardUc } from "@/src/services/rngService";
import { applyStandingToVendorManifest, getVendorManifestByOid } from "@/src/services/serversideVendorsService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    IPurchaseRequest,
    IPurchaseResponse,
    IInventoryChanges,
    PurchaseSource,
    IPurchaseParams
} from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";
import { getWorldState } from "@/src/services/worldStateService";
import {
    ExportBoosterPacks,
    ExportBoosters,
    ExportBundles,
    ExportGear,
    ExportMisc,
    ExportResources,
    ExportSyndicates,
    ExportVendors,
    TRarity
} from "warframe-public-export-plus";
import { config } from "@/src/services/configService";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { fromStoreItem, toStoreItem } from "@/src/services/itemDataService";
import { DailyDeal } from "@/src/models/worldStateModel";
import { fromMongoDate, toMongoDate } from "@/src/helpers/inventoryHelpers";
import { Guild } from "@/src/models/guildModel";
import { handleGuildGoalProgress } from "@/src/services/guildService";
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
    if (!config.noVendorPurchaseLimits) {
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
        let manifest = getVendorManifestByOid(purchaseRequest.PurchaseParams.SourceId!);
        if (manifest) {
            manifest = applyStandingToVendorManifest(inventory, manifest);
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
            if (!config.dontSubtractPurchaseCreditCost) {
                if (offer.RegularPrice) {
                    updateCurrency(inventory, offer.RegularPrice[0], false, prePurchaseInventoryChanges);
                }
            }
            if (!config.dontSubtractPurchasePlatinumCost) {
                if (offer.PremiumPrice) {
                    updateCurrency(inventory, offer.PremiumPrice[0], true, prePurchaseInventoryChanges);
                }
            }
            if (
                inventory.GuildId &&
                offer.ItemPrices &&
                manifest.VendorInfo.TypeName ==
                    "/Lotus/Types/Game/VendorManifests/Events/DuviriMurmurInvasionVendorManifest"
            ) {
                const guild = await Guild.findById(inventory.GuildId, "GoalProgress Tier VaultDecoRecipes");
                const goal = getWorldState().Goals.find(x => x.Tag == "DuviriMurmurEvent");
                if (guild && goal) {
                    await handleGuildGoalProgress(guild, {
                        Count: offer.ItemPrices[0].ItemCount * purchaseRequest.PurchaseParams.Quantity,
                        Tag: goal.Tag,
                        goalId: new Types.ObjectId(goal._id.$oid)
                    });
                }
            }
            if (!config.dontSubtractPurchaseItemCost) {
                if (offer.ItemPrices) {
                    handleItemPrices(
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
        seed
    );
    combineInventoryChanges(purchaseResponse.InventoryChanges, prePurchaseInventoryChanges);

    updateCurrency(
        inventory,
        purchaseRequest.PurchaseParams.ExpectedPrice,
        purchaseRequest.PurchaseParams.UsePremium,
        prePurchaseInventoryChanges
    );

    switch (purchaseRequest.PurchaseParams.Source) {
        case PurchaseSource.VoidTrader: {
            const worldState = getWorldState();
            if (purchaseRequest.PurchaseParams.SourceId! != worldState.VoidTraders[0]._id.$oid) {
                throw new Error("invalid request source");
            }
            const offer = worldState.VoidTraders[0].Manifest.find(
                x => x.ItemType == purchaseRequest.PurchaseParams.StoreItem
            );
            if (offer) {
                if (!config.dontSubtractPurchaseCreditCost) {
                    updateCurrency(inventory, offer.RegularPrice, false, purchaseResponse.InventoryChanges);
                }
                if (purchaseRequest.PurchaseParams.ExpectedPrice) {
                    throw new Error(`vendor purchase should not have an expected price`);
                }

                if (offer.PrimePrice && !config.dontSubtractPurchaseItemCost) {
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
                } else if (!config.dontSubtractPurchaseStandingCost) {
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
                    if (typeof offer.credits == "number" && !config.dontSubtractPurchaseCreditCost) {
                        updateCurrency(inventory, offer.credits, false, purchaseResponse.InventoryChanges);
                    }
                    if (typeof offer.platinum == "number" && !config.dontSubtractPurchasePlatinumCost) {
                        updateCurrency(inventory, offer.platinum, true, purchaseResponse.InventoryChanges);
                    }
                    if (offer.itemPrices && !config.dontSubtractPurchaseItemCost) {
                        handleItemPrices(
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
            const worldState = getWorldState();
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
                    if (!config.dontSubtractPurchaseItemCost) {
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

    return purchaseResponse;
};

const handleItemPrices = (
    inventory: TInventoryDatabaseDocument,
    itemPrices: IMiscItem[],
    purchaseQuantity: number,
    inventoryChanges: IInventoryChanges
): void => {
    for (const item of itemPrices) {
        const invItem: IMiscItem = {
            ItemType: item.ItemType,
            ItemCount: item.ItemCount * purchaseQuantity * -1
        };

        addMiscItems(inventory, [invItem]);

        inventoryChanges.MiscItems ??= [];
        const change = inventoryChanges.MiscItems.find(x => x.ItemType == item.ItemType);
        if (change) {
            change.ItemCount += invItem.ItemCount;
        } else {
            inventoryChanges.MiscItems.push(invItem);
        }
    }
};

export const handleDailyDealPurchase = async (
    inventory: TInventoryDatabaseDocument,
    purchaseParams: IPurchaseParams,
    purchaseResponse: IPurchaseResponse
): Promise<void> => {
    const dailyDeal = (await DailyDeal.findOne({ StoreItem: purchaseParams.StoreItem }))!;
    dailyDeal.AmountSold += 1;
    await dailyDeal.save();

    if (!config.dontSubtractPurchasePlatinumCost) {
        updateCurrency(inventory, dailyDeal.SalePrice, true, purchaseResponse.InventoryChanges);
    }

    if (!config.noVendorPurchaseLimits) {
        inventory.UsedDailyDeals.push(purchaseParams.StoreItem);
        purchaseResponse.DailyDealUsed = purchaseParams.StoreItem;
    }
};

export const handleBundleAcqusition = async (
    storeItemName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number = 1,
    inventoryChanges: IInventoryChanges = {}
): Promise<IInventoryChanges> => {
    const bundle = ExportBundles[storeItemName];
    logger.debug("acquiring bundle", bundle);
    for (const component of bundle.components) {
        combineInventoryChanges(
            inventoryChanges,
            (
                await handleStoreItemAcquisition(
                    component.typeName,
                    inventory,
                    component.purchaseQuantity * quantity,
                    component.durability,
                    true
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
    durability: TRarity = "COMMON",
    ignorePurchaseQuantity: boolean = false,
    premiumPurchase: boolean = true,
    seed?: bigint
): Promise<IPurchaseResponse> => {
    let purchaseResponse = {
        InventoryChanges: {}
    };
    logger.debug(`handling acquision of ${storeItemName}`);
    if (storeItemName in ExportBundles) {
        await handleBundleAcqusition(storeItemName, inventory, quantity, purchaseResponse.InventoryChanges);
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
                    seed
                );
                break;
            case "Boosters":
                purchaseResponse = handleBoostersPurchase(storeItemName, inventory, durability);
                break;
        }
    }
    return purchaseResponse;
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
    const slotPurchaseName = parseSlotPurchaseName(
        slotPurchaseNameFull.substring(slotPurchaseNameFull.lastIndexOf("/") + 1)
    );
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
    quantity: number
): Promise<IPurchaseResponse> => {
    const pack = ExportBoosterPacks[typeName];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!pack) {
        throw new Error(`unknown booster pack: ${typeName}`);
    }
    const purchaseResponse: IPurchaseResponse = {
        BoosterPackItems: "",
        InventoryChanges: {}
    };
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
                purchaseResponse.BoosterPackItems += toStoreItem(result.Item) + ',{"lvl":0};';
                combineInventoryChanges(
                    purchaseResponse.InventoryChanges,
                    await addItem(inventory, result.Item, result.Amount)
                );
                ++roll;
            }
        }
    }
    return purchaseResponse;
};

const handleCreditBundlePurchase = async (
    typeName: string,
    inventory: TInventoryDatabaseDocument
): Promise<IPurchaseResponse> => {
    if (typeName && typeName in ExportMisc.creditBundles) {
        const creditsAmount = ExportMisc.creditBundles[typeName];

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
    seed?: bigint
): Promise<IPurchaseResponse> => {
    const typeCategory = getStoreItemTypesCategory(typesName);
    logger.debug(`type category ${typeCategory}`);
    switch (typeCategory) {
        default:
            return {
                InventoryChanges: await addItem(inventory, typesName, quantity, premiumPurchase, seed, undefined, true)
            };
        case "BoosterPacks":
            return handleBoosterPackPurchase(typesName, inventory, quantity);
        case "SlotItems":
            return handleSlotPurchase(typesName, inventory, quantity, ignorePurchaseQuantity);
        case "CreditBundles":
            return handleCreditBundlePurchase(typesName, inventory);
    }
};

const handleBoostersPurchase = (
    boosterStoreName: string,
    inventory: TInventoryDatabaseDocument,
    durability: TRarity
): { InventoryChanges: IInventoryChanges } => {
    if (!(boosterStoreName in ExportBoosters)) {
        logger.error(`unknown booster type: ${boosterStoreName}`);
        return { InventoryChanges: {} };
    }

    const ItemType = ExportBoosters[boosterStoreName].typeName;
    const ExpiryDate = ExportMisc.boosterDurations[durability];

    addBooster(ItemType, ExpiryDate, inventory);

    return {
        InventoryChanges: {
            Boosters: [{ ItemType, ExpiryDate }]
        }
    };
};
