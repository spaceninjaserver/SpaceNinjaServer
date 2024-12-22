import { parseSlotPurchaseName } from "@/src/helpers/purchaseHelpers";
import { getSubstringFromKeyword } from "@/src/helpers/stringHelpers";
import {
    addBooster,
    addItem,
    addMiscItems,
    combineInventoryChanges,
    getInventory,
    updateCurrency,
    updateSlots
} from "@/src/services/inventoryService";
import { getVendorManifestByOid } from "@/src/services/serversideVendorsService";
import { IMiscItem } from "@/src/types/inventoryTypes/inventoryTypes";
import { IPurchaseRequest, IPurchaseResponse, SlotPurchase, IInventoryChanges } from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";
import worldState from "@/static/fixed_responses/worldState.json";
import { ExportBundles, ExportGear, ExportSyndicates, ExportVendors, TRarity } from "warframe-public-export-plus";

export const getStoreItemCategory = (storeItem: string) => {
    const storeItemString = getSubstringFromKeyword(storeItem, "StoreItems/");
    const storeItemElements = storeItemString.split("/");
    return storeItemElements[1];
};

export const getStoreItemTypesCategory = (typesItem: string) => {
    const typesString = getSubstringFromKeyword(typesItem, "Types");
    const typeElements = typesString.split("/");
    if (typesItem.includes("StoreItems")) {
        return typeElements[2];
    }
    return typeElements[1];
};

export const handlePurchase = async (purchaseRequest: IPurchaseRequest, accountId: string) => {
    logger.debug("purchase request", purchaseRequest);

    if (purchaseRequest.PurchaseParams.Source == 7) {
        const manifest = getVendorManifestByOid(purchaseRequest.PurchaseParams.SourceId!);
        if (manifest) {
            const offer = manifest.VendorInfo.ItemManifest.find(
                x => x.StoreItem == purchaseRequest.PurchaseParams.StoreItem
            );
            if (offer) {
                purchaseRequest.PurchaseParams.Quantity *= offer.QuantityMultiplier;
            }
        }
    }

    const purchaseResponse = await handleStoreItemAcquisition(
        purchaseRequest.PurchaseParams.StoreItem,
        accountId,
        purchaseRequest.PurchaseParams.Quantity,
        "COMMON"
    );

    if (!purchaseResponse) throw new Error("purchase response was undefined");

    const currencyChanges = await updateCurrency(
        purchaseRequest.PurchaseParams.ExpectedPrice,
        purchaseRequest.PurchaseParams.UsePremium,
        accountId
    );
    purchaseResponse.InventoryChanges = {
        ...currencyChanges,
        ...purchaseResponse.InventoryChanges
    };

    switch (purchaseRequest.PurchaseParams.Source) {
        case 2:
            if (!purchaseRequest.PurchaseParams.UseFreeFavor!) {
                const syndicateTag = purchaseRequest.PurchaseParams.SyndicateTag!;
                const syndicate = ExportSyndicates[syndicateTag];
                if (syndicate) {
                    const favour = syndicate.favours.find(x => x.storeItem == purchaseRequest.PurchaseParams.StoreItem);
                    if (favour) {
                        const inventory = await getInventory(accountId);
                        const affiliation = inventory.Affiliations.find(x => x.Tag == syndicateTag);
                        if (affiliation) {
                            purchaseResponse.Standing = [
                                {
                                    Tag: syndicateTag,
                                    Standing: favour.standingCost
                                }
                            ];
                            affiliation.Standing -= favour.standingCost;
                            await inventory.save();
                        }
                    }
                }
            }
            break;
        case 7:
            if (purchaseRequest.PurchaseParams.SourceId! in ExportVendors) {
                const vendor = ExportVendors[purchaseRequest.PurchaseParams.SourceId!];
                const offer = vendor.items.find(x => x.storeItem == purchaseRequest.PurchaseParams.StoreItem);
                if (offer) {
                    const inventory = await getInventory(accountId);
                    for (const item of offer.itemPrices) {
                        const invItem: IMiscItem = {
                            ItemType: item.ItemType,
                            ItemCount: item.ItemCount * purchaseRequest.PurchaseParams.Quantity * -1
                        };

                        addMiscItems(inventory, [invItem]);

                        purchaseResponse.InventoryChanges.MiscItems ??= [];
                        const change = (purchaseResponse.InventoryChanges.MiscItems as IMiscItem[]).find(
                            x => x.ItemType == item.ItemType
                        );
                        if (change) {
                            change.ItemCount += invItem.ItemCount;
                        } else {
                            (purchaseResponse.InventoryChanges.MiscItems as IMiscItem[]).push(invItem);
                        }
                    }

                    await inventory.save();
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
                const inventory = await getInventory(accountId);
                if (offer.RegularPrice) {
                    const invItem: IMiscItem = {
                        ItemType: "/Lotus/Types/Items/MiscItems/SchismKey",
                        ItemCount: offer.RegularPrice * purchaseRequest.PurchaseParams.Quantity * -1
                    };

                    addMiscItems(inventory, [invItem]);

                    purchaseResponse.InventoryChanges.MiscItems ??= [];
                    (purchaseResponse.InventoryChanges.MiscItems as IMiscItem[]).push(invItem);
                } else {
                    inventory.PrimeTokens -= offer.PrimePrice! * purchaseRequest.PurchaseParams.Quantity;
                }
                await inventory.save();
            }
            break;
        }
    }

    return purchaseResponse;
};

