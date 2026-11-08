import type { IAlert } from "../types/worldStateTypes.ts";
import gameToBuildVersionInt from "./gameToBuildVersionInt.ts";

export type TConfigAlert = IAlert & { minBuildVersion?: number };

export const configAlerts = {
    voidCorruption2025Week1: {
        _id: { $oid: "677d452e2f324ee7b90f8ccf" },
        Activation: { $date: { $numberLong: "1736524800000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode61",
            missionType: "MT_SABOTAGE",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 30000,
                items: ["/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedFireRateDamagePistol"]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusShipCoreSabotage",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusShipEnemySpecs/CorpusShipSquadA",
            extraEnemySpec: "/Lotus/Types/Game/EnemySpecs/GamemodeExtraEnemySpecs/CorpusSabotageTiersA",
            minEnemyLevel: 10,
            maxEnemyLevel: 15
        }
    },
    voidCorruption2025Week2: {
        _id: { $oid: "677d45811daeae9de40e8c0f" },
        Activation: { $date: { $numberLong: "1737129600000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SettlementNode11",
            missionType: "MT_DEFENSE",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 30000,
                items: ["/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedCritChanceFireRatePistol"]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusShipDefense",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusShipEnemySpecs/CorpusShipSquadDefenseB",
            minEnemyLevel: 20,
            maxEnemyLevel: 25,
            maxRotations: 2
        }
    },
    voidCorruption2025Week3: {
        _id: { $oid: "677d45a494ad716c90006b9a" },
        Activation: { $date: { $numberLong: "1737734400000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode118",
            missionType: "MT_ARTIFACT",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 30000,
                items: ["/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedCritDamagePistol"]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusShipDisruption",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusShipEnemySpecs/CorpusShipSurvivalA",
            extraEnemySpec: "/Lotus/Types/Game/EnemySpecs/SpecialMissionSpecs/DisruptionCorpusShip",
            customAdvancedSpawners: ["/Lotus/Types/Enemies/AdvancedSpawners/ErrantSpecterInvasion"],
            minEnemyLevel: 30,
            maxEnemyLevel: 35
        }
    },
    voidCorruption2025Week4: {
        _id: { $oid: "677d4700682d173abb0e19fe" },
        Activation: { $date: { $numberLong: "1738339200000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode4",
            missionType: "MT_EXTERMINATION",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 30000,
                items: ["/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedDamageRecoilPistol"]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusShipExterminate",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusShipEnemySpecs/CorpusShipExterminateMixed",
            minEnemyLevel: 40,
            maxEnemyLevel: 45
        }
    },
    dagathAlerts2026Week1: {
        _id: { $oid: "6949862e3f3f35491e02232c" },
        Activation: { $date: { $numberLong: "1769022000000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode147",
            missionType: "MT_TERRITORY",
            faction: "FC_GRINEER",
            difficulty: 1,
            missionReward: {
                credits: 10000,
                items: ["/Lotus/StoreItems/Types/Recipes/WarframeRecipes/DagathChassisComponent"]
            },
            levelOverride: "/Lotus/Levels/Proc/Grineer/GrineerShipyardsInterception",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/GrineerShipyardsDefenseA",
            minEnemyLevel: 25,
            maxEnemyLevel: 35,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    dagathAlerts2026Week2: {
        _id: { $oid: "6949863a548d83b650011de8" },
        Activation: { $date: { $numberLong: "1769626800000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode404",
            missionType: "MT_SABOTAGE",
            faction: "FC_OROKIN",
            difficulty: 1,
            missionReward: {
                credits: 10000,
                items: ["/Lotus/StoreItems/Types/Recipes/WarframeRecipes/DagathHelmetComponent"]
            },
            levelOverride: "/Lotus/Levels/Proc/Orokin/OrokinTowerSabotageForest",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/OrokinSquadOne",
            extraEnemySpec: "/Lotus/Types/Game/EnemySpecs/OrokinSabotageGrineerForest",
            minEnemyLevel: 25,
            maxEnemyLevel: 35,
            vipAgent: "/Lotus/Types/Enemies/Grineer/Vip/JetpackSisters/JetpackSisters",
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    dagathAlerts2026Week3: {
        _id: { $oid: "69498642a0836c98e10f5e34" },
        Activation: { $date: { $numberLong: "1770231600000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode100",
            missionType: "MT_SURVIVAL",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 10000,
                items: ["/Lotus/StoreItems/Types/Recipes/WarframeRecipes/DagathSystemsComponent"]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusGasCitySurvival",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusGasSurvival",
            minEnemyLevel: 25,
            maxEnemyLevel: 35,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    dagathAlerts2026Week4: {
        _id: { $oid: "69498623a7342ab1500cc99b" },
        Activation: { $date: { $numberLong: "1768417200000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode103",
            missionType: "MT_EXTERMINATION",
            faction: "FC_GRINEER",
            difficulty: 1,
            missionReward: {
                credits: 10000,
                items: ["/Lotus/StoreItems/Types/Recipes/WarframeRecipes/DagathBlueprint"]
            },
            levelOverride: "/Lotus/Levels/Proc/Grineer/GrineerAsteroidExterminate",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/GrineerExterminateBlades",
            minEnemyLevel: 25,
            maxEnemyLevel: 35,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    starDaysAlerts2026Week1: {
        _id: { $oid: "696935998429008d89100af9" },
        Activation: { $date: { $numberLong: "1770393600000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode22",
            missionType: "MT_DEFENSE",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 25000,
                items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageStarDaysStarDaysMarieGlyph"],
                countedItems: [{ ItemType: "/Lotus/Types/Items/MiscItems/OrokinCatalyst", ItemCount: 1 }]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusOutpostDefense",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusSquadDefenseB",
            minEnemyLevel: 25,
            maxEnemyLevel: 30,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc",
            maxRotations: 1
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    starDaysAlerts2026Week2: {
        _id: { $oid: "696935b47918af0b1c0c4c2f" },
        Activation: { $date: { $numberLong: "1770998400000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode11",
            missionType: "MT_MOBILE_DEFENSE",
            faction: "FC_GRINEER",
            difficulty: 1,
            missionReward: {
                credits: 25000,
                items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageStarDaysLyonGlyph"],
                countedItems: [{ ItemType: "/Lotus/Types/Items/MiscItems/OrokinReactor", ItemCount: 1 }]
            },
            levelOverride: "/Lotus/Levels/Proc/Grineer/GrineerSettlementMobileDefense",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/DesertGrineerSquadOne",
            minEnemyLevel: 25,
            maxEnemyLevel: 30,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    starDaysAlerts2026Week3: {
        _id: { $oid: "696935d518288b03bb0224ae" },
        Activation: { $date: { $numberLong: "1771603200000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode121",
            missionType: "MT_EXTERMINATION",
            faction: "FC_CORPUS",
            difficulty: 1,
            missionReward: {
                credits: 25000,
                items: ["/Lotus/StoreItems/Types/StoreItems/AvatarImages/AvatarImageStarDaysRoatheGlyph"],
                countedItems: [{ ItemType: "/Lotus/Types/Items/MiscItems/Forma", ItemCount: 1 }]
            },
            levelOverride: "/Lotus/Levels/Proc/Corpus/CorpusGasCityExterminate",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/CorpusGasExterminateMixed",
            minEnemyLevel: 25,
            maxEnemyLevel: 30,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    starDaysAlerts2026Week4: {
        _id: { $oid: "696935ed8429008d89100cea" },
        Activation: { $date: { $numberLong: "1772208000000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode82",
            missionType: "MT_SABOTAGE",
            faction: "FC_GRINEER",
            difficulty: 1,
            missionReward: {
                credits: 25000,
                items: ["/Lotus/StoreItems/Types/Items/ShipDecos/Props/Seasonal/StarDays2026HeartPictureFrame"],
                countedItems: [{ ItemType: "/Lotus/Types/Items/MiscItems/UtilityUnlocker", ItemCount: 1 }]
            },
            levelOverride: "/Lotus/Levels/Proc/Grineer/GrineerGalleonCoreSabotage",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/GrineerSquadSix",
            extraEnemySpec: "/Lotus/Types/Game/EnemySpecs/GamemodeExtraEnemySpecs/GrineerSabotageTiersTwo",
            minEnemyLevel: 25,
            maxEnemyLevel: 30,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc"
        },
        Tag: "LotusGift",
        ForceUnlock: true
    },
    destiny2TributeAlert: {
        _id: { $oid: "6a29b21c614c39ecbb0aa925" },
        Activation: { $date: { $numberLong: "1781708400000" } },
        Expiry: { $date: { $numberLong: "2000000000000" } },
        MissionInfo: {
            location: "SolNode20",
            missionType: "MT_EXTERMINATION",
            faction: "FC_GRINEER",
            difficulty: 1,
            missionReward: {
                credits: 10000,
                countedItems: [{ ItemType: "/Lotus/Types/Items/Titles/GuardianTitle", ItemCount: 1 }]
            },
            levelOverride: "/Lotus/Levels/Proc/Grineer/GrineerGalleonExterminate",
            enemySpec: "/Lotus/Types/Game/EnemySpecs/GrineerExterminateSimple",
            minEnemyLevel: 10,
            maxEnemyLevel: 15,
            descText: "/Lotus/Language/Alerts/LotusGiftDesc",
            maxWaveNum: 167
        },
        Tag: "LotusGift",
        ForceUnlock: true,
        minBuildVersion: gameToBuildVersionInt["43.0.0"]
    }
} as const satisfies Record<string, TConfigAlert>;

export type TConfigAlertKey = keyof typeof configAlerts;
