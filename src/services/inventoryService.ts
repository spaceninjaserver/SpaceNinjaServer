import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import { Inventory } from "../models/inventoryModels/inventoryModel.ts";
import { config } from "./configService.ts";
import { Types } from "mongoose";
import type { SlotNames, IInventoryChanges, IBinChanges, IAffiliationMods } from "../types/purchaseTypes.ts";
import { slotNames } from "../types/purchaseTypes.ts";
import type {
    IChallengeProgress,
    IMiscItem,
    IMission,
    IRawUpgrade,
    ISeasonChallenge,
    IWeaponSkinClient,
    TEquipmentKey,
    IFusionTreasure,
    IDailyAffiliations,
    IKubrowPetEggDatabase,
    IKubrowPetEggClient,
    ILibraryDailyTaskInfo,
    IDroneClient,
    IUpgradeClient,
    TPartialStartingGear,
    ILoreFragmentScan,
    ICrewMemberClient,
    ICalendarProgress,
    INemesisWeaponTargetFingerprint,
    INemesisPetTargetFingerprint,
    IDialogueDatabase,
    IKubrowPetPrintClient
} from "../types/inventoryTypes/inventoryTypes.ts";
import { InventorySlot, equipmentKeys } from "../types/inventoryTypes/inventoryTypes.ts";
import type { IGenericUpdate, IUpdateNodeIntrosResponse } from "../types/genericUpdate.ts";
import type { IKeyChainRequest, IMissionInventoryUpdateRequest } from "../types/requestTypes.ts";
import { logger } from "../utils/logger.ts";
import { convertInboxMessage, fromStoreItem, getKeyChainItems } from "./itemDataService.ts";
import type { IFlavourItem, IItemConfig } from "../types/inventoryTypes/commonInventoryTypes.ts";
import type { IDefaultUpgrade, IPowersuit, ISentinel, TStandingLimitBin } from "warframe-public-export-plus";
import {
    ExportArcanes,
    ExportBoosters,
    ExportBundles,
    ExportChallenges,
    ExportCustoms,
    ExportDrones,
    ExportEmailItems,
    ExportEnemies,
    ExportFlavour,
    ExportFusionBundles,
    ExportGear,
    ExportKeys,
    ExportMisc,
    ExportRailjackWeapons,
    ExportRecipes,
    ExportResources,
    ExportSentinels,
    ExportSyndicates,
    ExportUpgrades,
    ExportWarframes,
    ExportWeapons
} from "warframe-public-export-plus";
import { createShip } from "./shipService.ts";
import type { TTraitsPool } from "../helpers/inventoryHelpers.ts";
import {
    catbrowDetails,
    fromDbOid,
    fromMongoDate,
    fromOid,
    kubrowDetails,
    kubrowFurPatternsWeights,
    kubrowWeights,
    toOid
} from "../helpers/inventoryHelpers.ts";
import { addQuestKey, completeQuest } from "./questService.ts";
import { handleBundleAcqusition } from "./purchaseService.ts";
import libraryDailyTasks from "../../static/fixed_responses/libraryDailyTasks.json" with { type: "json" };
import { generateRewardSeed, getRandomElement, getRandomInt, getRandomWeightedReward, SRng } from "./rngService.ts";
import type { IMessageCreationTemplate } from "./inboxService.ts";
import { createMessage } from "./inboxService.ts";
import { getMaxStanding, getMinStanding } from "../helpers/syndicateStandingHelper.ts";
import { getNightwaveSyndicateTag, getWorldState } from "./worldStateService.ts";
import type { ICalendarSeason } from "../types/worldStateTypes.ts";
import type { INemesisProfile } from "../helpers/nemesisHelpers.ts";
import { generateNemesisProfile } from "../helpers/nemesisHelpers.ts";
import type { TAccountDocument } from "./loginService.ts";
import { unixTimesInMs } from "../constants/timeConstants.ts";
import { addString } from "../helpers/stringHelpers.ts";
import type {
    IEquipmentClient,
    IEquipmentDatabase,
    IKubrowPetDetailsDatabase,
    ITraits
} from "../types/equipmentTypes.ts";
import { EquipmentFeatures, Status } from "../types/equipmentTypes.ts";
import type { ITypeCount } from "../types/commonTypes.ts";

export const createInventory = async (
    accountOwnerId: Types.ObjectId,
    defaultItemReferences: { loadOutPresetId: Types.ObjectId; ship: Types.ObjectId }
): Promise<void> => {
    try {
        const inventory = new Inventory({
            accountOwnerId: accountOwnerId,
            LoadOutPresets: defaultItemReferences.loadOutPresetId,
            Ships: [defaultItemReferences.ship]
        });

        inventory.LibraryAvailableDailyTaskInfo = createLibraryDailyTask();
        inventory.RewardSeed = generateRewardSeed();
        inventory.DuviriInfo = {
            Seed: generateRewardSeed(),
            NumCompletions: 0
        };
        await addItem(inventory, "/Lotus/Types/Friendly/PlayerControllable/Weapons/DuviriDualSwords");

        if (config.skipTutorial) {
            inventory.PlayedParkourTutorial = true;
            await addStartingGear(inventory);
            await completeQuest(inventory, "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain");

            const completedMissions = ["SolNode27", "SolNode89", "SolNode63", "SolNode85", "SolNode15", "SolNode79"];

            inventory.Missions.push(
                ...completedMissions.map(tag => ({
                    Completes: 1,
                    Tag: tag
                }))
            );
        }

        await inventory.save();
    } catch (error) {
        throw new Error(`Error creating inventory: ${error instanceof Error ? error.message : "Unknown error type"}`);
    }
};

//TODO: RawUpgrades might need to return a LastAdded
const awakeningRewards = [
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem1",
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem2",
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem3",
    "/Lotus/Types/StoreItems/AvatarImages/AvatarImageItem4",
    "/Lotus/Types/Restoratives/LisetAutoHack",
    "/Lotus/Upgrades/Mods/Warframe/AvatarShieldMaxMod"
];

export const addStartingGear = async (
    inventory: TInventoryDatabaseDocument,
    startingGear?: TPartialStartingGear
): Promise<IInventoryChanges> => {
    if (inventory.ReceivedStartingGear) {
        throw new Error(`account has already received starting gear`);
    }
    inventory.ReceivedStartingGear = true;

    const { LongGuns, Pistols, Suits, Melee } = startingGear || {
        LongGuns: [{ ItemType: "/Lotus/Weapons/Tenno/Rifle/Rifle" }],
        Pistols: [{ ItemType: "/Lotus/Weapons/Tenno/Pistol/Pistol" }],
        Suits: [{ ItemType: "/Lotus/Powersuits/Excalibur/Excalibur" }],
        Melee: [{ ItemType: "/Lotus/Weapons/Tenno/Melee/LongSword/LongSword" }]
    };

    //TODO: properly merge weapon bin changes it is currently static here
    const inventoryChanges: IInventoryChanges = {};
    addEquipment(inventory, "LongGuns", LongGuns[0].ItemType, { IsNew: false }, inventoryChanges);
    addEquipment(inventory, "Pistols", Pistols[0].ItemType, { IsNew: false }, inventoryChanges);
    addEquipment(inventory, "Melee", Melee[0].ItemType, { IsNew: false }, inventoryChanges);
    await addPowerSuit(inventory, Suits[0].ItemType, { IsNew: false }, inventoryChanges);
    addEquipment(
        inventory,
        "DataKnives",
        "/Lotus/Weapons/Tenno/HackingDevices/TnHackingDevice/TnHackingDeviceWeapon",
        { XP: 450_000, IsNew: false },
        inventoryChanges
    );
    addEquipment(
        inventory,
        "Scoops",
        "/Lotus/Weapons/Tenno/Speedball/SpeedballWeaponTest",
        { IsNew: false },
        inventoryChanges
    );

    updateSlots(inventory, InventorySlot.SUITS, 0, 1);
    updateSlots(inventory, InventorySlot.WEAPONS, 0, 3);
    inventoryChanges.SuitBin = { count: 1, platinum: 0, Slots: -1 };
    inventoryChanges.WeaponBin = { count: 3, platinum: 0, Slots: -3 };

    await addItem(inventory, "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain");
    inventory.ActiveQuest = "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain";

    inventory.PremiumCredits = 50;
    inventory.PremiumCreditsFree = 50;
    inventoryChanges.PremiumCredits = 50;
    inventoryChanges.PremiumCreditsFree = 50;
    inventory.RegularCredits = 3000;
    inventoryChanges.RegularCredits = 3000;

    for (const item of awakeningRewards) {
        const inventoryDelta = await addItem(inventory, item);
        combineInventoryChanges(inventoryChanges, inventoryDelta);
    }

    return inventoryChanges;
};

/**
 * Combines two inventory changes objects into one.
 *
 * @param InventoryChanges - will hold the combined changes
 * @param delta - inventory changes to be added
 */
