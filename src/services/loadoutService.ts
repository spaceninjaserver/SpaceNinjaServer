import type { FlattenMaps, Types } from "mongoose";
import type { TLoadoutDatabaseDocument } from "../models/inventoryModels/loadoutModel.ts";
import { Loadout } from "../models/inventoryModels/loadoutModel.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import type {
    ILoadoutConfigClient,
    ILoadoutConfigClientLegacy,
    ILoadoutPresetClientLegacy,
    ILoadOutPresets
} from "../types/saveLoadoutTypes.ts";
import type { IEquipmentDatabase, IEquipmentSelectionClient } from "../types/equipmentTypes.ts";
import { eLoadoutIndex } from "../types/inventoryTypes/inventoryTypes.ts";
import { convertIColorToLegacyColors, fromOid } from "../helpers/inventoryHelpers.ts";
import { buildVersionToInt } from "../helpers/versionHelper.ts";
import gameToBuildVersionInt from "../constants/gameToBuildVersionInt.ts";
import { logger } from "../utils/logger.ts";

export const getLoadout = async (
    accountId: Types.ObjectId | string,
    projection?: string
): Promise<TLoadoutDatabaseDocument> => {
    const loadout = await Loadout.findOne({ loadoutOwnerId: accountId }, projection);

    if (!loadout) {
        throw new Error(`loadout not found for account ${String(accountId)}`);
    }

    return loadout;
};

export const mapLegacyLoadoutPresets = (
    inventory: TInventoryDatabaseDocument,
    loadoutPresets: ILoadOutPresets,
    buildVersion: number
): FlattenMaps<ILoadoutConfigClientLegacy[]> =>
    loadoutPresets.NORMAL.map(x =>
        mapLegacyLoadoutConfig(inventory, loadoutPresets, buildVersion, fromOid(x.ItemId))
    ).filter(x => x !== undefined) as unknown as FlattenMaps<ILoadoutConfigClientLegacy[]>;

export const mapLegacyLoadoutConfig = (
    inventory: TInventoryDatabaseDocument,
    loadoutPresets: ILoadOutPresets,
    buildVersion: number,
    presetId?: string
): ILoadoutConfigClientLegacy | undefined => {
    // Loadout config mapping for U15 and below
    const findPreset = (presets: ILoadoutConfigClient[], index: number): ILoadoutConfigClient | undefined => {
        if (presetId !== undefined) {
            const preset = presets.find(x => fromOid(x.ItemId) == presetId);
            // Sentinel & archwing parts of a named preset fall back to the current ones
            if (preset || index == eLoadoutIndex.NORMAL) {
                return preset;
            }
        }
        const currentId = inventory.CurrentLoadOutIds[index] as Types.ObjectId | undefined;
        return currentId && presets.find(x => currentId.equals(fromOid(x.ItemId)));
    };
    const warnIfMissing = (preset: ILoadoutConfigClient | undefined, index: number, name: string): void => {
        const currentId = inventory.CurrentLoadOutIds[index] as Types.ObjectId | undefined;
        if (!preset && currentId && currentId.toString() !== "000000000000000000000000") {
            logger.warn(
                `Could not find ${name} loadout with id ${currentId.toString()}, this part of the loadout will be empty`
            );
        }
    };

    const emptyId = "ffffffffffffffffffffffff";
    const noSentinelId = buildVersion < gameToBuildVersionInt["8.0.0"] ? "NoSentinel" : emptyId;
    const hasModSlots = buildVersion >= gameToBuildVersionInt["10.8.0"];
    const mapSlot = (
        selection: IEquipmentSelectionClient | undefined,
        items: Types.DocumentArray<IEquipmentDatabase>,
        emptySlotId: string = emptyId
    ): ILoadoutPresetClientLegacy => {
        const item = selection?.ItemId ? items.id(fromOid(selection.ItemId)) : null;
        const cus = selection?.cus ?? 0;
        return {
            ItemId: { $id: item?._id.toString() ?? emptySlotId },
            ModSlot: hasModSlots ? (selection?.mod ?? 0) : 0,
            CustSlot: cus,
            Customization: {
                Emblem: "",
                Colors: convertIColorToLegacyColors(item?.Configs[cus]?.pricol),
                Skins: item?.Configs[cus]?.Skins ?? []
            }
        };
    };

    const normPreset = findPreset(loadoutPresets.NORMAL, eLoadoutIndex.NORMAL);
    if (!normPreset) {
        logger.error(
            `Could not find NORMAL loadout with id ${presetId ?? inventory.CurrentLoadOutIds[eLoadoutIndex.NORMAL]?.toString()}, entire loadout will be undefined`
        );
        return undefined;
    }

    const loadoutConfig: ILoadoutConfigClientLegacy = {
        ItemId: {
            $id: presetId ?? (buildVersion < gameToBuildVersionInt["14.0.0"] ? "Current" : fromOid(normPreset.ItemId))
        },
        Name: normPreset.n ?? "Default Loadout",
        Presets: [
            mapSlot(normPreset.s, inventory.Suits),
            mapSlot(normPreset.p, inventory.Pistols),
            mapSlot(normPreset.l, inventory.LongGuns),
            mapSlot(normPreset.m, inventory.Melee)
        ]
    };

    if (buildVersion >= buildVersionToInt("2013.03.18.00.00")) {
        const compPreset = findPreset(loadoutPresets.SENTINEL, eLoadoutIndex.SENTINEL);
        warnIfMissing(compPreset, eLoadoutIndex.SENTINEL, "SENTINEL");
        loadoutConfig.Presets.push(
            mapSlot(compPreset?.s, inventory.Sentinels, noSentinelId),
            mapSlot(compPreset?.l, inventory.SentinelWeapons, noSentinelId)
        );
    }

    if (buildVersion >= gameToBuildVersionInt["15.0.0"]) {
        const archPreset = findPreset(loadoutPresets.ARCHWING, eLoadoutIndex.ARCHWING);
        warnIfMissing(archPreset, eLoadoutIndex.ARCHWING, "ARCHWING");
        loadoutConfig.Presets.push(
            mapSlot(archPreset?.s, inventory.SpaceSuits),
            mapSlot(archPreset?.l, inventory.SpaceGuns),
            mapSlot(archPreset?.m, inventory.SpaceMelee)
        );
    }

    return loadoutConfig;
};
