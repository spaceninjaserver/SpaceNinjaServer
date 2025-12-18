import { unixTimesInMs } from "../../constants/timeConstants.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addBooster, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getRandomInt } from "../../services/rngService.ts";
import type { RequestHandler } from "express";
import { ExportBoosters } from "warframe-public-export-plus";
import type { IOid } from "../../types/commonTypes.ts";

export const hubBlessingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IHubBlessingRequest>(String(req.body));
    if (req.query.mode == "send") {
        const boosterType = ExportBoosters[data.booster!].typeName;

        const inventory = await getInventory(accountId, "BlessingCooldown Boosters");
        inventory.BlessingCooldown = new Date(Date.now() + 23 * unixTimesInMs.hour);
        addBooster(boosterType, 3 * 3600, inventory); // unfaithful for < U41 but correct for >= U41 afaict. Either way, needed for blessings to work without a (full) HUB server.
        await inventory.save();

        let token = "";
        for (let i = 0; i != 32; ++i) {
            token += getRandomInt(0, 15).toString(16);
        }

        res.json({
            BlessingCooldown: inventory.BlessingCooldown,
            SendTime: Math.trunc(Date.now() / 1000).toString(),
            Expiry: Math.trunc(Date.now() / 1000 + 3 * 3600).toString(), // added in 38.6.0
            Token: token
        });
    } else {
        if (data.booster) {
            // < U41
            const boosterType = ExportBoosters[data.booster].typeName;

            const inventory = await getInventory(accountId, "Boosters");
            addBooster(boosterType, 3 * 3600, inventory);
            await inventory.save();

            res.json({
                BoosterType: data.booster,
                Sender: data.senderId
            });
        } else {
            // >= U41
            const inventory = await getInventory(accountId, "Boosters");
            for (const blessing of data.PendingHubBlessings!) {
                const boosterType = ExportBoosters[blessing.booster].typeName;
                // TODO: Maybe respect sendTime?
                addBooster(boosterType, 3 * 3600, inventory);
            }
            await inventory.save();
            res.end();
        }
    }
};

interface IHubBlessingRequest {
    booster?: string;
    senderId?: string; // mode=request
    sendTime?: string; // mode=request
    token?: string; // mode=request
    PendingHubBlessings?: {
        booster: string;
        senderId: IOid;
        sendTime: string;
        token: string;
    }[];
}
