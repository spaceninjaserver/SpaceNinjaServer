import { getWeaponType } from "@/src/helpers/purchaseHelpers";
import { getSubstringFromKeyword } from "@/src/helpers/stringHelpers";
import { addBooster, addCustomization, addPowerSuit, addWeapon, updateSlots } from "@/src/services/inventoryService";
import { IPurchaseRequest, SlotType } from "@/src/types/purchaseTypes";

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
    console.log(purchaseRequest);
    const storeCategory = getStoreItemCategory(purchaseRequest.PurchaseParams.StoreItem);
    const internalName = purchaseRequest.PurchaseParams.StoreItem.replace("/StoreItems", "");
    console.log("Store category", storeCategory);

    let purchaseResponse;
    switch (storeCategory) {
        case "Powersuits":
            purchaseResponse = await handlePowersuitPurchase(internalName, accountId);
            break;
        case "Weapons":
            purchaseResponse = await handleWeaponsPurchase(internalName, accountId);
            break;
        case "Types":
            purchaseResponse = await handleTypesPurchase(internalName, accountId);
            break;
        case "Boosters":
            purchaseResponse = await handleBoostersPurchase(internalName, accountId);
            break;

        default:
            throw new Error(`unknown store category: ${storeCategory} not implemented or new`);
    }

    // const currencyResponse = await updateCurrency(
    //     purchaseRequest.PurchaseParams.ExpectedPrice,
    //     purchaseRequest.PurchaseParams.UsePremium,
    //     accountId
    // );

    // (purchaseResponse as IPurchaseResponse).InventoryChanges = {
    //     ...purchaseResponse.InventoryChanges,
    //     ...currencyResponse
    // };

    return purchaseResponse;
};

const handleWeaponsPurchase = async (weaponName: string, accountId: string) => {
    const weaponType = getWeaponType(weaponName);
    const addedWeapon = await addWeapon(weaponType, weaponName, accountId);

    await updateSlots(SlotType.WEAPON, accountId, -1);

    return {
        InventoryChanges: {
            WeaponBin: { count: 1, platinum: 0, Slots: -1 },
            [weaponType]: [addedWeapon]
        }
    };
};

const handlePowersuitPurchase = async (powersuitName: string, accountId: string) => {
    const suit = await addPowerSuit(powersuitName, accountId);
    await updateSlots(SlotType.WEAPON, accountId, -1);

    return {
        InventoryChanges: {
            SuitBin: {
                count: 1,
                platinum: 0,
                Slots: -1
            },
            Suits: [suit]
        }
    };
};

const handleTypesPurchase = async (typesName: string, accountId: string) => {
    const typeCategory = getStoreItemTypesCategory(typesName);
    console.log("type category", typeCategory);
    switch (typeCategory) {
        case "SuitCustomizations":
            return await handleSuitCustomizationsPurchase(typesName, accountId);
        // case "Recipes":
        //     break;
        // case "Sentinels":
        //     break;
        default:
            throw new Error(`unknown Types category: ${typeCategory} not implemented or new`);
    }
};

const handleSuitCustomizationsPurchase = async (customizationName: string, accountId: string) => {
    const customization = await addCustomization(customizationName, accountId);

    return {
        InventoryChanges: {
            FlavourItems: [customization]
        }
    };
};

const boosterCollection = [
    "/Lotus/Types/Boosters/ResourceAmountBooster",
    "/Lotus/Types/Boosters/AffinityBooster",
    "/Lotus/Types/Boosters/ResourceDropChanceBooster",
    "/Lotus/Types/Boosters/CreditBooster"
];

const handleBoostersPurchase = async (boosterStoreName: string, accountId: string) => {
    const match = boosterStoreName.match(/(\d+)Day/);
    if (!match) return;

    const extractedDigit = Number(match[1]);
    const ItemType = boosterCollection.find(i =>
        boosterStoreName.includes(i.split("/").pop()!.replace("Booster", ""))
    )!;
    const ExpiryDate = extractedDigit * 86400;

    await addBooster(ItemType, ExpiryDate, accountId);

    return {
        InventoryChanges: {
            Boosters: [{ ItemType, ExpiryDate }]
        }
    };
};
