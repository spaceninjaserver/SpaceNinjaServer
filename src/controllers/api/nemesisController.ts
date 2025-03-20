import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { SRng } from "@/src/services/rngService";
import { IMongoDate } from "@/src/types/commonTypes";
import { IInfNode } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";
import { ExportRegions } from "warframe-public-export-plus";

export const nemesisController: RequestHandler = async (req, res) => {
    if ((req.query.mode as string) == "s") {
        const accountId = await getAccountIdForRequest(req);
        const inventory = await getInventory(accountId, "Nemesis NemesisAbandonedRewards");
        const body = getJSONfromString<INemesisStartRequest>(String(req.body));

        const infNodes: IInfNode[] = [];
        for (const [key, value] of Object.entries(ExportRegions)) {
            if (
                value.systemIndex == 2 && // earth
                value.nodeType != 3 && // not hub
                value.nodeType != 7 && // not junction
                value.missionIndex && // must have a mission type and not assassination
                value.missionIndex != 28 && // not open world
                value.missionIndex != 32 && // not railjack
                value.missionIndex != 41 && // not saya's visions
                value.name.indexOf("Archwing") == -1
            ) {
                //console.log(dict_en[value.name]);
                infNodes.push({ Node: key, Influence: 1 });
            }
        }

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

        body.target.fp = BigInt(body.target.fp);
        const initialWeaponIdx = new SRng(body.target.fp).randomInt(0, weapons.length - 1);
        let weaponIdx = initialWeaponIdx;
        do {
            const weapon = weapons[weaponIdx];
            if (!body.target.DisallowedWeapons.find(x => x == weapon)) {
                break;
            }
            weaponIdx = (weaponIdx + 1) % weapons.length;
        } while (weaponIdx != initialWeaponIdx);
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
            InfNodes: infNodes,
            GuessHistory: [],
            Hints: [],
            HintProgress: 0,
            Weakened: body.target.Weakened,
            PrevOwners: 0,
            HenchmenKilled: 0,
            SecondInCommand: body.target.SecondInCommand
        };
        inventory.NemesisAbandonedRewards = []; // unclear if we need to do this since the client also submits this with missionInventoryUpdate
        await inventory.save();

        res.json({
            target: inventory.toJSON().Nemesis
        });
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unknown nemesis mode: ${String(req.query.mode)}`);
    }
};

export interface INemesisStartRequest {
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
        SecondInCommand: boolean;
    };
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
