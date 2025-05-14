import { ExportRegions, ExportWarframes } from "warframe-public-export-plus";
import { IInfNode, ITypeCount, TNemesisFaction } from "@/src/types/inventoryTypes/inventoryTypes";
import { getRewardAtPercentage, SRng } from "@/src/services/rngService";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";
import { logger } from "../utils/logger";
import { IOid } from "../types/commonTypes";
import { Types } from "mongoose";
import { addMods, generateRewardSeed } from "../services/inventoryService";
import { isArchwingMission } from "../services/worldStateService";
import { fromStoreItem, toStoreItem } from "../services/itemDataService";
import { createMessage } from "../services/inboxService";
import { version_compare } from "./inventoryHelpers";

export const getInfNodes = (faction: TNemesisFaction, rank: number): IInfNode[] => {
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

const systemIndexes: Record<TNemesisFaction, number[]> = {
    FC_GRINEER: [2, 3, 9, 11, 18],
    FC_CORPUS: [1, 15, 4, 7, 8],
    FC_INFESTATION: [23]
};

export const showdownNodes: Record<TNemesisFaction, string> = {
    FC_GRINEER: "CrewBattleNode557",
    FC_CORPUS: "CrewBattleNode558",
    FC_INFESTATION: "CrewBattleNode559"
};

const ephemeraProbabilities: Record<TNemesisFaction, number> = {
    FC_GRINEER: 0.05,
    FC_CORPUS: 0.2,
    FC_INFESTATION: 0
};

type TInnateDamageTag =
    | "InnateElectricityDamage"
    | "InnateHeatDamage"
    | "InnateFreezeDamage"
    | "InnateToxinDamage"
    | "InnateMagDamage"
    | "InnateRadDamage"
    | "InnateImpactDamage";

const ephmeraTypes: Record<"FC_GRINEER" | "FC_CORPUS", Record<TInnateDamageTag, string>> = {
    FC_GRINEER: {
        InnateElectricityDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaLightningEphemera",
        InnateHeatDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaFireEphemera",
        InnateFreezeDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaIceEphemera",
        InnateToxinDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaToxinEphemera",
        InnateMagDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaMagneticEphemera",
        InnateRadDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaTricksterEphemera",
        InnateImpactDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaImpactEphemera"
    },
    FC_CORPUS: {
        InnateElectricityDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraA",
        InnateHeatDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraB",
        InnateFreezeDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraC",
        InnateToxinDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraD",
        InnateMagDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraE",
        InnateRadDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraF",
        InnateImpactDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraG"
    }
};

// Get a parazon 'passcode' based on the nemesis fingerprint so it's always the same for the same nemesis.
export const getNemesisPasscode = (nemesis: { fp: bigint; Faction: TNemesisFaction }): number[] => {
    const rng = new SRng(nemesis.fp);
    const choices = [0, 1, 2, 3, 5, 6, 7];
    let choiceIndex = rng.randomInt(0, choices.length - 1);
    const passcode = [choices[choiceIndex]];
    if (nemesis.Faction != "FC_INFESTATION") {
        choices.splice(choiceIndex, 1);
        choiceIndex = rng.randomInt(0, choices.length - 1);
        passcode.push(choices[choiceIndex]);

        choices.splice(choiceIndex, 1);
        choiceIndex = rng.randomInt(0, choices.length - 1);
        passcode.push(choices[choiceIndex]);
    }
    return passcode;
};

const reqiuemMods: readonly string[] = [
    "/Lotus/Upgrades/Mods/Immortal/ImmortalOneMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalTwoMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalThreeMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalFourMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalFiveMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalSixMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalSevenMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalEightMod"
];

const antivirusMods: readonly string[] = [
    "/Lotus/Upgrades/Mods/Immortal/AntivirusOneMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusTwoMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusThreeMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusFourMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusFiveMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusSixMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusSevenMod",
    "/Lotus/Upgrades/Mods/Immortal/AntivirusEightMod"
];

export const getNemesisPasscodeModTypes = (nemesis: { fp: bigint; Faction: TNemesisFaction }): string[] => {
    const passcode = getNemesisPasscode(nemesis);
    return nemesis.Faction == "FC_INFESTATION"
        ? passcode.map(i => antivirusMods[i])
        : passcode.map(i => reqiuemMods[i]);
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

export const getKnifeUpgrade = (
    inventory: TInventoryDatabaseDocument,
    dataknifeUpgrades: string[],
    type: string
): { ItemId: IOid; ItemType: string } => {
    if (dataknifeUpgrades.indexOf(type) != -1) {
        return {
            ItemId: { $oid: "000000000000000000000000" },
            ItemType: type
        };
    }
    for (const upgradeId of dataknifeUpgrades) {
        if (upgradeId.length == 24) {
            const upgrade = inventory.Upgrades.id(upgradeId);
            if (upgrade && upgrade.ItemType == type) {
                return {
                    ItemId: { $oid: upgradeId },
                    ItemType: type
                };
            }
        }
    }
    throw new Error(`${type} does not seem to be installed on parazon?!`);
};

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
        case "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionSix": // >= 35.6.0
            return kuvaLichVersionSixWeapons;
        case "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionThree": // >= 35.6.0
        case "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionFour": // >= 37.0.0
            return corpusVersionThreeWeapons;
    }
    throw new Error(`unknown nemesis manifest: ${manifest}`);
};

