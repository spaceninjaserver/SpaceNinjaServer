export const colorToShard: Record<string, string> = {
    ACC_RED: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmar",
    ACC_RED_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmarMythic",
    ACC_YELLOW: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNira",
    ACC_YELLOW_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNiraMythic",
    ACC_BLUE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal",
    ACC_BLUE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBorealMythic",
    ACC_GREEN: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreen",
    ACC_GREEN_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreenMythic",
    ACC_ORANGE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrange",
    ACC_ORANGE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrangeMythic",
    ACC_PURPLE: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalViolet",
    ACC_PURPLE_MYTHIC: "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalVioletMythic"
};

export const shardToColor: Record<string, string> = {
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmar": "ACC_RED",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalAmarMythic": "ACC_RED_MYTHIC",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNira": "ACC_YELLOW",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalNiraMythic": "ACC_YELLOW_MYTHIC",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal": "ACC_BLUE",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalBorealMythic": "ACC_BLUE_MYTHIC",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreen": "ACC_GREEN",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalGreenMythic": "ACC_GREEN_MYTHIC",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrange": "ACC_ORANGE",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalOrangeMythic": "ACC_ORANGE_MYTHIC",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalViolet": "ACC_PURPLE",
    "/Lotus/Types/Gameplay/NarmerSorties/ArchonCrystalVioletMythic": "ACC_PURPLE_MYTHIC"
};

export const combineColors = (a: string, b: string): string => {
    return (
        combinePlainColors(a.replace("_MYTHIC", ""), b.replace("_MYTHIC", "")) +
        (a.indexOf("_MYTHIC") != -1 ? "_MYTHIC" : "")
    );
};

const combinePlainColors = (a: string, b: string): string => {
    switch (a) {
        case "ACC_RED":
            switch (b) {
                case "ACC_YELLOW":
                    return "ACC_ORANGE";
                case "ACC_BLUE":
                    return "ACC_PURPLE";
            }
            break;
        case "ACC_YELLOW":
            switch (b) {
                case "ACC_RED":
                    return "ACC_ORANGE";
                case "ACC_BLUE":
                    return "ACC_GREEN";
            }
            break;
        case "ACC_BLUE":
            switch (b) {
                case "ACC_RED":
                    return "ACC_PURPLE";
                case "ACC_YELLOW":
                    return "ACC_GREEN";
            }
            break;
    }
    throw new Error(`invalid color combination request: ${a} and ${b}`);
};
