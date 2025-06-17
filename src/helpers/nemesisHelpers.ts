import { ExportRegions, ExportWarframes } from "warframe-public-export-plus";
import { IInfNode, TNemesisFaction } from "@/src/types/inventoryTypes/inventoryTypes";
import { getRewardAtPercentage, SRng } from "@/src/services/rngService";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";
import { logger } from "../utils/logger";
import { IOid } from "../types/commonTypes";
import { Types } from "mongoose";
import { addMods, generateRewardSeed } from "../services/inventoryService";
import { isArchwingMission } from "../services/worldStateService";

type TInnateDamageTag =
    | "InnateElectricityDamage"
    | "InnateHeatDamage"
    | "InnateFreezeDamage"
    | "InnateToxinDamage"
    | "InnateMagDamage"
    | "InnateRadDamage"
    | "InnateImpactDamage";

export interface INemesisManifest {
    weapons: readonly string[];
    systemIndexes: readonly number[];
    showdownNode: string;
    ephemeraChance: number;
    ephemeraTypes?: Record<TInnateDamageTag, string>;
    firstKillReward: string;
    firstConvertReward: string;
    messageTitle: string;
    messageBody: string;
    minBuild: string;
}

class KuvaLichManifest implements INemesisManifest {
    weapons = [
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
        "/Lotus/Weapons/Grineer/LongGuns/GrnKuvaLichRifle/GrnKuvaLichRifleWeapon"
    ];
    systemIndexes = [2, 3, 9, 11, 18];
    showdownNode = "CrewBattleNode557";
    ephemeraChance = 0.05;
    ephemeraTypes = {
        InnateElectricityDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaLightningEphemera",
        InnateHeatDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaFireEphemera",
        InnateFreezeDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaIceEphemera",
        InnateToxinDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaToxinEphemera",
        InnateMagDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaMagneticEphemera",
        InnateRadDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaTricksterEphemera",
        InnateImpactDamage: "/Lotus/Upgrades/Skins/Effects/Kuva/KuvaImpactEphemera"
    };
    firstKillReward = "/Lotus/StoreItems/Upgrades/Skins/Clan/LichKillerBadgeItem";
    firstConvertReward = "/Lotus/StoreItems/Upgrades/Skins/Sigils/KuvaLichSigil";
    messageTitle = "/Lotus/Language/Inbox/VanquishKuvaMsgTitle";
    messageBody = "/Lotus/Language/Inbox/VanquishLichMsgBody";
    minBuild = "2019.10.31.22.42"; // 26.0.0
}

class KuvaLichManifestVersionTwo extends KuvaLichManifest {
    constructor() {
        super();
        this.ephemeraChance = 0.1;
        this.minBuild = "2020.03.05.16.06"; // Unsure about this one, so using the same value as in version three.
    }
}

class KuvaLichManifestVersionThree extends KuvaLichManifestVersionTwo {
    constructor() {
        super();
        this.weapons.push("/Lotus/Weapons/Grineer/Bows/GrnBow/GrnBowWeapon");
        this.weapons.push("/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Hind/KuvaHind");
        this.weapons.push("/Lotus/Weapons/Grineer/KuvaLich/Secondaries/Nukor/KuvaNukor");
        this.ephemeraChance = 0.2;
        this.minBuild = "2020.03.05.16.06"; // This is 27.2.0, tho 27.1.0 should also recognise this.
    }
}

class KuvaLichManifestVersionFour extends KuvaLichManifestVersionThree {
    constructor() {
        super();
        this.minBuild = "2021.07.05.17.03"; // Unsure about this one, so using the same value as in version five.
    }
}

class KuvaLichManifestVersionFive extends KuvaLichManifestVersionFour {
    constructor() {
        super();
        this.weapons.push("/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Hek/KuvaHekWeapon");
        this.weapons.push("/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Zarr/KuvaZarr");
        this.weapons.push("/Lotus/Weapons/Grineer/KuvaLich/HeavyWeapons/Grattler/KuvaGrattler");
        this.minBuild = "2021.07.05.17.03"; // 30.5.0
    }
}

