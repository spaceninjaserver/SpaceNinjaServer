import { RequestHandler } from "express";

const modularWeaponSaleController: RequestHandler = (_req, res) => {
    res.json({
        SaleInfos: [
            {
                Name: "Ostron",
                Expiry: { $date: { $numberLong: "1683586800000" } },
                Revision: 3045,
                Weapons: [
                    {
                        ItemType: "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon",
                        PremiumPrice: 171,
                        ModularParts: [
                            "/Lotus/Weapons/Ostron/Melee/ModularMelee01/Handle/HandleFive",
                            "/Lotus/Weapons/Ostron/Melee/ModularMelee01/Tip/TipSix",
                            "/Lotus/Weapons/Ostron/Melee/ModularMelee01/Balance/BalanceDamageICritII"
                        ]
                    }
                ]
            },
            {
                Name: "SolarisUnitedHoverboard",
                Expiry: { $date: { $numberLong: "1683586800000" } },
                Revision: 1650,
                Weapons: [
                    {
                        ItemType: "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit",
                        PremiumPrice: 51,
                        ModularParts: [
                            "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts/PartComponents/HoverboardCorpusC/HoverboardCorpusCDeck",
                            "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts/PartComponents/HoverboardCorpusC/HoverboardCorpusCEngine",
                            "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts/PartComponents/HoverboardCorpusB/HoverboardCorpusBFront",
                            "/Lotus/Types/Vehicles/Hoverboard/HoverboardParts/PartComponents/HoverboardCorpusC/HoverboardCorpusCJet"
                        ]
                    }
                ]
            },
            {
                Name: "SolarisUnitedMoaPet",
                Expiry: { $date: { $numberLong: "1683586800000" } },
                Revision: 1650,
                Weapons: [
                    {
                        ItemType: "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit",
                        PremiumPrice: 175,
                        ModularParts: [
                            "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetLegC",
                            "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetHeadOloro",
                            "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetEngineKrisys",
                            "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetParts/MoaPetPayloadThermocor"
                        ]
                    }
                ]
            },
            {
                Name: "SolarisUnitedKitGun",
                Expiry: { $date: { $numberLong: "1683586800000" } },
                Revision: 1650,
                Weapons: [
                    {
                        ItemType: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam",
                        PremiumPrice: 157,
                        ModularParts: [
                            "/Lotus/Weapons/SolarisUnited/Primary/SUModularPrimarySet1/Handles/SUModularPrimaryHandleAPart",
                            "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelDPart",
                            "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Clip/SUModularCritIReloadIIClipPart"
                        ]
                    }
                ]
            }
        ]
    });
};

export { modularWeaponSaleController };