//TODO: this fails silently when providing an incorrect object to delta
export const combineInventoryChanges = (InventoryChanges: IInventoryChanges, delta: IInventoryChanges): void => {
    for (const key in delta) {
        if (!(key in InventoryChanges)) {
            InventoryChanges[key] = delta[key];
        } else if (key == "MiscItems") {
            for (const deltaItem of delta[key]!) {
                const existing = InventoryChanges[key]!.find(x => x.ItemType == deltaItem.ItemType);
                if (existing) {
                    existing.ItemCount += deltaItem.ItemCount;
                } else {
                    InventoryChanges[key]!.push(deltaItem);
                }
            }
        } else if (Array.isArray(delta[key])) {
            const left = InventoryChanges[key] as object[];
            const right: object[] = delta[key];
            for (const item of right) {
                left.push(item);
            }
        } else if (slotNames.indexOf(key as SlotNames) != -1) {
            const left = InventoryChanges[key as SlotNames]!;
            const right = delta[key as SlotNames]!;
            if (right.count) {
                left.count ??= 0;
                left.count += right.count;
            }
            if (right.platinum) {
                left.platinum ??= 0;
                left.platinum += right.platinum;
            }
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
    projection?: string
): Promise<TInventoryDatabaseDocument> => {
    const inventory = await Inventory.findOne({ accountOwnerId: accountOwnerId }, projection);

    if (!inventory) {
        throw new Error(`Didn't find an inventory for ${accountOwnerId}`);
    }

    return inventory;
};

export const productCategoryToInventoryBin = (productCategory: string): InventorySlot | undefined => {
    switch (productCategory) {
        case "Suits":
            return InventorySlot.SUITS;
        case "Pistols":
        case "LongGuns":
        case "Melee":
            return InventorySlot.WEAPONS;
        case "Sentinels":
        case "SentinelWeapons":
        case "KubrowPets":
        case "MoaPets":
            return InventorySlot.SENTINELS;
        case "SpaceSuits":
        case "Hoverboards":
            return InventorySlot.SPACESUITS;
        case "SpaceGuns":
        case "SpaceMelee":
            return InventorySlot.SPACEWEAPONS;
        case "OperatorAmps":
            return InventorySlot.AMPS;
        case "CrewShipWeapons":
        case "CrewShipWeaponSkins":
            return InventorySlot.RJ_COMPONENT_AND_ARMAMENTS;
        case "MechSuits":
            return InventorySlot.MECHSUITS;
        case "CrewMembers":
            return InventorySlot.CREWMEMBERS;
    }
    return undefined;
};

export const occupySlot = (
    inventory: TInventoryDatabaseDocument,
    bin: InventorySlot,
    premiumPurchase: boolean
): IInventoryChanges => {
    const slotChanges = {
        Slots: 0,
        Extra: 0
    };
    if (premiumPurchase) {
        slotChanges.Extra += 1;
    } else {
        // { count: 1, platinum: 0, Slots: -1 }
        slotChanges.Slots -= 1;
    }
    updateSlots(inventory, bin, slotChanges.Slots, slotChanges.Extra);
    const inventoryChanges: IInventoryChanges = {};
    inventoryChanges[bin] = slotChanges satisfies IBinChanges;
    return inventoryChanges;
};

export const freeUpSlot = (inventory: TInventoryDatabaseDocument, bin: InventorySlot): void => {
    // { count: -1, platinum: 0, Slots: 1 }
    updateSlots(inventory, bin, 1, 0);
};

export const addItem = async (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    quantity: number = 1,
    premiumPurchase: boolean = false,
    seed?: bigint,
    targetFingerprint?: string,
    exactQuantity: boolean = false
): Promise<IInventoryChanges> => {
    // Bundles are technically StoreItems but a) they don't have a normal counterpart, and b) they are used in non-StoreItem contexts, e.g. email attachments.
    if (typeName in ExportBundles) {
        return await handleBundleAcqusition(typeName, inventory, quantity);
    }

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
            Recipes: recipeChanges
        };
    }
    if (typeName in ExportResources) {
        if (ExportResources[typeName].productCategory == "MiscItems") {
            const miscItemChanges = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                } satisfies IMiscItem
            ];
            addMiscItems(inventory, miscItemChanges);
            return {
                MiscItems: miscItemChanges
            };
        } else if (ExportResources[typeName].productCategory == "FusionTreasures") {
            const fusionTreasureChanges = [
                {
                    ItemType: typeName,
                    ItemCount: quantity,
                    Sockets: 0
                } satisfies IFusionTreasure
            ];
            addFusionTreasures(inventory, fusionTreasureChanges);
            return {
                FusionTreasures: fusionTreasureChanges
            };
        } else if (ExportResources[typeName].productCategory == "Ships") {
            const oid = await createShip(inventory.accountOwnerId, typeName);
            inventory.Ships.push(oid);
            return {
                Ships: [
                    {
                        ItemId: { $oid: oid.toString() },
                        ItemType: typeName
                    }
                ]
            };
        } else if (ExportResources[typeName].productCategory == "CrewShips") {
            return {
                ...addCrewShip(inventory, typeName),
                // fix to unlock railjack modding, item bellow supposed to be obtained from archwing quest
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                ...(!inventory.CrewShipHarnesses?.length
                    ? addCrewShipHarness(inventory, "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness")
                    : {})
            };
        } else if (ExportResources[typeName].productCategory == "ShipDecorations") {
            const changes = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                } satisfies IMiscItem
            ];
            addShipDecorations(inventory, changes);
            return {
                ShipDecorations: changes
            };
        } else if (ExportResources[typeName].productCategory == "KubrowPetEggs") {
            const changes: IKubrowPetEggClient[] = [];
            if (quantity < 0 || quantity > 100) {
                throw new Error(`unexpected acquisition quantity of KubrowPetEggs: got ${quantity}, expected 0..100`);
            }
            for (let i = 0; i != quantity; ++i) {
                const egg: IKubrowPetEggDatabase = {
                    ItemType: "/Lotus/Types/Game/KubrowPet/Eggs/KubrowEgg",
                    _id: new Types.ObjectId()
                };
                inventory.KubrowPetEggs.push(egg);
                changes.push({
                    ItemType: egg.ItemType,
                    ExpirationDate: { $date: { $numberLong: "2000000000000" } },
                    ItemId: toOid(egg._id) // TODO: Pass on buildLabel from purchaseService
                });
            }
            return {
                KubrowPetEggs: changes
            };
        } else {
            throw new Error(`unknown product category: ${ExportResources[typeName].productCategory}`);
        }
    }
    if (typeName in ExportCustoms) {
        const meta = ExportCustoms[typeName];
        let inventoryChanges: IInventoryChanges;
        if (meta.productCategory == "CrewShipWeaponSkins") {
            if (meta.subroutines || meta.randomisedUpgrades) {
                // House versions need to be identified to get stats so put them into raw salvage first.
                const rawSalvageChanges = [
                    {
                        ItemType: typeName,
                        ItemCount: quantity
                    }
                ];
                addCrewShipRawSalvage(inventory, rawSalvageChanges);
                inventoryChanges = { CrewShipRawSalvage: rawSalvageChanges };
            } else {
                // Sigma versions can be added directly.
                if (quantity != 1) {
                    throw new Error(
                        `unexpected acquisition quantity of CrewShipWeaponSkin: got ${quantity}, expected 1`
                    );
                }
                inventoryChanges = {
                    ...addCrewShipWeaponSkin(inventory, typeName, undefined),
                    ...occupySlot(inventory, InventorySlot.RJ_COMPONENT_AND_ARMAMENTS, premiumPurchase)
                };
            }
        } else {
            if (quantity != 1) {
                throw new Error(`unexpected acquisition quantity of WeaponSkins: got ${quantity}, expected 1`);
            }
            inventoryChanges = addSkin(inventory, typeName);
        }
        if (meta.additionalItems) {
            for (const item of meta.additionalItems) {
                combineInventoryChanges(inventoryChanges, await addItem(inventory, item));
            }
        }
        return inventoryChanges;
    }
    if (typeName in ExportFlavour) {
        return addCustomization(inventory, typeName);
    }
    if (typeName in ExportUpgrades || typeName in ExportArcanes) {
        if (targetFingerprint) {
            if (quantity != 1) {
                logger.warn(`adding 1 of ${typeName} ${targetFingerprint} even tho quantity ${quantity} was requested`);
            }
            const upgrade =
                inventory.Upgrades[
                    inventory.Upgrades.push({
                        ItemType: typeName,
                        UpgradeFingerprint: targetFingerprint
                    }) - 1
                ];
            return { Upgrades: [upgrade.toJSON<IUpgradeClient>()] };
        }
        const changes = [
            {
                ItemType: typeName,
                ItemCount: quantity
            }
        ];
        addMods(inventory, changes);
        return {
            RawUpgrades: changes
        };
    }
    if (typeName in ExportGear) {
        // Multipling by purchase quantity for gear because:
        // - The Saya's Vigil scanner message has it as a non-counted attachment.
        // - Blueprints for Ancient Protector Specter, Shield Osprey Specter, etc. have num=1 despite giving their purchaseQuantity.
        if (!exactQuantity) {
            quantity *= ExportGear[typeName].purchaseQuantity ?? 1;
            logger.debug(`non-exact acquisition of ${typeName}; factored quantity is ${quantity}`);
        }
        const consumablesChanges = [
            {
                ItemType: typeName,
                ItemCount: quantity
            } satisfies ITypeCount
        ];
        addConsumables(inventory, consumablesChanges);
        return {
            Consumables: consumablesChanges
        };
    }
    if (typeName in ExportWeapons) {
        const weapon = ExportWeapons[typeName];
        if (weapon.totalDamage != 0) {
            const defaultOverwrites: Partial<IEquipmentDatabase> = {};
            if (premiumPurchase) {
                defaultOverwrites.Features = EquipmentFeatures.DOUBLE_CAPACITY;
            }
            if (weapon.maxLevelCap == 40 && typeName.indexOf("BallasSword") == -1) {
                if (!seed) {
                    seed = BigInt(Math.round(Math.random() * Number.MAX_SAFE_INTEGER));
                }
                const rng = new SRng(seed);
                const tag = rng.randomElement([
                    "InnateElectricityDamage",
                    "InnateFreezeDamage",
                    "InnateHeatDamage",
                    "InnateImpactDamage",
                    "InnateMagDamage",
                    "InnateRadDamage",
                    "InnateToxinDamage"
                ]);
                const WeaponUpgradeValueAttenuationExponent = 2.25;
                let value = Math.pow(rng.randomFloat(), WeaponUpgradeValueAttenuationExponent);
                if (value >= 0.941428) {
                    value = 1;
                }
                defaultOverwrites.UpgradeType = "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod";
                defaultOverwrites.UpgradeFingerprint = JSON.stringify({
                    compat: typeName,
                    buffs: [
                        {
                            Tag: tag,
                            Value: Math.trunc(value * 0x40000000)
                        }
                    ]
                });
            }
            if (targetFingerprint) {
                const targetFingerprintObj = JSON.parse(targetFingerprint) as INemesisWeaponTargetFingerprint;
                defaultOverwrites.UpgradeType = targetFingerprintObj.ItemType;
                defaultOverwrites.UpgradeFingerprint = JSON.stringify(targetFingerprintObj.UpgradeFingerprint);
                defaultOverwrites.ItemName = targetFingerprintObj.Name;
            }
            const inventoryChanges = addEquipment(inventory, weapon.productCategory, typeName, defaultOverwrites);
            if (weapon.additionalItems) {
                for (const item of weapon.additionalItems) {
                    combineInventoryChanges(inventoryChanges, await addItem(inventory, item, 1));
                }
            }
            return {
                ...inventoryChanges,
                ...occupySlot(
                    inventory,
                    productCategoryToInventoryBin(weapon.productCategory) ?? InventorySlot.WEAPONS,
                    premiumPurchase
                )
            };
        } else if (targetFingerprint) {
            // Sister's Hound
            const targetFingerprintObj = JSON.parse(targetFingerprint) as INemesisPetTargetFingerprint;
            const head = targetFingerprintObj.Parts[0];
            const defaultOverwrites: Partial<IEquipmentDatabase> = {
                ModularParts: targetFingerprintObj.Parts,
                ItemName: targetFingerprintObj.Name,
                Configs: applyDefaultUpgrades(inventory, ExportWeapons[head].defaultUpgrades)
            };
            const itemType = {
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA":
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB":
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC":
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit"
            }[head] as string;
            return {
                ...addEquipment(inventory, "MoaPets", itemType, defaultOverwrites),
                ...occupySlot(inventory, InventorySlot.SENTINELS, premiumPurchase)
            };
        } else {
            // Modular weapon parts
            const miscItemChanges = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                } satisfies IMiscItem
            ];
            addMiscItems(inventory, miscItemChanges);
            return {
                MiscItems: miscItemChanges
            };
        }
    }
    if (typeName in ExportRailjackWeapons) {
        const meta = ExportRailjackWeapons[typeName];
        if (meta.defaultUpgrades?.length) {
            // House versions need to be identified to get stats so put them into raw salvage first.
            const rawSalvageChanges = [
                {
                    ItemType: typeName,
                    ItemCount: quantity
                }
            ];
            addCrewShipRawSalvage(inventory, rawSalvageChanges);
            return { CrewShipRawSalvage: rawSalvageChanges };
        } else {
            // Sigma versions can be added directly.
            if (quantity != 1) {
                throw new Error(`unexpected acquisition quantity of CrewShipWeapon: got ${quantity}, expected 1`);
            }
            return {
                ...addEquipment(inventory, meta.productCategory, typeName),
                ...occupySlot(inventory, InventorySlot.RJ_COMPONENT_AND_ARMAMENTS, premiumPurchase)
            };
        }
    }
    if (typeName in ExportMisc.creditBundles) {
        const creditsTotal = ExportMisc.creditBundles[typeName] * quantity;
        inventory.RegularCredits += creditsTotal;
        return {
            RegularCredits: creditsTotal
        };
    }
    if (typeName in ExportFusionBundles) {
        const fusionPointsTotal = ExportFusionBundles[typeName].fusionPoints * quantity;
        addFusionPoints(inventory, fusionPointsTotal);
        return {
            FusionPoints: fusionPointsTotal
        };
    }
    if (typeName in ExportKeys) {
        // Note: "/Lotus/Types/Keys/" contains some EmailItems
        const key = ExportKeys[typeName];

        if (key.chainStages) {
            const key = addQuestKey(inventory, { ItemType: typeName });
            if (!key) return {};
            return { QuestKeys: [key] };
        } else {
            const levelKeyChanges = [{ ItemType: typeName, ItemCount: quantity }];
            addLevelKeys(inventory, levelKeyChanges);
            return { LevelKeys: levelKeyChanges };
        }
    }
    if (typeName in ExportDrones) {
        // Can only get 1 at a time from crafting, but for convenience's sake, allow up 100 to via the WebUI.
        if (quantity < 0 || quantity > 100) {
            throw new Error(`unexpected acquisition quantity of Drones: got ${quantity}, expected 0..100`);
        }
        for (let i = 0; i != quantity; ++i) {
            return addDrone(inventory, typeName);
        }
    }
    if (typeName in ExportEmailItems) {
        if (quantity != 1) {
            throw new Error(`unexpected acquisition quantity of EmailItems: got ${quantity}, expected 1`);
        }
        return await addEmailItem(inventory, typeName);
    }

    // Boosters are an odd case. They're only added like this via Baro's Void Surplus afaik.
    {
        const boosterEntry = Object.entries(ExportBoosters).find(arr => arr[1].typeName == typeName);
        if (boosterEntry) {
            addBooster(typeName, quantity, inventory);
            return {
                Boosters: [{ ItemType: typeName, ExpiryDate: quantity }]
            };
        }
    }

    // Path-based duck typing
    switch (typeName.substring(1).split("/")[1]) {
        case "Powersuits":
            if (typeName.endsWith("AugmentCard")) break;
            switch (typeName.substring(1).split("/")[2]) {
                default: {
                    return {
                        ...(await addPowerSuit(inventory, typeName, {
                            Features: premiumPurchase ? EquipmentFeatures.DOUBLE_CAPACITY : undefined
                        })),
                        ...occupySlot(inventory, InventorySlot.SUITS, premiumPurchase)
                    };
                }
                case "Archwing": {
                    inventory.ArchwingEnabled = true;
                    return {
                        ...addSpaceSuit(
                            inventory,
                            typeName,
                            {},
                            premiumPurchase ? EquipmentFeatures.DOUBLE_CAPACITY : undefined
                        ),
                        ...occupySlot(inventory, InventorySlot.SPACESUITS, premiumPurchase)
                    };
                }
                case "EntratiMech": {
                    return {
                        ...(await addMechSuit(
                            inventory,
                            typeName,
                            {},
                            premiumPurchase ? EquipmentFeatures.DOUBLE_CAPACITY : undefined
                        )),
                        ...occupySlot(inventory, InventorySlot.MECHSUITS, premiumPurchase)
                    };
                }
            }
            break;
        case "Upgrades": {
            switch (typeName.substring(1).split("/")[2]) {
                case "Mods": // Legendary Core
                case "CosmeticEnhancers": // Traumatic Peculiar
                    {
                        const changes = [
                            {
                                ItemType: typeName,
                                ItemCount: quantity
                            }
                        ];
                        addMods(inventory, changes);
                        return {
                            RawUpgrades: changes
                        };
                    }
                    break;

                case "Boons":
                    // Can purchase /Lotus/Upgrades/Boons/DuviriVendorBoonItem from Acrithis, doesn't need to be added to inventory.
                    return {};

                case "Stickers":
                    {
                        const entry = inventory.RawUpgrades.find(x => x.ItemType == typeName);
                        if (entry && entry.ItemCount >= 10) {
                            const miscItemChanges = [
                                {
                                    ItemType: "/Lotus/Types/Items/MiscItems/1999ConquestBucks",
                                    ItemCount: 1
                                }
                            ];
                            addMiscItems(inventory, miscItemChanges);
                            return {
                                MiscItems: miscItemChanges
                            };
                        } else {
                            const changes = [
                                {
                                    ItemType: typeName,
                                    ItemCount: quantity
                                }
                            ];
                            addMods(inventory, changes);
                            return {
                                RawUpgrades: changes
                            };
                        }
                    }
                    break;

                case "Skins": {
                    return addSkin(inventory, typeName);
                }
            }
            break;
        }
        case "Types":
            switch (typeName.substring(1).split("/")[2]) {
                case "Sentinels": {
                    return addSentinel(inventory, typeName, premiumPurchase);
                }
                case "Game": {
                    if (typeName.substring(1).split("/")[3] == "Projections") {
                        // Void Relics, e.g. /Lotus/Types/Game/Projections/T2VoidProjectionGaussPrimeDBronze
                        const miscItemChanges = [
                            {
                                ItemType: typeName,
                                ItemCount: quantity
                            } satisfies IMiscItem
                        ];
                        addMiscItems(inventory, miscItemChanges);
                        inventory.HasOwnedVoidProjectionsPreviously = true;
                        return {
                            MiscItems: miscItemChanges
                        };
                    } else if (
                        typeName.substring(1).split("/")[3] == "CatbrowPet" ||
                        typeName.substring(1).split("/")[3] == "KubrowPet"
                    ) {
                        if (
                            typeName != "/Lotus/Types/Game/KubrowPet/Eggs/KubrowPetEggItem" &&
                            typeName != "/Lotus/Types/Game/KubrowPet/BlankTraitPrint" &&
                            typeName != "/Lotus/Types/Game/KubrowPet/ImprintedTraitPrint"
                        ) {
                            return addKubrowPet(inventory, typeName, undefined, premiumPurchase);
                        }
                    } else if (typeName.startsWith("/Lotus/Types/Game/CrewShip/CrewMember/")) {
                        if (!seed) {
                            throw new Error(`Expected crew member to have a seed`);
                        }
                        seed |= BigInt(Math.trunc(inventory.Created.getTime() / 1000) & 0xffffff) << 32n;
                        return {
                            ...addCrewMember(inventory, typeName, seed),
                            ...occupySlot(inventory, InventorySlot.CREWMEMBERS, premiumPurchase)
                        };
                    } else if (typeName == "/Lotus/Types/Game/CrewShip/RailJack/DefaultHarness") {
                        return addCrewShipHarness(inventory, typeName);
                    }
                    break;
                }
                case "Items": {
                    if (typeName.substring(1).split("/")[3] == "Emotes") {
                        return addCustomization(inventory, typeName);
                    }
                    break;
                }
                case "NeutralCreatures": {
                    if (inventory.Horses.length != 0) {
                        logger.warn("refusing to add Horse because account already has one");
                        return {};
                    }
                    const horseIndex = inventory.Horses.push({ ItemType: typeName });
                    return {
                        Horses: [inventory.Horses[horseIndex - 1].toJSON<IEquipmentClient>()]
                    };
                }
                case "Vehicles":
                    if (typeName == "/Lotus/Types/Vehicles/Motorcycle/MotorcyclePowerSuit") {
                        return addMotorcycle(inventory, typeName);
                    }
                    break;
                case "Lore":
                    if (typeName == "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentRewards") {
                        const fragmentType = getRandomElement([
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentA",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentB",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentC",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentD",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentE",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentF",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentG",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentH",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentI",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentJ",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentK",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentL",
                            "/Lotus/Types/Lore/Fragments/GrineerGhoulFragments/GhoulFragmentM"
                        ])!;
                        addLoreFragmentScans(inventory, [
                            {
                                Progress: 1,
                                Region: "",
                                ItemType: fragmentType
                            }
                        ]);
                    }
                    break;
            }
            break;
        case "Weapons": {
            if (typeName.substring(1).split("/")[4] == "MeleeTrees") break;
            const productCategory = typeName.substring(1).split("/")[3];
            switch (productCategory) {
                case "Pistols":
                case "LongGuns":
                case "Melee": {
                    const inventoryChanges = addEquipment(inventory, productCategory, typeName);
                    return {
                        ...inventoryChanges,
                        ...occupySlot(
                            inventory,
                            productCategoryToInventoryBin(productCategory) ?? InventorySlot.WEAPONS,
                            premiumPurchase
                        )
                    };
                }
            }
            break;
        }
    }
    throw new Error(`unable to add item: ${typeName}`);
};