const handleStoreItemAcquisition = async (
    storeItemName: string,
    accountId: string,
    quantity: number,
    durability: TRarity,
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
                        accountId,
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
            }
        }
        switch (storeCategory) {
            default:
                purchaseResponse = await addItem(accountId, internalName, quantity);
                break;
            case "Types":
                purchaseResponse = await handleTypesPurchase(internalName, accountId, quantity);
                break;
            case "Boosters":
                purchaseResponse = await handleBoostersPurchase(internalName, accountId, durability);
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
const handleSlotPurchase = async (
    slotPurchaseNameFull: string,
    accountId: string
): Promise<{ InventoryChanges: IInventoryChanges }> => {
    logger.debug(`slot name ${slotPurchaseNameFull}`);
    const slotPurchaseName = parseSlotPurchaseName(
        slotPurchaseNameFull.substring(slotPurchaseNameFull.lastIndexOf("/") + 1)
    );
    logger.debug(`slot purchase name ${slotPurchaseName}`);

    const slotName = slotPurchaseNameToSlotName[slotPurchaseName].name;
    const slotsPerPurchase = slotPurchaseNameToSlotName[slotPurchaseName].slotsPerPurchase;

    await updateSlots(accountId, slotName, slotsPerPurchase, slotsPerPurchase);

    logger.debug(`added ${slotsPerPurchase} slot ${slotName}`);

    return {
        InventoryChanges: {
            [slotName]: {
                count: 0,
                platinum: 1,
                Slots: slotsPerPurchase,
                Extra: slotsPerPurchase
            }
        }
    };
};

//TODO: change to getInventory, apply changes then save at the end
const handleTypesPurchase = async (
    typesName: string,
    accountId: string,
    quantity: number
): Promise<{ InventoryChanges: IInventoryChanges }> => {
    const typeCategory = getStoreItemTypesCategory(typesName);
    logger.debug(`type category ${typeCategory}`);
    switch (typeCategory) {
        default:
            return await addItem(accountId, typesName, quantity);
        case "SlotItems":
            return await handleSlotPurchase(typesName, accountId);
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

const handleBoostersPurchase = async (
    boosterStoreName: string,
    accountId: string,
    durability: TRarity
): Promise<{ InventoryChanges: IInventoryChanges }> => {
    const ItemType = boosterStoreName.replace("StoreItem", "");
    if (!boosterCollection.find(x => x == ItemType)) {
        logger.error(`unknown booster type: ${ItemType}`);
        return { InventoryChanges: {} };
    }

    const ExpiryDate = boosterDuration[durability];

    await addBooster(ItemType, ExpiryDate, accountId);

    return {
        InventoryChanges: {
            Boosters: [{ ItemType, ExpiryDate }]
        }
    };
};
