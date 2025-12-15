import { EPOCH } from "../constants/timeConstants.ts";
import type { IDescent, IDescentFloor } from "../types/worldStateTypes.ts";
import { mixSeeds, SRng } from "./rngService.ts";

const combatLevels: string[] = [
    "/Lotus/Levels/DevilTower/ArenaAvocado.level",
    "/Lotus/Levels/DevilTower/ArenaBagel.level",
    "/Lotus/Levels/DevilTower/ArenaCherry.level",
    "/Lotus/Levels/DevilTower/ArenaCoconut.level",
    "/Lotus/Levels/DevilTower/ArenaEggplant.level",
    "/Lotus/Levels/DevilTower/ArenaGrape.level",
    "/Lotus/Levels/DevilTower/ArenaMango.level",
    "/Lotus/Levels/DevilTower/ArenaMelon.level",
    "/Lotus/Levels/DevilTower/ArenaPeach.level",
    "/Lotus/Levels/DevilTower/ArenaWaffle.level"
];

const collectionLevels: string[] = [
    "/Lotus/Levels/DevilTower/ArenaAvocado.level",
    "/Lotus/Levels/DevilTower/ArenaBagel.level",
    "/Lotus/Levels/DevilTower/ArenaCherry.level",
    "/Lotus/Levels/DevilTower/ArenaCoconut.level",
    "/Lotus/Levels/DevilTower/ArenaEggplant.level",
    "/Lotus/Levels/DevilTower/ArenaGrape.level",
    "/Lotus/Levels/DevilTower/ArenaMango.level",
    "/Lotus/Levels/DevilTower/ArenaMelon.level",
    "/Lotus/Levels/DevilTower/ArenaPeach.level",
    "/Lotus/Levels/DevilTower/ArenaWaffle.level"
];

const raceLevels: string[] = [
    "/Lotus/Levels/DevilTower/ArenaAvocado.level",
    "/Lotus/Levels/DevilTower/ArenaBagel.level",
    "/Lotus/Levels/DevilTower/ArenaCherry.level",
    "/Lotus/Levels/DevilTower/ArenaCoconut.level",
    "/Lotus/Levels/DevilTower/ArenaEggplant.level",
    "/Lotus/Levels/DevilTower/ArenaGrape.level",
    "/Lotus/Levels/DevilTower/ArenaMango.level",
    "/Lotus/Levels/DevilTower/ArenaMelon.level",
    "/Lotus/Levels/DevilTower/ArenaPeach.level",
    "/Lotus/Levels/DevilTower/ArenaWaffle.level",
    "/Lotus/Levels/DevilTower/SpecialChallengeArena01.level",
    "/Lotus/Levels/DevilTower/SpecialChallengeArena02.level",
    "/Lotus/Levels/DevilTower/SpecialChallengeArena03.level"
];

const uniqueLevels: string[] = [
    "/Lotus/Levels/DevilTower/SpecialChallengeArena01.level",
    "/Lotus/Levels/DevilTower/SpecialChallengeArena02.level",
    "/Lotus/Levels/DevilTower/SpecialChallengeArena03.level"
];

const lootRooms: string[] = [
    "/Lotus/Levels/DevilTower/ArenaAvocado.level",
    "/Lotus/Levels/DevilTower/ArenaBagel.level",
    "/Lotus/Levels/DevilTower/ArenaCherry.level",
    "/Lotus/Levels/DevilTower/ArenaCoconut.level",
    "/Lotus/Levels/DevilTower/ArenaEggplant.level",
    "/Lotus/Levels/DevilTower/ArenaGrape.level",
    "/Lotus/Levels/DevilTower/ArenaMango.level",
    "/Lotus/Levels/DevilTower/ArenaMelon.level",
    "/Lotus/Levels/DevilTower/ArenaPeach.level",
    "/Lotus/Levels/DevilTower/ArenaWaffle.level"
];

