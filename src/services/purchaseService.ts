import { parseSlotPurchaseName } from "@/src/helpers/purchaseHelpers";
import { getSubstringFromKeyword } from "@/src/helpers/stringHelpers";
import {
    addBooster,
    addItem,
    addMiscItems,
    combineInventoryChanges,
    updateCurrency,
    updateSlots
} from "@/src/services/inventoryService";
import { getRandomWeightedReward } from "@/src/services/rngService";
import { getVendorManifestByOid } from "@/src/services/serversideVendorsService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IPurchaseRequest, IPurchaseResponse, SlotPurchase, IInventoryChanges } from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";
import worldState from "@/static/fixed_responses/worldState/worldState.json";
import {
    ExportBoosterPacks,
    ExportBundles,
    ExportGear,
    ExportResources,
    ExportSyndicates,
    ExportVendors,
    TRarity
} from "warframe-public-export-plus";
import { config } from "./configService";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";

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

export const handlePurchase = async (
    purchaseRequest: IPurchaseRequest,
    inventory: TInventoryDatabaseDocument
): Promise<IPurchaseResponse> => {
    logger.debug("purchase request", purchaseRequest);

    const inventoryChanges: IInventoryChanges = {};
    if (purchaseRequest.PurchaseParams.Source == 7) {
        const manifest = getVendorManifestByOid(purchaseRequest.PurchaseParams.SourceId!);
        if (manifest) {
            const ItemId = (JSON.parse(purchaseRequest.PurchaseParams.ExtraPurchaseInfoJson!) as { ItemId: string })
                .ItemId;
            const offer = manifest.VendorInfo.ItemManifest.find(x => x.Id.$oid == ItemId);
            if (!offer) {
                throw new Error(`unknown vendor offer: ${ItemId}`);
            }
            if (offer.ItemPrices) {
                handleItemPrices(
                    inventory,
                    offer.ItemPrices,
                    purchaseRequest.PurchaseParams.Quantity,
                    inventoryChanges
                );
            }
            purchaseRequest.PurchaseParams.Quantity *= offer.QuantityMultiplier;
        } else if (!ExportVendors[purchaseRequest.PurchaseParams.SourceId!]) {
            throw new Error(`unknown vendor: ${purchaseRequest.PurchaseParams.SourceId!}`);
        }
    }

    const purchaseResponse = await handleStoreItemAcquisition(
        purchaseRequest.PurchaseParams.StoreItem,
        inventory,
        purchaseRequest.PurchaseParams.Quantity
    );
    combineInventoryChanges(purchaseResponse.InventoryChanges, inventoryChanges);

    if (!purchaseResponse) throw new Error("purchase response was undefined");

    const currencyChanges = updateCurrency(
        inventory,
        purchaseRequest.PurchaseParams.ExpectedPrice,
        purchaseRequest.PurchaseParams.UsePremium
    );
    purchaseResponse.InventoryChanges = {
        ...currencyChanges,
        ...purchaseResponse.InventoryChanges
    };

    switch (purchaseRequest.PurchaseParams.Source) {
        case 2:
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
                } else {
                    const syndicate = ExportSyndicates[syndicateTag];
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
                                        Standing: favour.standingCost
                                    }
                                ];
                                affiliation.Standing -= favour.standingCost;
                            }
                        }
                    }
                }
            }
            break;
        case 7:
            if (purchaseRequest.PurchaseParams.SourceId! in ExportVendors) {
                const vendor = ExportVendors[purchaseRequest.PurchaseParams.SourceId!];
                const offer = vendor.items.find(x => x.storeItem == purchaseRequest.PurchaseParams.StoreItem);
                if (offer && offer.itemPrices) {
                    handleItemPrices(
                        inventory,
                        offer.itemPrices,
                        purchaseRequest.PurchaseParams.Quantity,
                        purchaseResponse.InventoryChanges
                    );
                }
            }
            break;
        case 18: {
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
                    const invItem: IMiscItem = {
                        ItemType: "/Lotus/Types/Items/MiscItems/SchismKey",
                        ItemCount: offer.RegularPrice * purchaseRequest.PurchaseParams.Quantity * -1
                    };

                    addMiscItems(inventory, [invItem]);

                    purchaseResponse.InventoryChanges.MiscItems ??= [];
                    (purchaseResponse.InventoryChanges.MiscItems as IMiscItem[]).push(invItem);
                } else if (!config.infiniteRegalAya) {
                    inventory.PrimeTokens -= offer.PrimePrice! * purchaseRequest.PurchaseParams.Quantity;
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
        const change = (inventoryChanges.MiscItems as IMiscItem[]).find(x => x.ItemType == item.ItemType);
        if (change) {
            change.ItemCount += invItem.ItemCount;
        } else {
            (inventoryChanges.MiscItems as IMiscItem[]).push(invItem);
        }
    }
};