class KuvaLichManifestVersionSix extends KuvaLichManifestVersionFive {
    constructor() {
        super();
        this.weapons.push("/Lotus/Weapons/Grineer/KuvaLich/LongGuns/Sobek/KuvaSobek");
        this.minBuild = "2024.05.15.11.07"; // 35.6.0
    }
}

class LawyerManifest implements INemesisManifest {
    weapons = [
        "/Lotus/Weapons/Corpus/LongGuns/CrpBriefcaseLauncher/CrpBriefcaseLauncher",
        "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEArcaPlasmor/CrpBEArcaPlasmor",
        "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEFluxRifle/CrpBEFluxRifle",
        "/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBETetra/CrpBETetra",
        "/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBECycron/CrpBECycron",
        "/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBEDetron/CrpBEDetron",
        "/Lotus/Weapons/Corpus/Pistols/CrpIgniterPistol/CrpIgniterPistol",
        "/Lotus/Weapons/Corpus/Pistols/CrpBriefcaseAkimbo/CrpBriefcaseAkimboPistol"
    ];
    systemIndexes = [1, 15, 4, 7, 8];
    showdownNode = "CrewBattleNode558";
    ephemeraChance = 0.2;
    ephemeraTypes = {
        InnateElectricityDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraA",
        InnateHeatDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraB",
        InnateFreezeDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraC",
        InnateToxinDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraD",
        InnateMagDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraE",
        InnateRadDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraF",
        InnateImpactDamage: "/Lotus/Upgrades/Skins/Effects/CorpusLichEphemeraG"
    };
    firstKillReward = "/Lotus/StoreItems/Upgrades/Skins/Clan/CorpusLichBadgeItem";
    firstConvertReward = "/Lotus/StoreItems/Upgrades/Skins/Sigils/CorpusLichSigil";
    messageTitle = "/Lotus/Language/Inbox/VanquishLawyerMsgTitle";
    messageBody = "/Lotus/Language/Inbox/VanquishLichMsgBody";
    minBuild = "2021.07.05.17.03"; // 30.5.0
}

class LawyerManifestVersionTwo extends LawyerManifest {
    constructor() {
        super();
        this.weapons.push("/Lotus/Weapons/Corpus/BoardExec/Secondary/CrpBEPlinx/CrpBEPlinxWeapon");
        this.minBuild = "2022.11.30.08.13"; // 32.2.0
    }
}

class LawyerManifestVersionThree extends LawyerManifestVersionTwo {
    constructor() {
        super();
        this.weapons.push("/Lotus/Weapons/Corpus/BoardExec/Primary/CrpBEGlaxion/CrpBEGlaxion");
        this.minBuild = "2024.05.15.11.07"; // 35.6.0
    }
}

class LawyerManifestVersionFour extends LawyerManifestVersionThree {
    constructor() {
        super();
        this.minBuild = "2024.10.01.11.03"; // 37.0.0
    }
}

class InfestedLichManfest implements INemesisManifest {
    weapons = [];
    systemIndexes = [23];
    showdownNode = "CrewBattleNode559";
    ephemeraChance = 0;
    firstKillReward = "/Lotus/StoreItems/Upgrades/Skins/Sigils/InfLichVanquishedSigil";
    firstConvertReward = "/Lotus/StoreItems/Upgrades/Skins/Sigils/InfLichConvertedSigil";
    messageTitle = "/Lotus/Language/Inbox/VanquishBandMsgTitle";
    messageBody = "/Lotus/Language/Inbox/VanquishBandMsgBody";
    minBuild = "2025.03.18.09.51"; // 38.5.0
}

