import { parseBoolean, parseNumber, parseString } from "@/src/helpers/general";
import { slotPurchaseNameToSlotName } from "@/src/services/purchaseService";
import { IPurchaseRequest, SlotPurchaseName } from "@/src/types/purchaseTypes";

export const toPurchaseRequest = (purchaseRequest: unknown): IPurchaseRequest => {
    if (!purchaseRequest || typeof purchaseRequest !== "object") {
        throw new Error("incorrect or missing purchase request data");
    }

    if (
        "PurchaseParams" in purchaseRequest &&
        "buildLabel" in purchaseRequest &&
        purchaseRequest.PurchaseParams &&
        typeof purchaseRequest.PurchaseParams === "object" &&
        "Source" in purchaseRequest.PurchaseParams &&
        "StoreItem" in purchaseRequest.PurchaseParams &&
        "StorePage" in purchaseRequest.PurchaseParams &&
        "SearchTerm" in purchaseRequest.PurchaseParams &&
        "CurrentLocation" in purchaseRequest.PurchaseParams &&
        "Quantity" in purchaseRequest.PurchaseParams &&
        "UsePremium" in purchaseRequest.PurchaseParams &&
        "ExpectedPrice" in purchaseRequest.PurchaseParams
    ) {
        return {
            PurchaseParams: {
                Source: parseNumber(purchaseRequest.PurchaseParams.Source),
                StoreItem: parseString(purchaseRequest.PurchaseParams.StoreItem),
                StorePage: parseString(purchaseRequest.PurchaseParams.StorePage),
                SearchTerm: parseString(purchaseRequest.PurchaseParams.SearchTerm),
                CurrentLocation: parseString(purchaseRequest.PurchaseParams.CurrentLocation),
                Quantity: parseNumber(purchaseRequest.PurchaseParams.Quantity),
                UsePremium: parseBoolean(purchaseRequest.PurchaseParams.UsePremium),
                ExpectedPrice: parseNumber(purchaseRequest.PurchaseParams.ExpectedPrice)
            },
            buildLabel: parseString(purchaseRequest.buildLabel)
        };
    }

    throw new Error("invalid purchaseRequest");
};

export const isSlotPurchaseName = (slotPurchaseName: string): slotPurchaseName is SlotPurchaseName => {
    return slotPurchaseName in slotPurchaseNameToSlotName;
};

export const parseSlotPurchaseName = (slotPurchaseName: string): SlotPurchaseName => {
    if (!isSlotPurchaseName(slotPurchaseName)) throw new Error(`invalid slot name ${slotPurchaseName}`);
    return slotPurchaseName;
};
