import { ExportRegions, ExportWarframes } from "warframe-public-export-plus";
import { IInfNode } from "@/src/types/inventoryTypes/inventoryTypes";
import { SRng } from "@/src/services/rngService";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";
import { logger } from "../utils/logger";
import { IOid } from "../types/commonTypes";
import { Types } from "mongoose";
import { addMods } from "../services/inventoryService";
import { isArchwingMission } from "../services/worldStateService";

export const getInfNodes = (faction: string, rank: number): IInfNode[] => {
    const infNodes = [];
    const systemIndex = systemIndexes[faction][rank];
    for (const [key, value] of Object.entries(ExportRegions)) {
        if (
            value.systemIndex === systemIndex &&
            value.nodeType != 3 && // not hub
            value.nodeType != 7 && // not junction
            value.missionIndex && // must have a mission type and not assassination
            value.missionIndex != 28 && // not open world
            value.missionIndex != 32 && // not railjack
            value.missionIndex != 41 && // not saya's visions
            value.missionIndex != 42 && // not face off
            value.name.indexOf("1999NodeI") == -1 && // not stage defence
            value.name.indexOf("1999NodeJ") == -1 && // not lich bounty
            !isArchwingMission(value)
        ) {
            //console.log(dict_en[value.name]);
            infNodes.push({ Node: key, Influence: 1 });
        }
    }
    return infNodes;
};

const systemIndexes: Record<string, number[]> = {
    FC_GRINEER: [2, 3, 9, 11, 18],
    FC_CORPUS: [1, 15, 4, 7, 8],
    FC_INFESTATION: [23]
};

// Get a parazon 'passcode' based on the nemesis fingerprint so it's always the same for the same nemesis.
export const getNemesisPasscode = (nemesis: { fp: bigint; Faction: string }): number[] => {
    const rng = new SRng(nemesis.fp);
    const passcode = [rng.randomInt(0, 7)];
    if (nemesis.Faction != "FC_INFESTATION") {
        passcode.push(rng.randomInt(0, 7));
        passcode.push(rng.randomInt(0, 7));
    }
    return passcode;
};

export const encodeNemesisGuess = (
    symbol1: number,
    result1: number,
    symbol2: number,
    result2: number,
    symbol3: number,
    result3: number
): number => {
    return (
        (symbol1 & 0xf) |
        ((result1 & 3) << 12) |
        ((symbol2 << 4) & 0xff) |
        ((result2 << 14) & 0xffff) |
        ((symbol3 & 0xf) << 8) |
        ((result3 & 3) << 16)
    );
};

export const decodeNemesisGuess = (val: number): number[] => {
    return [val & 0xf, (val >> 12) & 3, (val & 0xff) >> 4, (val & 0xffff) >> 14, (val >> 8) & 0xf, (val >> 16) & 3];
};

export interface IKnifeResponse {
    UpgradeIds?: string[];
    UpgradeTypes?: string[];
    UpgradeFingerprints?: { lvl: number }[];
    UpgradeNew?: boolean[];
    HasKnife?: boolean;
}