export const addItems = async (
    inventory: TInventoryDatabaseDocument,
    items: ITypeCount[] | string[],
    inventoryChanges: IInventoryChanges = {}
): Promise<IInventoryChanges> => {
    let inventoryDelta;
    for (const item of items) {
        if (typeof item === "string") {
            inventoryDelta = await addItem(inventory, item, 1, true);
        } else {
            inventoryDelta = await addItem(inventory, item.ItemType, item.ItemCount, true);
        }
        combineInventoryChanges(inventoryChanges, inventoryDelta);
    }
    return inventoryChanges;
};

export const applyDefaultUpgrades = (
    inventory: TInventoryDatabaseDocument,
    defaultUpgrades: IDefaultUpgrade[] | undefined
): IItemConfig[] => {
    const modsToGive: IRawUpgrade[] = [];
    const configs: IItemConfig[] = [];
    if (defaultUpgrades) {
        const upgrades = [];
        for (const defaultUpgrade of defaultUpgrades) {
            modsToGive.push({ ItemType: defaultUpgrade.ItemType, ItemCount: 1 });
            if (defaultUpgrade.Slot != -1) {
                while (upgrades.length < defaultUpgrade.Slot) {
                    upgrades.push("");
                }
                upgrades[defaultUpgrade.Slot] = defaultUpgrade.ItemType;
            }
        }
        if (upgrades.length != 0) {
            configs.push({ Upgrades: upgrades });
        }
    }
    addMods(inventory, modsToGive);
    return configs;
};

//TODO: maybe genericMethod for all the add methods, they share a lot of logic
const addSentinel = (
    inventory: TInventoryDatabaseDocument,
    sentinelName: string,
    premiumPurchase: boolean,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    // Sentinel itself occupies a slot in the sentinels bin
    combineInventoryChanges(inventoryChanges, occupySlot(inventory, InventorySlot.SENTINELS, premiumPurchase));

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (ExportSentinels[sentinelName]?.defaultWeapon) {
        addSentinelWeapon(inventory, ExportSentinels[sentinelName].defaultWeapon, premiumPurchase, inventoryChanges);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const configs: IItemConfig[] = applyDefaultUpgrades(inventory, ExportSentinels[sentinelName]?.defaultUpgrades);

    const sentinelIndex =
        inventory.Sentinels.push({
            ItemType: sentinelName,
            Configs: configs,
            XP: 0,
            Features: premiumPurchase ? EquipmentFeatures.DOUBLE_CAPACITY : undefined,
            IsNew: inventory.Sentinels.find(x => x.ItemType == sentinelName) ? undefined : true
        }) - 1;
    inventoryChanges.Sentinels ??= [];
    inventoryChanges.Sentinels.push(inventory.Sentinels[sentinelIndex].toJSON<IEquipmentClient>());

    return inventoryChanges;
};

const addSentinelWeapon = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    premiumPurchase: boolean,
    inventoryChanges: IInventoryChanges
): void => {
    // Sentinel weapons also occupy a slot in the sentinels bin
    combineInventoryChanges(inventoryChanges, occupySlot(inventory, InventorySlot.SENTINELS, premiumPurchase));

    const index = inventory.SentinelWeapons.push({ ItemType: typeName, XP: 0 }) - 1;
    inventoryChanges.SentinelWeapons ??= [];
    inventoryChanges.SentinelWeapons.push(inventory.SentinelWeapons[index].toJSON<IEquipmentClient>());
};

