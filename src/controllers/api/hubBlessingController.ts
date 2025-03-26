import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addBooster, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getRandomInt } from "@/src/services/rngService";
import { RequestHandler } from "express";
import { ExportBoosters } from "warframe-public-export-plus";

export const hubBlessingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IHubBlessingRequest>(String(req.body));
    const boosterType = ExportBoosters[data.booster].typeName;
    if (req.query.mode == "send") {
        const inventory = await getInventory(accountId, "BlessingCooldown Boosters");
        inventory.BlessingCooldown = new Date(Date.now() + 86400000);
        addBooster(boosterType, 3 * 3600, inventory);
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