const gameModes: {
    type: string;
    probability: number;
    availableChallengeCategories: string[];
    levels: string[];
}[] = [
    {
        type: "DT_EXTERMINATE",
        probability: 200,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemiesExt",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_BOSS",
        probability: 100,
        availableChallengeCategories: ["BossChallenges"],
        levels: combatLevels
    },
    {
        type: "DT_SHRINE_DEFENSE",
        probability: 80,
        availableChallengeCategories: ["Enhancement", "SpecialEnemies", "DamageRules", "Combat_Environmental"],
        levels: combatLevels
    },
    {
        type: "DT_EXCAVATION",
        probability: 100,
        availableChallengeCategories: ["Enhancement", "SpecialEnemies", "DamageRules", "Combat_Environmental"],
        levels: combatLevels
    },
    {
        type: "DT_ALCHEMY",
        probability: 100,
        availableChallengeCategories: ["Enhancement", "SpecialEnemies", "DamageRules", "Combat_Environmental"],
        levels: combatLevels
    },
    {
        type: "DT_DEFENSE",
        probability: 100,
        availableChallengeCategories: ["Enhancement", "DamageRules", "Combat_Environmental", "Weapons"],
        levels: combatLevels
    },
    {
        type: "DT_SABOTAGE_DEFENSE",
        probability: 100,
        availableChallengeCategories: ["Enhancement", "DamageRules", "Combat_Environmental", "Weapons"],
        levels: combatLevels
    },
    {
        type: "DT_PRESURE_GAUGE",
        probability: 100,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_INTERCEPTION",
        probability: 100,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_CAPTURE",
        probability: 80,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_SABOTAGE_HIVE",
        probability: 100,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_INFESTED_SALVAGE",
        probability: 100,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_NETRACELLS",
        probability: 100,
        availableChallengeCategories: [
            "Enhancement",
            "SpecialEnemies",
            "DamageRules",
            "Combat_Environmental",
            "Weapons"
        ],
        levels: combatLevels
    },
    {
        type: "DT_PLACEHOLDER_05",
        probability: 2,
        availableChallengeCategories: ["EasterEgg"],
        levels: combatLevels
    },
    {
        type: "DT_COLLECTION",
        probability: 100,
        availableChallengeCategories: ["NC_Environmental", "Collection"],
        levels: collectionLevels
    },
    {
        type: "DT_RACE",
        probability: 80,
        availableChallengeCategories: ["Race"],
        levels: raceLevels
    },
    {
        type: "DT_BREAK_TARGETS",
        probability: 100,
        availableChallengeCategories: ["NC_Environmental", "BreakTargets"],
        levels: combatLevels
    },
    {
        type: "DT_UNIQUE",
        probability: 40,
        availableChallengeCategories: ["Unique"],
        levels: uniqueLevels
    },
    {
        type: "DT_LOOT",
        probability: 0,
        availableChallengeCategories: ["LootRooms", "NC_Environmental"],
        levels: lootRooms
    },
    {
        type: "DT_MIMICS",
        probability: 0,
        availableChallengeCategories: ["LootMimics", "NC_Environmental"],
        levels: lootRooms
    },
    {
        type: "DT_LOOT_CREATURES",
        probability: 0,
        availableChallengeCategories: ["LootCreatures", "NC_Environmental"],
        levels: lootRooms
    }
];

interface IChallenge {
    tag: string;
    repeatable: boolean; // TODO: This field is currently not respected when generating a descent.
    useSecondarySpec: boolean;
    enemySpecs: string[];
    auras: string[];
    forcedLevel?: string;
}