export const addPowerSuit = async (
    inventory: TInventoryDatabaseDocument,
    powersuitName: string,
    defaultOverwrites?: Partial<IEquipmentDatabase>,
    inventoryChanges: IInventoryChanges = {}
): Promise<IInventoryChanges> => {
    const powersuit = ExportWarframes[powersuitName] as IPowersuit | undefined;
    const exalted = powersuit?.exalted ?? [];
    for (const specialItem of exalted) {
        addSpecialItem(inventory, specialItem, inventoryChanges);
    }
    if (powersuit?.additionalItems) {
        for (const item of powersuit.additionalItems) {
            if (exalted.indexOf(item) == -1) {
                combineInventoryChanges(inventoryChanges, await addItem(inventory, item, 1));
            }
        }
    }
    const suit: Omit<IEquipmentDatabase, "_id"> = Object.assign(
        {
            ItemType: powersuitName,
            Configs: [],
            UpgradeVer: 101,
            XP: 0,
            IsNew: true
        },
        defaultOverwrites
    );
    if (suit.IsNew) {
        suit.IsNew = !inventory.Suits.find(x => x.ItemType == powersuitName);
    }
    if (!suit.IsNew) {
        suit.IsNew = undefined;
    }
    const suitIndex = inventory.Suits.push(suit) - 1;
    inventoryChanges.Suits ??= [];
    inventoryChanges.Suits.push(inventory.Suits[suitIndex].toJSON<IEquipmentClient>());
    return inventoryChanges;
};

export const addMechSuit = async (
    inventory: TInventoryDatabaseDocument,
    mechsuitName: string,
    inventoryChanges: IInventoryChanges = {},
    features?: number
): Promise<IInventoryChanges> => {
    const powersuit = ExportWarframes[mechsuitName] as IPowersuit | undefined;
    const exalted = powersuit?.exalted ?? [];
    for (const specialItem of exalted) {
        addSpecialItem(inventory, specialItem, inventoryChanges);
    }
    if (powersuit?.additionalItems) {
        for (const item of powersuit.additionalItems) {
            if (exalted.indexOf(item) == -1) {
                combineInventoryChanges(inventoryChanges, await addItem(inventory, item, 1));
            }
        }
    }
    const suitIndex =
        inventory.MechSuits.push({
            ItemType: mechsuitName,
            Configs: [],
            UpgradeVer: 101,
            XP: 0,
            Features: features,
            IsNew: inventory.MechSuits.find(x => x.ItemType == mechsuitName) ? undefined : true
        }) - 1;
    inventoryChanges.MechSuits ??= [];
    inventoryChanges.MechSuits.push(inventory.MechSuits[suitIndex].toJSON<IEquipmentClient>());
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
    inventoryChanges.SpecialItems.push(inventory.SpecialItems[specialItemIndex].toJSON<IEquipmentClient>());
};

export const addSpaceSuit = (
    inventory: TInventoryDatabaseDocument,
    spacesuitName: string,
    inventoryChanges: IInventoryChanges = {},
    features?: number
): IInventoryChanges => {
    const suitIndex =
        inventory.SpaceSuits.push({
            ItemType: spacesuitName,
            Configs: [],
            UpgradeVer: 101,
            XP: 0,
            Features: features,
            IsNew: inventory.SpaceSuits.find(x => x.ItemType == spacesuitName) ? undefined : true
        }) - 1;
    inventoryChanges.SpaceSuits ??= [];
    inventoryChanges.SpaceSuits.push(inventory.SpaceSuits[suitIndex].toJSON<IEquipmentClient>());
    return inventoryChanges;
};

const createRandomTraits = (kubrowPetName: string, traitsPool: TTraitsPool): ITraits => {
    return {
        BaseColor: getRandomWeightedReward(traitsPool.Colors, kubrowWeights)!.type,
        SecondaryColor: getRandomWeightedReward(traitsPool.Colors, kubrowWeights)!.type,
        TertiaryColor: getRandomWeightedReward(traitsPool.Colors, kubrowWeights)!.type,
        AccentColor: getRandomWeightedReward(traitsPool.Colors, kubrowWeights)!.type,
        EyeColor: getRandomWeightedReward(traitsPool.EyeColors, kubrowWeights)!.type,
        FurPattern: getRandomWeightedReward(traitsPool.FurPatterns, kubrowFurPatternsWeights)!.type,
        Personality: kubrowPetName,
        BodyType: getRandomWeightedReward(traitsPool.BodyTypes, kubrowWeights)!.type,
        Head: traitsPool.Heads.length ? getRandomWeightedReward(traitsPool.Heads, kubrowWeights)!.type : undefined,
        Tail: traitsPool.Tails.length ? getRandomWeightedReward(traitsPool.Tails, kubrowWeights)!.type : undefined
    };
};

export const addKubrowPet = (
    inventory: TInventoryDatabaseDocument,
    kubrowPetName: string,
    details?: IKubrowPetDetailsDatabase,
    premiumPurchase: boolean = false,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    combineInventoryChanges(inventoryChanges, occupySlot(inventory, InventorySlot.SENTINELS, premiumPurchase));

    // TODO: When incubating, this should only be given when claiming the recipe.
    const kubrowPet = ExportSentinels[kubrowPetName] as ISentinel | undefined;
    const exalted = kubrowPet?.exalted ?? [];
    for (const specialItem of exalted) {
        addSpecialItem(inventory, specialItem, inventoryChanges);
    }

    const configs: IItemConfig[] = applyDefaultUpgrades(inventory, kubrowPet?.defaultUpgrades);

    if (!details) {
        const isCatbrow = [
            "/Lotus/Types/Game/CatbrowPet/CheshireCatbrowPetPowerSuit",
            "/Lotus/Types/Game/CatbrowPet/MirrorCatbrowPetPowerSuit",
            "/Lotus/Types/Game/CatbrowPet/VampireCatbrowPetPowerSuit"
        ].includes(kubrowPetName);

        const traitsPool = isCatbrow ? catbrowDetails : kubrowDetails;
        let dominantTraits: ITraits;
        if (kubrowPetName == "/Lotus/Types/Game/CatbrowPet/VampireCatbrowPetPowerSuit") {
            dominantTraits = {
                BaseColor: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseVampire",
                SecondaryColor: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorSecondaryVampire",
                TertiaryColor: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorTertiaryVampire",
                AccentColor: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorAccentsVampire",
                EyeColor: "/Lotus/Types/Game/CatbrowPet/Colors/CatbrowPetColorBaseA",
                FurPattern: "/Lotus/Types/Game/CatbrowPet/Patterns/CatbrowPetPatternVampire",
                Personality: kubrowPetName,
                BodyType: "/Lotus/Types/Game/CatbrowPet/BodyTypes/CatbrowPetVampireBodyType",
                Head: "/Lotus/Types/Game/CatbrowPet/Heads/CatbrowHeadVampire",
                Tail: "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailVampire"
            };
        } else {
            dominantTraits = createRandomTraits(kubrowPetName, traitsPool);
            if (kubrowPetName == "/Lotus/Types/Game/KubrowPet/ChargerKubrowPetPowerSuit") {
                dominantTraits.BodyType = "/Lotus/Types/Game/KubrowPet/BodyTypes/ChargerKubrowPetBodyType";
                dominantTraits.FurPattern = "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternInfested";
            }
        }

        const recessiveTraits: ITraits = createRandomTraits(
            getRandomElement(
                isCatbrow
                    ? [
                          "/Lotus/Types/Game/CatbrowPet/MirrorCatbrowPetPowerSuit",
                          "/Lotus/Types/Game/CatbrowPet/CheshireCatbrowPetPowerSuit"
                      ]
                    : [
                          "/Lotus/Types/Game/KubrowPet/AdventurerKubrowPetPowerSuit",
                          "/Lotus/Types/Game/KubrowPet/FurtiveKubrowPetPowerSuit",
                          "/Lotus/Types/Game/KubrowPet/GuardKubrowPetPowerSuit",
                          "/Lotus/Types/Game/KubrowPet/HunterKubrowPetPowerSuit",
                          "/Lotus/Types/Game/KubrowPet/RetrieverKubrowPetPowerSuit"
                      ]
            )!,
            traitsPool
        );
        for (const key of Object.keys(recessiveTraits) as (keyof ITraits)[]) {
            // My heurstic approximation is a 20% chance for a dominant trait to be copied into the recessive traits. TODO: A more scientific statistical analysis maybe?
            if (Math.random() < 0.2) {
                recessiveTraits[key] = dominantTraits[key]!;
            }
        }

        details = {
            Name: "",
            IsPuppy: !premiumPurchase,
            HasCollar: true,
            PrintsRemaining: isCatbrow ? 3 : 2,
            Status: premiumPurchase ? Status.StatusStasis : Status.StatusIncubating,
            HatchDate: premiumPurchase ? new Date() : new Date(Date.now() + 10 * unixTimesInMs.hour), // On live, this seems to be somewhat randomised so that the pet hatches 9~11 hours after start.
            IsMale: !!getRandomInt(0, 1),
            Size: getRandomInt(70, 100) / 100,
            DominantTraits: dominantTraits,
            RecessiveTraits: recessiveTraits
        };
    }

    const kubrowPetIndex =
        inventory.KubrowPets.push({
            ItemType: kubrowPetName,
            Configs: configs,
            XP: 0,
            Details: details,
            IsNew: inventory.KubrowPets.find(x => x.ItemType == kubrowPetName) ? undefined : true
        }) - 1;
    inventoryChanges.KubrowPets ??= [];
    inventoryChanges.KubrowPets.push(inventory.KubrowPets[kubrowPetIndex].toJSON<IEquipmentClient>());

    return inventoryChanges;
};

export const addKubrowPetPrint = (
    inventory: TInventoryDatabaseDocument,
    pet: IEquipmentDatabase,
    inventoryChanges: IInventoryChanges
): void => {
    inventoryChanges.KubrowPetPrints ??= [];
    inventoryChanges.KubrowPetPrints.push(
        inventory.KubrowPetPrints[
            inventory.KubrowPetPrints.push({
                ItemType: "/Lotus/Types/Game/KubrowPet/ImprintedTraitPrint",
                Name: pet.Details!.Name,
                IsMale: pet.Details!.IsMale,
                Size: pet.Details!.Size,
                DominantTraits: pet.Details!.DominantTraits,
                RecessiveTraits: pet.Details!.RecessiveTraits
            }) - 1
        ].toJSON<IKubrowPetPrintClient>()
    );
};

export const updateSlots = (
    inventory: TInventoryDatabaseDocument,
    slotName: SlotNames,
    slotAmount: number,
    extraAmount: number
): void => {
    inventory[slotName].Slots += slotAmount;
    if (extraAmount != 0) {
        inventory[slotName].Extra ??= 0;
        inventory[slotName].Extra += extraAmount;
    }
};

const isCurrencyTracked = (inventory: TInventoryDatabaseDocument, usePremium: boolean): boolean => {
    return usePremium ? !inventory.infinitePlatinum : !inventory.infiniteCredits;
};

