import { Inventory, TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import postTutorialInventory from "@/static/fixed_responses/postTutorialInventory.json";
import { config } from "@/src/services/configService";
import { Types } from "mongoose";
import { SlotNames, IInventoryChanges, IBinChanges, ICurrencyChanges } from "@/src/types/purchaseTypes";
import {
    IChallengeProgress,
    IConsumable,
    IFlavourItem,
    IMiscItem,
    IMission,
    IRawUpgrade,
    ISeasonChallenge,
    ITypeCount,
    InventorySlot,
    IWeaponSkinClient,
    TEquipmentKey,
    equipmentKeys,
    IFusionTreasure
} from "@/src/types/inventoryTypes/inventoryTypes";
import { IGenericUpdate } from "../types/genericUpdate";
import {
    IArtifactsRequest,
    IMissionInventoryUpdateRequest,
    IThemeUpdateRequest,
    IUpdateChallengeProgressRequest
} from "../types/requestTypes";
import { logger } from "@/src/utils/logger";
import { getWeaponType, getExalted } from "@/src/services/itemDataService";
import { IEquipmentClient, IItemConfig } from "../types/inventoryTypes/commonInventoryTypes";
import {
    ExportArcanes,
    ExportCustoms,
    ExportFlavour,
    ExportGear,
    ExportRecipes,
    ExportResources,
    ExportSentinels,
    ExportUpgrades
} from "warframe-public-export-plus";
import { createShip } from "./shipService";

export const createInventory = async (
    accountOwnerId: Types.ObjectId,
    defaultItemReferences: { loadOutPresetId: Types.ObjectId; ship: Types.ObjectId }
): Promise<void> => {
    try {
        const inventory = config.skipTutorial
            ? new Inventory({
                  accountOwnerId: accountOwnerId,
                  LoadOutPresets: defaultItemReferences.loadOutPresetId,
                  Ships: [defaultItemReferences.ship],
                  ...postTutorialInventory
              })
            : new Inventory({
                  accountOwnerId: accountOwnerId,
                  LoadOutPresets: defaultItemReferences.loadOutPresetId,
                  Ships: [defaultItemReferences.ship],
                  TrainingDate: 0
              });
        await inventory.save();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error creating inventory" ${error.message}`);
        }
        throw new Error("error creating inventory that is not of instance Error");
    }
};

export const combineInventoryChanges = (InventoryChanges: IInventoryChanges, delta: IInventoryChanges): void => {
    for (const key in delta) {
        if (!(key in InventoryChanges)) {
            InventoryChanges[key] = delta[key];
        } else if (Array.isArray(delta[key])) {
            const left = InventoryChanges[key] as object[];
            const right: object[] = delta[key];
            for (const item of right) {
                left.push(item);
            }
        } else if (typeof delta[key] == "object") {
            console.assert(key.substring(-3) == "Bin");
            console.assert(key != "InfestedFoundry");
            const left = InventoryChanges[key] as IBinChanges;
            const right = delta[key] as IBinChanges;
            left.count += right.count;
            left.platinum += right.platinum;
            left.Slots += right.Slots;
            if (right.Extra) {
                left.Extra ??= 0;
                left.Extra += right.Extra;
            }
        } else {
            logger.warn(`inventory change not merged: ${key}`);
        }
    }
};

export const getInventory = async (accountOwnerId: string): Promise<TInventoryDatabaseDocument> => {
    const inventory = await Inventory.findOne({ accountOwnerId: accountOwnerId });

    if (!inventory) {
        throw new Error(`Didn't find an inventory for ${accountOwnerId}`);
    }

    return inventory;
};

