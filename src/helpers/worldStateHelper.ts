export const missionTags = [
    "MT_ASSASSINATION",
    "MT_EXTERMINATION",
    "MT_SURVIVAL",
    "MT_RESCUE",
    "MT_SABOTAGE",
    "MT_CAPTURE",
    "MT_COUNTER_INTEL",
    "MT_INTEL",
    "MT_DEFENSE",
    "MT_MOBILE_DEFENSE",
    "MT_PVP",
    "MT_MASTERY",
    "MT_RECOVERY",
    "MT_TERRITORY",
    "MT_RETRIEVAL",
    "MT_HIVE",
    "MT_SALVAGE",
    "MT_EXCAVATE",
    "MT_RAID",
    "MT_PURGE",
    "MT_GENERIC",
    "MT_PURIFY",
    "MT_ARENA",
    "MT_JUNCTION",
    "MT_PURSUIT",
    "MT_RACE",
    "MT_ASSAULT",
    "MT_EVACUATION",
    "MT_LANDSCAPE",
    "MT_RESOURCE_THEFT",
    "MT_ENDLESS_EXTERMINATION",
    "MT_ENDLESS_DUVIRI",
    "MT_RAILJACK",
    "MT_ARTIFACT",
    "MT_CORRUPTION",
    "MT_VOID_CASCADE",
    "MT_ARMAGEDDON",
    "MT_VAULTS",
    "MT_ALCHEMY",
    "MT_ASCENSION",
    "MT_ENDLESS_CAPTURE",
    "MT_OFFERING",
    "MT_PVPVE"
];

export const sortieBosses = [
    "SORTIE_BOSS_HYENA",
    "SORTIE_BOSS_KELA",
    "SORTIE_BOSS_VOR",
    "SORTIE_BOSS_RUK",
    "SORTIE_BOSS_HEK",
    "SORTIE_BOSS_KRIL",
    "SORTIE_BOSS_TYL",
    "SORTIE_BOSS_JACKAL",
    "SORTIE_BOSS_ALAD",
    "SORTIE_BOSS_AMBULAS",
    "SORTIE_BOSS_NEF",
    "SORTIE_BOSS_RAPTOR",
    "SORTIE_BOSS_PHORID",
    "SORTIE_BOSS_LEPHANTIS",
    "SORTIE_BOSS_INFALAD",
    "SORTIE_BOSS_CORRUPTED_VOR"
];

export const sortieBossToFaction: Record<string, string> = {
    SORTIE_BOSS_HYENA: "FC_CORPUS",
    SORTIE_BOSS_KELA: "FC_GRINEER",
    SORTIE_BOSS_VOR: "FC_GRINEER",
    SORTIE_BOSS_RUK: "FC_GRINEER",
    SORTIE_BOSS_HEK: "FC_GRINEER",
    SORTIE_BOSS_KRIL: "FC_GRINEER",
    SORTIE_BOSS_TYL: "FC_GRINEER",
    SORTIE_BOSS_JACKAL: "FC_CORPUS",
    SORTIE_BOSS_ALAD: "FC_CORPUS",
    SORTIE_BOSS_AMBULAS: "FC_CORPUS",
    SORTIE_BOSS_NEF: "FC_CORPUS",
    SORTIE_BOSS_RAPTOR: "FC_CORPUS",
    SORTIE_BOSS_PHORID: "FC_INFESTATION",
    SORTIE_BOSS_LEPHANTIS: "FC_INFESTATION",
    SORTIE_BOSS_INFALAD: "FC_INFESTATION",
    SORTIE_BOSS_CORRUPTED_VOR: "FC_CORRUPTED"
};

export const sortieFactionToSystemIndexes: Record<string, number[]> = {
    FC_GRINEER: [0, 2, 3, 5, 6, 9, 11, 18],
    FC_CORPUS: [1, 4, 7, 8, 12, 15],
    FC_INFESTATION: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15],
    FC_CORRUPTED: [14]
};

export const sortieFactionToFactionIndexes: Record<string, number[]> = {
    FC_GRINEER: [0],
    FC_CORPUS: [1],
    FC_INFESTATION: [0, 1, 2],
    FC_CORRUPTED: [3]
};

export const sortieBossNode: Record<string, string> = {
    SORTIE_BOSS_HYENA: "SolNode127",
    SORTIE_BOSS_KELA: "SolNode193",
    SORTIE_BOSS_VOR: "SolNode108",
    SORTIE_BOSS_RUK: "SolNode32",
    SORTIE_BOSS_HEK: "SolNode24",
    SORTIE_BOSS_KRIL: "SolNode99",
    SORTIE_BOSS_TYL: "SolNode105",
    SORTIE_BOSS_JACKAL: "SolNode104",
    SORTIE_BOSS_ALAD: "SolNode53",
    SORTIE_BOSS_AMBULAS: "SolNode51",
    SORTIE_BOSS_NEF: "SettlementNode20",
    SORTIE_BOSS_RAPTOR: "SolNode210",
    SORTIE_BOSS_LEPHANTIS: "SolNode712",
    SORTIE_BOSS_INFALAD: "SolNode705"
};

export const EPOCH = 1734307200 * 1000; // Monday, Dec 16, 2024 @ 00:00 UTC+0; should logically be winter in 1999 iteration 0

export const getSortieTime = (day: number): number => {
    const dayStart = EPOCH + day * 86400000;
    const date = new Date(dayStart);
    date.setUTCHours(12);
    const isDst = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        timeZoneName: "short"
    })
        .formatToParts(date)
        .find(part => part.type === "timeZoneName")!
        .value.includes("DT");
    return dayStart + (isDst ? 16 : 17) * 3600000;
};
