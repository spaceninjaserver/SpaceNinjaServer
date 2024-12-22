import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { TEndlessXpCategory } from "@/src/types/inventoryTypes/inventoryTypes";

export const endlessXpController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = getJSONfromString(String(req.body)) as IEndlessXpRequest;

    inventory.EndlessXP ??= [];
    const entry = inventory.EndlessXP.find(x => x.Category == payload.Category);
    if (entry) {
        entry.Choices = payload.Choices;
    } else {
        inventory.EndlessXP.push({
            Category: payload.Category,
            Choices: payload.Choices
        });
    }
    await inventory.save();

    res.json({
        NewProgress: {
            Category: payload.Category,
            Earn: 0,
            Claim: 0,
            BonusAvailable: {
                $date: {
                    $numberLong: "9999999999999"
                }
            },
            Expiry: {
                $date: {
                    $numberLong: "9999999999999"
                }
            },
            Choices: payload.Choices,
            PendingRewards: [
                {
                    RequiredTotalXp: 190,
                    Rewards: [
                        {
                            StoreItem: "/Lotus/StoreItems/Upgrades/Mods/Aura/PlayerHealthAuraMod",
                            ItemCount: 1
                        }
                    ]
                }
                // ...
            ]
        }
    });
};

interface IEndlessXpRequest {
    Mode: string; // "r"
    Category: TEndlessXpCategory;
    Choices: string[];
}
