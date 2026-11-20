import type {
    IItemEntry,
    ILoadoutClient,
    ILoadoutConfigClientLegacy,
    ILoadoutConfigDatabase,
    ILoadoutEntry,
    ILoadoutPresetClientLegacy,
    IOperatorConfigEntry,
    ISaveLoadoutRequestNoUpgradeVer
} from "../types/saveLoadoutTypes.ts";
import { getLoadout } from "./loadoutService.ts";
import { addMods, getInventory } from "./inventoryService.ts";
import type { IOidWithLegacySupport } from "../types/commonTypes.ts";
import { Types } from "mongoose";
import { isEmptyObject, isObjectEmpty } from "../helpers/general.ts";
import { convertLegacyColorsToIColor, fromOid, toObjectId } from "../helpers/inventoryHelpers.ts";
import { buildVersionToInt } from "../helpers/versionHelper.ts";
import { logger } from "../utils/logger.ts";
import type { ISketch, TEquipmentKey } from "../types/inventoryTypes/inventoryTypes.ts";
import { eLegacyLoadoutSlot, eLoadoutIndex, equipmentKeys } from "../types/inventoryTypes/inventoryTypes.ts";
import type { IItemConfig, IItemConfigDatabase } from "../types/inventoryTypes/commonInventoryTypes.ts";
import { importCrewShipMembers, importCrewShipWeapon, importLoadOutConfig } from "./importService.ts";
import type { IEquipmentDatabase, IEquipmentSelectionDatabase } from "../types/equipmentTypes.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import gameToBuildVersionInt from "../constants/gameToBuildVersionInt.ts";
import type { IFocusLoadoutClient } from "../types/inventoryTypes/inventoryTypes.ts";

//TODO: setup default items on account creation or like originally in giveStartingItems.php

//TODO: change update functions to only add and not save perhaps, functions that add and return inventory perhaps