export const consumeModCharge = (
    response: IKnifeResponse,
    inventory: TInventoryDatabaseDocument,
    upgrade: { ItemId: IOid; ItemType: string },
    dataknifeUpgrades: string[]
): void => {
    response.UpgradeIds ??= [];
    response.UpgradeTypes ??= [];
    response.UpgradeFingerprints ??= [];
    response.UpgradeNew ??= [];
    response.HasKnife = true;

    if (upgrade.ItemId.$oid != "000000000000000000000000") {
        const dbUpgrade = inventory.Upgrades.id(upgrade.ItemId.$oid)!;
        const fingerprint = JSON.parse(dbUpgrade.UpgradeFingerprint!) as { lvl: number };
        fingerprint.lvl += 1;
        dbUpgrade.UpgradeFingerprint = JSON.stringify(fingerprint);

        response.UpgradeIds.push(upgrade.ItemId.$oid);
        response.UpgradeTypes.push(upgrade.ItemType);
        response.UpgradeFingerprints.push(fingerprint);
        response.UpgradeNew.push(false);
    } else {
        const id = new Types.ObjectId();
        inventory.Upgrades.push({
            _id: id,
            ItemType: upgrade.ItemType,
            UpgradeFingerprint: `{"lvl":1}`
        });

        addMods(inventory, [
            {
                ItemType: upgrade.ItemType,
                ItemCount: -1
            }
        ]);

        const dataknifeRawUpgradeIndex = dataknifeUpgrades.indexOf(upgrade.ItemType);
        if (dataknifeRawUpgradeIndex != -1) {
            dataknifeUpgrades[dataknifeRawUpgradeIndex] = id.toString();
        } else {
            logger.warn(`${upgrade.ItemType} not found in dataknife config`);
        }

        response.UpgradeIds.push(id.toString());
        response.UpgradeTypes.push(upgrade.ItemType);
        response.UpgradeFingerprints.push({ lvl: 1 });
        response.UpgradeNew.push(true);
    }
};

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

export const getWeaponsForManifest = (manifest: string): readonly string[] => {
    switch (manifest) {
        case "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionSix":
            return kuvaLichVersionSixWeapons;
        case "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionThree":
        case "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionFour":
            return corpusVersionThreeWeapons;
    }
    throw new Error(`unknown nemesis manifest: ${manifest}`);
};

