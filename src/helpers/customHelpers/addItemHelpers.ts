import { isString, parseString } from "@/src/helpers/general";
import { items } from "@/src/services/itemDataService";

export enum ItemType {
    Powersuit = "Powersuit",
    Weapon = "Weapon"
}

export const isItemType = (itemType: string): itemType is ItemType => {
    return Object.keys(ItemType).includes(itemType);
};

const parseItemType = (itemType: unknown): ItemType => {
    if (!itemType || !isString(itemType) || !isItemType(itemType)) {
        throw new Error("incorrect item type");
    }

    return itemType;
};

interface IAddItemRequest {
    type: ItemType;
    InternalName: string;
    accountId: string;
}
export const isInternalName = (internalName: string): boolean => {
    const item = items.find(i => i.uniqueName === internalName);
    return Boolean(item);
};

const parseInternalName = (internalName: unknown): string => {
    if (!isString(internalName) || !isInternalName(internalName)) {
        throw new Error("incorrect internal name");
    }

    return internalName;
};

const toAddItemRequest = (body: unknown): IAddItemRequest => {
    if (!body || typeof body !== "object") {
        throw new Error("incorrect or missing add item request data");
    }

    if ("type" in body && "internalName" in body && "accountId" in body) {
        return {
            type: parseItemType(body.type),
            InternalName: parseInternalName(body.internalName),
            accountId: parseString(body.accountId)
        };
    }

    throw new Error("malformed add item request");
};

export { toAddItemRequest };
