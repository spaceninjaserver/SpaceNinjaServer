import {
    Inventory,
    InventoryDocumentProps,
    TInventoryDatabaseDocument
} from "@/src/models/inventoryModels/inventoryModel";
import { config } from "@/src/services/configService";
import { HydratedDocument, Types } from "mongoose";
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
    IFusionTreasure,
    IDailyAffiliations,
    IInventoryDatabase
} from "@/src/types/inventoryTypes/inventoryTypes";
import { IGenericUpdate } from "../types/genericUpdate";
import {
    IMissionInventoryUpdateRequest,
    IThemeUpdateRequest,
    IUpdateChallengeProgressRequest
} from "../types/requestTypes";
import { logger } from "@/src/utils/logger";
import { getExalted, getKeyChainItems } from "@/src/services/itemDataService";
import { IEquipmentClient, IItemConfig } from "../types/inventoryTypes/commonInventoryTypes";
import {
    ExportArcanes,
    ExportCustoms,
    ExportFlavour,
    ExportGear,
    ExportRecipes,
    ExportResources,
    ExportSentinels,
    ExportUpgrades,
    ExportWeapons,
    TStandingLimitBin
} from "warframe-public-export-plus";
import { createShip } from "./shipService";
import { creditBundles, fusionBundles } from "@/src/services/missionInventoryUpdateService";
import { IGiveKeyChainTriggeredItemsRequest } from "@/src/controllers/api/giveKeyChainTriggeredItemsController";

