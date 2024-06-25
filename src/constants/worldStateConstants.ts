export const voidTiers = ["VoidT1", "VoidT2", "VoidT3", "VoidT4", "VoidT5", "VoidT6"];

export const modifierTypes = [
    "SORTIE_MODIFIER_LOW_ENERGY",
    "SORTIE_MODIFIER_IMPACT",
    "SORTIE_MODIFIER_SLASH",
    "SORTIE_MODIFIER_PUNCTURE",
    "SORTIE_MODIFIER_EXIMUS",
    "SORTIE_MODIFIER_MAGNETIC",
    "SORTIE_MODIFIER_CORROSIVE",
    "SORTIE_MODIFIER_VIRAL",
    "SORTIE_MODIFIER_ELECTRICITY",
    "SORTIE_MODIFIER_RADIATION",
    "SORTIE_MODIFIER_GAS",
    "SORTIE_MODIFIER_FIRE",
    "SORTIE_MODIFIER_EXPLOSION",
    "SORTIE_MODIFIER_FREEZE",
    "SORTIE_MODIFIER_TOXIN",
    "SORTIE_MODIFIER_POISON",
    "SORTIE_MODIFIER_HAZARD_RADIATION",
    "SORTIE_MODIFIER_HAZARD_MAGNETIC",
    "SORTIE_MODIFIER_HAZARD_FOG",
    "SORTIE_MODIFIER_HAZARD_FIRE",
    "SORTIE_MODIFIER_HAZARD_ICE",
    "SORTIE_MODIFIER_HAZARD_COLD",
    "SORTIE_MODIFIER_ARMOR",
    "SORTIE_MODIFIER_SHIELDS",
    "SORTIE_MODIFIER_SECONDARY_ONLY",
    "SORTIE_MODIFIER_SHOTGUN_ONLY",
    "SORTIE_MODIFIER_SNIPER_ONLY",
    "SORTIE_MODIFIER_RIFLE_ONLY",
    "SORTIE_MODIFIER_MELEE_ONLY",
    "SORTIE_MODIFIER_BOW_ONLY"
];

export const liteSortiesBosses = [
    "SORTIE_BOSS_AMAR", // SytemIndex 3
    "SORTIE_BOSS_NIRA", // SytemIndex 4
    "SORTIE_BOSS_PAAZUL" // SytemIndex 0
];

export const liteSortiesMissionIndex = [
    [
        1, // Exterminate
        3, // Rescue
        4, // Sabotage
        5, // Capture
        7, // Spy
        9 // Mobile Defense
    ],
    [
        2, // Survival
        8, // Defense
        13, // Interception
        17, // Excavation
        33 // Disruption
    ],
    [
        0 // Assasination
    ]
];

/* data from wfcd worldstate-data sucks,
     missing bosses: 
         SORTIE_BOSS_CORRUPTED_VOR
     also missing tilesets and void missions
 */
export const endStates = [
    {
        bossName: "SORTIE_BOSS_VOR",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 16,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 8, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_HEK",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 8, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_RUK",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 8, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 8, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 8, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_KELA",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 2, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 8, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_KRIL",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 8, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_TYL",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_JACKAL",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 17, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 8, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_ALAD",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_AMBULAS",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 1, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_HYENA",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 3, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 4, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 7, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_NEF",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_RAPTOR",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_PHORID",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 15, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_LEPHANTIS",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 7, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 7, 9, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 15, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    },
    {
        bossName: "SORTIE_BOSS_INFALAD",
        regions: [
            {
                systemIndex: 0,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 1,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 8, 7, 0]
            },
            {
                systemIndex: 2,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 3,
                missionIndex: [1, 2, 3, 4, 7, 13, 9, 13, 7, 0]
            },
            {
                systemIndex: 4,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 5,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 6,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 7,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 17, 7, 0]
            },
            {
                systemIndex: 8,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 9,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 10,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 2, 15, 0]
            },
            {
                systemIndex: 11,
                missionIndex: [1, 2, 3, 4, 7, 8, 9, 13, 7, 0]
            },
            {
                systemIndex: 12,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 14, 0]
            },
            {
                systemIndex: 15,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },
            {
                systemIndex: 17,
                missionIndex: [1, 17, 3, 4, 7, 8, 9, 13, 1, 0]
            },

            {
                systemIndex: 18,
                missionIndex: [8, 8, 8, 1, 8, 8, 8, 8, 8, 0]
            }
        ]
    }
];

export const validFisureMissionIndex = [
    1, // Exterminate
    2, // Survival
    3, // Rescue
    4, // Sabotage
    5, // Capture
    7, // Spy
    8, // Defense
    9, // Mobile Defense
    13, // Interception
    15, // Hive
    17, // Excavation
    26, // Assault
    33, // Disruption
    34, // Void Flood
    35, // Void Cascade
    38 // Alchemy
];

export const omniaNodes = ["SolNode309", "SolNode310", "SolNode230", "SolNode718", "SolNode232", "SolNode717"];

