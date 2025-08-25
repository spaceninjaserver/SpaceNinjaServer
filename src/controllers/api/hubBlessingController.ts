import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { addBooster, getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getRandomInt } from "../../services/rngService.ts";
import type { RequestHandler } from "express";
import { ExportBoosters } from "warframe-public-export-plus";

export const hubBlessingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IHubBlessingRequest>(String(req.body));
    const boosterType = ExportBoosters[data.booster].typeName;
    if (req.query.mode == "send") {
        const inventory = await getInventory(accountId, "BlessingCooldown Boosters");
        inventory.BlessingCooldown = new Date(Date.now() + 86400000);
        addBooster(boosterType, 3 * 3600, inventory); // unfaithful, but current HUB server does not handle broadcasting, so this way users can bless themselves.
        await inventory.save();

        let token = "";
        for (let i = 0; i != 32; ++i) {
            token += getRandomInt(0, 15).toString(16);
        }

        res.json({
            BlessingCooldown: inventory.BlessingCooldown,
            SendTime: Math.trunc(Date.now() / 1000).toString(),
            Token: token
        });
    } else {
        const inventory = await getInventory(accountId, "Boosters");
        addBooster(boosterType, 3 * 3600, inventory);
        await inventory.save();

        res.json({
            BoosterType: data.booster,
            Sender: data.senderId
        });
    }
};

interface IHubBlessingRequest {
    booster: string;
    senderId?: string; // mode=request
    sendTime?: string; // mode=request
    token?: string; // mode=request
}
