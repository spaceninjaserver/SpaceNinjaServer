import { version_compare } from "@/src/helpers/inventoryHelpers";
import {
    consumeModCharge,
    decodeNemesisGuess,
    encodeNemesisGuess,
    getInfNodes,
    getKnifeUpgrade,
    getNemesisManifest,
    getNemesisPasscode,
    getNemesisPasscodeModTypes,
    GUESS_CORRECT,
    GUESS_INCORRECT,
    GUESS_NEUTRAL,
    GUESS_NONE,
    GUESS_WILDCARD,
    IKnifeResponse
} from "@/src/helpers/nemesisHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { freeUpSlot, getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest } from "@/src/services/loginService";
import { SRng } from "@/src/services/rngService";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IInnateDamageFingerprint,
    IInventoryClient,
    INemesisClient,
    InventorySlot,
    IUpgradeClient,
    IWeaponSkinClient,
    LoadoutIndex,
    TEquipmentKey,
    TNemesisFaction
} from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const nemesisController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if ((req.query.mode as string) == "f") {
        const body = getJSONfromString<IValenceFusionRequest>(String(req.body));
        const inventory = await getInventory(account._id.toString(), body.Category + " WeaponBin");
        const destWeapon = inventory[body.Category].id(body.DestWeapon.$oid)!;
        const sourceWeapon = inventory[body.Category].id(body.SourceWeapon.$oid)!;
        const destFingerprint = JSON.parse(destWeapon.UpgradeFingerprint!) as IInnateDamageFingerprint;
        const sourceFingerprint = JSON.parse(sourceWeapon.UpgradeFingerprint!) as IInnateDamageFingerprint;

        // Update destination damage type if desired
        if (body.UseSourceDmgType) {
            destFingerprint.buffs[0].Tag = sourceFingerprint.buffs[0].Tag;
        }

        // Upgrade destination damage value
        const destDamage = 0.25 + (destFingerprint.buffs[0].Value / 0x3fffffff) * (0.6 - 0.25);
        const sourceDamage = 0.25 + (sourceFingerprint.buffs[0].Value / 0x3fffffff) * (0.6 - 0.25);
        let newDamage = Math.max(destDamage, sourceDamage) * 1.1;
        if (newDamage >= 0.5794998) {
            newDamage = 0.6;
        }
        destFingerprint.buffs[0].Value = Math.trunc(((newDamage - 0.25) / (0.6 - 0.25)) * 0x3fffffff);

        // Commit fingerprint
        destWeapon.UpgradeFingerprint = JSON.stringify(destFingerprint);

        // Remove source weapon
        inventory[body.Category].pull({ _id: body.SourceWeapon.$oid });
        freeUpSlot(inventory, InventorySlot.WEAPONS);

        await inventory.save();
        res.json({
            InventoryChanges: {
                [body.Category]: [destWeapon.toJSON()],
                RemovedIdItems: [{ ItemId: body.SourceWeapon }]
            }
        });
    } else if ((req.query.mode as string) == "p") {
        const inventory = await getInventory(account._id.toString(), "Nemesis");
        const body = getJSONfromString<INemesisPrespawnCheckRequest>(String(req.body));
        const passcode = getNemesisPasscode(inventory.Nemesis!);
        let guessResult = 0;
        if (inventory.Nemesis!.Faction == "FC_INFESTATION") {
            for (let i = 0; i != 3; ++i) {
                if (body.guess[i] == passcode[0]) {
                    guessResult = 1 + i;
                    break;
                }
            }
        } else {
            for (let i = 0; i != 3; ++i) {
                if (body.guess[i] == passcode[i] || body.guess[i] == GUESS_WILDCARD) {
                    ++guessResult;
                }
            }
        }
        res.json({ GuessResult: guessResult });
    } else if (req.query.mode == "r") {
        const inventory = await getInventory(
            account._id.toString(),
            "Nemesis LoadOutPresets CurrentLoadOutIds DataKnives Upgrades RawUpgrades"
        );
        const body = getJSONfromString<INemesisRequiemRequest>(String(req.body));
        if (inventory.Nemesis!.Faction == "FC_INFESTATION") {
            const guess: number[] = [body.guess & 0xf, (body.guess >> 4) & 0xf, (body.guess >> 8) & 0xf];
            const passcode = getNemesisPasscode(inventory.Nemesis!)[0];
            const result1 = passcode == guess[0] ? GUESS_CORRECT : GUESS_INCORRECT;
            const result2 = passcode == guess[1] ? GUESS_CORRECT : GUESS_INCORRECT;
            const result3 = passcode == guess[2] ? GUESS_CORRECT : GUESS_INCORRECT;
            inventory.Nemesis!.GuessHistory.push(
                encodeNemesisGuess([
                    {
                        symbol: guess[0],
                        result: result1
                    },
                    {
                        symbol: guess[1],
                        result: result2
                    },
                    {
                        symbol: guess[2],
                        result: result3
                    }
                ])
            );

            // Increase antivirus if correct antivirus mod is installed
            const response: IKnifeResponse = {};
            if (result1 == GUESS_CORRECT || result2 == GUESS_CORRECT || result3 == GUESS_CORRECT) {
                let antivirusGain = 5;
                const loadout = (await Loadout.findById(inventory.LoadOutPresets, "DATAKNIFE"))!;
                const dataknifeLoadout = loadout.DATAKNIFE.id(inventory.CurrentLoadOutIds[LoadoutIndex.DATAKNIFE].$oid);
                const dataknifeConfigIndex = dataknifeLoadout?.s?.mod ?? 0;
                const dataknifeUpgrades = inventory.DataKnives[0].Configs[dataknifeConfigIndex].Upgrades!;
                for (const upgrade of body.knife!.AttachedUpgrades) {
                    switch (upgrade.ItemType) {
                        case "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusAndSpeedOnUseMod":
                            antivirusGain += 10;
                            consumeModCharge(response, inventory, upgrade, dataknifeUpgrades);
                            break;
                        case "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusAndWeaponDamageOnUseMod":
                            antivirusGain += 10;
                            consumeModCharge(response, inventory, upgrade, dataknifeUpgrades);
                            break;
                        case "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusLargeOnSingleUseMod": // Instant Secure
                            antivirusGain += 15;
                            consumeModCharge(response, inventory, upgrade, dataknifeUpgrades);
                            break;
                        case "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusOnUseMod": // Immuno Shield
                            antivirusGain += 15;
                            consumeModCharge(response, inventory, upgrade, dataknifeUpgrades);
                            break;
                        case "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusSmallOnSingleUseMod":
                            antivirusGain += 10;
                            consumeModCharge(response, inventory, upgrade, dataknifeUpgrades);
                            break;
                    }
                }
                inventory.Nemesis!.HenchmenKilled += antivirusGain;
            }

            if (inventory.Nemesis!.HenchmenKilled >= 100) {
                inventory.Nemesis!.HenchmenKilled = 100;
            }
            inventory.Nemesis!.InfNodes = getInfNodes(getNemesisManifest(inventory.Nemesis!.manifest), 0);

            await inventory.save();
            res.json(response);
        } else {
            // For first guess, create a new entry.
            if (body.position == 0) {
                inventory.Nemesis!.GuessHistory.push(
                    encodeNemesisGuess([
                        {
                            symbol: GUESS_NONE,
                            result: GUESS_NEUTRAL
                        },
                        {
                            symbol: GUESS_NONE,
                            result: GUESS_NEUTRAL
                        },
                        {
                            symbol: GUESS_NONE,
                            result: GUESS_NEUTRAL
                        }
                    ])
                );
            }

            // Evaluate guess
            const correct =
                body.guess == GUESS_WILDCARD || getNemesisPasscode(inventory.Nemesis!)[body.position] == body.guess;

            // Update entry
            const guess = decodeNemesisGuess(
                inventory.Nemesis!.GuessHistory[inventory.Nemesis!.GuessHistory.length - 1]
            );
            guess[body.position].symbol = body.guess;
            guess[body.position].result = correct ? GUESS_CORRECT : GUESS_INCORRECT;
            inventory.Nemesis!.GuessHistory[inventory.Nemesis!.GuessHistory.length - 1] = encodeNemesisGuess(guess);

            // Increase rank if incorrect
            let RankIncrease: number | undefined;
            if (!correct) {
                RankIncrease = 1;
                const manifest = getNemesisManifest(inventory.Nemesis!.manifest);
                inventory.Nemesis!.Rank = Math.min(inventory.Nemesis!.Rank + 1, manifest.systemIndexes.length - 1);
                inventory.Nemesis!.InfNodes = getInfNodes(manifest, inventory.Nemesis!.Rank);
            }
            await inventory.save();
            res.json({ RankIncrease });
        }
    } else if ((req.query.mode as string) == "rs") {
        // report spawn; POST but no application data in body
        const inventory = await getInventory(account._id.toString(), "Nemesis");
        inventory.Nemesis!.LastEnc = inventory.Nemesis!.MissionCount;
        await inventory.save();
        res.json({ LastEnc: inventory.Nemesis!.LastEnc });
    } else if ((req.query.mode as string) == "s") {
        const inventory = await getInventory(account._id.toString(), "Nemesis");
        if (inventory.Nemesis) {
            logger.warn(`overwriting an existing nemesis as a new one is being requested`);
        }
        const body = getJSONfromString<INemesisStartRequest>(String(req.body));
        body.target.fp = BigInt(body.target.fp);

        const manifest = getNemesisManifest(body.target.manifest);
        if (account.BuildLabel && version_compare(account.BuildLabel, manifest.minBuild) < 0) {
            logger.warn(
                `client on version ${account.BuildLabel} provided nemesis manifest ${body.target.manifest} which was expected to require ${manifest.minBuild} or above. please file a bug report.`
            );
        }

        let weaponIdx = -1;
        if (body.target.Faction != "FC_INFESTATION") {
            const weapons: readonly string[] = manifest.weapons;
            const initialWeaponIdx = new SRng(body.target.fp).randomInt(0, weapons.length - 1);
            weaponIdx = initialWeaponIdx;
            if (body.target.DisallowedWeapons) {
                do {
                    const weapon = weapons[weaponIdx];
                    if (body.target.DisallowedWeapons.indexOf(weapon) == -1) {
                        break;
                    }
                    weaponIdx = (weaponIdx + 1) % weapons.length;
                } while (weaponIdx != initialWeaponIdx);
            }
        }

        inventory.Nemesis = {
            fp: body.target.fp,
            manifest: body.target.manifest,
            KillingSuit: body.target.KillingSuit,
            killingDamageType: body.target.killingDamageType,
            ShoulderHelmet: body.target.ShoulderHelmet,
            WeaponIdx: weaponIdx,
            AgentIdx: body.target.AgentIdx,
            BirthNode: body.target.BirthNode,
            Faction: body.target.Faction,
            Rank: 0,
            k: false,
            Traded: false,
            d: new Date(),
            InfNodes: getInfNodes(manifest, 0),
            GuessHistory: [],
            Hints: [],
            HintProgress: 0,
            Weakened: false,
            PrevOwners: 0,
            HenchmenKilled: 0,
            SecondInCommand: false,
            MissionCount: 0,
            LastEnc: 0
        };
        await inventory.save();

        res.json({
            target: inventory.toJSON().Nemesis
        });
    } else if ((req.query.mode as string) == "w") {
        const inventory = await getInventory(
            account._id.toString(),
            "Nemesis LoadOutPresets CurrentLoadOutIds DataKnives Upgrades RawUpgrades"
        );
        //const body = getJSONfromString<INemesisWeakenRequest>(String(req.body));

        inventory.Nemesis!.InfNodes = [
            {
                Node: getNemesisManifest(inventory.Nemesis!.manifest).showdownNode,
                Influence: 1
            }
        ];
        inventory.Nemesis!.Weakened = true;

        const response: IKnifeResponse & { target: INemesisClient } = {
            target: inventory.toJSON<IInventoryClient>().Nemesis!
        };

        // Consume charge of the correct requiem mod(s)
        const loadout = (await Loadout.findById(inventory.LoadOutPresets, "DATAKNIFE"))!;
        const dataknifeLoadout = loadout.DATAKNIFE.id(inventory.CurrentLoadOutIds[LoadoutIndex.DATAKNIFE].$oid);
        const dataknifeConfigIndex = dataknifeLoadout?.s?.mod ?? 0;
        const dataknifeUpgrades = inventory.DataKnives[0].Configs[dataknifeConfigIndex].Upgrades!;
        const modTypes = getNemesisPasscodeModTypes(inventory.Nemesis!);
        for (const modType of modTypes) {
            const upgrade = getKnifeUpgrade(inventory, dataknifeUpgrades, modType);
            consumeModCharge(response, inventory, upgrade, dataknifeUpgrades);
        }

        await inventory.save();
        res.json(response);
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unknown nemesis mode: ${String(req.query.mode)}`);
    }
};

interface IValenceFusionRequest {
    DestWeapon: IOid;
    SourceWeapon: IOid;
    Category: TEquipmentKey;
    UseSourceDmgType: boolean;
}

interface INemesisStartRequest {
    target: {
        fp: number | bigint;
        manifest: string;
        KillingSuit: string;
        killingDamageType: number;
        ShoulderHelmet: string;
        DisallowedWeapons?: string[];
        WeaponIdx: number;
        AgentIdx: number;
        BirthNode: string;
        Faction: TNemesisFaction;
        Rank: number;
        k: boolean;
        Traded: boolean;
        d: IMongoDate;
        InfNodes: [];
        GuessHistory: [];
        Hints: [];
        HintProgress: number;
        Weakened: boolean;
        PrevOwners: number;
        HenchmenKilled: number;
        MissionCount?: number; // Added in 38.5.0
        LastEnc?: number; // Added in 38.5.0
        SecondInCommand: boolean;
    };
}

interface INemesisPrespawnCheckRequest {
    guess: number[]; // .length == 3
    potency?: number[];
}

interface INemesisRequiemRequest {
    guess: number; // grn/crp: 4 bits | coda: 3x 4 bits
    position: number; // grn/crp: 0-2 | coda: 0
    // knife field provided for coda only
    knife?: IKnife;
}

// interface INemesisWeakenRequest {
//     target: INemesisClient;
//     knife: IKnife;
// }

interface IKnife {
    Item: IEquipmentClient;
    Skins: IWeaponSkinClient[];
    ModSlot: number;
    CustSlot: number;
    AttachedUpgrades: IUpgradeClient[];
    HiddenWhenHolstered: boolean;
}