export const handleStoreItemAcquisition = async (
    storeItemName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number = 1,
    durability: TRarity = "COMMON",
    ignorePurchaseQuantity: boolean = false
): Promise<IPurchaseResponse> => {
    let purchaseResponse = {
        InventoryChanges: {}
    };
    logger.debug(`handling acquision of ${storeItemName}`);
    if (storeItemName in ExportBundles) {
        const bundle = ExportBundles[storeItemName];
        logger.debug("acquiring bundle", bundle);
        for (const component of bundle.components) {
            combineInventoryChanges(
                purchaseResponse.InventoryChanges,
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
    } else {
        const storeCategory = getStoreItemCategory(storeItemName);
        const internalName = storeItemName.replace("/StoreItems", "");
        logger.debug(`store category ${storeCategory}`);
        if (!ignorePurchaseQuantity) {
            if (internalName in ExportGear) {
                quantity *= ExportGear[internalName].purchaseQuantity || 1;
            } else if (internalName in ExportResources) {
                quantity *= ExportResources[internalName].purchaseQuantity || 1;
            }
        }
        switch (storeCategory) {
            default: {
                purchaseResponse = await addItem(inventory, internalName, quantity);
                break;
            }
            case "Types":
                purchaseResponse = await handleTypesPurchase(internalName, inventory, quantity);
                break;
            case "Boosters":
                purchaseResponse = handleBoostersPurchase(internalName, inventory, durability);
                break;
        }
    }
    return purchaseResponse;
};

export const slotPurchaseNameToSlotName: SlotPurchase = {
    SuitSlotItem: { name: "SuitBin", slotsPerPurchase: 1 },
    TwoSentinelSlotItem: { name: "SentinelBin", slotsPerPurchase: 2 },
    TwoWeaponSlotItem: { name: "WeaponBin", slotsPerPurchase: 2 },
    SpaceSuitSlotItem: { name: "SpaceSuitBin", slotsPerPurchase: 1 },
    TwoSpaceWeaponSlotItem: { name: "SpaceWeaponBin", slotsPerPurchase: 2 },
    MechSlotItem: { name: "MechBin", slotsPerPurchase: 1 },
    TwoOperatorWeaponSlotItem: { name: "OperatorAmpBin", slotsPerPurchase: 2 },
    RandomModSlotItem: { name: "RandomModBin", slotsPerPurchase: 3 },
    TwoCrewShipSalvageSlotItem: { name: "CrewShipSalvageBin", slotsPerPurchase: 2 },
    CrewMemberSlotItem: { name: "CrewMemberBin", slotsPerPurchase: 1 }
};

// // extra = everything above the base +2 slots (depending on slot type)
// // new slot above base = extra + 1 and slots +1
// // new frame = slots -1
// // number of frames = extra - slots + 2
const handleSlotPurchase = (
    slotPurchaseNameFull: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number
): IPurchaseResponse => {
    logger.debug(`slot name ${slotPurchaseNameFull}`);
    const slotPurchaseName = parseSlotPurchaseName(
        slotPurchaseNameFull.substring(slotPurchaseNameFull.lastIndexOf("/") + 1)
    );
    logger.debug(`slot purchase name ${slotPurchaseName}`);

    const slotName = slotPurchaseNameToSlotName[slotPurchaseName].name;
    const slotsPurchased = slotPurchaseNameToSlotName[slotPurchaseName].slotsPerPurchase * quantity;

    updateSlots(inventory, slotName, slotsPurchased, slotsPurchased);

    logger.debug(`added ${slotsPurchased} slot ${slotName}`);

    return {
        InventoryChanges: {
            [slotName]: {
                count: 0,
                platinum: 1,
                Slots: slotsPurchased,
                Extra: slotsPurchased
            }
        }
    };
};

const handleBoosterPackPurchase = async (
    typeName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number
): Promise<IPurchaseResponse> => {
    const pack = ExportBoosterPacks[typeName];
    if (!pack) {
        throw new Error(`unknown booster pack: ${typeName}`);
    }
    const purchaseResponse: IPurchaseResponse = {
        BoosterPackItems: "",
        InventoryChanges: {}
    };
    for (let i = 0; i != quantity; ++i) {
        for (const weights of pack.rarityWeightsPerRoll) {
            const result = getRandomWeightedReward(pack.components, weights);
            if (result) {
                logger.debug(`booster pack rolled`, result);
                purchaseResponse.BoosterPackItems +=
                    result.type.split("/Lotus/").join("/Lotus/StoreItems/") + ',{"lvl":0};';
                combineInventoryChanges(
                    purchaseResponse.InventoryChanges,
                    (await addItem(inventory, result.type, result.itemCount)).InventoryChanges
                );
            }
        }
    }
    return purchaseResponse;
};

//TODO: change to getInventory, apply changes then save at the end
const handleTypesPurchase = async (
    typesName: string,
    inventory: TInventoryDatabaseDocument,
    quantity: number
): Promise<IPurchaseResponse> => {
    const typeCategory = getStoreItemTypesCategory(typesName);
    logger.debug(`type category ${typeCategory}`);
    switch (typeCategory) {
        default:
            return await addItem(inventory, typesName, quantity);
        case "BoosterPacks":
            return handleBoosterPackPurchase(typesName, inventory, quantity);
        case "SlotItems":
            return handleSlotPurchase(typesName, inventory, quantity);
    }
};

const boosterCollection = [
    "/Lotus/Types/Boosters/ResourceAmountBooster",
    "/Lotus/Types/Boosters/AffinityBooster",
    "/Lotus/Types/Boosters/ResourceDropChanceBooster",
    "/Lotus/Types/Boosters/CreditBooster"
];

const boosterDuration: Record<TRarity, number> = {
    COMMON: 3 * 86400,
    UNCOMMON: 7 * 86400,
    RARE: 30 * 86400,
    LEGENDARY: 90 * 86400
};

const handleBoostersPurchase = (
    boosterStoreName: string,
    inventory: TInventoryDatabaseDocument,
    durability: TRarity
): { InventoryChanges: IInventoryChanges } => {
    const ItemType = boosterStoreName.replace("StoreItem", "");
    if (!boosterCollection.find(x => x == ItemType)) {
        logger.error(`unknown booster type: ${ItemType}`);
        return { InventoryChanges: {} };
    }

    const ExpiryDate = boosterDuration[durability];

    addBooster(ItemType, ExpiryDate, inventory);

    return {
        InventoryChanges: {
            Boosters: [{ ItemType, ExpiryDate }]
        }
    };
};