/* loadouts has loadoutconfigs
operatorloadouts has itemconfig, but no multiple config ids
itemconfig has multiple config ids
*/
export const handleInventoryItemConfigChange = async (
    equipmentChanges: ISaveLoadoutRequestNoUpgradeVer,
    accountId: string | Types.ObjectId,
    buildVersion: number
): Promise<string | void> => {
    const inventory = await getInventory(accountId, undefined);
    let newLoadoutId: Types.ObjectId | undefined;

    for (const [_equipmentName, equipment] of Object.entries(equipmentChanges)) {
        const equipmentName = _equipmentName as keyof ISaveLoadoutRequestNoUpgradeVer;

        if (isEmptyObject(equipment)) {
            continue;
        }
        // non-empty is a change in loadout(or suit...)
        switch (equipmentName) {
            case "TennoOperator": {
                // U18
                logger.debug(`operator loadout received ${equipmentName}`, equipment);
                const { OperatorAmp, ...changes } = equipment as IItemConfig & { ItemId?: IOidWithLegacySupport };
                delete changes.ItemId;
                if (changes.Skins) {
                    changes.Skins = [
                        ...changes.Skins,
                        ...(inventory.TennoOperator.Skins?.slice(changes.Skins.length) ?? [])
                    ];
                }
                if (changes.Upgrades) {
                    changes.Upgrades = changes.Upgrades.map(x => (typeof x == "string" ? x : fromOid(x)));
                }
                inventory.TennoOperator.set(changes);
                if (OperatorAmp) inventory.TennoOperator.OperatorAmp = new Types.ObjectId(fromOid(OperatorAmp));
                break;
            }
            case "AdultOperatorLoadOuts":
            case "OperatorLoadOuts":
            case "KahlLoadOuts": {
                const operatorConfig = equipment as IOperatorConfigEntry;
                const operatorLoadout = inventory[equipmentName];
                logger.debug(`operator loadout received ${equipmentName} `, operatorConfig);
                // all non-empty entries are one loadout slot
                for (const [loadoutId, loadoutConfig] of Object.entries(operatorConfig)) {
                    logger.debug(`loadoutId ${loadoutId} loadoutConfig`, { config: loadoutConfig });
                    const loadout = operatorLoadout.id(loadoutId);

                    // if no config with this id exists, create a new one
                    if (!loadout) {
                        const { ItemId, ...loadoutConfigItemIdRemoved } = loadoutConfig;
                        operatorLoadout.push({
                            _id: ItemId.$oid,
                            ...loadoutConfigItemIdRemoved
                        });
                        continue;
                    }
                    loadout.set(loadoutConfig);
                }
                break;
            }
            case "LoadOuts": {
                if (
                    buildVersion >= gameToBuildVersionInt["13.0.0"] &&
                    buildVersion < buildVersionToInt("2015.03.19.00.00")
                ) {
                    // U14-U15
                    const configs = equipment as {
                        [key: string]: ILoadoutConfigClientLegacy;
                    };

                    logger.debug("legacy loadout received (U14-U15 format)", configs);

                    for (const [key, x] of Object.entries(configs)) {
                        const id = (x.ItemId as IOidWithLegacySupport | undefined) ? fromOid(x.ItemId) : key;
                        if (x.Remove) {
                            const loadout = await getLoadout(accountId);
                            for (const category of legacyPresetCategories) {
                                const index = eLoadoutIndex[category];
                                loadout[category].pull({ _id: id });
                                if (inventory.CurrentLoadOutIds[index]?.equals(id) && loadout[category].length != 0) {
                                    inventory.CurrentLoadOutIds[index] = loadout[category][0]._id;
                                }
                            }
                            await loadout.save();
                        } else {
                            const savedId = await saveLegacyLoadoutPreset(
                                inventory,
                                x.Presets,
                                x.Name,
                                buildVersion,
                                id == "ffffffffffffffffffffffff" ? "" : id,
                                false
                            );
                            newLoadoutId ??= savedId;
                        }
                    }
                } else {
                    const loadout = await getLoadout(accountId);

                    for (const [_loadoutSlot, _loadout] of Object.entries(equipment)) {
                        const loadoutSlot = _loadoutSlot as keyof ILoadoutClient;
                        const newLoadout = _loadout as ILoadoutEntry;

                        // empty loadout slot like: "NORMAL": {}
                        if (isObjectEmpty(newLoadout)) {
                            continue;
                        }

                        logger.debug(`${loadoutSlot} loadout received`);

                        // all non-empty entries are one loadout slot
                        for (const [loadoutId, loadoutConfig] of Object.entries(newLoadout)) {
                            if (loadoutConfig.Remove) {
                                loadout[loadoutSlot].pull({ _id: loadoutId });
                                continue;
                            }

                            const oldLoadoutConfig = loadout[loadoutSlot].id(loadoutId);

                            const loadoutConfigDatabase = importLoadOutConfig(loadoutConfig);
                            logger.trace(`imported loadout config:`, loadoutConfigDatabase);

                            // if no config with this id exists, create a new one
                            if (!oldLoadoutConfig) {
                                //save the new object id and assign it for every ffff return at the end
                                if (loadoutConfigDatabase._id.toString() === "ffffffffffffffffffffffff") {
                                    if (!newLoadoutId) {
                                        newLoadoutId = new Types.ObjectId();
                                    }
                                    loadoutConfigDatabase._id = newLoadoutId;
                                    loadout[loadoutSlot].push(loadoutConfigDatabase);
                                    continue;
                                }

                                loadout[loadoutSlot].push(loadoutConfigDatabase);
                                continue;
                            }

                            const loadoutIndex = loadout[loadoutSlot].indexOf(oldLoadoutConfig);
                            if (loadoutIndex === -1) {
                                throw new Error("loadout index not found");
                            }

                            loadout[loadoutSlot][loadoutIndex].overwrite(loadoutConfigDatabase);
                        }
                    }
                    await loadout.save();
                }

                break;
            }
            case "LoadOut": {
                // U10-U13
                const config = equipment as ILoadoutConfigClientLegacy;
                logger.debug("legacy loadout received (U10-U13 format)", config);
                const configId = (config as Partial<ILoadoutConfigClientLegacy>).ItemId;

                const savedId = await saveLegacyLoadoutPreset(
                    inventory,
                    config.Presets,
                    config.Name,
                    buildVersion,
                    configId && fromOid(configId)
                );
                newLoadoutId ??= savedId;
                break;
            }
            case "Presets": {
                const presets = equipment as ILoadoutPresetClientLegacy[];
                logger.debug("legacy loadout received (U7.7-U9 format)", presets);

                const savedId = await saveLegacyLoadoutPreset(
                    inventory,
                    presets,
                    equipmentChanges.Name,
                    buildVersion,
                    equipmentChanges.ItemId && fromOid(equipmentChanges.ItemId)
                );
                newLoadoutId ??= savedId;
                break;
            }
            case "ItemId":
            case "Name": {
                // U7.7-U9: handled together with Presets
                break;
            }
            case "CurrentLoadout": {
                // U14-U15, applied after LoadOuts so it can refer to a preset created in the same request
                break;
            }
            case "CurrentLoadOutIds": {
                const loadoutIds = equipment as IOidWithLegacySupport[]; // TODO: Check for more than just an array of oids, I think i remember one instance
                const ids: Types.ObjectId[] = [];
                loadoutIds.forEach(x => {
                    ids.push(toObjectId(fromOid(x) || "000000000000000000000000"));
                });
                inventory.CurrentLoadOutIds = ids;
                break;
            }
            case "EquippedGear":
            case "EquippedEmotes": {
                inventory[equipmentName] = equipment as string[];
                break;
            }
            case "UseAdultOperatorLoadout": {
                inventory.UseAdultOperatorLoadout = equipment as boolean;
                break;
            }
            case "Sketches": {
                inventory.Sketches = equipment as ISketch[];
                break;
            }
            case "FocusLoadouts": {
                const raw = equipment as unknown;
                const focusLoadouts: unknown[] = Array.isArray(raw)
                    ? raw
                    : raw && typeof raw === "object"
                      ? "Preset" in raw || "FocusAbility" in raw
                          ? [raw]
                          : Object.values(raw)
                      : [];
                const converted = focusLoadouts
                    .filter((fl): fl is IFocusLoadoutClient => {
                        if (!fl || typeof fl !== "object") return false;
                        const obj = fl as Partial<IFocusLoadoutClient>;
                        return (
                            typeof obj.FocusAbility === "string" &&
                            !!obj.Preset &&
                            typeof obj.Preset === "object" &&
                            !Array.isArray(obj.Preset)
                        );
                    })
                    .map(fl => ({
                        FocusAbility: fl.FocusAbility,
                        Preset: {
                            ...fl.Preset,
                            ItemId:
                                fl.Preset.ItemId && typeof fl.Preset.ItemId === "object"
                                    ? toObjectId(fromOid(fl.Preset.ItemId))
                                    : undefined
                        } satisfies IEquipmentSelectionDatabase
                    }));
                if (converted.length || Array.isArray(raw)) {
                    inventory.FocusLoadouts = converted;
                }
                break;
            }
            case "WeaponSkins": {
                const itemEntries = equipment as IItemEntry;
                for (const [itemId, itemConfigEntries] of Object.entries(itemEntries)) {
                    if (itemId.startsWith("ca70ca70ca70ca70")) {
                        logger.warn(
                            `unlockAllSkins does not work with favoriting items because you don't actually own it`
                        );
                    } else {
                        const inventoryItem = inventory.WeaponSkins.id(itemId);
                        if (!inventoryItem) {
                            logger.warn(`inventory item WeaponSkins not found with id ${itemId}`);
                            continue;
                        }
                        if ("Favorite" in itemConfigEntries) {
                            inventoryItem.Favorite = itemConfigEntries.Favorite;
                        }
                        if ("IsNew" in itemConfigEntries) {
                            inventoryItem.IsNew = itemConfigEntries.IsNew;
                        }
                    }
                }
                break;
            }
            case "LotusCustomization": {
                logger.debug(`saved LotusCustomization`, equipmentChanges.LotusCustomization);
                inventory.LotusCustomization = equipmentChanges.LotusCustomization;
                break;
            }
            case "ValidNewLoadoutId": {
                logger.debug(`ignoring ValidNewLoadoutId (${equipmentChanges.ValidNewLoadoutId})`);
                // seems always equal to the id of loadout config NORMAL[0], likely has no purpose and we're free to ignore it
                break;
            }
            case "ActiveCrewShip": {
                if (inventory.CrewShips.length != 1) {
                    logger.warn(`saving railjack changes with broken inventory?`);
                } else if (!inventory.CrewShips[0]._id.equals(equipmentChanges.ActiveCrewShip.$oid)) {
                    logger.warn(
                        `client provided CrewShip id ${equipmentChanges.ActiveCrewShip.$oid} but id in inventory is ${inventory.CrewShips[0]._id.toString()}`
                    );
                }
                break;
            }
            default: {
                if (equipmentKeys.includes(equipmentName as TEquipmentKey)) {
                    logger.debug(`general Item config saved of type ${equipmentName}`, {
                        config: equipment
                    });

                    const itemEntries = equipment as IItemEntry;
                    for (const [itemId, itemConfigEntries] of Object.entries(itemEntries)) {
                        const inventoryItem = inventory[equipmentName].id(itemId);

                        if (!inventoryItem) {
                            logger.warn(`inventory item ${equipmentName} not found with id ${itemId}`);
                            continue;
                        }

                        const prevAbilityOverrides = inventoryItem.Configs.map(x => x.AbilityOverride);

                        let abilityMapping: Record<string, string> | undefined;
                        if (buildVersion < gameToBuildVersionInt["42.0.0"]) {
                            abilityMapping = {};
                            for (const config of inventoryItem.Configs) {
                                if (config.AbilityOverride) {
                                    abilityMapping[config.AbilityOverride.Ability.split("/").pop()!] =
                                        config.AbilityOverride.Ability;
                                }
                            }
                        }
                        for (const [configId, config] of Object.entries(itemConfigEntries)) {
                            if (/^[0-9]+$/.test(configId)) {
                                const c = config as IItemConfig;
                                if (buildVersion >= gameToBuildVersionInt["29.0.0"]) {
                                    if (abilityMapping && c.AbilityOverride) {
                                        c.AbilityOverride.Ability =
                                            abilityMapping[c.AbilityOverride.Ability.split("/").pop()!];
                                    }
                                } else {
                                    c.AbilityOverride = prevAbilityOverrides[parseInt(configId)];
                                    if (buildVersion <= gameToBuildVersionInt["16.0.2"]) {
                                        const legacyColors = c.Customization?.Colors ?? c.Colors;
                                        if (legacyColors) {
                                            if (legacyColors.length == 10) {
                                                c.pricol = convertLegacyColorsToIColor(legacyColors.splice(0, 5));
                                                c.attcol = convertLegacyColorsToIColor(legacyColors);
                                            } else {
                                                c.pricol = convertLegacyColorsToIColor(legacyColors);
                                            }
                                        }
                                        const legacySkins = c.Customization?.Skins;
                                        if (legacySkins) {
                                            c.Skins = legacySkins;
                                        }
                                        if (buildVersion < gameToBuildVersionInt["12.1.2"]) {
                                            if (c.Upgrades) {
                                                // U10-U11 store mods in the item config as $id instead of a string, need to convert that here
                                                const convertedUpgrades: string[] = [];
                                                c.Upgrades.forEach(upgrade => {
                                                    const upgradeId = upgrade as { $id: string };
                                                    const rawUpgrade = inventory.RawUpgrades.id(upgradeId.$id);
                                                    if (rawUpgrade) {
                                                        const newId = new Types.ObjectId();
                                                        convertedUpgrades.push(newId.toString());
                                                        addMods(inventory, [
                                                            {
                                                                ItemType: rawUpgrade.ItemType,
                                                                ItemCount: -1
                                                            }
                                                        ]);
                                                        inventory.Upgrades.push({
                                                            UpgradeFingerprint: `{"lvl":0}`,
                                                            ItemType: rawUpgrade.ItemType,
                                                            _id: newId
                                                        });
                                                    } else {
                                                        convertedUpgrades.push(upgradeId.$id);
                                                    }
                                                });
                                                c.Upgrades = convertedUpgrades;
                                            }
                                        }
                                    }
                                }
                                inventoryItem.Configs[parseInt(configId)] = c as IItemConfigDatabase;
                            }
                        }

                        const prevAbilityOverridesString = JSON.stringify(
                            prevAbilityOverrides
                                .map(x => x?.Ability)
                                .filter(x => x)
                                .sort()
                        );
                        const newAbilityOverridesString = JSON.stringify(
                            inventoryItem.Configs.map(x => x.AbilityOverride?.Ability)
                                .filter(x => x)
                                .sort()
                        );
                        if (prevAbilityOverridesString != newAbilityOverridesString) {
                            throw new Error(
                                `refusing saveLoadout with different abilityOverrides: before=${prevAbilityOverridesString}, after=${newAbilityOverridesString}`
                            );
                        }

                        if ("Favorite" in itemConfigEntries) {
                            inventoryItem.Favorite = itemConfigEntries.Favorite;
                        }
                        if ("IsNew" in itemConfigEntries) {
                            inventoryItem.IsNew = itemConfigEntries.IsNew;
                        }

                        if ("ItemName" in itemConfigEntries) {
                            inventoryItem.ItemName = itemConfigEntries.ItemName;
                        }
                        if ("RailjackImage" in itemConfigEntries) {
                            inventoryItem.RailjackImage = itemConfigEntries.RailjackImage;
                        }
                        if ("Customization" in itemConfigEntries) {
                            inventoryItem.Customization = itemConfigEntries.Customization;
                        }
                        if (itemConfigEntries.Weapon) {
                            inventoryItem.Weapon = importCrewShipWeapon(itemConfigEntries.Weapon);
                        }
                        if (itemConfigEntries.CrewMembers) {
                            inventoryItem.CrewMembers = importCrewShipMembers(itemConfigEntries.CrewMembers);
                        }
                    }
                    break;
                } else {
                    logger.warn(`unknown saveLoadout field: ${equipmentName}`, {
                        config: equipment
                    });
                }
            }
        }
    }
    if (equipmentChanges.CurrentLoadout) {
        const raw = equipmentChanges.CurrentLoadout as string | IOidWithLegacySupport;
        let id = typeof raw == "string" ? raw : fromOid(raw);
        if (id == "ffffffffffffffffffffffff" && newLoadoutId) {
            id = newLoadoutId.toString();
        }
        if (isLegacyEmptyItemId(id)) {
            logger.warn(`ignoring invalid CurrentLoadout ${id}`);
        } else {
            const loadout = await getLoadout(accountId);
            for (const category of legacyPresetCategories) {
                if (loadout[category].id(id)) {
                    setCurrentLoadoutId(inventory.CurrentLoadOutIds, eLoadoutIndex[category], new Types.ObjectId(id));
                }
            }
        }
    }
    await inventory.save();
    return newLoadoutId?.toString();
};

