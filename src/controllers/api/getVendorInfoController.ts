import type { RequestHandler } from "express";
import { applyStandingToVendorManifest, getVendorManifestByTypeName } from "../../services/serversideVendorsService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { config } from "../../services/configService.ts";
import { toMongoDate, version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { BL_LATEST } from "../../constants/gameVersions.ts";

export const getVendorInfoController: RequestHandler = async (req, res) => {
    let buildLabel: string;
    let accountId: string | undefined;

    if (req.query.accountId) {
        const account = await getAccountForRequest(req);
        buildLabel = getBuildLabel(req, account);
        accountId = account._id.toString();
    } else {
        buildLabel = BL_LATEST;
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
                    Expiry: toMongoDate(new Date(Date.now() + 5000)) // Giving 5 seconds because tenet/coda shop boots you with "Shopping session expired" at expiry
                }
            };
        }

        if (version_compare(buildLabel, gameToBuildVersion["42.0.0"]) < 0) {
            // Coda shop breaks if an item is unknown.
            manifest.VendorInfo.ItemManifest = manifest.VendorInfo.ItemManifest.filter(
                item =>
                    item.StoreItem !=
                    "/Lotus/StoreItems/Weapons/Infested/InfestedLich/LongGuns/CodaBubonico/CodaBubonicoCannon"
            );
        }
    }

    res.json(manifest);
};
