import { Types } from "mongoose";
import { IEquipmentClient, IEquipmentDatabase } from "../types/inventoryTypes/commonInventoryTypes";
import { IMongoDate } from "../types/commonTypes";
import { IInventoryResponse } from "../types/inventoryTypes/inventoryTypes";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";

const importDate = (value: IMongoDate): Date => {
    return new Date(parseInt(value.$date.$numberLong));
};

const importOptionalDate = (value: IMongoDate | undefined): Date | undefined => {
    return value ? importDate(value) : undefined;
};

const importEquipment = (client: IEquipmentClient): IEquipmentDatabase => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(client.ItemId.$oid),
        InfestationDate: importOptionalDate(client.InfestationDate),
        Expiry: importOptionalDate(client.Expiry),
        UpgradesExpiry: importOptionalDate(client.UpgradesExpiry)
    };
};

export const importInventory = (
    db: TInventoryDatabaseDocument,
    client: IInventoryResponse,
    replace: boolean = false,
    update: boolean = true
): void => {
    const clientSuitsInDbFormat = client.Suits.map(x => importEquipment(x));
    if (replace) {
        db.Suits.splice(0, db.Suits.length);
    }
    clientSuitsInDbFormat.forEach(suitToImport => {
        if (update) {
            const index = db.Suits.findIndex(x => x._id == suitToImport._id);
            if (index != -1) {
                db.Suits.splice(index, 1);
            }
        } else {
            if (db.Suits.id(suitToImport._id)) {
                return;
            }
        }
        db.Suits.push(suitToImport);
    });
};