export const updateCurrency = (
    inventory: TInventoryDatabaseDocument,
    price: number,
    usePremium: boolean,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (price != 0 && isCurrencyTracked(inventory, usePremium)) {
        if (usePremium) {
            if (inventory.PremiumCreditsFree > 0) {
                const premiumCreditsFreeDelta = Math.min(price, inventory.PremiumCreditsFree) * -1;
                inventoryChanges.PremiumCreditsFree ??= 0;
                inventoryChanges.PremiumCreditsFree += premiumCreditsFreeDelta;
                inventory.PremiumCreditsFree += premiumCreditsFreeDelta;
            }
            inventoryChanges.PremiumCredits ??= 0;
            inventoryChanges.PremiumCredits -= price;
            inventory.PremiumCredits -= price;
            logger.debug(`currency changes `, { PremiumCredits: -price });
        } else {
            inventoryChanges.RegularCredits ??= 0;
            inventoryChanges.RegularCredits -= price;
            inventory.RegularCredits -= price;
            logger.debug(`currency changes `, { RegularCredits: -price });
        }
    }
    return inventoryChanges;
};

export const addFusionPoints = (inventory: TInventoryDatabaseDocument, add: number): number => {
    if (inventory.FusionPoints + add > 2147483647) {
        logger.warn(`capping FusionPoints balance at 2147483647`);
        add = 2147483647 - inventory.FusionPoints;
    }
    inventory.FusionPoints += add;
    return add;
};

export const addCrewShipFusionPoints = (inventory: TInventoryDatabaseDocument, add: number): number => {
    if (inventory.CrewShipFusionPoints + add > 2147483647) {
        logger.warn(`capping CrewShipFusionPoints balance at 2147483647`);
        add = 2147483647 - inventory.CrewShipFusionPoints;
    }
    inventory.CrewShipFusionPoints += add;
    return add;
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

const getStandingLimit = (inventory: TInventoryDatabaseDocument, bin: TStandingLimitBin): number => {
    if (bin == "STANDING_LIMIT_BIN_NONE" || inventory.noDailyStandingLimits) {
        return Number.MAX_SAFE_INTEGER;
    }
    return inventory[standingLimitBinToInventoryKey[bin]];
};

const updateStandingLimit = (
    inventory: TInventoryDatabaseDocument,
    bin: TStandingLimitBin,
    subtrahend: number
): void => {
    if (bin != "STANDING_LIMIT_BIN_NONE" && !inventory.noDailyStandingLimits) {
        inventory[standingLimitBinToInventoryKey[bin]] -= subtrahend;
    }
};

export const addStanding = (
    inventory: TInventoryDatabaseDocument,
    syndicateTag: string,
    gainedStanding: number,
    affiliationMods: IAffiliationMods[] = [],
    isMedallion: boolean = false,
    propagateAlignments: boolean = true
): void => {
    let syndicate = inventory.Affiliations.find(x => x.Tag == syndicateTag);
    const syndicateMeta = ExportSyndicates[syndicateTag];

    if (!syndicate) {
        syndicate =
            inventory.Affiliations[inventory.Affiliations.push({ Tag: syndicateTag, Standing: 0, Title: 0 }) - 1];
    }

    const max = getMaxStanding(syndicateMeta, syndicate.Title ?? 0);
    if (syndicate.Standing + gainedStanding > max) gainedStanding = max - syndicate.Standing;

    if (syndicate.Standing + gainedStanding < -71000) {
        gainedStanding = -71000 - syndicate.Standing;
    }

    if (!isMedallion || syndicateMeta.medallionsCappedByDailyLimit) {
        if (gainedStanding > getStandingLimit(inventory, syndicateMeta.dailyLimitBin)) {
            gainedStanding = getStandingLimit(inventory, syndicateMeta.dailyLimitBin);
        }
        updateStandingLimit(inventory, syndicateMeta.dailyLimitBin, gainedStanding);
    }

    syndicate.Standing += gainedStanding;
    const affiliationMod: IAffiliationMods = {
        Tag: syndicateTag,
        Standing: gainedStanding
    };
    affiliationMods.push(affiliationMod);

    if (syndicateMeta.alignments) {
        if (propagateAlignments) {
            for (const [tag, factor] of Object.entries(syndicateMeta.alignments)) {
                addStanding(inventory, tag, gainedStanding * factor, affiliationMods, isMedallion, false);
            }
        } else {
            while (syndicate.Standing < getMinStanding(syndicateMeta, syndicate.Title ?? 0)) {
                syndicate.Title ??= 0;
                syndicate.Title -= 1;
                affiliationMod.Title ??= 0;
                affiliationMod.Title -= 1;
                logger.debug(`${syndicateTag} is decreasing to title ${syndicate.Title} after applying alignment`);
            }
        }
    }
};

// TODO: AffiliationMods support (Nightwave).
export const updateGeneric = async (data: IGenericUpdate, accountId: string): Promise<IUpdateNodeIntrosResponse> => {
    const inventory = await getInventory(accountId, "NodeIntrosCompleted MiscItems ShipDecorations");

    // Make it an array for easier parsing.
    if (typeof data.NodeIntrosCompleted === "string") {
        data.NodeIntrosCompleted = [data.NodeIntrosCompleted];
    }

    const inventoryChanges: IInventoryChanges = {};
    for (const node of data.NodeIntrosCompleted) {
        if (node == "TC2025") {
            inventoryChanges.ShipDecorations = [
                {
                    ItemType: "/Lotus/Types/Items/ShipDecos/TauGrineerLancerBobbleHead",
                    ItemCount: 1
                }
            ];
            addShipDecorations(inventory, inventoryChanges.ShipDecorations);
        } else if (node == "KayaFirstVisitPack") {
            inventoryChanges.MiscItems = [
                {
                    ItemType: "/Lotus/Types/Items/MiscItems/1999FixedStickersPack",
                    ItemCount: 1
                }
            ];
            addMiscItems(inventory, inventoryChanges.MiscItems);
        } else if (node == "BeatCaliberChicks") {
            await addEmailItem(inventory, "/Lotus/Types/Items/EmailItems/BeatCaliberChicksEmailItem", inventoryChanges);
        } else if (node == "ClearedFiveLoops") {
            await addEmailItem(inventory, "/Lotus/Types/Items/EmailItems/ClearedFiveLoopsEmailItem", inventoryChanges);
        }
    }

    // Combine the two arrays into one.
    data.NodeIntrosCompleted = inventory.NodeIntrosCompleted.concat(data.NodeIntrosCompleted);

    // Remove duplicate entries.
    const nodes = [...new Set(data.NodeIntrosCompleted)];

    inventory.NodeIntrosCompleted = nodes;
    await inventory.save();

    return {
        MissionRewards: [],
        InventoryChanges: inventoryChanges
    };
};

export const addEquipment = (
    inventory: TInventoryDatabaseDocument,
    category: TEquipmentKey,
    type: string,
    defaultOverwrites?: Partial<IEquipmentDatabase>,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const equipment: Omit<IEquipmentDatabase, "_id"> = Object.assign(
        {
            ItemType: type,
            Configs: [],
            XP: 0,
            IsNew: category != "CrewShipWeapons" && category != "CrewShipSalvagedWeapons"
        },
        defaultOverwrites
    );
    if (equipment.IsNew) {
        equipment.IsNew = !inventory[category].find(x => x.ItemType == type);
    }
    if (!equipment.IsNew) {
        equipment.IsNew = undefined;
    }
    const index = inventory[category].push(equipment) - 1;

    inventoryChanges[category] ??= [];
    inventoryChanges[category].push(inventory[category][index].toJSON<IEquipmentClient>());
    return inventoryChanges;
};

export const addCustomization = (
    inventory: TInventoryDatabaseDocument,
    customizationName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (!inventory.FlavourItems.some(x => x.ItemType == customizationName)) {
        const flavourItemIndex = inventory.FlavourItems.push({ ItemType: customizationName }) - 1;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        inventoryChanges.FlavourItems ??= [];
        (inventoryChanges.FlavourItems as IFlavourItem[]).push(
            inventory.FlavourItems[flavourItemIndex].toJSON<IFlavourItem>()
        );
    }
    return inventoryChanges;
};

export const addSkin = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (inventory.WeaponSkins.some(x => x.ItemType == typeName)) {
        logger.debug(`refusing to add WeaponSkin ${typeName} because account already owns it`);
    } else {
        const index =
            inventory.WeaponSkins.push({
                ItemType: typeName,
                IsNew: typeName.startsWith("/Lotus/Upgrades/Skins/RailJack/") ? undefined : true // railjack skins are incompatible with this flag
            }) - 1;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        inventoryChanges.WeaponSkins ??= [];
        (inventoryChanges.WeaponSkins as IWeaponSkinClient[]).push(
            inventory.WeaponSkins[index].toJSON<IWeaponSkinClient>()
        );
    }
    return inventoryChanges;
};

export const addCrewShipWeaponSkin = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    upgradeFingerprint: string | undefined,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const index =
        inventory.CrewShipWeaponSkins.push({ ItemType: typeName, UpgradeFingerprint: upgradeFingerprint }) - 1;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    inventoryChanges.CrewShipWeaponSkins ??= [];
    (inventoryChanges.CrewShipWeaponSkins as IUpgradeClient[]).push(
        inventory.CrewShipWeaponSkins[index].toJSON<IUpgradeClient>()
    );
    return inventoryChanges;
};

export const addCrewShipSalvagedWeaponSkin = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    upgradeFingerprint: string | undefined,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const index =
        inventory.CrewShipSalvagedWeaponSkins.push({ ItemType: typeName, UpgradeFingerprint: upgradeFingerprint }) - 1;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    inventoryChanges.CrewShipSalvagedWeaponSkins ??= [];
    (inventoryChanges.CrewShipSalvagedWeaponSkins as IUpgradeClient[]).push(
        inventory.CrewShipSalvagedWeaponSkins[index].toJSON<IUpgradeClient>()
    );
    return inventoryChanges;
};

const addCrewShip = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (inventory.CrewShips.length != 0) {
        logger.warn("refusing to add CrewShip because account already has one");
    } else {
        const index = inventory.CrewShips.push({ ItemType: typeName }) - 1;
        inventoryChanges.CrewShips ??= [];
        inventoryChanges.CrewShips.push(inventory.CrewShips[index].toJSON<IEquipmentClient>());
    }
    return inventoryChanges;
};

const addCrewShipHarness = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (inventory.CrewShipHarnesses.length != 0) {
        logger.warn("refusing to add CrewShipHarness because account already has one");
    } else {
        const index = inventory.CrewShipHarnesses.push({ ItemType: typeName }) - 1;
        inventoryChanges.CrewShipHarnesses ??= [];
        inventoryChanges.CrewShipHarnesses.push(inventory.CrewShipHarnesses[index].toJSON<IEquipmentClient>());
    }
    return inventoryChanges;
};

const addMotorcycle = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    if (inventory.Motorcycles.length != 0) {
        logger.warn("refusing to add Motorcycle because account already has one");
    } else {
        const index = inventory.Motorcycles.push({ ItemType: typeName }) - 1;
        inventoryChanges.Motorcycles ??= [];
        inventoryChanges.Motorcycles.push(inventory.Motorcycles[index].toJSON<IEquipmentClient>());
    }
    return inventoryChanges;
};

const addDrone = (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    const index = inventory.Drones.push({ ItemType: typeName, CurrentHP: ExportDrones[typeName].durability }) - 1;
    inventoryChanges.Drones ??= [];
    inventoryChanges.Drones.push(inventory.Drones[index].toJSON<IDroneClient>());
    return inventoryChanges;
};

