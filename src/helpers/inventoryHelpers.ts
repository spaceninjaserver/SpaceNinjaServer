import { IInventoryDatabase, IInventoryResponse } from "@/src/types/inventoryTypes/inventoryTypes";

const toInventoryResponse = (inventoryDatabase: IInventoryDatabase): IInventoryResponse => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accountOwnerId, ...inventoreResponse } = inventoryDatabase;
    return inventoreResponse;
};

export { toInventoryResponse };