export const addItem = async (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    quantity: number = 1
): Promise<{ InventoryChanges: IInventoryChanges }> => {
    // Strict typing
    if (typeName in ExportRecipes) {
        const recipeChanges = [
            {
                ItemType: typeName,
                ItemCount: quantity
            } satisfies ITypeCount
        ];
        addRecipes(inventory, recipeChanges);
        return {
            InventoryChanges: {
                Recipes: recipeChanges
            }
        };
    }
    if (typeName in ExportResources) {
        if (ExportResources[typeName].productCategory == "Ships") {
            const oid = await createShip(inventory.accountOwnerId, typeName);
            inventory.Ships.push(oid);
            return {
                InventoryChanges: {
                    Ships: [
                        {
                            ItemId: { $oid: oid },
                            ItemType: typeName
                        }
                    ]
                }
            };
        } else if (ExportResources[typeName].productCategory == "CrewShips") {
            const inventoryChanges = addCrewShip(inventory, typeName);
            return { InventoryChanges: inventoryChanges };
        } else {
            const miscItemChanges = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                } satisfies IMiscItem
            ];
            addMiscItems(inventory, miscItemChanges);
            return {
                InventoryChanges: {
                    MiscItems: miscItemChanges
                }
            };
        }
    }
    if (typeName in ExportCustoms) {
        const inventoryChanges = addSkin(inventory, typeName);
        return { InventoryChanges: inventoryChanges };
    }
    if (typeName in ExportFlavour) {
        const inventoryChanges = addCustomization(inventory, typeName);
        return { InventoryChanges: inventoryChanges };
    }
    if (typeName in ExportUpgrades || typeName in ExportArcanes) {
        const changes = [
            {
                ItemType: typeName,
                ItemCount: quantity
            }
        ];
        addMods(inventory, changes);
        return {
            InventoryChanges: {
                RawUpgrades: changes
            }
        };
    }
    if (typeName in ExportGear) {
        const consumablesChanges = [
            {
                ItemType: typeName,
                ItemCount: quantity
            } satisfies IConsumable
        ];
        addConsumables(inventory, consumablesChanges);
        return {
            InventoryChanges: {
                Consumables: consumablesChanges
            }
        };
    }

    // Path-based duck typing
    switch (typeName.substr(1).split("/")[1]) {
        case "Powersuits":
            switch (typeName.substr(1).split("/")[2]) {
                default: {
                    const inventoryChanges = addPowerSuit(inventory, typeName);
                    updateSlots(inventory, InventorySlot.SUITS, 0, 1);
                    return {
                        InventoryChanges: {
                            ...inventoryChanges,
                            SuitBin: {
                                count: 1,
                                platinum: 0,
                                Slots: -1
                            }
                        }
                    };
                }
                case "Archwing": {
                    const inventoryChanges = addSpaceSuit(inventory, typeName);
                    updateSlots(inventory, InventorySlot.SPACESUITS, 0, 1);
                    return {
                        InventoryChanges: {
                            ...inventoryChanges,
                            SpaceSuitBin: {
                                count: 1,
                                platinum: 0,
                                Slots: -1
                            }
                        }
                    };
                }
                case "EntratiMech": {
                    const inventoryChanges = addMechSuit(inventory, typeName);
                    updateSlots(inventory, InventorySlot.MECHSUITS, 0, 1);
                    return {
                        InventoryChanges: {
                            ...inventoryChanges,
                            MechBin: {
                                count: 1,
                                platinum: 0,
                                Slots: -1
                            }
                        }
                    };
                }
            }
            break;
        case "Weapons": {
            const weaponType = getWeaponType(typeName);
            const inventoryChanges = addEquipment(inventory, weaponType, typeName);
            updateSlots(inventory, InventorySlot.WEAPONS, 0, 1);
            return {
                InventoryChanges: {
                    ...inventoryChanges,
                    WeaponBin: { count: 1, platinum: 0, Slots: -1 }
                }
            };
        }
        case "Objects": {
            // /Lotus/Objects/Tenno/Props/TnoLisetTextProjector (Note Beacon)
            const changes = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                } satisfies IMiscItem
            ];
            addShipDecorations(inventory, changes);
            return {
                InventoryChanges: {
                    ShipDecorations: changes
                }
            };
        }
        case "Types":
            switch (typeName.substr(1).split("/")[2]) {
                case "Sentinels": {
                    const inventoryChanges = addSentinel(inventory, typeName);
                    updateSlots(inventory, InventorySlot.SENTINELS, 0, 1);
                    return {
                        InventoryChanges: {
                            ...inventoryChanges,
                            SentinelBin: { count: 1, platinum: 0, Slots: -1 }
                        }
                    };
                }
                case "Items": {
                    switch (typeName.substr(1).split("/")[3]) {
                        case "ShipDecos": {
                            const changes = [
                                {
                                    ItemType: typeName,
                                    ItemCount: quantity
                                } satisfies IMiscItem
                            ];
                            addShipDecorations(inventory, changes);
                            return {
                                InventoryChanges: {
                                    ShipDecorations: changes
                                }
                            };
                        }
                        default: {
                            const miscItemChanges = [
                                {
                                    ItemType: typeName,
                                    ItemCount: quantity
                                } satisfies IMiscItem
                            ];
                            addMiscItems(inventory, miscItemChanges);
                            return {
                                InventoryChanges: {
                                    MiscItems: miscItemChanges
                                }
                            };
                        }
                    }
                }
                case "Game":
                    if (typeName.substr(1).split("/")[3] == "Projections") {
                        // Void Relics, e.g. /Lotus/Types/Game/Projections/T2VoidProjectionGaussPrimeDBronze
                        const miscItemChanges = [
                            {
                                ItemType: typeName,
                                ItemCount: quantity
                            } satisfies IMiscItem
                        ];
                        addMiscItems(inventory, miscItemChanges);
                        return {
                            InventoryChanges: {
                                MiscItems: miscItemChanges
                            }
                        };
                    }
                    break;
            }
            break;
    }
    const errorMessage = `unable to add item: ${typeName}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
};

//TODO: maybe genericMethod for all the add methods, they share a lot of logic
export const addSentinel = (
    inventory: TInventoryDatabaseDocument,
    sentinelName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (ExportSentinels[sentinelName]?.defaultWeapon) {
        addSentinelWeapon(inventory, ExportSentinels[sentinelName].defaultWeapon, inventoryChanges);
    }

    const modsToGive: IRawUpgrade[] = [];
    const configs: IItemConfig[] = [];
    if (ExportSentinels[sentinelName]?.defaultUpgrades) {
        const upgrades = [];
        for (const defaultUpgrade of ExportSentinels[sentinelName].defaultUpgrades) {
            modsToGive.push({ ItemType: defaultUpgrade.ItemType, ItemCount: 1 });
            if (defaultUpgrade.Slot != -1) {
                upgrades[defaultUpgrade.Slot] = defaultUpgrade.ItemType;
            }
        }
        if (upgrades.length != 0) {
            configs.push({ Upgrades: upgrades });
        }
    }

    addMods(inventory, modsToGive);
    const sentinelIndex = inventory.Sentinels.push({ ItemType: sentinelName, Configs: configs, XP: 0 }) - 1;
    inventoryChanges.Sentinels ??= [];
    (inventoryChanges.Sentinels as IEquipmentClient[]).push(
        inventory.Sentinels[sentinelIndex].toJSON<IEquipmentClient>()
    );

    return inventoryChanges;
};

export const addSentinelWeapon = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges
): void => {
    const index = inventory.SentinelWeapons.push({ ItemType: typeName }) - 1;
    inventoryChanges.SentinelWeapons ??= [];
    (inventoryChanges.SentinelWeapons as IEquipmentClient[]).push(
        inventory.SentinelWeapons[index].toJSON<IEquipmentClient>()
    );
};

export const addPowerSuit = (
    inventory: TInventoryDatabaseDocument,
    powersuitName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const specialItems = getExalted(powersuitName);
    if (specialItems) {
        for (const specialItem of specialItems) {
            addSpecialItem(inventory, specialItem, inventoryChanges);
        }
    }
    const suitIndex = inventory.Suits.push({ ItemType: powersuitName, Configs: [], UpgradeVer: 101, XP: 0 }) - 1;
    inventoryChanges.Suits ??= [];
    (inventoryChanges.Suits as IEquipmentClient[]).push(inventory.Suits[suitIndex].toJSON<IEquipmentClient>());
    return inventoryChanges;
};

export const addMechSuit = (
    inventory: TInventoryDatabaseDocument,
    mechsuitName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const specialItems = getExalted(mechsuitName);
    if (specialItems) {
        for (const specialItem of specialItems) {
            addSpecialItem(inventory, specialItem, inventoryChanges);
        }
    }
    const suitIndex = inventory.MechSuits.push({ ItemType: mechsuitName, Configs: [], UpgradeVer: 101, XP: 0 }) - 1;
    inventoryChanges.MechSuits ??= [];
    (inventoryChanges.MechSuits as IEquipmentClient[]).push(inventory.MechSuits[suitIndex].toJSON<IEquipmentClient>());
    return inventoryChanges;
};

export const addSpecialItem = (
    inventory: TInventoryDatabaseDocument,
    itemName: string,
    inventoryChanges: IInventoryChanges
): void => {
    if (inventory.SpecialItems.find(x => x.ItemType == itemName)) {
        return;
    }
    const specialItemIndex =
        inventory.SpecialItems.push({
            ItemType: itemName,
            Configs: [],
            Features: 1,
            UpgradeVer: 101,
            XP: 0
        }) - 1;
    inventoryChanges.SpecialItems ??= [];
    (inventoryChanges.SpecialItems as IEquipmentClient[]).push(
        inventory.SpecialItems[specialItemIndex].toJSON<IEquipmentClient>()
    );
};

export const addSpaceSuit = (
    inventory: TInventoryDatabaseDocument,
    spacesuitName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const suitIndex = inventory.SpaceSuits.push({ ItemType: spacesuitName, Configs: [], UpgradeVer: 101, XP: 0 }) - 1;
    inventoryChanges.SpaceSuits ??= [];
    (inventoryChanges.SpaceSuits as IEquipmentClient[]).push(
        inventory.SpaceSuits[suitIndex].toJSON<IEquipmentClient>()
    );
    return inventoryChanges;
};

export const updateSlots = (
    inventory: TInventoryDatabaseDocument,
    slotName: SlotNames,
    slotAmount: number,
    extraAmount: number
): void => {
    inventory[slotName].Slots += slotAmount;
    if (inventory[slotName].Extra === undefined) {
        inventory[slotName].Extra = extraAmount;
    } else {
        inventory[slotName].Extra += extraAmount;
    }
};

const isCurrencyTracked = (usePremium: boolean): boolean => {
    return usePremium ? !config.infinitePlatinum : !config.infiniteCredits;
};

export const updateCurrency = (
    inventory: TInventoryDatabaseDocument,
    price: number,
    usePremium: boolean
): ICurrencyChanges => {
    const currencyChanges: ICurrencyChanges = {};
    if (price != 0 && isCurrencyTracked(usePremium)) {
        if (usePremium) {
            if (inventory.PremiumCreditsFree > 0) {
                currencyChanges.PremiumCreditsFree = Math.min(price, inventory.PremiumCreditsFree) * -1;
                inventory.PremiumCreditsFree += currencyChanges.PremiumCreditsFree;
            }
            currencyChanges.PremiumCredits = -price;
            inventory.PremiumCredits += currencyChanges.PremiumCredits;
        } else {
            currencyChanges.RegularCredits = -price;
            inventory.RegularCredits += currencyChanges.RegularCredits;
        }
        logger.debug(`currency changes `, currencyChanges);
    }
    return currencyChanges;
};

export const updateCurrencyByAccountId = async (
    price: number,
    usePremium: boolean,
    accountId: string
): Promise<ICurrencyChanges> => {
    if (!isCurrencyTracked(usePremium)) {
        return {};
    }
    const inventory = await getInventory(accountId);
    const currencyChanges = updateCurrency(inventory, price, usePremium);
    await inventory.save();
    return currencyChanges;
};

// TODO: AffiliationMods support (Nightwave).
export const updateGeneric = async (data: IGenericUpdate, accountId: string): Promise<void> => {
    const inventory = await getInventory(accountId);

    // Make it an array for easier parsing.
    if (typeof data.NodeIntrosCompleted === "string") {
        data.NodeIntrosCompleted = [data.NodeIntrosCompleted];
    }

    // Combine the two arrays into one.
    data.NodeIntrosCompleted = inventory.NodeIntrosCompleted.concat(data.NodeIntrosCompleted);

    // Remove duplicate entries.
    const nodes = [...new Set(data.NodeIntrosCompleted)];

    inventory.NodeIntrosCompleted = nodes;
    await inventory.save();
};

export const updateTheme = async (data: IThemeUpdateRequest, accountId: string): Promise<void> => {
    const inventory = await getInventory(accountId);
    if (data.Style) inventory.ThemeStyle = data.Style;
    if (data.Background) inventory.ThemeBackground = data.Background;
    if (data.Sounds) inventory.ThemeSounds = data.Sounds;

    await inventory.save();
};

export const addEquipment = (
    inventory: TInventoryDatabaseDocument,
    category: TEquipmentKey,
    type: string,
    modularParts: string[] | undefined = undefined,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const index =
        inventory[category].push({
            ItemType: type,
            Configs: [],
            XP: 0,
            ModularParts: modularParts
        }) - 1;

    inventoryChanges[category] ??= [];
    (inventoryChanges[category] as IEquipmentClient[]).push(inventory[category][index].toJSON<IEquipmentClient>());
    return inventoryChanges;
};

export const addCustomization = (
    inventory: TInventoryDatabaseDocument,
    customizationName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const flavourItemIndex = inventory.FlavourItems.push({ ItemType: customizationName }) - 1;
    inventoryChanges.FlavourItems ??= [];
    (inventoryChanges.FlavourItems as IFlavourItem[]).push(
        inventory.FlavourItems[flavourItemIndex].toJSON<IFlavourItem>()
    );
    return inventoryChanges;
};

export const addSkin = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const index = inventory.WeaponSkins.push({ ItemType: typeName }) - 1;
    inventoryChanges.WeaponSkins ??= [];
    (inventoryChanges.WeaponSkins as IWeaponSkinClient[]).push(
        inventory.WeaponSkins[index].toJSON<IWeaponSkinClient>()
    );
    return inventoryChanges;
};

const addCrewShip = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const index = inventory.CrewShips.push({ ItemType: typeName }) - 1;
    inventoryChanges.CrewShips ??= [];
    (inventoryChanges.CrewShips as object[]).push(inventory.CrewShips[index].toJSON());
    return inventoryChanges;
};

const addGearExpByCategory = (
    inventory: TInventoryDatabaseDocument,
    gearArray: IEquipmentClient[] | undefined,
    categoryName: TEquipmentKey
): void => {
    const category = inventory[categoryName];

    gearArray?.forEach(({ ItemId, XP }) => {
        if (!XP) {
            return;
        }

        const itemIndex = ItemId ? category.findIndex(item => item._id?.equals(ItemId.$oid)) : -1;
        if (itemIndex !== -1) {
            const item = category[itemIndex];
            item.XP ??= 0;
            item.XP += XP;
            inventory.markModified(`${categoryName}.${itemIndex}.XP`);

            const xpinfoIndex = inventory.XPInfo.findIndex(x => x.ItemType == item.ItemType);
            if (xpinfoIndex !== -1) {
                const xpinfo = inventory.XPInfo[xpinfoIndex];
                xpinfo.XP += XP;
            } else {
                inventory.XPInfo.push({
                    ItemType: item.ItemType,
                    XP: XP
                });
            }
        }
    });
};

export const addMiscItems = (inventory: TInventoryDatabaseDocument, itemsArray: IMiscItem[] | undefined): void => {
    const { MiscItems } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = MiscItems.findIndex(miscItem => miscItem.ItemType === ItemType);

        if (itemIndex !== -1) {
            MiscItems[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`MiscItems.${itemIndex}.ItemCount`);
        } else {
            MiscItems.push({ ItemCount, ItemType });
        }
    });
};

export const addShipDecorations = (
    inventory: TInventoryDatabaseDocument,
    itemsArray: IConsumable[] | undefined
): void => {
    const { ShipDecorations } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = ShipDecorations.findIndex(miscItem => miscItem.ItemType === ItemType);

        if (itemIndex !== -1) {
            ShipDecorations[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`ShipDecorations.${itemIndex}.ItemCount`);
        } else {
            ShipDecorations.push({ ItemCount, ItemType });
        }
    });
};

export const addConsumables = (inventory: TInventoryDatabaseDocument, itemsArray: IConsumable[] | undefined): void => {
    const { Consumables } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = Consumables.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            Consumables[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`Consumables.${itemIndex}.ItemCount`);
        } else {
            Consumables.push({ ItemCount, ItemType });
        }
    });
};

export const addRecipes = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[] | undefined): void => {
    const { Recipes } = inventory;

    itemsArray?.forEach(({ ItemCount, ItemType }) => {
        const itemIndex = Recipes.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            Recipes[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`Recipes.${itemIndex}.ItemCount`);
        } else {
            Recipes.push({ ItemCount, ItemType });
        }
    });
};

export const addMods = (inventory: TInventoryDatabaseDocument, itemsArray: IRawUpgrade[] | undefined): void => {
    const { RawUpgrades } = inventory;
    itemsArray?.forEach(({ ItemType, ItemCount }) => {
        const itemIndex = RawUpgrades.findIndex(i => i.ItemType === ItemType);

        if (itemIndex !== -1) {
            RawUpgrades[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`RawUpgrades.${itemIndex}.ItemCount`);
        } else {
            RawUpgrades.push({ ItemCount, ItemType });
        }
    });
};

export const addFusionTreasures = (
    inventory: TInventoryDatabaseDocument,
    itemsArray: IFusionTreasure[] | undefined
): void => {
    const { FusionTreasures } = inventory;
    itemsArray?.forEach(({ ItemType, ItemCount, Sockets }) => {
        const itemIndex = FusionTreasures.findIndex(i => i.ItemType == ItemType && (i.Sockets || 0) == (Sockets || 0));

        if (itemIndex !== -1) {
            FusionTreasures[itemIndex].ItemCount += ItemCount;
            inventory.markModified(`FusionTreasures.${itemIndex}.ItemCount`);
        } else {
            FusionTreasures.push({ ItemCount, ItemType, Sockets });
        }
    });
};

export const updateChallengeProgress = async (
    challenges: IUpdateChallengeProgressRequest,
    accountId: string
): Promise<void> => {
    const inventory = await getInventory(accountId);

    addChallenges(inventory, challenges.ChallengeProgress);
    addSeasonalChallengeHistory(inventory, challenges.SeasonChallengeHistory);

    await inventory.save();
};

export const addSeasonalChallengeHistory = (
    inventory: TInventoryDatabaseDocument,
    itemsArray: ISeasonChallenge[] | undefined
): void => {
    const category = inventory.SeasonChallengeHistory;

    itemsArray?.forEach(({ challenge, id }) => {
        const itemIndex = category.findIndex(i => i.challenge === challenge);

        if (itemIndex !== -1) {
            category[itemIndex].id = id;
        } else {
            category.push({ challenge, id });
        }
    });
};

export const addChallenges = (
    inventory: TInventoryDatabaseDocument,
    itemsArray: IChallengeProgress[] | undefined
): void => {
    const category = inventory.ChallengeProgress;

    itemsArray?.forEach(({ Name, Progress }) => {
        const itemIndex = category.findIndex(i => i.Name === Name);

        if (itemIndex !== -1) {
            category[itemIndex].Progress += Progress;
            inventory.markModified(`ChallengeProgress.${itemIndex}.ItemCount`);
        } else {
            category.push({ Name, Progress });
        }
    });
};

const addMissionComplete = (inventory: TInventoryDatabaseDocument, { Tag, Completes }: IMission): void => {
    const { Missions } = inventory;
    const itemIndex = Missions.findIndex(item => item.Tag === Tag);

    if (itemIndex !== -1) {
        Missions[itemIndex].Completes += Completes;
        inventory.markModified(`Missions.${itemIndex}.Completes`);
    } else {
        Missions.push({ Tag, Completes });
    }
};

export const missionInventoryUpdate = async (data: IMissionInventoryUpdateRequest, accountId: string) => {
    const {
        RawUpgrades,
        MiscItems,
        RegularCredits,
        ChallengeProgress,
        FusionPoints,
        Consumables,
        Recipes,
        Missions,
        FusionTreasures
    } = data;
    const inventory = await getInventory(accountId);

    // credits
    inventory.RegularCredits += RegularCredits || 0;

    // endo
    inventory.FusionPoints += FusionPoints || 0;

    // syndicate
    data.AffiliationChanges?.forEach(affiliation => {
        const syndicate = inventory.Affiliations.find(x => x.Tag == affiliation.Tag);
        if (syndicate !== undefined) {
            syndicate.Standing =
                syndicate.Standing === undefined ? affiliation.Standing : syndicate.Standing + affiliation.Standing;
            syndicate.Title = syndicate.Title === undefined ? affiliation.Title : syndicate.Title + affiliation.Title;
        } else {
            inventory.Affiliations.push({
                Standing: affiliation.Standing,
                Title: affiliation.Title,
                Tag: affiliation.Tag,
                FreeFavorsEarned: [],
                FreeFavorsUsed: []
            });
        }
    });

    // Gear XP
    equipmentKeys.forEach(key => addGearExpByCategory(inventory, data[key], key));

    // Incarnon Challenges
    if (data.EvolutionProgress) {
        for (const evoProgress of data.EvolutionProgress) {
            const entry = inventory.EvolutionProgress
                ? inventory.EvolutionProgress.find(entry => entry.ItemType == evoProgress.ItemType)
                : undefined;
            if (entry) {
                entry.Progress = evoProgress.Progress;
                entry.Rank = evoProgress.Rank;
            } else {
                inventory.EvolutionProgress ??= [];
                inventory.EvolutionProgress.push(evoProgress);
            }
        }
    }

    // LastRegionPlayed
    if (data.LastRegionPlayed) {
        inventory.LastRegionPlayed = data.LastRegionPlayed;
    }

    // other
    addMods(inventory, RawUpgrades);
    addMiscItems(inventory, MiscItems);
    addConsumables(inventory, Consumables);
    addRecipes(inventory, Recipes);
    addChallenges(inventory, ChallengeProgress);
    addFusionTreasures(inventory, FusionTreasures);
    if (Missions) {
        addMissionComplete(inventory, Missions);
    }

    const changedInventory = await inventory.save();
    return changedInventory.toJSON();
};

export const addBooster = async (ItemType: string, time: number, accountId: string): Promise<void> => {
    const currentTime = Math.floor(Date.now() / 1000) - 129600; // Value is wrong without 129600. Figure out why, please. :)

    const inventory = await getInventory(accountId);
    const { Boosters } = inventory;

    const itemIndex = Boosters.findIndex(booster => booster.ItemType === ItemType);

    if (itemIndex !== -1) {
        const existingBooster = Boosters[itemIndex];
        existingBooster.ExpiryDate = Math.max(existingBooster.ExpiryDate, currentTime) + time;
        inventory.markModified(`Boosters.${itemIndex}.ExpiryDate`);
    } else {
        Boosters.push({ ItemType, ExpiryDate: currentTime + time });
    }

    await inventory.save();
};

export const upgradeMod = async (artifactsData: IArtifactsRequest, accountId: string): Promise<string | undefined> => {
    const { Upgrade, LevelDiff, Cost, FusionPointCost } = artifactsData;
    try {
        const inventory = await getInventory(accountId);
        const { Upgrades, RawUpgrades } = inventory;
        const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

        const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint) as { lvl: number };
        parsedUpgradeFingerprint.lvl += LevelDiff;
        const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

        let itemIndex = Upgrades.findIndex(upgrade => upgrade._id?.equals(ItemId!.$oid));

        if (itemIndex !== -1) {
            Upgrades[itemIndex].UpgradeFingerprint = stringifiedUpgradeFingerprint;
            inventory.markModified(`Upgrades.${itemIndex}.UpgradeFingerprint`);
        } else {
            itemIndex =
                Upgrades.push({
                    UpgradeFingerprint: stringifiedUpgradeFingerprint,
                    ItemType
                }) - 1;

            const rawItemIndex = RawUpgrades.findIndex(rawUpgrade => rawUpgrade.ItemType === ItemType);
            RawUpgrades[rawItemIndex].ItemCount--;
            if (RawUpgrades[rawItemIndex].ItemCount > 0) {
                inventory.markModified(`RawUpgrades.${rawItemIndex}.UpgradeFingerprint`);
            } else {
                RawUpgrades.splice(rawItemIndex, 1);
            }
        }

        if (!config.infiniteCredits) {
            inventory.RegularCredits -= Cost;
        }
        if (!config.infiniteEndo) {
            inventory.FusionPoints -= FusionPointCost;
        }

        const changedInventory = await inventory.save();
        const itemId = changedInventory.toJSON().Upgrades[itemIndex]?.ItemId?.$oid;

        if (!itemId) {
            throw new Error("Item Id not found in upgradeMod");
        }

        return itemId;
    } catch (error) {
        console.error("Error in upgradeMod:", error);
        throw error;
    }
};