export const isNemesisCompatibleWithVersion = (
    nemesis: { manifest: string; Faction: TNemesisFaction },
    buildLabel: string
): boolean => {
    // Anything below 35.6.0 is not going to be okay given our set of supported manifests.
    if (version_compare(buildLabel, "2024.05.15.11.07") < 0) {
        return false;
    }

    if (nemesis.Faction == "FC_INFESTATION") {
        // Anything below 38.5.0 isn't gonna like an infested lich.
        if (version_compare(buildLabel, "2025.03.18.16.07") < 0) {
            return false;
        }
    } else if (nemesis.manifest == "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionFour") {
        // Anything below 37.0.0 isn't gonna know version 4, but version 3 is identical in terms of weapon choices, so we can spoof it to that.
        if (version_compare(buildLabel, "2024.10.01.11.03") < 0) {
            nemesis.manifest = "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionThree";
        }
    }

    return true;
};

export const getInnateDamageTag = (KillingSuit: string): TInnateDamageTag => {
    return ExportWarframes[KillingSuit].nemesisUpgradeTag!;
};

export interface INemesisProfile {
    innateDamageTag: TInnateDamageTag;
    innateDamageValue: number;
    ephemera?: string;
    petHead?: string;
    petBody?: string;
    petLegs?: string;
    petTail?: string;
}

export const generateNemesisProfile = (
    fp: bigint = generateRewardSeed(),
    Faction: TNemesisFaction = "FC_CORPUS",
    killingSuit: string = "/Lotus/Powersuits/Ember/Ember"
): INemesisProfile => {
    const rng = new SRng(fp);
    rng.randomFloat(); // used for the weapon index
    const WeaponUpgradeValueAttenuationExponent = 2.25;
    let value = Math.pow(rng.randomFloat(), WeaponUpgradeValueAttenuationExponent);
    if (value >= 0.941428) {
        value = 1;
    }
    const profile: INemesisProfile = {
        innateDamageTag: getInnateDamageTag(killingSuit),
        innateDamageValue: Math.trunc(value * 0x40000000) // TODO: For -1399275245665749231n, the value should be 75306944, but we're off by 59 with 75307003.
    };
    if (rng.randomFloat() <= ephemeraProbabilities[Faction] && Faction != "FC_INFESTATION") {
        profile.ephemera = ephmeraTypes[Faction][profile.innateDamageTag];
    }
    rng.randomFloat(); // something related to sentinel agent maybe
    if (Faction == "FC_CORPUS") {
        profile.petHead = rng.randomElement([
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC"
        ])!;
        profile.petBody = rng.randomElement([
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartBodyA",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartBodyB",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartBodyC"
        ])!;
        profile.petLegs = rng.randomElement([
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartLegsA",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartLegsB",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartLegsC"
        ])!;
        profile.petTail = rng.randomElement([
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartTailA",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartTailB",
            "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartTailC"
        ])!;
    }
    return profile;
};

export const getKillTokenRewardCount = (fp: bigint): number => {
    const rng = new SRng(fp);
    return rng.randomInt(10, 15);
};