const nemesisManifests: Record<string, INemesisManifest> = {
    "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifest": new KuvaLichManifest(),
    "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionTwo": new KuvaLichManifestVersionTwo(),
    "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionThree": new KuvaLichManifestVersionThree(),
    "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionFour": new KuvaLichManifestVersionFour(),
    "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionFive": new KuvaLichManifestVersionFive(),
    "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionSix": new KuvaLichManifestVersionSix(),
    "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifest": new LawyerManifest(),
    "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionTwo": new LawyerManifestVersionTwo(),
    "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionThree": new LawyerManifestVersionThree(),
    "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifestVersionFour": new LawyerManifestVersionFour(),
    "/Lotus/Types/Enemies/InfestedLich/InfestedLichManifest": new InfestedLichManfest()
};

export const getNemesisManifest = (manifest: string): INemesisManifest => {
    if (manifest in nemesisManifests) {
        return nemesisManifests[manifest];
    }
    throw new Error(`unknown nemesis manifest: ${manifest}`);
};

export const getInfNodes = (manifest: INemesisManifest, rank: number): IInfNode[] => {
    const infNodes = [];
    const systemIndex = manifest.systemIndexes[rank];
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

const requiemMods: readonly string[] = [
    "/Lotus/Upgrades/Mods/Immortal/ImmortalOneMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalTwoMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalThreeMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalFourMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalFiveMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalSixMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalSevenMod",
    "/Lotus/Upgrades/Mods/Immortal/ImmortalEightMod"
];

export const antivirusMods: readonly string[] = [
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
        : passcode.map(i => requiemMods[i]);
};

// Symbols; 0-7 are the normal requiem mods.
export const GUESS_NONE = 8;
export const GUESS_WILDCARD = 9;

// Results; there are 3, 4, 5 as well which are more muted versions but unused afaik.
export const GUESS_NEUTRAL = 0;
export const GUESS_INCORRECT = 1;
export const GUESS_CORRECT = 2;

interface NemesisPositionGuess {
    symbol: number;
    result: number;
}

export type NemesisGuess = [NemesisPositionGuess, NemesisPositionGuess, NemesisPositionGuess];

export const encodeNemesisGuess = (guess: NemesisGuess): number => {
    return (
        (guess[0].symbol & 0xf) |
        ((guess[0].result & 3) << 12) |
        ((guess[1].symbol << 4) & 0xff) |
        ((guess[1].result << 14) & 0xffff) |
        ((guess[2].symbol & 0xf) << 8) |
        ((guess[2].result & 3) << 16)
    );
};

export const decodeNemesisGuess = (val: number): NemesisGuess => {
    return [
        {
            symbol: val & 0xf,
            result: (val >> 12) & 3
        },
        {
            symbol: (val & 0xff) >> 4,
            result: (val & 0xffff) >> 14
        },
        {
            symbol: (val >> 8) & 0xf,
            result: (val >> 16) & 3
        }
    ];
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

export const getInnateDamageTag = (KillingSuit: string): TInnateDamageTag => {
    return ExportWarframes[KillingSuit].nemesisUpgradeTag!;
};

const petHeads = [
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA",
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB",
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC"
] as const;

export interface INemesisProfile {
    innateDamageTag: TInnateDamageTag;
    innateDamageValue: number;
    ephemera?: string;
    petHead?: (typeof petHeads)[number];
    petBody?: string;
    petLegs?: string;
    petTail?: string;
}

export const generateNemesisProfile = (
    fp: bigint = generateRewardSeed(),
    manifest: INemesisManifest = new LawyerManifest(),
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
    if (rng.randomFloat() <= manifest.ephemeraChance && manifest.ephemeraTypes) {
        profile.ephemera = manifest.ephemeraTypes[profile.innateDamageTag];
    }
    rng.randomFloat(); // something related to sentinel agent maybe
    if (manifest instanceof LawyerManifest) {
        profile.petHead = rng.randomElement(petHeads)!;
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
