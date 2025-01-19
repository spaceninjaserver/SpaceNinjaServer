/* eslint-disable @typescript-eslint/no-unused-vars */

import { Types } from "mongoose";
import { IEquipmentClient, IEquipmentDatabase } from "../types/inventoryTypes/commonInventoryTypes";
import { IMongoDate } from "../types/commonTypes";
import { IInventoryClient, IWeaponSkinClient, IWeaponSkinDatabase } from "../types/inventoryTypes/inventoryTypes";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";

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

const replaceArray = <T>(arr: T[], replacement: T[]): void => {
    arr.splice(0, arr.length);
    replacement.forEach(x => {
        arr.push(x);
    });
};

export const importInventory = (db: TInventoryDatabaseDocument, client: IInventoryClient): void => {
    replaceArray<IEquipmentDatabase>(db.Suits, client.Suits.map(convertEquipment));
    replaceArray<IWeaponSkinDatabase>(db.WeaponSkins, client.WeaponSkins.map(convertWeaponSkin));
};