/*const getCrewMemberSkills = (seed: bigint, skillPointsToAssign: number): Record<string, number> => {
    const rng = new SRng(seed);

    const skills = ["PILOTING", "GUNNERY", "ENGINEERING", "COMBAT", "SURVIVABILITY"];
    for (let i = 1; i != 5; ++i) {
        const swapIndex = rng.randomInt(0, i);
        if (swapIndex != i) {
            const tmp = skills[i];
            skills[i] = skills[swapIndex];
            skills[swapIndex] = tmp;
        }
    }

    rng.randomFloat(); // unused afaict

    const skillAssignments = [0, 0, 0, 0, 0];
    for (let skill = 0; skillPointsToAssign; skill = (skill + 1) % 5) {
        const maxIncrease = Math.min(5 - skillAssignments[skill], skillPointsToAssign);
        const increase = rng.randomInt(0, maxIncrease);
        skillAssignments[skill] += increase;
        skillPointsToAssign -= increase;
    }

    skillAssignments.sort((a, b) => b - a);

    const combined: Record<string, number> = {};
    for (let i = 0; i != 5; ++i) {
        combined[skills[i]] = skillAssignments[i];
    }
    return combined;
};*/

const addCrewMember = (
    inventory: TInventoryDatabaseDocument,
    itemType: string,
    seed: bigint,
    inventoryChanges: IInventoryChanges = {}
): IInventoryChanges => {
    // SkillEfficiency is additional to the base stats, so we don't need to compute this
    //const skillPointsToAssign = itemType.endsWith("Strong") ? 12 : itemType.indexOf("Medium") != -1 ? 10 : 8;
    //const skills = getCrewMemberSkills(seed, skillPointsToAssign);

    // Arbiters = male
    // CephalonSuda = female
    // NewLoka = female
    // Perrin = male
    // RedVeil = male
    // SteelMeridian = female
    const powersuitType =
        itemType.indexOf("Arbiters") != -1 || itemType.indexOf("Perrin") != -1 || itemType.indexOf("RedVeil") != -1
            ? "/Lotus/Powersuits/NpcPowersuits/CrewMemberMaleSuit"
            : "/Lotus/Powersuits/NpcPowersuits/CrewMemberFemaleSuit";

    const index =
        inventory.CrewMembers.push({
            ItemType: itemType,
            NemesisFingerprint: 0n,
            Seed: seed,
            SkillEfficiency: {
                PILOTING: { Assigned: 0 },
                GUNNERY: { Assigned: 0 },
                ENGINEERING: { Assigned: 0 },
                COMBAT: { Assigned: 0 },
                SURVIVABILITY: { Assigned: 0 }
            },
            PowersuitType: powersuitType
        }) - 1;
    inventoryChanges.CrewMembers ??= [];
    inventoryChanges.CrewMembers.push(inventory.CrewMembers[index].toJSON<ICrewMemberClient>());
    return inventoryChanges;
};

export const addEmailItem = async (
    inventory: TInventoryDatabaseDocument,
    typeName: string,
    inventoryChanges: IInventoryChanges = {}
): Promise<IInventoryChanges> => {
    const meta = ExportEmailItems[typeName];
    const emailItem = inventory.EmailItems.find(x => x.ItemType == typeName);
    if (!emailItem || !meta.sendOnlyOnce) {
        const msg: IMessageCreationTemplate = convertInboxMessage(meta.message);
        if (msg.cinematic == "/Lotus/Levels/1999/PlayerHomeBalconyCinematics.level") {
            msg.customData = JSON.stringify({
                Tag: msg.customData + "KissCin",
                CinLoadout: {
                    Skins: inventory.AdultOperatorLoadOuts[0].Skins,
                    Upgrades: inventory.AdultOperatorLoadOuts[0].Upgrades,
                    attcol: inventory.AdultOperatorLoadOuts[0].attcol,
                    cloth: inventory.AdultOperatorLoadOuts[0].cloth,
                    eyecol: inventory.AdultOperatorLoadOuts[0].eyecol,
                    pricol: inventory.AdultOperatorLoadOuts[0].pricol,
                    syancol: inventory.AdultOperatorLoadOuts[0].syancol
                }
            });
        }
        await createMessage(inventory.accountOwnerId, [msg]);

        if (emailItem) {
            emailItem.ItemCount += 1;
        } else {
            inventory.EmailItems.push({ ItemType: typeName, ItemCount: 1 });
        }

        inventoryChanges.EmailItems ??= [];
        inventoryChanges.EmailItems.push({ ItemType: typeName, ItemCount: 1 });
    }
    return inventoryChanges;
};

const xpEarningParts: readonly string[] = [
    "LWPT_BLADE",
    "LWPT_GUN_BARREL",
    "LWPT_AMP_OCULUS",
    "LWPT_MOA_HEAD",
    "LWPT_ZANUKA_HEAD",
    "LWPT_HB_DECK"
];

export const applyClientEquipmentUpdates = (
    inventory: TInventoryDatabaseDocument,
    gearArray: IEquipmentClient[],
    categoryName: TEquipmentKey
): void => {
    const category = inventory[categoryName];

    gearArray.forEach(({ ItemId, XP, InfestationDate }) => {
        const item = category.id(fromOid(ItemId));
        if (!item) {
            logger.warn(`Skipping unknown ${categoryName} item: id ${fromOid(ItemId)} not found`);
            return;
        }

        if (XP) {
            item.XP ??= 0;
            item.XP += XP;

            if (
                categoryName != "SpecialItems" ||
                item.ItemType == "/Lotus/Powersuits/Khora/Kavat/KhoraKavatPowerSuit" ||
                item.ItemType == "/Lotus/Powersuits/Khora/Kavat/KhoraPrimeKavatPowerSuit"
            ) {
                let xpItemType = item.ItemType;
                if (item.ModularParts) {
                    for (const part of item.ModularParts) {
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        const partType = ExportWeapons[part]?.partType;
                        if (partType !== undefined && xpEarningParts.indexOf(partType) != -1) {
                            xpItemType = part;
                            break;
                        }
                    }
                    logger.debug(`adding xp to ${xpItemType} for modular item ${fromOid(ItemId)} (${item.ItemType})`);
                }

                const xpinfoIndex = inventory.XPInfo.findIndex(x => x.ItemType == xpItemType);
                if (xpinfoIndex !== -1) {
                    const xpinfo = inventory.XPInfo[xpinfoIndex];
                    xpinfo.XP += XP;
                } else {
                    inventory.XPInfo.push({
                        ItemType: xpItemType,
                        XP: XP
                    });
                }
            }
        }

        if (InfestationDate) {
            // 2147483647000 means cured, otherwise became infected
            item.InfestationDate =
                InfestationDate.$date.$numberLong == "2147483647000" ? new Date(0) : fromMongoDate(InfestationDate);
        }
    });
};

export const addMiscItem = (
    inventory: TInventoryDatabaseDocument,
    type: string,
    count: number,
    inventoryChanges: IInventoryChanges = {}
): void => {
    const miscItemChanges: IMiscItem[] = [
        {
            ItemType: type,
            ItemCount: count
        }
    ];
    addMiscItems(inventory, miscItemChanges);
    combineInventoryChanges(inventoryChanges, { MiscItems: miscItemChanges });
};

export const addMiscItems = (inventory: TInventoryDatabaseDocument, itemsArray: IMiscItem[]): void => {
    const { MiscItems } = inventory;

    itemsArray.forEach(({ ItemCount, ItemType }) => {
        if (ItemCount == 0) {
            return;
        }

        let itemIndex = MiscItems.findIndex(x => x.ItemType === ItemType);
        if (itemIndex == -1) {
            itemIndex = MiscItems.push({ ItemType, ItemCount: 0 }) - 1;
        }

        MiscItems[itemIndex].ItemCount += ItemCount;

        if (ItemType == "/Lotus/Types/Items/MiscItems/ArgonCrystal" && ItemCount > 0) {
            inventory.FoundToday ??= [];
            let foundTodayIndex = inventory.FoundToday.findIndex(x => x.ItemType == ItemType);
            if (foundTodayIndex == -1) {
                foundTodayIndex = inventory.FoundToday.push({ ItemType, ItemCount: 0 }) - 1;
            }
            inventory.FoundToday[foundTodayIndex].ItemCount += ItemCount;
            if (inventory.FoundToday[foundTodayIndex].ItemCount <= 0) {
                inventory.FoundToday.splice(foundTodayIndex, 1);
            }
            if (inventory.FoundToday.length == 0) {
                inventory.FoundToday = undefined;
            }
        }

        if (MiscItems[itemIndex].ItemCount == 0) {
            MiscItems.splice(itemIndex, 1);
        } else if (MiscItems[itemIndex].ItemCount <= 0) {
            logger.warn(`inventory.MiscItems has a negative count for ${ItemType}`);
        }
    });
};

const applyArrayChanges = (
    inventory: TInventoryDatabaseDocument,
    key: "ShipDecorations" | "Consumables" | "CrewShipRawSalvage" | "CrewShipAmmo" | "Recipes" | "LevelKeys",
    changes: ITypeCount[]
): void => {
    const arr: ITypeCount[] = inventory[key];
    for (const change of changes) {
        if (change.ItemCount != 0) {
            let itemIndex = arr.findIndex(x => x.ItemType === change.ItemType);
            if (itemIndex == -1) {
                itemIndex = arr.push({ ItemType: change.ItemType, ItemCount: 0 }) - 1;
            }

            arr[itemIndex].ItemCount += change.ItemCount;
            if (arr[itemIndex].ItemCount == 0) {
                arr.splice(itemIndex, 1);
            } else if (arr[itemIndex].ItemCount <= 0) {
                logger.warn(`inventory.${key} has a negative count for ${change.ItemType}`);
            }
        }
    }
};

export const addShipDecorations = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[]): void => {
    applyArrayChanges(inventory, "ShipDecorations", itemsArray);
};

export const addConsumables = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[]): void => {
    applyArrayChanges(inventory, "Consumables", itemsArray);
};

export const addCrewShipRawSalvage = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[]): void => {
    applyArrayChanges(inventory, "CrewShipRawSalvage", itemsArray);
};

export const addCrewShipAmmo = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[]): void => {
    applyArrayChanges(inventory, "CrewShipAmmo", itemsArray);
};

export const addRecipes = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[]): void => {
    applyArrayChanges(inventory, "Recipes", itemsArray);
};

export const addLevelKeys = (inventory: TInventoryDatabaseDocument, itemsArray: ITypeCount[]): void => {
    applyArrayChanges(inventory, "LevelKeys", itemsArray);
};

export const addMods = (inventory: TInventoryDatabaseDocument, itemsArray: IRawUpgrade[]): void => {
    const { RawUpgrades } = inventory;

    itemsArray.forEach(({ ItemType, ItemCount }) => {
        if (ItemCount == 0) {
            return;
        }

        let itemIndex = RawUpgrades.findIndex(x => x.ItemType === ItemType);
        if (itemIndex == -1) {
            itemIndex = RawUpgrades.push({ ItemType, ItemCount: 0 }) - 1;
        }

        RawUpgrades[itemIndex].ItemCount += ItemCount;
        if (RawUpgrades[itemIndex].ItemCount == 0) {
            RawUpgrades.splice(itemIndex, 1);
        } else if (RawUpgrades[itemIndex].ItemCount <= 0) {
            logger.warn(`inventory.RawUpgrades has a negative count for ${ItemType}`);
        }
    });
};

