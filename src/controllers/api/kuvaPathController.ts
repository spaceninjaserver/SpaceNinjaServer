import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { generateRewardSeed } from "../../services/rngService.ts";
import type { IInventoryClient, IKuvaKeyClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { logger } from "../../utils/logger.ts";
import { EPOCH, unixTimesInMs } from "../../constants/timeConstants.ts";

export const kuvaPathController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IKuvaPathRequest>(String(req.body));
    if (payload.Mode == "r") {
        const inventory = await getInventory(accountId, "KuvaKeysRewards");
        if (payload.Force || !inventory.KuvaKeysRewards || inventory.KuvaKeysRewards.Expiry.getTime() <= Date.now()) {
            const choices = [];
            for (let i = 0; i != 3; ++i) {
                choices.push({ ItemType: payload.ItemType, Seed: generateRewardSeed(), Claimed: false });
            }
            const week = Math.trunc((Date.now() - EPOCH) / unixTimesInMs.week);
            inventory.KuvaKeysRewards = {
                Expiry: new Date(EPOCH + (week + 1) * unixTimesInMs.week),
                Choices: choices
            };
            await inventory.save();
        }
        res.json({
            KuvaKeysRewards: inventory.toJSON<IInventoryClient>().KuvaKeysRewards
        });
    } else if (payload.Mode == "a") {
        const inventory = await getInventory(accountId, "KuvaKeysRewards KuvaKeys");
        const choice = inventory.KuvaKeysRewards?.Choices[payload.Index];
        if (!choice) {
            logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
            throw new Error(`missing KuvaPath choice`);
        }
        choice.Claimed = true;
        const index = inventory.KuvaKeys.push({ ItemType: choice.ItemType, Seed: choice.Seed }) - 1;
        await inventory.save();
        const inventoryChanges: IInventoryChanges = {
            KuvaKeys: [inventory.KuvaKeys[index].toJSON<IKuvaKeyClient>()]
        };
        res.json({
            KuvaKeysRewards: inventory.toJSON<IInventoryClient>().KuvaKeysRewards,
            InventoryChanges: inventoryChanges
        });
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unexpected kuvaPath mode: ${payload.Mode}`);
    }
};

type IKuvaPathRequest =
    | {
          Mode: "r"; // RefreshKeys
          ItemType: string;
          Force: boolean;
      }
    | {
          Mode: "a"; // GetKey
          Index: number;
      }
    | {
          Mode: "something else";
      };
