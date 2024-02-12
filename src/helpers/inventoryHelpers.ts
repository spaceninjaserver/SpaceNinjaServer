import { IOid } from "@/src/types/commonTypes";
import { IInventoryDatabase, IInventoryResponse } from "@/src/types/inventoryTypes/inventoryTypes";
import { Types } from "mongoose";

//TODO: this needs to be addressed: a schema's toJSON is responsible for changing Oid and Date to their corresponding Response versions __id to "ItemId":{"$oid":"6450f720bc562ebf030222d4"}, and a Date to "date":{"$date":{"$numberLong":"unix timestamp"})
export const toInventoryResponse = (inventoryDatabase: IInventoryDatabase): IInventoryResponse => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountOwnerId, ...inventoryResponse } = inventoryDatabase;
    return inventoryResponse as unknown as IInventoryResponse;
};

export const toOid = (objectId: Types.ObjectId) => {
    return { $oid: objectId.toString() } satisfies IOid;
};

export const toMongoDate = (date: Date) => {
    return { $date: { $numberLong: date.getTime().toString() } };
};