export const addFusionTreasures = (inventory: TInventoryDatabaseDocument, itemsArray: IFusionTreasure[]): void => {
    const { FusionTreasures } = inventory;
    itemsArray.forEach(({ ItemType, ItemCount, Sockets }) => {
        const itemIndex = FusionTreasures.findIndex(i => i.ItemType == ItemType && (i.Sockets || 0) == (Sockets || 0));

        if (itemIndex !== -1) {
            FusionTreasures[itemIndex].ItemCount += ItemCount;
            if (FusionTreasures[itemIndex].ItemCount == 0) {
                FusionTreasures.splice(itemIndex, 1);
            } else if (FusionTreasures[itemIndex].ItemCount <= 0) {
                logger.warn(`inventory.FusionTreasures has a negative count for ${ItemType}`);
            }
        } else {
            FusionTreasures.push({ ItemCount, ItemType, Sockets });
        }
    });
};

export const addFocusXpIncreases = (inventory: TInventoryDatabaseDocument, focusXpPlus: number[]): void => {
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

    inventory.FocusXP ??= {};
    if (focusXpPlus[FocusType.AP_ATTACK]) {
        inventory.FocusXP.AP_ATTACK ??= 0;
        inventory.FocusXP.AP_ATTACK += focusXpPlus[FocusType.AP_ATTACK];
    }
    if (focusXpPlus[FocusType.AP_DEFENSE]) {
        inventory.FocusXP.AP_DEFENSE ??= 0;
        inventory.FocusXP.AP_DEFENSE += focusXpPlus[FocusType.AP_DEFENSE];
    }
    if (focusXpPlus[FocusType.AP_TACTIC]) {
        inventory.FocusXP.AP_TACTIC ??= 0;
        inventory.FocusXP.AP_TACTIC += focusXpPlus[FocusType.AP_TACTIC];
    }
    if (focusXpPlus[FocusType.AP_POWER]) {
        inventory.FocusXP.AP_POWER ??= 0;
        inventory.FocusXP.AP_POWER += focusXpPlus[FocusType.AP_POWER];
    }
    if (focusXpPlus[FocusType.AP_WARD]) {
        inventory.FocusXP.AP_WARD ??= 0;
        inventory.FocusXP.AP_WARD += focusXpPlus[FocusType.AP_WARD];
    }

    if (!inventory.noDailyFocusLimit) {
        inventory.DailyFocus -= focusXpPlus.reduce((a, b) => a + b, 0);
    }
};

export const addLoreFragmentScans = (inventory: TInventoryDatabaseDocument, arr: ILoreFragmentScan[]): void => {
    arr.forEach(clientFragment => {
        const fragment = inventory.LoreFragmentScans.find(x => x.ItemType == clientFragment.ItemType);
        if (fragment) {
            fragment.Progress += clientFragment.Progress;
        } else {
            inventory.LoreFragmentScans.push(clientFragment);
        }
    });
};

const challengeRewardsInboxMessages: Record<string, IMessageCreationTemplate> = {
    SentEvoEphemeraRankOne: {
        sub: "/Lotus/Language/Inbox/EvolvingEphemeraUnlockAName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingEphemeraUnlockADesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: ["/Lotus/Upgrades/Skins/Effects/NarmerEvolvingEphemeraB"]
    },
    SentEvoEphemeraRankTwo: {
        sub: "/Lotus/Language/Inbox/EvolvingEphemeraUnlockBName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingEphemeraUnlockBDesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: ["/Lotus/Upgrades/Skins/Effects/NarmerEvolvingEphemeraC"]
    },
    SentEvoSyandanaRankOne: {
        sub: "/Lotus/Language/Inbox/EvolvingSyandanaUnlockAName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingSyandanaUnlockADesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: ["/Lotus/Upgrades/Skins/Scarves/NarmerEvolvingSyandanaBCape"]
    },
    SentEvoSyandanaRankTwo: {
        sub: "/Lotus/Language/Inbox/EvolvingSyandanaUnlockBName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingSyandanaUnlockBDesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: ["/Lotus/Upgrades/Skins/Scarves/NarmerEvolvingSyandanaCCape"]
    },
    SentEvoSekharaRankOne: {
        sub: "/Lotus/Language/Inbox/EvolvingSekharaUnlockAName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingSekharaUnlockADesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: ["/Lotus/Upgrades/Skins/Clan/ZarimanEvolvingSekharaBadgeItemB"]
    },
    SentEvoSekharaRankTwo: {
        sub: "/Lotus/Language/Inbox/EvolvingSekharaUnlockBName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingSekharaUnlockBDesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: ["/Lotus/Upgrades/Skins/Clan/ZarimanEvolvingSekharaBadgeItemC"]
    },
    // In theory, the following should only give what is owned, but based on the limited information I can find, DE may have simply taken the easy way: https://www.reddit.com/r/Warframe/comments/rzlnku/receiving_all_protovyre_armor_evolution_but_only/
    SentEvoArmorRankOne: {
        sub: "/Lotus/Language/Inbox/EvolvingArmorUnlockAName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingArmorUnlockADesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: [
            "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2A",
            "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2C",
            "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2L"
        ]
    },
    SentEvoArmorRankTwo: {
        sub: "/Lotus/Language/Inbox/EvolvingArmorUnlockBName",
        sndr: "/Lotus/Language/Bosses/Ordis",
        msg: "/Lotus/Language/Inbox/EvolvingArmorUnlockBDesc",
        icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
        att: [
            "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor3A",
            "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor3C",
            "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor3L"
        ]
    }
};

/*const evolvingWeaponSkins: Record<string, { challenge: keyof typeof challengeRewardsInboxMessages; reward: string }> = {
    "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor1A": {
        challenge: "SentEvoArmorRankOne",
        reward: "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2A"
    },
    "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor1C": {
        challenge: "SentEvoArmorRankOne",
        reward: "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2C"
    },
    "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor1L": {
        challenge: "SentEvoArmorRankOne",
        reward: "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2L"
    },
    "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2A": {
        challenge: "SentEvoArmorRankTwo",
        reward: "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor3A"
    },
    "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2C": {
        challenge: "SentEvoArmorRankTwo",
        reward: "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor3C"
    },
    "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor2L": {
        challenge: "SentEvoArmorRankTwo",
        reward: "/Lotus/Upgrades/Skins/Armor/SentEvoArmor/SentEvoArmor3L"
    }
};*/

export const addChallenges = async (
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument,
    ChallengeProgress: IChallengeProgress[],
    SeasonChallengeCompletions: ISeasonChallenge[] | undefined
): Promise<IAffiliationMods[]> => {
    for (const { Name, Progress, Completed } of ChallengeProgress) {
        let dbChallenge = inventory.ChallengeProgress.find(x => x.Name == Name);
        if (dbChallenge) {
            dbChallenge.Progress = Progress;
        } else {
            dbChallenge = { Name, Progress };
            inventory.ChallengeProgress.push(dbChallenge);
        }

        if (Name.startsWith("Calendar")) {
            addString(getCalendarProgress(inventory).SeasonProgress.ActivatedChallenges, Name);
        }

        if ((Completed?.length ?? 0) > (dbChallenge.Completed?.length ?? 0)) {
            dbChallenge.Completed ??= [];
            for (const completion of Completed!) {
                if (dbChallenge.Completed.indexOf(completion) == -1) {
                    dbChallenge.Completed.push(completion);
                    if (completion == "challengeRewards") {
                        if (Name in challengeRewardsInboxMessages) {
                            await createMessage(account._id, [challengeRewardsInboxMessages[Name]]);
                            // Would love to somehow let the client know about inbox or inventory changes, but there doesn't seem to anything for updateChallengeProgress.
                            continue;
                        }
                        logger.warn(`ignoring unknown challenge completion`, { challenge: Name, completion });
                        dbChallenge.Progress = 0;
                        dbChallenge.Completed = [];
                    }
                }
            }
        } else {
            dbChallenge.Completed = Completed;
        }
    }

    const affiliationMods: IAffiliationMods[] = [];
    if (SeasonChallengeCompletions) {
        for (const challenge of SeasonChallengeCompletions) {
            // Ignore challenges that weren't completed just now
            if (!ChallengeProgress.find(x => challenge.challenge.indexOf(x.Name) != -1)) {
                continue;
            }

            const meta = ExportChallenges[challenge.challenge];
            const nightwaveSyndicateTag = getNightwaveSyndicateTag(account.BuildLabel);
            logger.debug("Completed season challenge", {
                uniqueName: challenge.challenge,
                syndicateTag: nightwaveSyndicateTag,
                ...meta
            });
            if (nightwaveSyndicateTag) {
                let affiliation = inventory.Affiliations.find(x => x.Tag == nightwaveSyndicateTag);
                if (!affiliation) {
                    affiliation =
                        inventory.Affiliations[
                            inventory.Affiliations.push({
                                Tag: nightwaveSyndicateTag,
                                Standing: 0
                            }) - 1
                        ];
                }

                const standingToAdd = meta.standing! * (config.nightwaveStandingMultiplier ?? 1);
                affiliation.Standing += standingToAdd;
                if (affiliationMods.length == 0) {
                    affiliationMods.push({ Tag: nightwaveSyndicateTag });
                }
                affiliationMods[0].Standing ??= 0;
                affiliationMods[0].Standing += standingToAdd;
            }
        }
    }
    return affiliationMods;
};

export const addCalendarProgress = (inventory: TInventoryDatabaseDocument, value: { challenge: string }[]): void => {
    const calendarProgress = getCalendarProgress(inventory);
    const currentSeason = getWorldState().KnownCalendarSeasons[0];
    calendarProgress.SeasonProgress.LastCompletedChallengeDayIdx = currentSeason.Days.findIndex(
        day => day.events.length != 0 && day.events[0].challenge == value[value.length - 1].challenge
    );
    checkCalendarAutoAdvance(inventory, currentSeason);
};

export const addMissionComplete = (inventory: TInventoryDatabaseDocument, { Tag, Completes, Tier }: IMission): void => {
    const { Missions } = inventory;
    const itemIndex = Missions.findIndex(item => item.Tag === Tag);

    if (itemIndex !== -1) {
        Missions[itemIndex].Completes += Completes;
        if (Tier) {
            Missions[itemIndex].Tier = Tier;
        }
    } else {
        Missions.push({ Tag, Completes });
    }
};

export const addBooster = (ItemType: string, time: number, inventory: TInventoryDatabaseDocument): void => {
    const currentTime = Math.floor(Date.now() / 1000);

    const { Boosters } = inventory;

    const itemIndex = Boosters.findIndex(booster => booster.ItemType === ItemType);

    if (itemIndex !== -1) {
        const existingBooster = Boosters[itemIndex];
        existingBooster.ExpiryDate = Math.max(existingBooster.ExpiryDate, currentTime) + time;
    } else {
        Boosters.push({ ItemType, ExpiryDate: currentTime + time });
    }
};

