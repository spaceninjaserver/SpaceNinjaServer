import { RequestHandler } from "express";
import { applyStandingToVendorManifest, getVendorManifestByTypeName } from "@/src/services/serversideVendorsService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";

export const getVendorInfoController: RequestHandler = async (req, res) => {
    let manifest = getVendorManifestByTypeName(req.query.vendor as string);
    if (!manifest) {
        throw new Error(`Unknown vendor: ${req.query.vendor as string}`);
    }

    // For testing purposes, authenticating with this endpoint is optional here, but would be required on live.
    if (req.query.accountId) {
        const accountId = await getAccountIdForRequest(req);
        const inventory = await getInventory(accountId);
        manifest = applyStandingToVendorManifest(inventory, manifest);
    }

    res.json(manifest);
};