const challenges: Record<string, IChallenge[]> = {
    BossChallenges: [
        {
            tag: "CorruptedVor",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: []
        },
        {
            tag: "ArbitersNightmareLich",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Gameplay/DevilTower/LiteGameModes/CoHNemesisAura"]
        },
        {
            tag: "ArbitersNightmareLawyer",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Gameplay/DevilTower/LiteGameModes/CoHNemesisAura"]
        },
        {
            tag: "InfestedLichDuo",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Gameplay/DevilTower/LiteGameModes/CoHNemesisAura"]
        },
        {
            tag: "InfestedBoyband",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Gameplay/DevilTower/LiteGameModes/CoHNemesisAura"]
        },
        {
            tag: "Raptor2",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "HyenaPack",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: []
        },
        {
            tag: "Phorid",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: []
        },
        {
            tag: "StalkerParty",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        },
        {
            tag: "VayHekDrone",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/ForestBossGrineerSquadOne"],
            auras: []
        },
        {
            tag: "VayHekBipedal",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/ForestBossGrineerSquadOne"],
            auras: []
        },
        {
            tag: "JohnProdman",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/CorpusVenusResearchFacility"],
            auras: []
        },
        {
            tag: "Octopede",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/EntratiLab/EntratiSwarmSpec"],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "Oraxia",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "Kullervo",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "99TankP1",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/VaniaExterminateScaldraNoBalloonSpec"],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/RocketDropOnDeathAura"],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "99TankP2",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "ArchonAmar",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "ArchonBoreal",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        },
        {
            tag: "ArchonNira",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [],
            forcedLevel: "/Lotus/Levels/DevilTower/BossArenaSmall.level"
        }
    ],
    Enhancement: [
        {
            tag: "JadeGuardian",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/JadeGuardianEnhancementAura"]
        },
        {
            tag: "FireAndIce",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/FireAndIceEnhancementAura"]
        },
        {
            tag: "VeryToxic",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/ToxicLeechEnhancementAura"]
        },
        {
            tag: "PowerHouse",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/PowerHouseEnhancementAura"]
        },
        {
            tag: "HardShell",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/HardShellEnhancementAura"]
        },
        {
            tag: "ShockingLeech",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/ShockingLeechEnhancementAura"]
        },
        {
            tag: "FreezeInShoot",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/FreezeNShootEnhancementAura"]
        },
        {
            tag: "ToxicFire",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/ToxicFireEnhancementAura"]
        },
        {
            tag: "BlitzLeech",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/BlitzLeechEnhancementAura"]
        },
        {
            tag: "FieryTrail",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/FieryTrailAura"]
        },
        {
            tag: "Sunlight",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/DarknessAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/SunlightAura"
            ]
        },
        {
            tag: "GiantRealm",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/GiantRealmAura"]
        },
        {
            tag: "JumpSmash",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/JumpSmashAura"]
        },
        {
            tag: "FireChain",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/FireChainAura"]
        },
        {
            tag: "GlassMaker",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/GlassMakerAura"]
        },
        {
            tag: "Escapist",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHEscapistAura"]
        }
    ],
    SpecialEnemiesExt: [
        {
            tag: "Juggernauts",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHJuggernautSpec"],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/FieryTrailAura"]
        },
        {
            tag: "NecroMechNormal",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHNecroMechSpec"],
            auras: []
        },
        {
            tag: "NecroMechWeakpoints",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHNecroMechSpec"],
            auras: ["/Lotus/Types/Gameplay/EntratiLab/LabConquest/GenericFortifiedFoesWeakpointAura"]
        },
        {
            tag: "NullifierOnly",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHNullifierOnlySpec"],
            auras: []
        },
        {
            tag: "BallonParty",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/CoHScaldraBalloonsOnlySpec"],
            auras: []
        },
        {
            tag: "MechCombatOnly",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHWeakNecroMechSpec"],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/CoHPlayAsMechAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/DisableSelfReviveAura"
            ]
        }
    ],
    SpecialEnemies: [
        {
            tag: "Manics",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHManicSpec"],
            auras: []
        },
        {
            tag: "Sentients",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHSentientSurvival"],
            auras: []
        },
        {
            tag: "ArbitrationDrones",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHArbitrationSupportAura"]
        },
        {
            tag: "FieryTrailRollers",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHRollerSpec"],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/FieryTrailAura"]
        }
    ],
    DamageRules: [
        {
            tag: "HeadShotsOnly",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Gameplay/EntratiLab/LabConquest/GenericFortifiedFoesWeakpointAura"]
        },
        {
            tag: "HordeWeakpoints",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHHordeSpec"],
            auras: ["/Lotus/Types/Gameplay/EntratiLab/LabConquest/GenericFortifiedFoesWeakpointAura"]
        },
        {
            tag: "RangedArcadiaOnly",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHRangeOnlySpec"],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHArcadeAutomataAura"]
        },
        {
            tag: "SpicyKnife",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/SpicyKnifeAura"]
        },
        {
            tag: "UnseenFoes",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHUnseenFoesAura"]
        }
    ],
    Weapons: [
        {
            tag: "HeavyWeaponsOnly",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/HeavyWeaponSpawnAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/HeavyWeaponsOnlyAura"
            ]
        },
        {
            tag: "GrenadesOnly",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/GrenadeSpawnAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/GrenadesOnlyAura"
            ]
        },
        {
            tag: "RocketsOnly",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/RocketSpawnAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/RocketsOnlyAura"
            ]
        }
    ],
    Combat_Environmental: [
        {
            tag: "PoisonGas",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/PoisonGasAura"]
        },
        {
            tag: "Darkness",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/DarknessAura"]
        },
        {
            tag: "SpikeCeiling",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHSpikeOrbAura"]
        },
        {
            tag: "VoidAberration",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/DarknessAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/CoHVoidAberrationAura"
            ]
        },
        {
            tag: "NarmerPhobia",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHNarmerPhobiaAura"]
        },
        {
            tag: "MineField",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHMineFieldAura"]
        },
        {
            tag: "SecuritySpin",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHSecuritySpinAura"]
        },
        {
            tag: "SlipAndSlide",
            repeatable: false,
            useSecondarySpec: true,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHSlipAndSlideAura"]
        }
    ],
    NC_Environmental: [
        {
            tag: "NC_Darkness",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/DarknessAura"]
        },
        {
            tag: "NC_SpikeCeiling",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHSpikeOrbAura"]
        },
        {
            tag: "NC_VoidAberration",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/DarknessAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/CoHVoidAberrationAura"
            ]
        },
        {
            tag: "NC_NarmerPhobia",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHNarmerPhobiaAura"]
        },
        {
            tag: "NC_MineField",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHMineFieldAura"]
        },
        {
            tag: "NC_SecuritySpin",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHSecuritySpinAura"]
        },
        {
            tag: "NC_SlipAndSlide",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: ["/Lotus/Types/Scripts/Tau/CoH/Complications/CoHSlipAndSlideAura"]
        }
    ],
    EasterEgg: [
        {
            tag: "TheSergeant",
            repeatable: true,
            useSecondarySpec: false,
            enemySpecs: ["/Lotus/Types/Game/EnemySpecs/Tau/CoHSniperOnlySpec"],
            auras: []
        }
    ],
    Collection: [
        {
            tag: "CollectionBasic",
            repeatable: true,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        }
    ],
    Unique: [
        {
            tag: "HorseCombatOnly",
            repeatable: true,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/CoHHorseAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/DisableSelfReviveAura"
            ]
        },
        {
            tag: "RaceHorse",
            repeatable: true,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: [
                "/Lotus/Types/Scripts/Tau/CoH/Complications/CoHHorseAura",
                "/Lotus/Types/Scripts/Tau/CoH/Complications/DisableSelfReviveAura"
            ]
        }
    ],
    Race: [
        {
            tag: "BasicRace",
            repeatable: true,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        }
    ],
    BreakTargets: [
        {
            tag: "BasicBreakTargets",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        }
    ],
    LootMimics: [
        {
            tag: "BasicMimics",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        }
    ],
    LootRooms: [
        {
            tag: "BasicLoot",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        }
    ],
    LootCreatures: [
        {
            tag: "BasicLootCreatures",
            repeatable: false,
            useSecondarySpec: false,
            enemySpecs: [],
            auras: []
        }
    ]
};

