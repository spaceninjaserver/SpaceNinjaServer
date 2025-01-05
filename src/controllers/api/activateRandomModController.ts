import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMods, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getRandomElement, getRandomInt, getRandomReward, IRngResult } from "@/src/services/rngService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportUpgrades } from "warframe-public-export-plus";

export const activateRandomModController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = getJSONfromString(String(req.body)) as IActiveRandomModRequest;
    addMods(inventory, [
        {
            ItemType: request.ItemType,
            ItemCount: -1
        }
    ]);
    const rivenType = getRandomElement(rivenRawToRealWeighted[request.ItemType]);
    const challenge = getRandomElement(ExportUpgrades[rivenType].availableChallenges!);
    const fingerprintChallenge: IRandomModChallenge = {
        Type: challenge.fullName,
        Progress: 0,
        Required: getRandomInt(challenge.countRange[0], challenge.countRange[1])
    };
    if (Math.random() < challenge.complicationChance) {
        const complicationsAsRngResults: IRngResult[] = [];
        for (const complication of challenge.complications) {
            complicationsAsRngResults.push({
                type: complication.fullName,
                itemCount: 1,
                probability: complication.weight
            });
        }
        fingerprintChallenge.Complication = getRandomReward(complicationsAsRngResults)!.type;
        logger.debug(
            `riven rolled challenge ${fingerprintChallenge.Type} with complication ${fingerprintChallenge.Complication}`
        );
        const complication = challenge.complications.find(x => x.fullName == fingerprintChallenge.Complication)!;
        fingerprintChallenge.Required *= complication.countMultiplier;
    } else {
        logger.debug(`riven rolled challenge ${fingerprintChallenge.Type}`);
    }
    const upgradeIndex =
        inventory.Upgrades.push({
            ItemType: rivenType,
            UpgradeFingerprint: JSON.stringify({ challenge: fingerprintChallenge })
        }) - 1;
    await inventory.save();
    res.json({
        NewMod: inventory.Upgrades[upgradeIndex].toJSON()
    });
};

interface IActiveRandomModRequest {
    ItemType: string;
}

interface IRandomModChallenge {
    Type: string;
    Progress: number;
    Required: number;
    Complication?: string;
}

const rivenRawToRealWeighted: Record<string, string[]> = {
    "/Lotus/Upgrades/Mods/Randomized/RawArchgunRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusArchgunRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawMeleeRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawModularMeleeRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusModularMeleeRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawModularPistolRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusModularPistolRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawPistolRandomMod": ["/Lotus/Upgrades/Mods/Randomized/LotusPistolRandomModRare"],
    "/Lotus/Upgrades/Mods/Randomized/RawRifleRandomMod": ["/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare"],
    "/Lotus/Upgrades/Mods/Randomized/RawShotgunRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusShotgunRandomModRare"
    ],
    "/Lotus/Upgrades/Mods/Randomized/RawSentinelWeaponRandomMod": [
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusShotgunRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/LotusPistolRandomModRare",
        "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare"
    ]
};