// TODO: This sucks.
export const getInnateDamageTag = (
    KillingSuit: string
):
    | "InnateElectricityDamage"
    | "InnateFreezeDamage"
    | "InnateHeatDamage"
    | "InnateImpactDamage"
    | "InnateMagDamage"
    | "InnateRadDamage"
    | "InnateToxinDamage" => {
    const baseSuitType = ExportWarframes[KillingSuit].parentName;
    switch (baseSuitType) {
        case "/Lotus/Powersuits/Volt/VoltBaseSuit":
        case "/Lotus/Powersuits/Excalibur/ExcaliburBaseSuit":
        case "/Lotus/Powersuits/AntiMatter/NovaBaseSuit":
        case "/Lotus/Powersuits/Banshee/BansheeBaseSuit":
        case "/Lotus/Powersuits/Berserker/BerserkerBaseSuit":
        case "/Lotus/Powersuits/Magician/MagicianBaseSuit":
        case "/Lotus/Powersuits/Sentient/SentientBaseSuit":
        case "/Lotus/Powersuits/Gyre/GyreBaseSuit":
            return "InnateElectricityDamage";
        case "/Lotus/Powersuits/Ember/EmberBaseSuit":
        case "/Lotus/Powersuits/Dragon/DragonBaseSuit":
        case "/Lotus/Powersuits/Nezha/NezhaBaseSuit":
        case "/Lotus/Powersuits/Sandman/SandmanBaseSuit":
        case "/Lotus/Powersuits/Trapper/TrapperBaseSuit":
        case "/Lotus/Powersuits/Wisp/WispBaseSuit":
        case "/Lotus/Powersuits/Odalisk/OdaliskBaseSuit":
        case "/Lotus/Powersuits/PaxDuviricus/PaxDuviricusBaseSuit":
        case "/Lotus/Powersuits/Choir/ChoirBaseSuit":
        case "/Lotus/Powersuits/Temple/TempleBaseSuit":
            return "InnateHeatDamage";
        case "/Lotus/Powersuits/Frost/FrostBaseSuit":
        case "/Lotus/Powersuits/Glass/GlassBaseSuit":
        case "/Lotus/Powersuits/Fairy/FairyBaseSuit":
        case "/Lotus/Powersuits/IronFrame/IronFrameBaseSuit":
        case "/Lotus/Powersuits/Revenant/RevenantBaseSuit":
        case "/Lotus/Powersuits/Trinity/TrinityBaseSuit":
        case "/Lotus/Powersuits/Hoplite/HopliteBaseSuit":
        case "/Lotus/Powersuits/Koumei/KoumeiBaseSuit":
            return "InnateFreezeDamage";
        case "/Lotus/Powersuits/Saryn/SarynBaseSuit":
        case "/Lotus/Powersuits/Paladin/PaladinBaseSuit":
        case "/Lotus/Powersuits/Brawler/BrawlerBaseSuit":
        case "/Lotus/Powersuits/Infestation/InfestationBaseSuit":
        case "/Lotus/Powersuits/Necro/NecroBaseSuit":
        case "/Lotus/Powersuits/Khora/KhoraBaseSuit":
        case "/Lotus/Powersuits/Ranger/RangerBaseSuit":
        case "/Lotus/Powersuits/Dagath/DagathBaseSuit":
            return "InnateToxinDamage";
        case "/Lotus/Powersuits/Mag/MagBaseSuit":
        case "/Lotus/Powersuits/Pirate/PirateBaseSuit":
        case "/Lotus/Powersuits/Cowgirl/CowgirlBaseSuit":
        case "/Lotus/Powersuits/Priest/PriestBaseSuit":
        case "/Lotus/Powersuits/BrokenFrame/BrokenFrameBaseSuit":
        case "/Lotus/Powersuits/Alchemist/AlchemistBaseSuit":
        case "/Lotus/Powersuits/Yareli/YareliBaseSuit":
        case "/Lotus/Powersuits/Geode/GeodeBaseSuit":
        case "/Lotus/Powersuits/Frumentarius/FrumentariusBaseSuit":
            return "InnateMagDamage";
        case "/Lotus/Powersuits/Loki/LokiBaseSuit":
        case "/Lotus/Powersuits/Ninja/NinjaBaseSuit":
        case "/Lotus/Powersuits/Jade/JadeBaseSuit":
        case "/Lotus/Powersuits/Bard/BardBaseSuit":
        case "/Lotus/Powersuits/Harlequin/HarlequinBaseSuit":
        case "/Lotus/Powersuits/Garuda/GarudaBaseSuit":
        case "/Lotus/Powersuits/YinYang/YinYangBaseSuit":
        case "/Lotus/Powersuits/Werewolf/WerewolfBaseSuit":
        case "/Lotus/Powersuits/ConcreteFrame/ConcreteFrameBaseSuit":
            return "InnateRadDamage";
        case "/Lotus/Powersuits/Rhino/RhinoBaseSuit":
        case "/Lotus/Powersuits/Tengu/TenguBaseSuit":
        case "/Lotus/Powersuits/MonkeyKing/MonkeyKingBaseSuit":
        case "/Lotus/Powersuits/Runner/RunnerBaseSuit":
        case "/Lotus/Powersuits/Pacifist/PacifistBaseSuit":
        case "/Lotus/Powersuits/Devourer/DevourerBaseSuit":
        case "/Lotus/Powersuits/Wraith/WraithBaseSuit":
        case "/Lotus/Powersuits/Pagemaster/PagemasterBaseSuit":
            return "InnateImpactDamage";
    }
    logger.warn(`unknown innate damage type for ${KillingSuit}, using heat as a fallback`);
    return "InnateHeatDamage";
};

// TODO: For -1399275245665749231n, the value should be 75306944, but we're off by 59 with 75307003.
export const getInnateDamageValue = (fp: bigint): number => {
    const rng = new SRng(fp);
    rng.randomFloat(); // used for the weapon index
    const WeaponUpgradeValueAttenuationExponent = 2.25;
    let value = Math.pow(rng.randomFloat(), WeaponUpgradeValueAttenuationExponent);
    if (value >= 0.941428) {
        value = 1;
    }
    return Math.trunc(value * 0x40000000);
};
