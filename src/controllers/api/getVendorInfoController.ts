import type { RequestHandler } from "express";
import { applyStandingToVendorManifest, getVendorManifestByTypeName } from "../../services/serversideVendorsService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { config } from "../../services/configService.ts";

export const getVendorInfoController: RequestHandler = async (req, res) => {
    let buildLabel: string | undefined;
    let accountId: string | undefined;

    if (req.query.accountId) {
        const account = await getAccountForRequest(req);
        buildLabel = account.BuildLabel;
        accountId = account._id.toString();
    }

    let manifest = getVendorManifestByTypeName(req.query.vendor as string, undefined, buildLabel);
    if (!manifest) {
        throw new Error(`Unknown vendor: ${req.query.vendor as string}`);
    }

    // For testing purposes, authenticating with this endpoint is optional here, but would be required on live.
    if (accountId) {
        const inventory = await getInventory(accountId, "Affiliations");
        manifest = applyStandingToVendorManifest(manifest, inventory.Affiliations);
        if (config.dev?.keepVendorsExpired) {
            manifest = {
                VendorInfo: {
                    ...manifest.VendorInfo,
                    Expiry: { $date: { $numberLong: "0" } }
                }
            };
        }
    }

    res.json(manifest);
};
