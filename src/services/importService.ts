import { Types } from "mongoose";
import { IEquipmentClient, IEquipmentDatabase } from "../types/inventoryTypes/commonInventoryTypes";
import { IMongoDate } from "../types/commonTypes";
import {
    equipmentKeys,
    IInventoryClient,
    ISlots,
    IUpgradeClient,
    IUpgradeDatabase,
    IWeaponSkinClient,
    IWeaponSkinDatabase
} from "../types/inventoryTypes/inventoryTypes";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";

/* eslint-disable @typescript-eslint/no-unused-vars */

const convertDate = (value: IMongoDate): Date => {
    return new Date(parseInt(value.$date.$numberLong));
};

const convertOptionalDate = (value: IMongoDate | undefined): Date | undefined => {
    return value ? convertDate(value) : undefined;
};

const convertEquipment = (client: IEquipmentClient): IEquipmentDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(client.ItemId.$oid),
        InfestationDate: convertOptionalDate(client.InfestationDate),
        Expiry: convertOptionalDate(client.Expiry),
        UpgradesExpiry: convertOptionalDate(client.UpgradesExpiry)
    };
};

const convertWeaponSkin = (client: IWeaponSkinClient): IWeaponSkinDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(client.ItemId.$oid)
    };
};

const convertUpgrade = (client: IUpgradeClient): IUpgradeDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(client.ItemId.$oid)
    };
};

const replaceArray = <T>(arr: T[], replacement: T[]): void => {
    arr.splice(0, arr.length);
    replacement.forEach(x => {
        arr.push(x);
    });
};

const replaceSlots = (db: ISlots, client: ISlots): void => {
    db.Extra = client.Extra;
    db.Slots = client.Slots;
};

export const importInventory = (db: TInventoryDatabaseDocument, client: Partial<IInventoryClient>): void => {
    for (const key of equipmentKeys) {
        if (client[key]) {
            replaceArray<IEquipmentDatabase>(db[key], client[key].map(convertEquipment));
        }
    }
    if (client.WeaponSkins) {
        replaceArray<IWeaponSkinDatabase>(db.WeaponSkins, client.WeaponSkins.map(convertWeaponSkin));
    }
    if (client.Upgrades) {
        replaceArray<IUpgradeDatabase>(db.Upgrades, client.Upgrades.map(convertUpgrade));
    }
    for (const key of [
        "SuitBin",
        "WeaponBin",
        "SentinelBin",
        "SpaceSuitBin",
        "SpaceWeaponBin",
        "PvpBonusLoadoutBin",
        "PveBonusLoadoutBin",
        "RandomModBin",
        "MechBin",
        "CrewMemberBin",
        "OperatorAmpBin",
        "CrewShipSalvageBin"
    ] as const) {
        if (client[key]) {
            replaceSlots(db[key], client[key]);
        }
    }
    for (const key of [
        "RegularCredits",
        "PremiumCredits",
        "PremiumCreditsFree",
        "FusionPoints",
        "PrimeTokens"
    ] as const) {
        if (client[key]) {
            db[key] = client[key];
        }
    }
    for (const key of ["ThemeStyle", "ThemeBackground", "ThemeSounds", "EquippedInstrument"] as const) {
        if (client[key]) {
            db[key] = client[key];
        }
    }
};