const secondarySpecs: readonly string[] = [
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHInfestedExterminateMixed",
    "/Lotus/Types/Game/EnemySpecs/OrokinExterminateB",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHEntratiExterminateSpec",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHEntratiAlchemySpec",
    "/Lotus/Types/Game/EnemySpecs/VaniaExterminateScaldraNoBalloonSpec",
    "/Lotus/Types/Game/EnemySpecs/VaniaExterminateTechrotSpec",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHPNWNarmerCorpusGasExterminate",
    "/Lotus/Types/Game/EnemySpecs/Tau/TauOrokinEmpireSpec",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHTauGrineerSpec",
    "/Lotus/Types/Game/EnemySpecs/Tau/Tau12MinWarDaxSpec",
    "/Lotus/Types/Game/EnemySpecs/Duviri/Arena/DuviriExterminateHardmodeA",
    "/Lotus/Types/Game/EnemySpecs/Duviri/Arena/DuviriSurvivalSpecA",
    "/Lotus/Types/Game/EnemySpecs/Duviri/Arena/DuviriMITWSurvivalSpecA",
    "/Lotus/Types/Game/EnemySpecs/Narmer/PNWNarmerForestGrineerExterminate",
    "/Lotus/Types/Game/EnemySpecs/Narmer/PNWNarmerDesertGrineerExterminate",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHCorpusGasExterminateMixed",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHCorpusExterminateHumans",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHCorpusExterminateMixed",
    "/Lotus/Types/Game/EnemySpecs/CorpusExterminateRobots",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHDesertGrineerExterminate",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHForestGrineerExterminate",
    "/Lotus/Types/Game/EnemySpecs/FiveFatesDefense",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHGrineerExterminateFire",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHGrineerNightwatchExterminate",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHGrineerSealabExterminate",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHInfestedMicroplanet",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHGrineerZarimanExterminate",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHCorpusZarimanExterminateSpec",
    "/Lotus/Types/Game/EnemySpecs/CorpusGrineerInvasionHard",
    "/Lotus/Types/Game/EnemySpecs/CorpusGrineerMix",
    "/Lotus/Types/Game/EnemySpecs/CorpusInfestedMix",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHForestGrineerFairy",
    "/Lotus/Types/Game/EnemySpecs/Tau/CoHVaniaScaldraTechrot"
];

