import { IInventoryDatabase, IInventoryResponse } from "@/src/types/inventoryTypes/inventoryTypes";

// a schema's toJSON is responsible for changing Oid and Date to their corresponding Response versions __id to "ItemId":{"$oid":"6450f720bc562ebf030222d4"}, and a Date to "date":{"$date":{"$numberLong":"unix timestamp"})
const toInventoryResponse = (inventoryDatabase: IInventoryDatabase): IInventoryResponse => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountOwnerId, ...inventoryResponse } = inventoryDatabase;
    return inventoryResponse as unknown as IInventoryResponse;
};

export { toInventoryResponse };
