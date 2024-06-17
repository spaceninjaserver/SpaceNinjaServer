import { parseSlotPurchaseName } from "@/src/helpers/purchaseHelpers";
import { getSubstringFromKeyword } from "@/src/helpers/stringHelpers";
import { addItem, addBooster, updateCurrency, updateSlots } from "@/src/services/inventoryService";
import { IPurchaseRequest, SlotPurchase } from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";
import { ExportBundles, TRarity } from "warframe-public-export-plus";

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

    return purchaseResponse;
};

const handleStoreItemAcquisition = async (
    storeItemName: string,
    accountId: string,
    quantity: number,
    durability: TRarity
): Promise<{ InventoryChanges: object }> => {
    let purchaseResponse = {
        InventoryChanges: {}
    };
    logger.debug(`handling acquision of ${storeItemName}`);
    if (storeItemName in ExportBundles) {
        const bundle = ExportBundles[storeItemName];
        logger.debug("acquiring bundle", bundle);
        for (const component of bundle.components) {
            purchaseResponse = {
                ...purchaseResponse,
                ...(await handleStoreItemAcquisition(
                    component.typeName,
                    accountId,
                    component.purchaseQuantity,
                    component.durability
                ))
            };
        }
    } else {
        const storeCategory = getStoreItemCategory(storeItemName);
        const internalName = storeItemName.replace("/StoreItems", "");
        logger.debug(`store category ${storeCategory}`);
        switch (storeCategory) {
            default:
                purchaseResponse = await addItem(accountId, internalName);
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
const handleSlotPurchase = async (slotPurchaseNameFull: string, accountId: string) => {
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
const handleTypesPurchase = async (typesName: string, accountId: string, quantity: number) => {
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

const handleBoostersPurchase = async (boosterStoreName: string, accountId: string, durability: TRarity) => {
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
