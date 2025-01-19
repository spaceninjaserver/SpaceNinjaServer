import { Types } from "mongoose";
import { IEquipmentClient, IEquipmentDatabase } from "../types/inventoryTypes/commonInventoryTypes";
import { IMongoDate } from "../types/commonTypes";
import { IInventoryResponse } from "../types/inventoryTypes/inventoryTypes";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";

const convertDate = (value: IMongoDate): Date => {
    return new Date(parseInt(value.$date.$numberLong));
};

const convertOptionalDate = (value: IMongoDate | undefined): Date | undefined => {
    return value ? convertDate(value) : undefined;
};

const convertEquipment = (client: IEquipmentClient): IEquipmentDatabase => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(client.ItemId.$oid),
        InfestationDate: convertOptionalDate(client.InfestationDate),
        Expiry: convertOptionalDate(client.Expiry),
        UpgradesExpiry: convertOptionalDate(client.UpgradesExpiry)
    };
};

export const importInventory = (db: TInventoryDatabaseDocument, client: IInventoryResponse): void => {
    const clientSuitsInDbFormat = client.Suits.map(x => convertEquipment(x));
    db.Suits.splice(0, db.Suits.length);
    clientSuitsInDbFormat.forEach(suitToImport => {
        db.Suits.push(suitToImport);
    });
};
