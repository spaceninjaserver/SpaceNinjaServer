import type {
    IItemEntry,
    ILoadoutClient,
    ILoadoutEntry,
    IOperatorConfigEntry,
    ISaveLoadoutRequestNoUpgradeVer
} from "@/src/types/saveLoadoutTypes";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { getInventory } from "@/src/services/inventoryService";
import type { IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import { isEmptyObject } from "@/src/helpers/general";
import { logger } from "@/src/utils/logger";
import type { TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { equipmentKeys } from "@/src/types/inventoryTypes/inventoryTypes";
import type { IItemConfig } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { importCrewShipMembers, importCrewShipWeapon, importLoadOutConfig } from "@/src/services/importService";

//TODO: setup default items on account creation or like originally in giveStartingItems.php

//TODO: change update functions to only add and not save perhaps, functions that add and return inventory perhaps

/* loadouts has loadoutconfigs
operatorloadouts has itemconfig, but no multiple config ids
itemconfig has multiple config ids
*/
export const handleInventoryItemConfigChange = async (
    equipmentChanges: ISaveLoadoutRequestNoUpgradeVer,
    accountId: string
): Promise<string | void> => {
    const inventory = await getInventory(accountId);

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
                logger.debug("loadout received");
                const loadout = await Loadout.findOne({ loadoutOwnerId: accountId });
                if (!loadout) {
                    throw new Error("loadout not found");
                }

                let newLoadoutId: Types.ObjectId | undefined;
                for (const [_loadoutSlot, _loadout] of Object.entries(equipment)) {
                    const loadoutSlot = _loadoutSlot as keyof ILoadoutClient;
                    const newLoadout = _loadout as ILoadoutEntry;

                    // empty loadout slot like: "NORMAL": {}
                    if (isEmptyObject(newLoadout)) {
                        continue;
                    }

                    // all non-empty entries are one loadout slot
                    for (const [loadoutId, loadoutConfig] of Object.entries(newLoadout)) {
                        if (loadoutConfig.Remove) {
                            loadout[loadoutSlot].pull({ _id: loadoutId });
                            continue;
                        }

                        const oldLoadoutConfig = loadout[loadoutSlot].id(loadoutId);

                        const loadoutConfigDatabase = importLoadOutConfig(loadoutConfig);

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
                break;
            }
            case "CurrentLoadOutIds": {
                const loadoutIds = equipment as IOid[]; // TODO: Check for more than just an array of oids, I think i remember one instance
                inventory.CurrentLoadOutIds = loadoutIds;
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

                        for (const [configId, config] of Object.entries(itemConfigEntries)) {
                            if (/^[0-9]+$/.test(configId)) {
                                inventoryItem.Configs[parseInt(configId)] = config as IItemConfig;
                            }
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
