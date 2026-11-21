import type { RequestHandler } from "express";
import { getAccountForRequest, hasPermission } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getSyndicate } from "../../services/itemDataService.ts";
import { buildVersionToInt } from "../../helpers/versionHelper.ts";
import { BV_LATEST } from "../../constants/gameVersions.ts";
import { getTitleBounds } from "../../helpers/syndicateStandingHelper.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";

export const setSyndicateStandingController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!hasPermission(account, "setSyndicateStanding")) {
        res.status(500).send(`Permission denied`).end();
        return;
    }
    const request = req.body as ISetSyndicateStandingRequest;
    const inventory = await getInventory(account._id, "Affiliations");
    const buildVersion = account.BuildLabel ? buildVersionToInt(account.BuildLabel) : BV_LATEST;
    const meta = await getSyndicate(request.Tag, buildVersion);
    let syndicate = inventory.Affiliations.find(x => x.Tag == request.Tag);
    const bounds = meta ? getTitleBounds(meta, syndicate?.Title ?? 0) : undefined;
    if (!bounds) {
        res.status(400).end();
        return;
    }

    let standing: number;
    if (request.Mode == "min") {
        standing = bounds.min;
    } else if (request.Mode == "max") {
        standing = bounds.max;
    } else {
        if (typeof request.Standing != "number" || !Number.isFinite(request.Standing)) {
            res.status(400).end();
            return;
        }
        standing =
            request.Mode == "add"
                ? (syndicate?.Standing ?? 0) + Math.trunc(request.Standing)
                : bounds.base + Math.trunc(request.Standing);
        standing = Math.min(bounds.max, Math.max(bounds.min, standing));
    }

    syndicate ??= inventory.Affiliations[inventory.Affiliations.push({ Tag: request.Tag, Standing: 0, Title: 0 }) - 1];
    syndicate.Standing = standing;

    await inventory.save();
    res.json(syndicate);
    broadcastInventoryUpdate(req);
};

interface ISetSyndicateStandingRequest {
    Tag: string;
    Mode: "min" | "max" | "set" | "add";
    Standing?: number;
}