export const updateSyndicate = (
    inventory: TInventoryDatabaseDocument,
    syndicateUpdate: IMissionInventoryUpdateRequest["AffiliationChanges"]
): void => {
    syndicateUpdate?.forEach(affiliation => {
        const syndicate = inventory.Affiliations.find(x => x.Tag == affiliation.Tag);
        if (syndicate !== undefined) {
            syndicate.Standing += affiliation.Standing;
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
        updateStandingLimit(inventory, ExportSyndicates[affiliation.Tag].dailyLimitBin, affiliation.Standing);
    });
};

/**
 * @returns object with inventory keys of changes or empty object when no items were added
 */
export const addKeyChainItems = async (
    inventory: TInventoryDatabaseDocument,
    keyChainData: IKeyChainRequest
): Promise<IInventoryChanges> => {
    const keyChainItems = getKeyChainItems(keyChainData);

    logger.debug(
        `adding key chain items ${keyChainItems.join()} for ${keyChainData.KeyChain} at stage ${keyChainData.ChainStage}`
    );

    const nonStoreItems = keyChainItems.map(item => fromStoreItem(item));

    const inventoryChanges: IInventoryChanges = {};

    for (const item of nonStoreItems) {
        const inventoryChangesDelta = await addItem(inventory, item);
        combineInventoryChanges(inventoryChanges, inventoryChangesDelta);
    }

    return inventoryChanges;
};

export const createLibraryDailyTask = (): ILibraryDailyTaskInfo => {
    const enemyTypes = getRandomElement(libraryDailyTasks)!;
    const enemyAvatar = ExportEnemies.avatars[enemyTypes[0]];
    const scansRequired = getRandomInt(2, 4);
    return {
        EnemyTypes: enemyTypes,
        EnemyLocTag: enemyAvatar.name,
        EnemyIcon: enemyAvatar.icon!,
        ScansRequired: scansRequired,
        RewardStoreItem: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/RareFusionBundle",
        RewardQuantity: Math.trunc(scansRequired * 2.5),
        RewardStanding: 2500 * scansRequired
    };
};

export const setupKahlSyndicate = (inventory: TInventoryDatabaseDocument): void => {
    inventory.Affiliations.push({
        Title: 1,
        Standing: 1,
        WeeklyMissions: [
            {
                MissionIndex: 0,
                CompletedMission: false,
                JobManifest: "/Lotus/Syndicates/Kahl/KahlJobManifestVersionThree",
                WeekCount: 0,
                Challenges: []
            }
        ],
        Tag: "KahlSyndicate"
    });
};

export const cleanupInventory = (inventory: TInventoryDatabaseDocument): void => {
    inventory.CurrentLoadOutIds = inventory.CurrentLoadOutIds.map(fromDbOid);

    let index = inventory.MiscItems.findIndex(x => x.ItemType == "");
    if (index != -1) {
        inventory.MiscItems.splice(index, 1);
    }

    index = inventory.Affiliations.findIndex(x => x.Tag == "KahlSyndicate");
    if (index != -1 && !inventory.Affiliations[index].WeeklyMissions) {
        logger.debug(`KahlSyndicate seems broken, removing it and setting up again`);
        inventory.Affiliations.splice(index, 1);
        setupKahlSyndicate(inventory);
    }

    const LibrarySyndicate = inventory.Affiliations.find(x => x.Tag == "LibrarySyndicate");
    if (LibrarySyndicate && LibrarySyndicate.FreeFavorsEarned) {
        logger.debug(`removing FreeFavorsEarned from LibrarySyndicate`);
        LibrarySyndicate.FreeFavorsEarned = undefined;
    }

    if (inventory.LotusCustomization) {
        if (
            Array.isArray(inventory.LotusCustomization.attcol) ||
            Array.isArray(inventory.LotusCustomization.sigcol) ||
            Array.isArray(inventory.LotusCustomization.eyecol) ||
            Array.isArray(inventory.LotusCustomization.facial) ||
            Array.isArray(inventory.LotusCustomization.cloth) ||
            Array.isArray(inventory.LotusCustomization.syancol)
        ) {
            logger.debug(`fixing empty objects represented as empty arrays in LotusCustomization`);
            inventory.LotusCustomization.attcol = {};
            inventory.LotusCustomization.sigcol = {};
            inventory.LotusCustomization.eyecol = {};
            inventory.LotusCustomization.facial = {};
            inventory.LotusCustomization.cloth = {};
            inventory.LotusCustomization.syancol = {};
        }
    }

    {
        let numFixed = 0;
        for (const equipmentKey of equipmentKeys) {
            for (const item of inventory[equipmentKey]) {
                if (item.ModularParts?.length === 0) {
                    item.ModularParts = undefined;
                    ++numFixed;
                }
            }
        }
        if (numFixed != 0) {
            logger.debug(`removed ModularParts from ${numFixed} non-modular items`);
        }
    }
};

export const getDialogue = (inventory: TInventoryDatabaseDocument, dialogueName: string): IDialogueDatabase => {
    inventory.DialogueHistory ??= {};
    inventory.DialogueHistory.Dialogues ??= [];
    let dialogue = inventory.DialogueHistory.Dialogues.find(x => x.DialogueName == dialogueName);
    if (!dialogue) {
        dialogue =
            inventory.DialogueHistory.Dialogues[
                inventory.DialogueHistory.Dialogues.push({
                    Rank: 0,
                    Chemistry: 0,
                    AvailableDate: new Date(0),
                    AvailableGiftDate: new Date(0),
                    RankUpExpiry: new Date(0),
                    BountyChemExpiry: new Date(0),
                    QueuedDialogues: [],
                    Gifts: [],
                    Booleans: [],
                    Completed: [],
                    DialogueName: dialogueName
                }) - 1
            ];
    }
    return dialogue;
};

export const getCalendarProgress = (inventory: TInventoryDatabaseDocument): ICalendarProgress => {
    const currentSeason = getWorldState().KnownCalendarSeasons[0];

    if (!inventory.CalendarProgress) {
        inventory.CalendarProgress = {
            Version: 19,
            Iteration: currentSeason.YearIteration,
            YearProgress: {
                Upgrades: []
            },
            SeasonProgress: {
                SeasonType: currentSeason.Season,
                LastCompletedDayIdx: -1,
                LastCompletedChallengeDayIdx: -1,
                ActivatedChallenges: []
            }
        };
    }

    const yearRolledOver = inventory.CalendarProgress.Iteration != currentSeason.YearIteration;
    if (yearRolledOver) {
        inventory.CalendarProgress.Iteration = currentSeason.YearIteration;
        inventory.CalendarProgress.YearProgress.Upgrades = [];
    }
    if (yearRolledOver || inventory.CalendarProgress.SeasonProgress.SeasonType != currentSeason.Season) {
        inventory.CalendarProgress.SeasonProgress.SeasonType = currentSeason.Season;
        inventory.CalendarProgress.SeasonProgress.LastCompletedDayIdx = -1;
        inventory.CalendarProgress.SeasonProgress.LastCompletedChallengeDayIdx = -1;
        inventory.CalendarProgress.SeasonProgress.ActivatedChallenges = [];
    }

    return inventory.CalendarProgress;
};

export const checkCalendarAutoAdvance = (
    inventory: TInventoryDatabaseDocument,
    currentSeason: ICalendarSeason
): void => {
    const calendarProgress = inventory.CalendarProgress!;
    for (
        let dayIndex = calendarProgress.SeasonProgress.LastCompletedDayIdx + 1;
        dayIndex != currentSeason.Days.length;
        ++dayIndex
    ) {
        const day = currentSeason.Days[dayIndex];
        if (day.events.length == 0) {
            // birthday
            if (day.day == 1) {
                // kaya
                if ((inventory.Affiliations.find(x => x.Tag == "HexSyndicate")?.Title || 0) >= 4) {
                    break;
                }
                logger.debug(`cannot talk to kaya, skipping birthday`);
                calendarProgress.SeasonProgress.LastCompletedDayIdx++;
            } else if (day.day == 74 || day.day == 355) {
                // minerva, velimir
                if ((inventory.Affiliations.find(x => x.Tag == "HexSyndicate")?.Title || 0) >= 5) {
                    break;
                }
                logger.debug(`cannot talk to minerva/velimir, skipping birthday`);
                calendarProgress.SeasonProgress.LastCompletedDayIdx++;
            } else {
                break;
            }
        } else if (day.events[0].type == "CET_CHALLENGE") {
            if (calendarProgress.SeasonProgress.LastCompletedChallengeDayIdx < dayIndex) {
                break;
            }
            //logger.debug(`already completed the challenge, skipping ahead`);
            calendarProgress.SeasonProgress.LastCompletedDayIdx++;
        } else {
            break;
        }
    }
};

export const giveNemesisWeaponRecipe = (
    inventory: TInventoryDatabaseDocument,
    weaponType: string,
    nemesisName: string = "AGOR ROK",
    weaponLoc?: string,
    profile: INemesisProfile = generateNemesisProfile()
): void => {
    if (!weaponLoc) {
        weaponLoc = ExportWeapons[weaponType].name;
    }
    const recipeType = Object.entries(ExportRecipes).find(arr => arr[1].resultType == weaponType)![0];
    addRecipes(inventory, [
        {
            ItemType: recipeType,
            ItemCount: 1
        }
    ]);
    inventory.PendingRecipes.push({
        CompletionDate: new Date(),
        ItemType: recipeType,
        TargetFingerprint: JSON.stringify({
            ItemType: "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod",
            UpgradeFingerprint: {
                compat: weaponType,
                buffs: [
                    {
                        Tag: profile.innateDamageTag,
                        Value: profile.innateDamageValue
                    }
                ]
            },
            Name: weaponLoc + "|" + nemesisName
        } satisfies INemesisWeaponTargetFingerprint)
    });
};

export const giveNemesisPetRecipe = (
    inventory: TInventoryDatabaseDocument,
    nemesisName: string = "AGOR ROK",
    profile: INemesisProfile = generateNemesisProfile()
): void => {
    const head = profile.petHead!;
    const body = profile.petBody!;
    const legs = profile.petLegs!;
    const tail = profile.petTail!;
    const recipeType = Object.entries(ExportRecipes).find(arr => arr[1].resultType == head)![0];
    addRecipes(inventory, [
        {
            ItemType: recipeType,
            ItemCount: 1
        }
    ]);
    inventory.PendingRecipes.push({
        CompletionDate: new Date(),
        ItemType: recipeType,
        TargetFingerprint: JSON.stringify({
            Parts: [head, body, legs, tail],
            Name: "/Lotus/Language/Pets/ZanukaPetName|" + nemesisName
        } satisfies INemesisPetTargetFingerprint)
    });
};

export const getEffectiveAvatarImageType = (inventory: TInventoryDatabaseDocument): string => {
    return inventory.ActiveAvatarImageType ?? "/Lotus/Types/StoreItems/AvatarImages/AvatarImageDefault";
};

export const updateEntratiVault = (inventory: TInventoryDatabaseDocument): void => {
    if (!inventory.EntratiVaultCountResetDate || Date.now() >= inventory.EntratiVaultCountResetDate.getTime()) {
        const EPOCH = 1734307200 * 1000; // Mondays, amirite?
        const day = Math.trunc((Date.now() - EPOCH) / 86400000);
        const week = Math.trunc(day / 7);
        const weekStart = EPOCH + week * 604800000;
        const weekEnd = weekStart + 604800000;
        inventory.EntratiVaultCountLastPeriod = 0;
        inventory.EntratiVaultCountResetDate = new Date(weekEnd);
        if (inventory.EntratiLabConquestUnlocked) {
            inventory.EntratiLabConquestUnlocked = 0;
            inventory.EntratiLabConquestCacheScoreMission = 0;
            inventory.EntratiLabConquestActiveFrameVariants = [];
        }
        if (inventory.EchoesHexConquestUnlocked) {
            inventory.EchoesHexConquestUnlocked = 0;
            inventory.EchoesHexConquestCacheScoreMission = 0;
            inventory.EchoesHexConquestActiveFrameVariants = [];
            inventory.EchoesHexConquestActiveStickers = [];
        }
    }
};