// /Lotus/Types/Enemies/InfestedLich/InfestedLichRewardManifest
const infestedLichRotA = [
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyDJRomHuman", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyDJRomInfested", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyDrillbitHuman", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyDrillbitInfested", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyHarddriveHuman", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyHarddriveInfested", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyPacketHuman", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyPacketInfested", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyZekeHuman", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/Plushies/PlushyZekeInfested", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandBillboardPosterA", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandBillboardPosterB", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandDespairPoster", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandGridPoster", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandHuddlePoster", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandJumpPoster", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandLimoPoster", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandLookingDownPosterDay", probability: 0.046 },
    {
        type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandLookingDownPosterNight",
        probability: 0.045
    },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandSillyPoster", probability: 0.046 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandWhiteBluePoster", probability: 0.045 },
    { type: "/Lotus/StoreItems/Types/Items/ShipDecos/BoybandPosters/BoybandWhitePinkPoster", probability: 0.045 }
];
const infestedLichRotB = [
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraA", probability: 0.072 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraB", probability: 0.071 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraC", probability: 0.072 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraD", probability: 0.071 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraE", probability: 0.072 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraF", probability: 0.071 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraG", probability: 0.071 },
    { type: "/Lotus/StoreItems/Upgrades/Skins/Effects/InfestedLichEphemeraH", probability: 0.072 },
    { type: "/Lotus/StoreItems/Types/Items/Emotes/DanceDJRomHype", probability: 0.071 },
    { type: "/Lotus/StoreItems/Types/Items/Emotes/DancePacketWindmillShuffle", probability: 0.072 },
    { type: "/Lotus/StoreItems/Types/Items/Emotes/DanceHarddrivePony", probability: 0.071 },
    { type: "/Lotus/StoreItems/Types/Items/Emotes/DanceDrillbitCrisscross", probability: 0.072 },
    { type: "/Lotus/StoreItems/Types/Items/Emotes/DanceZekeCanthavethis", probability: 0.071 },
    { type: "/Lotus/StoreItems/Types/Items/PhotoBooth/PhotoboothTileRJLasXStadiumBossArena", probability: 0.071 }
];
export const getInfestedLichItemRewards = (fp: bigint): string[] => {
    const rng = new SRng(fp);
    const rotAReward = getRewardAtPercentage(infestedLichRotA, rng.randomFloat())!.type;
    rng.randomFloat(); // unused afaict
    const rotBReward = getRewardAtPercentage(infestedLichRotB, rng.randomFloat())!.type;
    return [rotAReward, rotBReward];
};

export const sendCodaFinishedMessage = async (
    inventory: TInventoryDatabaseDocument,
    fp: bigint = generateRewardSeed(),
    name: string = "ZEKE_BEATWOMAN_TM.1999",
    killed: boolean = true
): Promise<void> => {
    const att: string[] = [];

    // First vanquish/convert gives a sigil
    const sigil = killed
        ? "/Lotus/Upgrades/Skins/Sigils/InfLichVanquishedSigil"
        : "/Lotus/Upgrades/Skins/Sigils/InfLichConvertedSigil";
    if (!inventory.WeaponSkins.find(x => x.ItemType == sigil)) {
        att.push(toStoreItem(sigil));
    }

    const [rotAReward, rotBReward] = getInfestedLichItemRewards(fp);
    att.push(fromStoreItem(rotAReward));
    att.push(fromStoreItem(rotBReward));

    let countedAtt: ITypeCount[] | undefined;
    if (killed) {
        countedAtt = [
            {
                ItemType: "/Lotus/Types/Items/MiscItems/CodaWeaponBucks",
                ItemCount: getKillTokenRewardCount(fp)
            }
        ];
    }

    await createMessage(inventory.accountOwnerId, [
        {
            sndr: "/Lotus/Language/Bosses/Ordis",
            msg: "/Lotus/Language/Inbox/VanquishBandMsgBody",
            arg: [
                {
                    Key: "LICH_NAME",
                    Tag: name
                }
            ],
            att: att,
            countedAtt: countedAtt,
            sub: "/Lotus/Language/Inbox/VanquishBandMsgTitle",
            icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
            highPriority: true
        }
    ]);
};