export const createInventory = async (
    accountOwnerId: Types.ObjectId,
    defaultItemReferences: { loadOutPresetId: Types.ObjectId; ship: Types.ObjectId }
): Promise<void> => {
    try {
        const inventory = new Inventory({
            accountOwnerId: accountOwnerId,
            LoadOutPresets: defaultItemReferences.loadOutPresetId,
            Ships: [defaultItemReferences.ship],
            PlayedParkourTutorial: config.skipTutorial,
            ReceivedStartingGear: config.skipTutorial
        });

        if (config.skipTutorial) {
            const defaultEquipment = [
                // Awakening rewards
                { ItemCount: 1, ItemType: "/Lotus/Powersuits/Excalibur/Excalibur" },
                { ItemCount: 1, ItemType: "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword" },
                { ItemCount: 1, ItemType: "/Lotus/Weapons/Tenno/Pistol/Pistol" },
                { ItemCount: 1, ItemType: "/Lotus/Weapons/Tenno/Rifle/Rifle" },
                { ItemCount: 1, ItemType: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem1" },
                { ItemCount: 1, ItemType: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem2" },
                { ItemCount: 1, ItemType: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem3" },
                { ItemCount: 1, ItemType: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem4" },
                { ItemCount: 1, ItemType: "/Lotus/Types/Restoratives/LisetAutoHack" }
            ];

            // const vorsPrizeRewards = [
            //     // Vor's Prize rewards
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarHealthMaxMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarShieldMaxMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarAbilityRangeMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarAbilityStrengthMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarAbilityDurationMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarPickupBonusMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarPowerMaxMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Warframe/AvatarEnemyRadarMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Melee/WeaponFireRateMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Melee/WeaponMeleeDamageMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Rifle/WeaponFactionDamageCorpus" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Rifle/WeaponFactionDamageGrineer" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Rifle/WeaponDamageAmountMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Pistol/WeaponFireDamageMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Pistol/WeaponElectricityDamageMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Upgrades/Mods/Pistol/WeaponDamageAmountMod" },
            //     { ItemCount: 1, ItemType: "/Lotus/Types/Recipes/Weapons/BurstonRifleBlueprint" },
            //     { ItemCount: 1, ItemType: "/Lotus/Types/Items/MiscItems/Morphic" },
            //     { ItemCount: 400, ItemType: "/Lotus/Types/Items/MiscItems/PolymerBundle" },
            //     { ItemCount: 150, ItemType: "/Lotus/Types/Items/MiscItems/AlloyPlate" }
            // ];
            for (const equipment of defaultEquipment) {
                await addItem(inventory, equipment.ItemType, equipment.ItemCount);
            }

            // Missing in Public Export
            inventory.Horses.push({
                ItemType: "/Lotus/Types/NeutralCreatures/ErsatzHorse/ErsatzHorsePowerSuit"
            });
            inventory.DataKnives.push({
                ItemType: "/Lotus/Weapons/Tenno/HackingDevices/TnHackingDevice/TnHackingDeviceWeapon",
                XP: 450000
            });
            inventory.Scoops.push({
                ItemType: "/Lotus/Weapons/Tenno/Speedball/SpeedballWeaponTest"
            });
            inventory.DrifterMelee.push({
                ItemType: "/Lotus/Types/Friendly/PlayerControllable/Weapons/DuviriDualSwords"
            });

            inventory.QuestKeys.push({
                ItemType: "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain"
            });

            const completedMissions = ["SolNode27", "SolNode89", "SolNode63", "SolNode85", "SolNode15", "SolNode79"];

            inventory.Missions.push(
                ...completedMissions.map(tag => ({
                    Completes: 1,
                    Tag: tag
                }))
            );

            inventory.RegularCredits = 25000;
            inventory.FusionPoints = 180;
        }

        await inventory.save();
    } catch (error) {
        throw new Error(`Error creating inventory: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

/**
 * Combines two inventory changes objects into one.
 *
 * @param InventoryChanges - will hold the combined changes
 * @param delta - inventory changes to be added
 */
export const combineInventoryChanges = (InventoryChanges: IInventoryChanges, delta: IInventoryChanges): void => {
    for (const key in delta) {
        if (!(key in InventoryChanges)) {
            InventoryChanges[key] = delta[key];
        } else if (Array.isArray(delta[key])) {
            const left = InventoryChanges[key] as object[];
            const right: object[] | string[] = delta[key];
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
        } else if (typeof delta[key] === "number") {
            (InventoryChanges[key] as number) += delta[key];
        } else {
            throw new Error(`inventory change not merged: unhandled type for inventory key ${key}`);
        }
    }
};

export const getInventory = async (
    accountOwnerId: string,
    projection: string | undefined = undefined
): Promise<TInventoryDatabaseDocument> => {
    const inventory = await Inventory.findOne({ accountOwnerId: accountOwnerId }, projection);

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
        } else if (ExportResources[typeName].productCategory == "ShipDecorations") {
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
    if (typeName in ExportWeapons) {
        const weapon = ExportWeapons[typeName];
        // Many non-weapon items are "Pistols" in Public Export, so some duck typing is needed.
        if (weapon.totalDamage != 0) {
            const inventoryChanges = addEquipment(inventory, weapon.productCategory, typeName);
            updateSlots(inventory, InventorySlot.WEAPONS, 0, 1);
            return {
                InventoryChanges: {
                    ...inventoryChanges,
                    WeaponBin: { count: 1, platinum: 0, Slots: -1 }
                }
            };
        }
    }
    if (typeName in creditBundles) {
        const creditsTotal = creditBundles[typeName] * quantity;
        inventory.RegularCredits += creditsTotal;
        return {
            InventoryChanges: {
                RegularCredits: creditsTotal
            }
        };
    }
    if (typeName in fusionBundles) {
        const fusionPointsTotal = fusionBundles[typeName] * quantity;
        inventory.FusionPoints += fusionPointsTotal;
        return {
            InventoryChanges: {
                FusionPoints: fusionPointsTotal
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
        case "Upgrades": {
            // Needed to add Traumatic Peculiar
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
                case "Game": {
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
                case "Keys": {
                    inventory.QuestKeys.push({ ItemType: typeName });
                    return {
                        InventoryChanges: {
                            QuestKeys: [
                                {
                                    ItemType: typeName
                                }
                            ]
                        }
                    };
                }
                case "NeutralCreatures": {
                    const horseIndex = inventory.Horses.push({ ItemType: typeName });
                    return {
                        InventoryChanges: {
                            Horses: inventory.Horses[horseIndex - 1].toJSON()
                        }
                    };
                }
                case "Recipes": {
                    inventory.MiscItems.push({ ItemType: typeName, ItemCount: quantity });
                    return {
                        InventoryChanges: {
                            MiscItems: [
                                {
                                    ItemType: typeName,
                                    ItemCount: quantity
                                }
                            ]
                        }
                    };
                }
            }
            break;
    }
    const errorMessage = `unable to add item: ${typeName}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
};

export const addItems = async (
    inventory: TInventoryDatabaseDocument,
    items: ITypeCount[],
    inventoryChanges: IInventoryChanges = {}
): Promise<IInventoryChanges> => {
    for (const item of items) {
        const inventoryDelta = await addItem(inventory, item.ItemType, item.ItemCount);
        combineInventoryChanges(inventoryChanges, inventoryDelta.InventoryChanges);
    }
    return inventoryChanges;
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
    const index = inventory.SentinelWeapons.push({ ItemType: typeName, XP: 0 }) - 1;
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

const standingLimitBinToInventoryKey: Record<
    Exclude<TStandingLimitBin, "STANDING_LIMIT_BIN_NONE">,
    keyof IDailyAffiliations
> = {
    STANDING_LIMIT_BIN_NORMAL: "DailyAffiliation",
    STANDING_LIMIT_BIN_PVP: "DailyAffiliationPvp",
    STANDING_LIMIT_BIN_LIBRARY: "DailyAffiliationLibrary",
    STANDING_LIMIT_BIN_CETUS: "DailyAffiliationCetus",
    STANDING_LIMIT_BIN_QUILLS: "DailyAffiliationQuills",
    STANDING_LIMIT_BIN_SOLARIS: "DailyAffiliationSolaris",
    STANDING_LIMIT_BIN_VENTKIDS: "DailyAffiliationVentkids",
    STANDING_LIMIT_BIN_VOX: "DailyAffiliationVox",
    STANDING_LIMIT_BIN_ENTRATI: "DailyAffiliationEntrati",
    STANDING_LIMIT_BIN_NECRALOID: "DailyAffiliationNecraloid",
    STANDING_LIMIT_BIN_ZARIMAN: "DailyAffiliationZariman",
    STANDING_LIMIT_BIN_KAHL: "DailyAffiliationKahl",
    STANDING_LIMIT_BIN_CAVIA: "DailyAffiliationCavia",
    STANDING_LIMIT_BIN_HEX: "DailyAffiliationHex"
};

export const allDailyAffiliationKeys: (keyof IDailyAffiliations)[] = Object.values(standingLimitBinToInventoryKey);

export const getStandingLimit = (inventory: IDailyAffiliations, bin: TStandingLimitBin): number => {
    if (bin == "STANDING_LIMIT_BIN_NONE" || config.noDailyStandingLimits) {
        return Number.MAX_SAFE_INTEGER;
    }
    return inventory[standingLimitBinToInventoryKey[bin]];
};

export const updateStandingLimit = (
    inventory: IDailyAffiliations,
    bin: TStandingLimitBin,
    subtrahend: number
): void => {
    if (bin != "STANDING_LIMIT_BIN_NONE" && !config.noDailyStandingLimits) {
        inventory[standingLimitBinToInventoryKey[bin]] -= subtrahend;
    }
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

//TODO: wrong id is not erroring
export const addGearExpByCategory = (
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
            if (MiscItems[itemIndex].ItemCount <= 0) {
                if (MiscItems[itemIndex].ItemCount == 0) {
                    MiscItems.splice(itemIndex, 1);
                } else {
                    logger.warn(`account now owns a negative amount of ${ItemType}`);
                }
            }
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
            if (RawUpgrades[itemIndex].ItemCount <= 0) {
                if (RawUpgrades[itemIndex].ItemCount == 0) {
                    RawUpgrades.splice(itemIndex, 1);
                } else {
                    logger.warn(`account now owns a negative amount of ${ItemType}`);
                }
            }
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

export const addFocusXpIncreases = (inventory: TInventoryDatabaseDocument, focusXpPlus: number[] | undefined): void => {
    enum FocusType {
        AP_UNIVERSAL,
        AP_ATTACK,
        AP_DEFENSE,
        AP_TACTIC,
        AP_POWER,
        AP_PRECEPT,
        AP_FUSION,
        AP_WARD,
        AP_UMBRA,
        AP_ANY
    }

    if (focusXpPlus) {
        inventory.FocusXP ??= { AP_ATTACK: 0, AP_DEFENSE: 0, AP_TACTIC: 0, AP_POWER: 0, AP_WARD: 0 };
        inventory.FocusXP.AP_ATTACK += focusXpPlus[FocusType.AP_ATTACK];
        inventory.FocusXP.AP_DEFENSE += focusXpPlus[FocusType.AP_DEFENSE];
        inventory.FocusXP.AP_TACTIC += focusXpPlus[FocusType.AP_TACTIC];
        inventory.FocusXP.AP_POWER += focusXpPlus[FocusType.AP_POWER];
        inventory.FocusXP.AP_WARD += focusXpPlus[FocusType.AP_WARD];
    }
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

export const addMissionComplete = (inventory: TInventoryDatabaseDocument, { Tag, Completes }: IMission): void => {
    const { Missions } = inventory;
    const itemIndex = Missions.findIndex(item => item.Tag === Tag);

    if (itemIndex !== -1) {
        Missions[itemIndex].Completes += Completes;
        inventory.markModified(`Missions.${itemIndex}.Completes`);
    } else {
        Missions.push({ Tag, Completes });
    }
};

export const addBooster = (ItemType: string, time: number, inventory: TInventoryDatabaseDocument): void => {
    const currentTime = Math.floor(Date.now() / 1000) - 129600; // Value is wrong without 129600. Figure out why, please. :)

    const { Boosters } = inventory;

    const itemIndex = Boosters.findIndex(booster => booster.ItemType === ItemType);

    if (itemIndex !== -1) {
        const existingBooster = Boosters[itemIndex];
        existingBooster.ExpiryDate = Math.max(existingBooster.ExpiryDate, currentTime) + time;
        inventory.markModified(`Boosters.${itemIndex}.ExpiryDate`);
    } else {
        Boosters.push({ ItemType, ExpiryDate: currentTime + time });
    }
};

export const updateSyndicate = (
    inventory: HydratedDocument<IInventoryDatabase, InventoryDocumentProps>,
    syndicateUpdate: IMissionInventoryUpdateRequest["AffiliationChanges"]
) => {
    syndicateUpdate?.forEach(affiliation => {
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
    return { AffiliationMods: [] };
};

/**
 * @returns object with inventory keys of changes or empty object when no items were added
 */
export const addKeyChainItems = async (
    inventory: TInventoryDatabaseDocument,
    keyChainData: IGiveKeyChainTriggeredItemsRequest
): Promise<IInventoryChanges> => {
    const keyChainItems = getKeyChainItems(keyChainData);

    logger.debug(
        `adding key chain items ${keyChainItems.join()} for ${keyChainData.KeyChain} at stage ${keyChainData.ChainStage}`
    );

    const nonStoreItems = keyChainItems.map(item => item.replace("StoreItems/", ""));

    //TODO: inventoryChanges is not typed correctly
    const inventoryChanges = {};

    for (const item of nonStoreItems) {
        const inventoryChangesDelta = await addItem(inventory, item);
        combineInventoryChanges(inventoryChanges, inventoryChangesDelta.InventoryChanges);
    }

    return inventoryChanges;
};
