import { getInfNodes, getNemesisPasscode } from "@/src/helpers/nemesisHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { freeUpSlot, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { SRng } from "@/src/services/rngService";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { IInnateDamageFingerprint, InventorySlot, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

export const nemesisController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    if ((req.query.mode as string) == "f") {
        const body = getJSONfromString<IValenceFusionRequest>(String(req.body));
        const inventory = await getInventory(accountId, body.Category + " WeaponBin");
        const destWeapon = inventory[body.Category].id(body.DestWeapon.$oid)!;
        const sourceWeapon = inventory[body.Category].id(body.SourceWeapon.$oid)!;
        const destFingerprint = JSON.parse(destWeapon.UpgradeFingerprint!) as IInnateDamageFingerprint;
        const sourceFingerprint = JSON.parse(sourceWeapon.UpgradeFingerprint!) as IInnateDamageFingerprint;

        // Upgrade destination damage type if desireed
        if (body.UseSourceDmgType) {
            destFingerprint.buffs[0].Tag = sourceFingerprint.buffs[0].Tag;
        }

        // Upgrade destination damage value
        const destDamage = 0.25 + (destFingerprint.buffs[0].Value / 0x3fffffff) * (0.6 - 0.25);
        const sourceDamage = 0.25 + (sourceFingerprint.buffs[0].Value / 0x3fffffff) * (0.6 - 0.25);
        let newDamage = Math.max(destDamage, sourceDamage) * 1.1;
        if (newDamage >= 0.58) {
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
                [body.Category]: [destWeapon.toJSON()]
            }
        });
    } else if ((req.query.mode as string) == "p") {
        const inventory = await getInventory(accountId, "Nemesis");
        const body = getJSONfromString<INemesisPrespawnCheckRequest>(String(req.body));
        const passcode = getNemesisPasscode(inventory.Nemesis!.fp, inventory.Nemesis!.Faction);
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
                if (body.guess[i] == passcode[i]) {
                    ++guessResult;
                }
            }
        }
        res.json({ GuessResult: guessResult });
    } else if ((req.query.mode as string) == "s") {
        const inventory = await getInventory(accountId, "Nemesis");
        const body = getJSONfromString<INemesisStartRequest>(String(req.body));
        body.target.fp = BigInt(body.target.fp);

        let weaponIdx = -1;
        if (body.target.Faction != "FC_INFESTATION") {
            let weapons: readonly string[];
            if (body.target.manifest == "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionSix") {
                weapons = kuvaLichVersionSixWeapons;
            } else if (
                body.target.manifest == "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionFour" ||
                body.target.manifest == "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionThree"
            ) {
                weapons = corpusVersionThreeWeapons;
            } else {
                throw new Error(`unknown nemesis manifest: ${body.target.manifest}`);
            }

            const initialWeaponIdx = new SRng(body.target.fp).randomInt(0, weapons.length - 1);
            weaponIdx = initialWeaponIdx;
            do {
                const weapon = weapons[weaponIdx];
                if (!body.target.DisallowedWeapons.find(x => x == weapon)) {
                    break;
                }
                weaponIdx = (weaponIdx + 1) % weapons.length;
            } while (weaponIdx != initialWeaponIdx);
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
            InfNodes: getInfNodes(body.target.Faction, 0),
            GuessHistory: [],
            Hints: [],
            HintProgress: 0,
            Weakened: body.target.Weakened,
            PrevOwners: 0,
            HenchmenKilled: 0,
            SecondInCommand: body.target.SecondInCommand,
            MissionCount: 0,
            LastEnc: 0
        };
        await inventory.save();

        res.json({
            target: inventory.toJSON().Nemesis
        });
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
        DisallowedWeapons: string[];
        WeaponIdx: number;
        AgentIdx: number;
        BirthNode: string;
        Faction: string;
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

const kuvaLichVersionSixWeapons = [
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Drakgoon/KuvaDrakgoon",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Karak/KuvaKarak",
    "/Lotus/Weapons/Grineer/Melee/GrnKuvaLichScythe/GrnKuvaLichScytheWeapon",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Kohm/KuvaKohm",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Ogris/KuvaOgris",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Quartakk/KuvaQuartakk",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Tonkor/KuvaTonkor",
    "/Lotus/Weapons/Grineer/KuvaLich/Secondaries/Brakk/KuvaBrakk",
    "/Lotus/Weapons/Grineer/KuvaLich/Secondaries/Kraken/KuvaKraken",
    "/Lotus/Weapons/Grineer/KuvaLich/Secondaries/Seer/KuvaSeer",
    "/Lotus/Weapons/Grineer/KuvaLich/Secondaries/Stubba/KuvaStubba",
    "/Lotus/Weapons/Grineer/HeavyWeapons/GrnHeavyGrenadeLauncher",
    "/Lotus/Weapons/Grineer/LongGuns/GrnKuvaLichRifle/GrnKuvaLichRifleWeapon",
    "/Lotus/Weapons/Grineer/Bows/GrnBow/GrnBowWeapon",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Hind/KuvaHind",
    "/Lotus/Weapons/Grineer/KuvaLich/Secondaries/Nukor/KuvaNukor",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Hek/KuvaHekWeapon",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Zarr/KuvaZarr",
    "/Lotus/Weapons/Grineer/KuvaLich/HeavyWeapons/Grattler/KuvaGrattler",
    "/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Sobek/KuvaSobek"
];

const corpusVersionThreeWeapons = [
    "/Lotus/Weapons/Corpus/LongGuns/CrpBriefcaseLauncher/CrpBriefcaseLauncher",
    "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEArcaPlasmor/CrpBEArcaPlasmor",
    "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEFluxRifle/CrpBEFluxRifle",
    "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBETetra/CrpBETetra",
    "/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBECycron/CrpBECycron",
    "/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBEDetron/CrpBEDetron",
    "/Lotus/Weapons/Corpus/Pistols/CrpIgniterPistol/CrpIgniterPistol",
    "/Lotus/Weapons/Corpus/Pistols/CrpBriefcaseAkimbo/CrpBriefcaseAkimboPistol",
    "/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBEPlinx/CrpBEPlinxWeapon",
    "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEGlaxion/CrpBEGlaxion"
];
