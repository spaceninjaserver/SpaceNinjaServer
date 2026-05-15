import type {
    IItemEntry,
    ILoadoutClient,
    ILoadoutConfigClientLegacy,
    ILoadoutEntry,
    ILoadoutPresetClientLegacy,
    IOperatorConfigEntry,
    ISaveLoadoutRequestNoUpgradeVer
} from "../types/saveLoadoutTypes.ts";
import { Loadout } from "../models/inventoryModels/loadoutModel.ts";
import { addMods, getInventory } from "./inventoryService.ts";
import type { IOidWithLegacySupport } from "../types/commonTypes.ts";
import { Types } from "mongoose";
import { isEmptyObject, isObjectEmpty } from "../helpers/general.ts";
import { convertLegacyColorsToIColor, fromOid, toObjectId, version_compare } from "../helpers/inventoryHelpers.ts";
import { logger } from "../utils/logger.ts";
import type { ISketch, TEquipmentKey } from "../types/inventoryTypes/inventoryTypes.ts";
import { eLoadoutIndex, equipmentKeys } from "../types/inventoryTypes/inventoryTypes.ts";
import type { IItemConfig, IItemConfigDatabase } from "../types/inventoryTypes/commonInventoryTypes.ts";
import { importCrewShipMembers, importCrewShipWeapon, importLoadOutConfig } from "./importService.ts";
import type { IEquipmentDatabase, IEquipmentSelectionDatabase } from "../types/equipmentTypes.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import gameToBuildVersion from "../constants/gameToBuildVersion.ts";
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
    buildLabel: string
): Promise<string | void> => {
    const inventory = await getInventory(accountId, undefined);

    for (const [_equipmentName, equipment] of Object.entries(equipmentChanges)) {
        const equipmentName = _equipmentName as keyof ISaveLoadoutRequestNoUpgradeVer;

        if (isEmptyObject(equipment)) {
            continue;
        }
        // non-empty is a change in loadout(or suit...)
        switch (equipmentName) {
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
                    version_compare(buildLabel, gameToBuildVersion["13.0.0"]) >= 0 &&
                    version_compare(buildLabel, "2015.03.19.00.00") < 0
                ) {
                    // U14-U15
                    const configs = equipment as {
                        [key: string]: ILoadoutConfigClientLegacy;
                    };

                    logger.debug("legacy loadout received (U14-U15 format)", configs);

                    for (const key in configs) {
                        const x = configs[key];
                        await saveLegacyLoadoutPreset(inventory, x.Presets, x.Name, buildLabel);
                    }
                } else {
                    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });
                    if (!loadout) {
                        throw new Error("loadout not found");
                    }

                    let newLoadoutId: Types.ObjectId | undefined;
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
                            //logger.debug(`imported loadout config:`, loadoutConfigDatabase);

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

                    //only return an id if a new loadout was added
                    if (newLoadoutId) {
                        return newLoadoutId.toString();
                    }
                }

                break;
            }
            case "LoadOut": {
                // U10-U13
                const config = equipment as ILoadoutConfigClientLegacy;
                logger.debug("legacy loadout received (U10-U13 format)", config);

                await saveLegacyLoadoutPreset(inventory, config.Presets, config.Name, buildLabel);
                break;
            }
            case "Presets": {
                // U8 and below
                const presets = equipment as ILoadoutPresetClientLegacy[];
                logger.debug("legacy loadout received (U8 format)", presets);

                await saveLegacyLoadoutPreset(inventory, presets, undefined, buildLabel);
                break;
            }
            case "CurrentLoadout": {
                // U14-U15
                logger.debug(`ignoring CurrentLoadout from U14-U15 for now`);
                /*const id = equipment as string;
                if (inventory.CurrentLoadOutIds[0]) {
                    inventory.CurrentLoadOutIds[0] = toObjectId(id);
                }
                if (inventory.CurrentLoadOutIds[1]) {
                    inventory.CurrentLoadOutIds[1] = toObjectId(id);
                }
                if (inventory.CurrentLoadOutIds[2]) {
                    inventory.CurrentLoadOutIds[2] = toObjectId(id);
                }*/
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

                        const prevAbilityOverrides = JSON.stringify(
                            inventoryItem.Configs.map(x => x.AbilityOverride?.Ability)
                                .filter(x => x)
                                .sort()
                        );

                        let abilityMapping: Record<string, string> | undefined;
                        if (version_compare(buildLabel, gameToBuildVersion["42.0.0"]) < 0) {
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
                                if (version_compare(buildLabel, gameToBuildVersion["16.0.2"]) <= 0) {
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
                                    if (version_compare(buildLabel, gameToBuildVersion["12.1.2"]) < 0) {
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
                                if (abilityMapping && c.AbilityOverride) {
                                    c.AbilityOverride.Ability =
                                        abilityMapping[c.AbilityOverride.Ability.split("/").pop()!];
                                }
                                inventoryItem.Configs[parseInt(configId)] = c as IItemConfigDatabase;
                            }
                        }

                        const newAbilityOverrides = JSON.stringify(
                            inventoryItem.Configs.map(x => x.AbilityOverride?.Ability)
                                .filter(x => x)
                                .sort()
                        );
                        if (
                            JSON.stringify(
                                inventoryItem.Configs.map(x => x.AbilityOverride?.Ability)
                                    .filter(x => x)
                                    .sort()
                            ) != prevAbilityOverrides
                        ) {
                            throw new Error(
                                `refusing saveLoadout with different abilityOverrides: before=${prevAbilityOverrides}, after=${newAbilityOverrides}`
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
    await inventory.save();
};

const saveLegacyLoadoutPreset = async (
    inventory: TInventoryDatabaseDocument,
    presets: ILoadoutPresetClientLegacy[],
    name: string | undefined,
    buildLabel: string
): Promise<void> => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: inventory.accountOwnerId });
    if (!loadout) {
        throw new Error("loadout not found");
    }

    const currentLoadouts = inventory.CurrentLoadOutIds;

    const s =
        fromOid(presets[0].ItemId) != "ffffffffffffffffffffffff"
            ? configureLegacyEquipmentSelection(
                  presets[0],
                  buildLabel,
                  inventory.Suits.id(fromOid(presets[0].ItemId)),
                  loadout.NORMAL.id(currentLoadouts[eLoadoutIndex.NORMAL])?.s?.cus
              )
            : undefined;
    const p =
        fromOid(presets[1].ItemId) != "ffffffffffffffffffffffff"
            ? configureLegacyEquipmentSelection(
                  presets[1],
                  buildLabel,
                  inventory.Pistols.id(fromOid(presets[1].ItemId)),
                  loadout.NORMAL.id(currentLoadouts[eLoadoutIndex.NORMAL])?.p?.cus
              )
            : undefined;
    const l =
        fromOid(presets[2].ItemId) != "ffffffffffffffffffffffff"
            ? configureLegacyEquipmentSelection(
                  presets[2],
                  buildLabel,
                  inventory.LongGuns.id(fromOid(presets[2].ItemId)),
                  loadout.NORMAL.id(currentLoadouts[eLoadoutIndex.NORMAL])?.l?.cus
              )
            : undefined;
    const m =
        fromOid(presets[3].ItemId) != "ffffffffffffffffffffffff"
            ? configureLegacyEquipmentSelection(
                  presets[3],
                  buildLabel,
                  inventory.Melee.id(fromOid(presets[3].ItemId)),
                  loadout.NORMAL.id(currentLoadouts[eLoadoutIndex.NORMAL])?.m?.cus
              )
            : undefined;

    if (loadout.NORMAL.length == 0) {
        const loadoutId = new Types.ObjectId("000000000000000000000000");
        loadout.NORMAL.push({
            n: "Default Loadout",
            s: s,
            l: l,
            p: p,
            m: m,
            _id: loadoutId
        });
        if (currentLoadouts.length == 0) {
            currentLoadouts.push(loadoutId);
        } else {
            currentLoadouts[eLoadoutIndex.NORMAL] = loadoutId;
        }
    } else {
        if (currentLoadouts.length <= eLoadoutIndex.NORMAL) {
            currentLoadouts.push(loadout.NORMAL[0]._id);
        } else if (!loadout.NORMAL.id(currentLoadouts[0])) {
            currentLoadouts[eLoadoutIndex.NORMAL] = loadout.NORMAL[0]._id;
        }
        const preset = loadout.NORMAL.id(currentLoadouts[0])!;
        preset.n = name ?? preset.n;
        preset.s = s;
        preset.p = p;
        preset.l = l;
        preset.m = m;
    }

    if (presets.length >= 6) {
        const s =
            fromOid(presets[4].ItemId) != "ffffffffffffffffffffffff"
                ? configureLegacyEquipmentSelection(
                      presets[4],
                      buildLabel,
                      inventory.Sentinels.id(fromOid(presets[4].ItemId)),
                      loadout.SENTINEL.id(currentLoadouts[eLoadoutIndex.SENTINEL])?.s?.cus
                  )
                : undefined;
        const l =
            fromOid(presets[5].ItemId) != "ffffffffffffffffffffffff"
                ? configureLegacyEquipmentSelection(
                      presets[5],
                      buildLabel,
                      inventory.SentinelWeapons.id(fromOid(presets[5].ItemId)),
                      loadout.SENTINEL.id(currentLoadouts[eLoadoutIndex.SENTINEL])?.l?.cus
                  )
                : undefined;

        if (loadout.SENTINEL.length == 0) {
            const loadoutId = new Types.ObjectId("000000000000000000000000");
            loadout.SENTINEL.push({
                n: "Default Loadout",
                s: s,
                l: l,
                _id: loadoutId
            });
            if (currentLoadouts.length < 2) {
                currentLoadouts.push(loadoutId);
            } else {
                currentLoadouts[eLoadoutIndex.SENTINEL] = loadoutId;
            }
        } else {
            if (currentLoadouts.length <= eLoadoutIndex.SENTINEL) {
                currentLoadouts.push(loadout.SENTINEL[0]._id);
            } else if (!loadout.SENTINEL.id(currentLoadouts[eLoadoutIndex.SENTINEL])) {
                currentLoadouts[eLoadoutIndex.SENTINEL] = loadout.SENTINEL[0]._id;
            }
            const preset = loadout.SENTINEL.id(currentLoadouts[eLoadoutIndex.SENTINEL])!;
            preset.n = name ?? preset.n;
            preset.s = s;
            preset.l = l;
        }
    }

    if (presets.length == 9) {
        const s =
            fromOid(presets[6].ItemId) != "ffffffffffffffffffffffff"
                ? configureLegacyEquipmentSelection(presets[6], buildLabel, null, 0)
                : undefined;
        const l =
            fromOid(presets[7].ItemId) != "ffffffffffffffffffffffff"
                ? configureLegacyEquipmentSelection(presets[7], buildLabel, null, 0)
                : undefined;
        const m =
            fromOid(presets[8].ItemId) != "ffffffffffffffffffffffff"
                ? configureLegacyEquipmentSelection(presets[8], buildLabel, null, 0)
                : undefined;

        if (loadout.ARCHWING.length == 0) {
            const loadoutId = new Types.ObjectId("000000000000000000000000");
            loadout.ARCHWING.push({
                n: "Default Loadout",
                s: s,
                l: l,
                m: m,
                _id: loadoutId
            });
            if (currentLoadouts.length < 3) {
                currentLoadouts.push(loadoutId);
            } else {
                currentLoadouts[eLoadoutIndex.ARCHWING] = loadoutId;
            }
        } else {
            if (currentLoadouts.length <= eLoadoutIndex.ARCHWING) {
                currentLoadouts.push(loadout.ARCHWING[0]._id);
            } else if (!loadout.ARCHWING.id(currentLoadouts[eLoadoutIndex.ARCHWING])) {
                currentLoadouts[eLoadoutIndex.ARCHWING] = loadout.ARCHWING[0]._id;
            }
            const preset = loadout.ARCHWING.id(currentLoadouts[eLoadoutIndex.ARCHWING])!;
            preset.n = name ?? preset.n;
            preset.s = s;
            preset.l = l;
            preset.m = m;
        }
    }

    await loadout.save();
};

const configureLegacyEquipmentSelection = (
    preset: ILoadoutPresetClientLegacy,
    buildLabel: string,
    item: IEquipmentDatabase | null,
    appearanceConfig: number | undefined
): IEquipmentSelectionDatabase | undefined => {
    if (preset.ItemId.$id) {
        const slotEntry = {
            ItemId: toObjectId(preset.ItemId.$id),
            mod: preset.ModSlot ?? 0,
            cus: preset.CustSlot ?? 0
        };

        if (item && version_compare(buildLabel, "2013.09.13.00.00") < 0) {
            // Specific code path for U8 and below for applying cosmetics
            const config = item.Configs[appearanceConfig ?? 0];
            if (item.Configs[appearanceConfig ?? 0]) {
                config.pricol = convertLegacyColorsToIColor(preset.Customization?.Colors);
                config.Skins = preset.Customization?.Skins;
            }
        }

        return slotEntry;
    } else {
        return undefined;
    }
};
