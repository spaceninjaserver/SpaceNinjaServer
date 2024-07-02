import {
    IItemEntry,
    ILoadoutClient,
    ILoadoutEntry,
    ILoadoutConfigDatabase,
    IOperatorConfigEntry,
    ISaveLoadoutRequestNoUpgradeVer
} from "@/src/types/saveLoadoutTypes";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { getInventory } from "@/src/services/inventoryService";
import { IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import { isEmptyObject } from "@/src/helpers/general";
import { logger } from "@/src/utils/logger";

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

    for (const [_equipmentName, _equipment] of Object.entries(equipmentChanges)) {
        const equipment = _equipment as ISaveLoadoutRequestNoUpgradeVer[keyof ISaveLoadoutRequestNoUpgradeVer];
        const equipmentName = _equipmentName as keyof ISaveLoadoutRequestNoUpgradeVer;

        if (isEmptyObject(equipment)) {
            continue;
        }
        // non-empty is a change in loadout(or suit...)
        switch (equipmentName) {
            case "OperatorLoadOuts":
            case "AdultOperatorLoadOuts": {
                const operatorConfig = equipment as IOperatorConfigEntry;
                const operatorLoadout = inventory[equipmentName];
                logger.debug(`operator loadout received ${equipmentName} `, operatorConfig);
                // all non-empty entries are one loadout slot
                for (const [loadoutId, loadoutConfig] of Object.entries(operatorConfig)) {
                    logger.debug(`loadoutId ${loadoutId} loadoutConfig`, { config: loadoutConfig });
                    const loadout = operatorLoadout.find(loadout => loadout._id?.toString() === loadoutId);

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

                        const oldLoadoutConfig = loadout[loadoutSlot].find(
                            loadout => loadout._id.toString() === loadoutId
                        );

                        const { ItemId, ...loadoutConfigItemIdRemoved } = loadoutConfig;
                        const loadoutConfigDatabase: ILoadoutConfigDatabase = {
                            _id: new Types.ObjectId(ItemId.$oid),
                            ...loadoutConfigItemIdRemoved
                        };

                        // if no config with this id exists, create a new one
                        if (!oldLoadoutConfig) {
                            //save the new object id and assign it for every ffff return at the end
                            if (ItemId.$oid === "ffffffffffffffffffffffff") {
                                if (!newLoadoutId) {
                                    newLoadoutId = new Types.ObjectId();
                                }
                                loadout[loadoutSlot].push({ _id: newLoadoutId, ...loadoutConfigItemIdRemoved });
                                continue;
                            }

                            loadout[loadoutSlot].push(loadoutConfigDatabase);
                            continue;
                        }

                        const loadoutIndex = loadout[loadoutSlot].indexOf(oldLoadoutConfig);
                        if (loadoutIndex === undefined || loadoutIndex === -1) {
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
            case "LongGuns":
            case "Pistols":
            case "Suits":
            case "Melee":
            case "Scoops":
            case "DataKnives":
            case "DrifterMelee":
            case "Sentinels":
            case "Horses":
            case "OperatorAmps":
            case "SentinelWeapons":
            case "KubrowPets":
            case "SpaceSuits":
            case "SpaceGuns":
            case "SpaceMelee":
            case "SpecialItems":
            case "MoaPets":
            case "Hoverboards":
            case "MechSuits":
            case "CrewShipHarnesses":
            case "CrewShips": {
                logger.debug(`general Item config saved of type ${equipmentName}`, { config: equipment });

                const itemEntries = equipment as IItemEntry;
                for (const [itemId, itemConfigEntries] of Object.entries(itemEntries)) {
                    const inventoryItem = inventory[equipmentName].find(item => item._id?.toString() === itemId);

                    if (!inventoryItem) {
                        throw new Error(`inventory item ${equipmentName} not found with id ${itemId}`);
                    }

                    //config ids are 0,1,2 can there be a 3?
                    for (const [configId, config] of Object.entries(itemConfigEntries)) {
                        inventoryItem.Configs[parseInt(configId)] = config;
                    }
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
            default: {
                logger.error(`category not implemented: ${equipmentName}`, { config: equipment });
            }
            //case "KahlLoadOuts": not sure yet how to handle kahl: it is not sent in inventory
        }
    }
    await inventory.save();
};