const isLegacyEmptyItemId = (id: string | undefined): boolean =>
    !id || id == "ffffffffffffffffffffffff" || !/^[0-9a-fA-F]{24}$/.test(id);

const setCurrentLoadoutId = (currentLoadouts: Types.ObjectId[], index: number, id: Types.ObjectId): void => {
    while (currentLoadouts.length < index) {
        currentLoadouts.push(new Types.ObjectId("000000000000000000000000"));
    }
    if (currentLoadouts.length == index) {
        currentLoadouts.push(id);
    } else {
        currentLoadouts[index] = id;
    }
};

const legacyPresetCategories = ["NORMAL", "SENTINEL", "ARCHWING"] as const;

const writeLegacyPreset = (
    presets: Types.DocumentArray<ILoadoutConfigDatabase>,
    currentLoadouts: Types.ObjectId[],
    index: number,
    targetId: Types.ObjectId | undefined,
    name: string | undefined,
    selections: Partial<Record<"s" | "p" | "l" | "m", IEquipmentSelectionDatabase | undefined>>,
    makeCurrent: boolean
): void => {
    let preset: ILoadoutConfigDatabase;
    if (targetId) {
        // Named preset (U7.7.0 & U14-U15): update it, or create it if it doesn't exist yet.
        preset = presets.id(targetId) ?? presets[presets.push({ _id: targetId, n: name }) - 1];
        if (makeCurrent) {
            setCurrentLoadoutId(currentLoadouts, index, targetId);
        }
    } else if (presets.length == 0) {
        const loadoutId = new Types.ObjectId("000000000000000000000000");
        preset = presets[presets.push({ _id: loadoutId, n: name }) - 1];
        if (currentLoadouts.length <= index) {
            currentLoadouts.push(loadoutId);
        } else {
            currentLoadouts[index] = loadoutId;
        }
    } else {
        if (currentLoadouts.length <= index) {
            currentLoadouts.push(presets[0]._id);
        } else if (!presets.id(currentLoadouts[index])) {
            currentLoadouts[index] = presets[0]._id;
        }
        preset = presets.id(currentLoadouts[index])!;
    }
    preset.n = name || preset.n;
    Object.assign(preset, selections);
};

