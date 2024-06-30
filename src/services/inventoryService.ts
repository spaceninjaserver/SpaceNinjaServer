import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import new_inventory from "@/static/fixed_responses/postTutorialInventory.json";
import { config } from "@/src/services/configService";
import { Types } from "mongoose";
import { SlotNames, IInventoryChanges } from "@/src/types/purchaseTypes";
import {
    IChallengeProgress,
    IConsumable,
    IFlavourItem,
    IInventoryDatabaseDocument,
    IMiscItem,
    IMission,
    IRawUpgrade,
    ISeasonChallenge,
    ITypeCount,
    InventorySlot,
    IWeaponSkinClient,
    TEquipmentKey,
    equipmentKeys
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
import { ISyndicateSacrifice, ISyndicateSacrificeResponse } from "../types/syndicateTypes";
import { IEquipmentClient } from "../types/inventoryTypes/commonInventoryTypes";
import { ExportCustoms, ExportFlavour, ExportRecipes, ExportResources } from "warframe-public-export-plus";

export const createInventory = async (
    accountOwnerId: Types.ObjectId,
    defaultItemReferences: { loadOutPresetId: Types.ObjectId; ship: Types.ObjectId }
) => {
    try {
        const inventory = new Inventory({
            ...new_inventory,
            accountOwnerId: accountOwnerId,
            LoadOutPresets: defaultItemReferences.loadOutPresetId,
            Ships: [defaultItemReferences.ship]
        });
        if (config.skipStoryModeChoice) {
            inventory.StoryModeChoice = "WARFRAME";
        }
        if (config.skipTutorial) {
            inventory.PlayedParkourTutorial = true;
            inventory.ReceivedStartingGear = true;
        }

        await inventory.save();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`error creating inventory" ${error.message}`);
        }
        throw new Error("error creating inventory that is not of instance Error");
    }
};

export const getInventory = async (accountOwnerId: string) => {
    const inventory = await Inventory.findOne({ accountOwnerId: accountOwnerId });

    if (!inventory) {
        throw new Error(`Didn't find an inventory for ${accountOwnerId}`);
    }

    return inventory;
};