const generateDescentFloor = (rng: SRng, forcedTypes: Record<number, string>, index: number): IDescentFloor => {
    const forcedType = forcedTypes[index];
    const gameMode = (forcedType ? gameModes.find(x => x.type == forcedType) : rng.randomReward(gameModes))!;
    const availableChallenges: IChallenge[] = [];
    for (const challengeCategory of gameMode.availableChallengeCategories) {
        for (const challenge of challenges[challengeCategory]) {
            availableChallenges.push(challenge);
        }
    }
    const challenge = rng.randomElement(availableChallenges)!;
    return {
        Index: index,
        Type: gameMode.type,
        Challenge: challenge.tag,
        Level: challenge.forcedLevel ?? rng.randomElement(gameMode.levels)!,
        Specs: challenge.useSecondarySpec ? [rng.randomElement(secondarySpecs)!] : challenge.enemySpecs,
        Auras: challenge.auras
    };
};

export const getDescent = (week: number): IDescent => {
    const weekStart = EPOCH + week * 604800000;
    const weekEnd = weekStart + 604800000;
    const rng = new SRng(mixSeeds(248937984, new SRng(week).randomInt(0, 1_000_000_000)));

    const forcedTypes: Record<number, string> = {};
    {
        const reservedLevels: number[] = [7, 14];

        let level;
        do {
            level = rng.randomInt(1, 20);
        } while (reservedLevels.indexOf(level) != -1);
        reservedLevels.push(level);
        forcedTypes[level] = "DT_LOOT";

        do {
            level = rng.randomInt(1, 20);
        } while (reservedLevels.indexOf(level) != -1);
        reservedLevels.push(level);
        forcedTypes[level] = "DT_LOOT_CREATURES";

        do {
            level = rng.randomInt(1, 20);
        } while (reservedLevels.indexOf(level) != -1);
        reservedLevels.push(level);
        forcedTypes[level] = "DT_MIMICS";
    }

    return {
        Activation: { $date: { $numberLong: weekStart.toString() } },
        Expiry: { $date: { $numberLong: weekEnd.toString() } },
        RandSeed: rng.randomInt(0, 1_000_000_000),
        Challenges: [
            generateDescentFloor(rng, forcedTypes, 1),
            generateDescentFloor(rng, forcedTypes, 2),
            generateDescentFloor(rng, forcedTypes, 3),
            generateDescentFloor(rng, forcedTypes, 4),
            generateDescentFloor(rng, forcedTypes, 5),
            generateDescentFloor(rng, forcedTypes, 6),
            {
                Index: 7,
                Type: "DT_PROTOFRAME",
                Challenge: "Wisp",
                Level: "/Lotus/Levels/DevilTower/ProtoframeRoomWisp.level",
                Specs: [],
                Auras: []
            },
            generateDescentFloor(rng, forcedTypes, 8),
            generateDescentFloor(rng, forcedTypes, 9),
            generateDescentFloor(rng, forcedTypes, 10),
            generateDescentFloor(rng, forcedTypes, 11),
            generateDescentFloor(rng, forcedTypes, 12),
            generateDescentFloor(rng, forcedTypes, 13),
            {
                Index: 14,
                Type: "DT_PROTOFRAME",
                Challenge: "Harrow",
                Level: "/Lotus/Levels/DevilTower/ProtoframeRoomHarrow.level",
                Specs: [],
                Auras: []
            },
            generateDescentFloor(rng, forcedTypes, 15),
            generateDescentFloor(rng, forcedTypes, 16),
            generateDescentFloor(rng, forcedTypes, 17),
            generateDescentFloor(rng, forcedTypes, 18),
            generateDescentFloor(rng, forcedTypes, 19),
            generateDescentFloor(rng, forcedTypes, 20),
            {
                Index: 21,
                Type: "DT_PROTOFRAME",
                Challenge: "Devil",
                Level: "/Lotus/Levels/DevilTower/BossArenaUriel.level",
                Specs: [],
                Auras: []
            }
        ]
    };
};