const saveLegacyLoadoutPreset = async (
    inventory: TInventoryDatabaseDocument,
    presets: ILoadoutPresetClientLegacy[],
    name: string | undefined,
    buildVersion: number,
    presetId?: string,
    makeCurrent: boolean = true
): Promise<Types.ObjectId | undefined> => {
    const loadout = await getLoadout(inventory.accountOwnerId);

    const currentLoadouts = inventory.CurrentLoadOutIds;

    let targetId: Types.ObjectId | undefined;
    let newPresetId: Types.ObjectId | undefined;
    if (presetId === "") {
        targetId = newPresetId = new Types.ObjectId();
    } else if (presetId && presetId != "Current" && Types.ObjectId.isValid(presetId) && presetId.length == 24) {
        targetId = new Types.ObjectId(presetId);
    }

    const select = (
        index: number,
        items?: Types.DocumentArray<IEquipmentDatabase>,
        appearanceConfig?: number
    ): IEquipmentSelectionDatabase | undefined => {
        const preset = presets[index];
        const itemId = fromOid(preset.ItemId);
        if (isLegacyEmptyItemId(itemId)) {
            return undefined;
        }
        return configureLegacyEquipmentSelection(preset, buildVersion, items?.id(itemId) ?? null, appearanceConfig);
    };

    const normal = loadout.NORMAL.id(currentLoadouts[eLoadoutIndex.NORMAL]);
    writeLegacyPreset(
        loadout.NORMAL,
        currentLoadouts,
        eLoadoutIndex.NORMAL,
        targetId,
        name,
        {
            s: select(eLegacyLoadoutSlot.SUIT, inventory.Suits, normal?.s?.cus),
            p: select(eLegacyLoadoutSlot.PISTOL, inventory.Pistols, normal?.p?.cus),
            l: select(eLegacyLoadoutSlot.LONG_GUN, inventory.LongGuns, normal?.l?.cus),
            m: select(eLegacyLoadoutSlot.MELEE, inventory.Melee, normal?.m?.cus)
        },
        makeCurrent
    );

    if (presets.length > eLegacyLoadoutSlot.SENTINEL_WEAPON) {
        const sentinel = loadout.SENTINEL.id(currentLoadouts[eLoadoutIndex.SENTINEL]);
        writeLegacyPreset(
            loadout.SENTINEL,
            currentLoadouts,
            eLoadoutIndex.SENTINEL,
            targetId,
            name,
            {
                s: select(eLegacyLoadoutSlot.SENTINEL, inventory.Sentinels, sentinel?.s?.cus),
                l: select(eLegacyLoadoutSlot.SENTINEL_WEAPON, inventory.SentinelWeapons, sentinel?.l?.cus)
            },
            makeCurrent
        );
    }

    if (presets.length > eLegacyLoadoutSlot.SPACE_MELEE) {
        writeLegacyPreset(
            loadout.ARCHWING,
            currentLoadouts,
            eLoadoutIndex.ARCHWING,
            targetId,
            name,
            {
                s: select(eLegacyLoadoutSlot.SPACE_SUIT),
                l: select(eLegacyLoadoutSlot.SPACE_GUN),
                m: select(eLegacyLoadoutSlot.SPACE_MELEE)
            },
            makeCurrent
        );
    }

    await loadout.save();
    return newPresetId;
};

const configureLegacyEquipmentSelection = (
    preset: ILoadoutPresetClientLegacy,
    buildVersion: number,
    item: IEquipmentDatabase | null,
    appearanceConfig: number | undefined
): IEquipmentSelectionDatabase | undefined => {
    const itemId = fromOid(preset.ItemId);
    if (isLegacyEmptyItemId(itemId)) {
        return undefined;
    }
    const slotEntry = {
        ItemId: toObjectId(itemId),
        mod: preset.ModSlot ?? 0,
        cus: preset.CustSlot ?? 0
    };

    if (item && buildVersion < gameToBuildVersionInt["10.3.3"]) {
        const config = item.Configs[appearanceConfig ?? 0];
        if (item.Configs[appearanceConfig ?? 0]) {
            config.pricol = convertLegacyColorsToIColor(preset.Customization?.Colors);
            config.Skins = preset.Customization?.Skins;
        }
    }

    return slotEntry;
};