export const addItem = async (
    accountId: string,
    typeName: string,
    quantity: number = 1
): Promise<{ InventoryChanges: IInventoryChanges }> => {
    // Strict typing
    if (typeName in ExportRecipes) {
        const inventory = await getInventory(accountId);
        const recipeChanges = [
            {
                ItemType: typeName,
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
    }
    if (typeName in ExportResources) {
        const inventory = await getInventory(accountId);
        const miscItemChanges = [
            {
                ItemType: typeName,
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
    }
    if (typeName in ExportCustoms) {
        return {
            InventoryChanges: {
                WeaponSkins: [await addSkin(typeName, accountId)]
            }
        };
    }
    if (typeName in ExportFlavour) {
        return {
            InventoryChanges: {
                FlavourItems: [await addCustomization(typeName, accountId)]
            }
        };
    }

    // Path-based duck typing
    switch (typeName.substr(1).split("/")[1]) {
        case "Powersuits":
            switch (typeName.substr(1).split("/")[2]) {
                default: {
                    const suit = await addPowerSuit(typeName, accountId);
                    await updateSlots(accountId, InventorySlot.SUITS, 0, 1);
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
                }
                case "Archwing": {
                    const spaceSuit = await addSpaceSuit(typeName, accountId);
                    await updateSlots(accountId, InventorySlot.SPACESUITS, 0, 1);
                    return {
                        InventoryChanges: {
                            SpaceSuitBin: {
                                count: 1,
                                platinum: 0,
                                Slots: -1
                            },
                            SpaceSuits: [spaceSuit]
                        }
                    };
                }
                case "EntratiMech": {
                    const mechSuit = await addMechSuit(typeName, accountId);
                    await updateSlots(accountId, InventorySlot.MECHSUITS, 0, 1);
                    return {
                        InventoryChanges: {
                            MechBin: {
                                count: 1,
                                platinum: 0,
                                Slots: -1
                            },
                            MechSuits: [mechSuit]
                        }
                    };
                }
            }
            break;
        case "Weapons":
            const weaponType = getWeaponType(typeName);
            const weapon = await addEquipment(weaponType, typeName, accountId);
            await updateSlots(accountId, InventorySlot.WEAPONS, 0, 1);
            return {
                InventoryChanges: {
                    WeaponBin: { count: 1, platinum: 0, Slots: -1 },
                    [weaponType]: [weapon]
                }
            };
        case "Upgrades": {
            const inventory = await getInventory(accountId);
            const changes = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                }
            ];
            addMods(inventory, changes);
            await inventory.save();
            return {
                InventoryChanges: {
                    ShipDecorations: changes
                }
            };
        }
        case "Objects": {
            // /Lotus/Objects/Tenno/Props/TnoLisetTextProjector (Note Beacon)
            const inventory = await getInventory(accountId);
            const changes = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                } satisfies IMiscItem
            ];
            addShipDecorations(inventory, changes);
            await inventory.save();
            return {
                InventoryChanges: {
                    ShipDecorations: changes
                }
            };
        }
        case "Types":
            switch (typeName.substr(1).split("/")[2]) {
                case "Sentinels":
                    // TOOD: Sentinels should also grant their DefaultUpgrades & SentinelWeapon.
                    const sentinel = await addSentinel(typeName, accountId);
                    await updateSlots(accountId, InventorySlot.SENTINELS, 0, 1);
                    return {
                        InventoryChanges: {
                            SentinelBin: { count: 1, platinum: 0, Slots: -1 },
                            Sentinels: [sentinel]
                        }
                    };
                case "Items": {
                    switch (typeName.substr(1).split("/")[3]) {
                        case "ShipDecos": {
                            const inventory = await getInventory(accountId);
                            const changes = [
                                {
                                    ItemType: typeName,
                                    ItemCount: quantity
                                } satisfies IMiscItem
                            ];
                            addShipDecorations(inventory, changes);
                            await inventory.save();
                            return {
                                InventoryChanges: {
                                    ShipDecorations: changes
                                }
                            };
                        }
                        default: {
                            const inventory = await getInventory(accountId);
                            const miscItemChanges = [
                                {
                                    ItemType: typeName,
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
                        }
                    }
                }
                case "Restoratives": // Codex Scanner, Remote Observer, Starburst
                    const inventory = await getInventory(accountId);
                    const consumablesChanges = [
                        {
                            ItemType: typeName,
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
            }
            break;
    }
    const errorMessage = `unable to add item: ${typeName}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
};

//TODO: maybe genericMethod for all the add methods, they share a lot of logic
export const addSentinel = async (sentinelName: string, accountId: string) => {
    const inventory = await getInventory(accountId);
    const sentinelIndex = inventory.Sentinels.push({ ItemType: sentinelName, Configs: [], XP: 0 });
    const changedInventory = await inventory.save();
    return changedInventory.Sentinels[sentinelIndex - 1].toJSON();
};

export const addPowerSuit = async (powersuitName: string, accountId: string): Promise<IEquipmentClient> => {
    const specialItems = getExalted(powersuitName);
    if (specialItems != false) {
        for await (const specialItem of specialItems) {
            await addSpecialItem(specialItem, accountId);
        }
    }
    const inventory = await getInventory(accountId);
    const suitIndex = inventory.Suits.push({ ItemType: powersuitName, Configs: [], UpgradeVer: 101, XP: 0 });
    const changedInventory = await inventory.save();
    return changedInventory.Suits[suitIndex - 1].toJSON();
};

export const addMechSuit = async (mechsuitName: string, accountId: string) => {
    const specialItems = getExalted(mechsuitName);
    if (specialItems != false) {
        for await (const specialItem of specialItems) {
            await addSpecialItem(specialItem, accountId);
        }
    }
    const inventory = await getInventory(accountId);
    const suitIndex = inventory.MechSuits.push({ ItemType: mechsuitName, Configs: [], UpgradeVer: 101, XP: 0 });
    const changedInventory = await inventory.save();
    return changedInventory.MechSuits[suitIndex - 1].toJSON();
};

export const addSpecialItem = async (itemName: string, accountId: string) => {
    const inventory = await getInventory(accountId);
    const specialItemIndex = inventory.SpecialItems.push({
        ItemType: itemName,
        Configs: [],
        Features: 1,
        UpgradeVer: 101,
        XP: 0
    });
    const changedInventory = await inventory.save();
    return changedInventory.SpecialItems[specialItemIndex - 1].toJSON();
};

export const addSpaceSuit = async (spacesuitName: string, accountId: string) => {
    const inventory = await getInventory(accountId);
    const suitIndex = inventory.SpaceSuits.push({ ItemType: spacesuitName, Configs: [], UpgradeVer: 101, XP: 0 });
    const changedInventory = await inventory.save();
    return changedInventory.SpaceSuits[suitIndex - 1].toJSON();
};

export const updateSlots = async (accountId: string, slotName: SlotNames, slotAmount: number, extraAmount: number) => {
    const inventory = await getInventory(accountId);

    inventory[slotName].Slots += slotAmount;
    if (inventory[slotName].Extra === undefined) {
        inventory[slotName].Extra = extraAmount;
    } else {
        inventory[slotName].Extra += extraAmount;
    }

    await inventory.save();
};

export const updateCurrency = async (price: number, usePremium: boolean, accountId: string) => {
    if (config.infiniteResources) {
        return {};
    }

    const inventory = await getInventory(accountId);

    if (usePremium) {
        if (inventory.PremiumCreditsFree > 0) {
            inventory.PremiumCreditsFree -= Math.min(price, inventory.PremiumCreditsFree);
        }
        inventory.PremiumCredits -= price;
    } else {
        inventory.RegularCredits -= price;
    }

    const modifiedPaths = inventory.modifiedPaths();

    type currencyKeys = "RegularCredits" | "PremiumCredits" | "PremiumCreditsFree";

    const currencyChanges = {} as Record<currencyKeys, number>;
    modifiedPaths.forEach(path => {
        currencyChanges[path as currencyKeys] = -price;
    });

    logger.debug(`currency changes `, { currencyChanges });

    //let changes = {} as keyof currencyKeys;

    // const obj2 = modifiedPaths.reduce(
    //     (obj, key) => {
    //         obj[key as keyof currencyKeys] = price;
    //         return obj;
    //     },
    //     {} as Record<keyof currencyKeys, number>
    // );

    await inventory.save();
    return currencyChanges;
};

// TODO: AffiliationMods support (Nightwave).
export const updateGeneric = async (data: IGenericUpdate, accountId: string) => {
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

    return data;
};

export const updateTheme = async (data: IThemeUpdateRequest, accountId: string) => {
    const inventory = await getInventory(accountId);
    if (data.Style) inventory.ThemeStyle = data.Style;
    if (data.Background) inventory.ThemeBackground = data.Background;
    if (data.Sounds) inventory.ThemeSounds = data.Sounds;

    await inventory.save();
};

export const syndicateSacrifice = async (
    data: ISyndicateSacrifice,
    accountId: string
): Promise<ISyndicateSacrificeResponse> => {
    const inventory = await getInventory(accountId);
    const syndicate = inventory.Affiliations.find(x => x.Tag == data.AffiliationTag);
    const level = data.SacrificeLevel - (syndicate?.Title ?? 0);
    const res: ISyndicateSacrificeResponse = {
        AffiliationTag: data.AffiliationTag,
        InventoryChanges: [],
        Level: data.SacrificeLevel,
        LevelIncrease: level <= 0 ? 1 : level,
        NewEpisodeReward: syndicate?.Tag == "RadioLegionIntermission9Syndicate"
    };

    if (syndicate?.Title !== undefined) syndicate.Title += 1;

    await inventory.save();

    return res;
};

export const addEquipment = async (
    category: TEquipmentKey,
    type: string,
    accountId: string,
    modularParts: string[] | undefined = undefined
): Promise<IEquipmentClient> => {
    const inventory = await getInventory(accountId);

    const index = inventory[category].push({
        ItemType: type,
        Configs: [],
        XP: 0,
        ModularParts: modularParts
    });

    const changedInventory = await inventory.save();
    return changedInventory[category][index - 1].toJSON();
};

export const addCustomization = async (customizatonName: string, accountId: string): Promise<IFlavourItem> => {
    const inventory = await getInventory(accountId);
    const flavourItemIndex = inventory.FlavourItems.push({ ItemType: customizatonName }) - 1;
    const changedInventory = await inventory.save();
    return changedInventory.FlavourItems[flavourItemIndex].toJSON();
};

export const addSkin = async (typeName: string, accountId: string): Promise<IWeaponSkinClient> => {
    const inventory = await getInventory(accountId);
    const index = inventory.WeaponSkins.push({ ItemType: typeName }) - 1;
    const changedInventory = await inventory.save();
    return changedInventory.WeaponSkins[index].toJSON();
};

const addGearExpByCategory = (
    inventory: IInventoryDatabaseDocument,
    gearArray: IEquipmentClient[] | undefined,
    categoryName: TEquipmentKey
) => {
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

export const addMiscItems = (inventory: IInventoryDatabaseDocument, itemsArray: IMiscItem[] | undefined) => {
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

export const addShipDecorations = (inventory: IInventoryDatabaseDocument, itemsArray: IConsumable[] | undefined) => {
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

export const addConsumables = (inventory: IInventoryDatabaseDocument, itemsArray: IConsumable[] | undefined) => {
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

export const addRecipes = (inventory: IInventoryDatabaseDocument, itemsArray: ITypeCount[] | undefined) => {
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

export const addMods = (inventory: IInventoryDatabaseDocument, itemsArray: IRawUpgrade[] | undefined) => {
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

export const updateChallengeProgress = async (challenges: IUpdateChallengeProgressRequest, accountId: string) => {
    const inventory = await getInventory(accountId);

    addChallenges(inventory, challenges.ChallengeProgress);
    addSeasonalChallengeHistory(inventory, challenges.SeasonChallengeHistory);

    await inventory.save();
};

export const addSeasonalChallengeHistory = (
    inventory: IInventoryDatabaseDocument,
    itemsArray: ISeasonChallenge[] | undefined
) => {
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

export const addChallenges = (inventory: IInventoryDatabaseDocument, itemsArray: IChallengeProgress[] | undefined) => {
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

const addMissionComplete = (inventory: IInventoryDatabaseDocument, { Tag, Completes }: IMission) => {
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
    const { RawUpgrades, MiscItems, RegularCredits, ChallengeProgress, FusionPoints, Consumables, Recipes, Missions } =
        data;
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
        Boosters.push({ ItemType, ExpiryDate: currentTime + time }) - 1;
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint);
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

        inventory.RegularCredits -= Cost;
        inventory.FusionPoints -= FusionPointCost;

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
