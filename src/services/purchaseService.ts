import { parseSlotPurchaseName } from "@/src/helpers/purchaseHelpers";
import { getWeaponType } from "@/src/services/itemDataService";
import { getSubstringFromKeyword } from "@/src/helpers/stringHelpers";
import {
    addBooster,
    addConsumables,
    addCustomization,
    addMechSuit,
    addMiscItems,
    addPowerSuit,
    addRecipes,
    addSentinel,
    addWeapon,
    getInventory,
    updateCurrency,
    updateSlots
} from "@/src/services/inventoryService";
import { IConsumable, IMiscItem, ITypeCount } from "@/src/types/inventoryTypes/inventoryTypes";
import { IPurchaseRequest, IPurchaseResponse, SlotNameToInventoryName, SlotPurchase } from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";

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
    const storeCategory = getStoreItemCategory(purchaseRequest.PurchaseParams.StoreItem);
    const internalName = purchaseRequest.PurchaseParams.StoreItem.replace("/StoreItems", "");
    logger.debug(`store category ${storeCategory}`);

    let inventoryChanges;
    switch (storeCategory) {
        case "Powersuits":
            inventoryChanges = await handlePowersuitPurchase(internalName, accountId);
            break;
        case "Weapons":
            inventoryChanges = await handleWeaponsPurchase(internalName, accountId);
            break;
        case "Types":
            inventoryChanges = await handleTypesPurchase(
                internalName,
                accountId,
                purchaseRequest.PurchaseParams.Quantity
            );
            break;
        case "Boosters":
            inventoryChanges = await handleBoostersPurchase(internalName, accountId);
            break;
        case "Interface":
            inventoryChanges = await handleCustomizationPurchase(internalName, accountId);
            break;
        default:
            const errorMessage = `unknown store category: ${storeCategory} not implemented or new`;
            logger.error(errorMessage);
            throw new Error(errorMessage);
    }

    if (!inventoryChanges) throw new Error("purchase response was undefined");

    const currencyChanges = await updateCurrency(
        purchaseRequest.PurchaseParams.ExpectedPrice,
        purchaseRequest.PurchaseParams.UsePremium,
        accountId
    );

    inventoryChanges.InventoryChanges = {
        ...currencyChanges,
        ...inventoryChanges.InventoryChanges
    };

    return inventoryChanges;
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

const handleWeaponsPurchase = async (weaponName: string, accountId: string) => {
    const weaponType = getWeaponType(weaponName);
    const addedWeapon = await addWeapon(weaponType, weaponName, accountId);

    await updateSlots(accountId, SlotNameToInventoryName.WEAPON, 0, 1);

    return {
        InventoryChanges: {
            WeaponBin: { count: 1, platinum: 0, Slots: -1 },
            [weaponType]: [addedWeapon]
        }
    } as IPurchaseResponse;
};

const handlePowersuitPurchase = async (powersuitName: string, accountId: string) => {
    if (powersuitName.includes("EntratiMech")) {
        const mechSuit = await addMechSuit(powersuitName, accountId);

        await updateSlots(accountId, SlotNameToInventoryName.MECHSUIT, 0, 1);
        logger.debug("mech suit", mechSuit);

        return {
            InventoryChanges: {
                MechBin: {
                    count: 1,
                    platinum: 0,
                    Slots: -1
                },
                MechSuits: [mechSuit]
            }
        } as IPurchaseResponse;
    }

    const suit = await addPowerSuit(powersuitName, accountId);
    await updateSlots(accountId, SlotNameToInventoryName.SUIT, 0, 1);

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

//TODO: change to getInventory, apply changes then save at the end
const handleTypesPurchase = async (typesName: string, accountId: string, quantity: number) => {
    const typeCategory = getStoreItemTypesCategory(typesName);
    logger.debug(`type category ${typeCategory}`);
    switch (typeCategory) {
        case "AvatarImages":
        case "SuitCustomizations":
            return await handleCustomizationPurchase(typesName, accountId);
        case "Sentinels":
            return await handleSentinelPurchase(typesName, accountId);
        case "SlotItems":
            return await handleSlotPurchase(typesName, accountId);
        case "Items":
            return await handleMiscItemPurchase(typesName, accountId, quantity);
        case "Recipes":
        case "Consumables": // Blueprints for Ciphers, Antitoxins
            return await handleRecipesPurchase(typesName, accountId, quantity);
        case "Restoratives": // Codex Scanner, Remote Observer, Starburst
            return await handleRestorativesPurchase(typesName, accountId, quantity);
            break;
        default:
            throw new Error(`unknown Types category: ${typeCategory} not implemented or new`);
    }
};

const handleSentinelPurchase = async (sentinelName: string, accountId: string) => {
    const sentinel = await addSentinel(sentinelName, accountId);

    await updateSlots(accountId, SlotNameToInventoryName.SENTINEL, 0, 1);

    return {
        InventoryChanges: {
            SentinelBin: { count: 1, platinum: 0, Slots: -1 },
            Sentinels: [sentinel]
        }
    };
};

const handleCustomizationPurchase = async (customizationName: string, accountId: string) => {
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

const handleMiscItemPurchase = async (uniqueName: string, accountId: string, quantity: number) => {
    const inventory = await getInventory(accountId);
    const miscItemChanges = [
        {
            ItemType: uniqueName,
            ItemCount: quantity
        } satisfies IMiscItem
    ];
    addMiscItems(inventory, miscItemChanges);
    await inventory.save();
    return {
        InventoryChanges: {
            MiscItems: miscItemChanges
        }
    };
};

const handleRecipesPurchase = async (uniqueName: string, accountId: string, quantity: number) => {
    const inventory = await getInventory(accountId);
    const recipeChanges = [
        {
            ItemType: uniqueName,
            ItemCount: quantity
        } satisfies ITypeCount
    ];
    addRecipes(inventory, recipeChanges);
    await inventory.save();
    return {
        InventoryChanges: {
            Recipes: recipeChanges
        }
    };
};

const handleRestorativesPurchase = async (uniqueName: string, accountId: string, quantity: number) => {
    const inventory = await getInventory(accountId);
    const consumablesChanges = [
        {
            ItemType: uniqueName,
            ItemCount: quantity
        } satisfies IConsumable
    ];
    addConsumables(inventory, consumablesChanges);
    await inventory.save();
    return {
        InventoryChanges: {
            Consumables: consumablesChanges
        }
    };
};
