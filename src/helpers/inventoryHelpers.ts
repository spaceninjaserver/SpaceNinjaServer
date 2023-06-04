import { removeKeysFromObject } from "@/src/helpers/general";
import { IInventoryDatabase } from "@/src/types/inventoryTypes";

const toInventoryResponse = (inventoryDatabase: IInventoryDatabase) => {
    return removeKeysFromObject(inventoryDatabase, ["accountOwnerId"]);
};

export { toInventoryResponse };