export const missionIndexToMissionTypes: { [key: number]: string } = {
    0: "MT_ASSASSINATION",
    1: "MT_EXTERMINATION",
    2: "MT_SURVIVAL",
    3: "MT_RESCUE",
    4: "MT_SABOTAGE",
    5: "MT_CAPTURE",
    7: "MT_INTEL",
    8: "MT_DEFENSE",
    9: "MT_MOBILE_DEFENSE",
    13: "MT_TERRITORY",
    15: "MT_HIVE",
    17: "MT_EXCAVATE",
    26: "MT_ASSAULT",
    33: "MT_ARTIFACT",
    34: "MT_VOID_FLOOD", // Maybe
    35: "MT_VOID_CASCADE",
    38: "MT_ALCHEMY" // Maybe
};

export const EntratiNormalJobs = [
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosAreaDefenseBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosAssassinateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosCrpSurvivorBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosExcavateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosGrnSurvivorBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosKeypiecesBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosPurifyBounty"
];

export const EntratiEndlessJobs = [
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndessExcavateBounty",
    "/Lotus/Types/Gameplay/InfestedMicroplanet/Jobs/DeimosEndessPurifyBounty"
];

export const CertusNarmerJobs = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AssassinateBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AttritionBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Narmer/AttritionBountyLib"
];
/*
export const CertusGhoulalertJobs = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyBunt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/GhoulAlertBountyRes"
]
export const CertusPlagueStarJob = "/Lotus/Types/Gameplay/Eidolon/Jobs/Events/InfestedPlainsBounty"
*/
export const CertusNormalJobs = [
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AssassinateBountyAss",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AssassinateBountyCap",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountyCap",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountyExt",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountyLib",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/AttritionBountySab",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/CaptureBountyCapOne",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/CaptureBountyCapTwo",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/ReclamationBountyCache",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/ReclamationBountyCap",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/ReclamationBountyTheft",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/RescueBountyResc",
    "/Lotus/Types/Gameplay/Eidolon/Jobs/SabotageBountySab"
];

export const factionSyndicates = [
    "ArbitersSyndicate",
    "CephalonSudaSyndicate",
    "NewLokaSyndicate",
    "PerrinSyndicate",
    "RedVeilSyndicate",
    "SteelMeridianSyndicate"
];
export const neutralJobsSyndicates = ["EntratiSyndicate", "CetusSyndicate", "SolarisSyndicate"];
export const neutralSyndicates = ["ZarimanSyndicate", "EntratiLabSyndicate"];
export const restSyndicates = [
    "NecraloidSyndicate",
    "KahlSyndicate",
    "EventSyndicate",
    "QuillsSyndicate",
    "VoxSyndicate",
    "VentKidsSyndicate",
    "RadioLegionSyndicate",
    "RadioLegion2Syndicate",
    "RadioLegion3Syndicate",
    "RadioLegionIntermissionSyndicate",
    "RadioLegionIntermission2Syndicate",
    "RadioLegionIntermission3Syndicate",
    "RadioLegionIntermission4Syndicate",
    "RadioLegionIntermission5Syndicate",
    "RadioLegionIntermission6Syndicate",
    "RadioLegionIntermission8Syndicate",
    "RadioLegionIntermission7Syndicate",
    "RadioLegionIntermission9Syndicate",
    "RadioLegionIntermission10Syndicate"
];

export const FortunaNarmerJobs = [
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusCullJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusCullJobExterminate",
    "/Lotus/Types/Gameplay/Venus/Jobs/Narmer/NarmerVenusTheftJobExcavation"
];
export const FortunaNormalJobs = [
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobAmbush",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobExcavation",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusArtifactJobRecovery",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusChaosJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusChaosJobExcavation",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusCullJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusCullJobExterminate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusCullJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusHelpingJobcaches",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusHelpingJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusHelpingJobSpy",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusIntelJobRecovery",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusIntelJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusIntelJobSpy",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusPreservationJobDefense",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusPreservationJobRecovery",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusPreservationJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusSpyJobSpy",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusTheftJobAmbush",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusTheftJobExcavation",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusTheftJobResource",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusWetworkJobAssassinate",
    "/Lotus/Types/Gameplay/Venus/Jobs/VenusWetworkJobSpy"
];

export const normalCircutRotations = [
    ["Excalibur", "Trinity", "Ember"],
    ["Loki", "Mag", "Rhino"],
    ["Ash", "Frost", "Nyx"],
    ["Saryn", "Vauban", "Nova"],
    ["Nekros", "Valkyr", "Oberon"],
    ["Hydroid", "Mirage", "Limbo"],
    ["Mesa", "Chroma", "Atlas"],
    ["Ivara", "Inaros", "Titania"],
    ["Nidus", "Octavia", "Harrow"],
    ["Gara", "Khora", "Revenant"],
    ["Garuda", "Baruuk", "Hildryn"]
];

export const hardCircutRotations = [
    ["Braton", "Lato", "Skana", "Paris", "Kunai"],
    ["Boar", "Grammacor", "Angstrum", "Gorgon", "Anku"],
    ["Bo", "Latron", "Furis", "Furax", "Strun"],
    ["Lex", "Magistar", "Boltor", "Bronko", "Ceramic Dagger"],
    ["Torid", "Dual Toxocyst", "Dual Ichor", "Milter", "Atomos"],
    ["Ack & Brunt", "Soma", "Vasto", "Nami Solo", "Burston"],
    ["Zylok", "Sibear", "Dread", "Despair", "Hate"]
];
