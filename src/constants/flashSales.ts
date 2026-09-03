import type { IFlashSale } from "../types/worldStateTypes.ts";
import gameToBuildVersionInt from "./gameToBuildVersionInt.ts";

export const qqtcFlashSales: IFlashSaleData[] = [
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageConquera2021D", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Operator/Tattoos/TattooTennoI", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Operator/Tattoos/TattooTennoH", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Clan/QTCC2024EmblemItem", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Conquera2024Display", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageConqueraGlyphVII", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageConqueraGlyphVI", RegularOverride: 1 },
    { TypeName: "/Lotus/Interface/Graphics/CustomUI/ConqueraStyle", RegularOverride: 1 },
    { TypeName: "/Lotus/Interface/Graphics/CustomUI/Backgrounds/ConqueraBackground", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Conquera2021Deco", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageConquera2022A", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageConquera2021B", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageConquera2021A", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Scarves/TnCharityRibbonSyandana", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageConquera2021C", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Venus/Conquera2023CommunityDisplay", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageConqueraGlyphUpdated", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageConquera", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Sigils/QTCC2023ConqueraSigil", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Sigils/ConqueraSigil", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/Conquera2022Ephemera", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/ConqueraEphemera", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/TnCharityRibbonArmor/ConqueraArmorL", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/TnCharityRibbonArmor/ConqueraArmorA", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/TnCharityRibbonArmor/ConqueraChestRibbon", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyProtectorStalker", PremiumOverride: 35 }
];

export const dogDaysFlashSales: IFlashSaleData[] = [
    { TypeName: "/Lotus/Types/StoreItems/Packages/WaterFightNoggleBundle", PremiumOverride: 240 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFBeastMasterBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFChargerBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFEngineerBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFGruntBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImagePopsicleGrineerPurple", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFHealerBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFHeavyBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFHellionBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFSniperBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Events/WFTankBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerRollers", PremiumOverride: 75 }
];

export const saintPatrickDayFlashSales: IFlashSaleData[] = [
    { TypeName: "/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerShamrockItem", RegularOverride: 1 }
];

export const prideMonthFlashSales: IFlashSaleData[] = [
    // Color palettes
    { TypeName: "/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerPrideItemA", RegularOverride: 1 },
    {
        TypeName: "/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerPrideItemB",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["31.5.0"]
    },
    // Glyphs
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImagePrideLotusSymbolGlyph",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["42.0.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImagePrideCommunity",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["31.6.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageHildrynPrideCommunity",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["33.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImagePrideGlyph",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["35.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImagePride2025Glyph",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["38.5.0"]
    },
    // Ship decorations
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Venus/PrideCommunityDisplay",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["31.6.0"]
    },
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Pride2023Display",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["33.5.0"]
    },
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Venus/Pride2024Display",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["35.5.0"]
    },
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Pride2in1Display",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["38.6.0"]
    },
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Events/NeonPrideWings",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["35.5.0"]
    },
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/HeartOroRainbowDeco",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["38.6.0"]
    },
    // 2026 items
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Pride2026Poster",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["42.0.0"]
    },
    {
        TypeName: "/Lotus/Types/Items/ShipDecos/Props/Seasonal/Pride2026SquarePictureFrame",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["42.0.0"]
    }
];

export const naberusNightsFlashSales: IFlashSaleData[] = [
    { TypeName: "/Lotus/Types/StoreItems/Packages/Halloween2023GlyphBundleA", PremiumOverride: 65 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/Halloween2021GlyphBundle", PremiumOverride: 65 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/Halloween2019GlyphBundleA", PremiumOverride: 65 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/Halloween2019GlyphBundleB", PremiumOverride: 65 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenGlyphBundle", PremiumOverride: 65 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/Halloween2023ArmorBundle", PremiumOverride: 125 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenCrpCircArmorPack", PremiumOverride: 100 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenScarfBundleB", PremiumOverride: 80 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenSkinPack", PremiumOverride: 175 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenShipSkinBundle", PremiumOverride: 80 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenSkinPackC", PremiumOverride: 175 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenSkinPackII", PremiumOverride: 145 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenScarfBundle", PremiumOverride: 130 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/AcolyteNoggleBundle", PremiumOverride: 160 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/AcolyteAreaCasterBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/AcolyteDuellistBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/AcolyteControlBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/AcolyteHeavyBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/AcolyteRogueBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/AcolyteStrikerBobbleHead", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/StoreItems/SuitCustomizations/ColourPickerHalloweenItemA", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/Halloween2014Wings/Halloween2014ArmArmor", PremiumOverride: 50 },
    { TypeName: "/Lotus/Upgrades/Skins/Festivities/PumpkinHead", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenRegorAxeShield", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019CheshireKavat", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenAkvasto", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenAngstrum", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenBoltor", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019GhostChibiWisp", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenBraton", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageHalloween2016A", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageHalloween2016C", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageHalloween2016B", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenBuzlok", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageHalloween2016D", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019CreepyClem", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenDaikyu", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageHalloween2021Dethcube", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenDragonNikana", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenDualZoren", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019FrankenCorpus", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageHalloween2021Grineer", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenGlaive", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenGalatine", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenGrakata", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenGorgon", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenGlaxion", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenTwinGremlins", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenGrinlok", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Scarves/HalloweenFireFlyScarf", PremiumOverride: 90 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenImperator", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenKronen", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageHalloween2021Lotus", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenJatKittag", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Scarves/HalloweenKyropteraScarf", PremiumOverride: 50 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenKunai", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Liset/LisetSkinHalloween", PremiumOverride: 50 },
    { TypeName: "/Lotus/Upgrades/Skins/Liset/LisetInsectSkinHalloween", PremiumOverride: 50 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageChillingGlyphFour", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenMarelok", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenNikana", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenNukor", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageHalloween2021Loid", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenOpticor", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenOrthos", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenParis", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageChillingGlyphTwo", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/CrpCircleArmour/HalloweenCrpCircC", PremiumOverride: 45 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/CrpCircleArmour/HalloweenCrpCircA", PremiumOverride: 50 },
    { TypeName: "/Lotus/Upgrades/Skins/Armor/CrpCircleArmour/HalloweenCrpCircL", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenScindo", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019GhoulGrave", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageHalloween2021Pumpkin", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSarpa", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageChillingGlyphThree", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSilvaAndAegis", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageChillingGlyphOne", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSoma", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSkana", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019SlimeLoki", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSobek", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSonicor", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSimulor", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenTonkor", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019TrickOrBalas", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenSpira", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenStradavar", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenTwinGrakatas", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenArchSword", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenLato", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/Halloween2019Werefested", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Scarves/HalloweenErosionCape", PremiumOverride: 50 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenVasto", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenDarkSplitSword", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenDarkDagger", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/Scarves/HalloweenGrnBannerScarf", PremiumOverride: 75 },
    { TypeName: "/Lotus/Upgrades/Skins/Halloween/HalloweenAmprex", PremiumOverride: 20 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/HalloweenSkinPackD", PremiumOverride: 180 }
];

export const tennobaumFlashSales: IFlashSaleData[] = [
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/Winter2017GlyphBundle",
        PremiumOverride: 100,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/Winter2018GlyphBundle",
        PremiumOverride: 80,
        minBuildVersionInt: gameToBuildVersionInt["24.2.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/Winter2016Bundle",
        PremiumOverride: 350,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/Winter2019GlyphBundle",
        PremiumOverride: 90,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/WinterBundle",
        PremiumOverride: 600,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/WinterGlyphBundle",
        PremiumOverride: 65,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/KavatColorPackXmas",
        PremiumOverride: 40,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Festivities/XmasSonicor",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["18.0.6"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/WinterAccessoriesBundle",
        PremiumOverride: 280,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Harlequin/MirageXmasSkin",
        PremiumOverride: 40,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Armor/SetThreeWinged/SolsticeSetThreeArmArmor",
        PremiumOverride: 50,
        minBuildVersionInt: gameToBuildVersionInt["19.0.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Archer/WinterSolsticeSalix",
        PremiumOverride: 95,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Armor/SetThreeWinged/SolsticeSetThreeChestArmor",
        PremiumOverride: 45,
        minBuildVersionInt: gameToBuildVersionInt["19.0.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Frost/FrostXmasSkin",
        PremiumOverride: 40,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackCandyCane",
        PremiumOverride: 50,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/WinterGlyphBundleB",
        PremiumOverride: 110,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Scarves/HolidayTurtleNeckScarf",
        PremiumOverride: 50,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Hammer/SolsticeHeliocor",
        PremiumOverride: 30,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/KubrowColorPackReindeer",
        PremiumOverride: 50,
        minBuildVersionInt: gameToBuildVersionInt["15.5.0"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Fairy/SolsticeFairySkin",
        PremiumOverride: 40,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/SolsticeSetThreeArmorPack",
        PremiumOverride: 100,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Kubrows/Collars/KubrowCollarXmas",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["18.0.6"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2017D",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/Game/KubrowPet/Patterns/KubrowPetPatternXmasC",

        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["18.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/Packages/CandyCaneScythePack",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["12.4.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2016B",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Catbrows/SolsticeCatbrowFur",
        PremiumOverride: 40,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2016C",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Kubrows/Fur/SolsticeKubrowFur",
        PremiumOverride: 40,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Festivities/JingleKnuckles",
        RegularOverride: 1,
        minBuildVersionInt: gameToBuildVersionInt["18.0.6"]
    },
    {
        TypeName: "/Lotus/Upgrades/Skins/Armor/SetThreeWinged/SolsticeSetThreeLegArmor",
        PremiumOverride: 35,
        minBuildVersionInt: gameToBuildVersionInt["19.0.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016D",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2016D",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016E",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016A",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016B",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016C",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016G",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinterB2016F",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.5.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2017B",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2017A",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2017E",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2016A",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["19.4.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2017C",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2018E",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["24.2.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2018B",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["24.2.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2018A",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["24.2.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2018C",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["24.2.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2017F",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["22.6.0.1"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageWinter2018D",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["24.2.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageGlyphJingleKavat",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageGlyphCarolingOctavia",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageGlyphSurpriseIvara",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageGlyphJollyGrendel",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageGlyphFestiveFloof",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    },
    {
        TypeName: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageGlyphSkiGauss",
        PremiumOverride: 20,
        minBuildVersionInt: gameToBuildVersionInt["26.1.0"]
    }
];

// Complete union used by the custom Market item selector. The year-specific
// presentation logic remains in worldStateService.
export const lunarNewYearAllFlashSales: IFlashSaleData[] = [
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyTiger", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2022HeavyBladeSkin", PremiumOverride: 45 },
    { TypeName: "/Lotus/Upgrades/Skins/MeleeDangles/LNYCarpSugatra", PremiumOverride: 15 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2022IgnisSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2022Zarr", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/Kubrows/Armor/Lunar2022KubrowArmor", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/PeachBlossomsEphemera", PremiumOverride: 60 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/CNY2021Poster", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ChineseNewYear2021Glyph", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/WeGame/LuckyKavat", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/WeGame/LuckyKavatWhite", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/WeGame/LuckyKavatGold", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2020AcceltraSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2020OrthosSkin", PremiumOverride: 20 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2020PyranaSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/Promo/WeGame/WeGameMacheteSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/MeleeDangles/WegameChinaKnotDangle", PremiumOverride: 15 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyLNY2023Rabbit", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2023CedoSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/Sigils/WeGameNewYearTigerSigil", PremiumOverride: 40 },
    { TypeName: "/Lotus/Upgrades/Skins/Sigils/WeGameNewYearRabbitSigil", PremiumOverride: 40 },
    { TypeName: "/Lotus/Interface/Graphics/CustomUI/LunarNewYearStyle", PremiumOverride: 50 },
    { TypeName: "/Lotus/Interface/Graphics/CustomUI/Backgrounds/SpringFestivalBackground", PremiumOverride: 50 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2023NagantakaSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/LunarEphemera", PremiumOverride: 60 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/Lunar2023CernosSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Types/Items/Emotes/LNY2023Emote", PremiumOverride: 25 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyLNY2024Dragon", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/LNY2024Nukor", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/LNY2024DragonSigil", PremiumOverride: 40 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/LNYHookSword", PremiumOverride: 75 },
    { TypeName: "/Lotus/Upgrades/Skins/MeleeDangles/LNYBirdSugatra", PremiumOverride: 15 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/LNYDragonEphemera", PremiumOverride: 60 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/LNY2024Ogris", PremiumOverride: 25 },
    { TypeName: "/Lotus/Types/Items/Emotes/LNY2024DragonEmote", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/Sentinels/Skins/LNYDragonSentinelSkin", PremiumOverride: 85 },
    { TypeName: "/Lotus/Upgrades/Skins/Sentinels/Masks/LNYDragonMask", PremiumOverride: 30 },
    { TypeName: "/Lotus/Upgrades/Skins/Sentinels/Wings/LNYDragonWings", PremiumOverride: 15 },
    { TypeName: "/Lotus/Upgrades/Skins/Sentinels/Tails/LNYDragonTail", PremiumOverride: 15 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushySnake", PremiumOverride: 35 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyLNYMirage", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/CNY2025ScytheSkin", PremiumOverride: 25 },
    { TypeName: "/Lotus/Upgrades/Skins/LunarNewYear/LNY2025BoltorSkin", PremiumOverride: 20 },
    { TypeName: "/Lotus/StoreItems/Upgrades/Skins/Catbrows/Armor/LNYKavatBoltorArmor", PremiumOverride: 90 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/LNYStonesEphemera", PremiumOverride: 60 },
    { TypeName: "/Lotus/Upgrades/Skins/Sigils/WeGameNewYearSnakeSigil", PremiumOverride: 40 },
    { TypeName: "/Lotus/Upgrades/Skins/MeleeDangles/LNYSnakeMeleeDangle", PremiumOverride: 15 },
    { TypeName: "/Lotus/Types/Items/Emotes/LNY2025SnakeEmote", PremiumOverride: 15 },
    { TypeName: "/Lotus/Upgrades/Skins/Horse/DagathDeluxeLNYHorseBodySkin", PremiumOverride: 220 },
    { TypeName: "/Lotus/Upgrades/Skins/Horse/DagathDeluxeLNYHorseTail", PremiumOverride: 30 },
    { TypeName: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyLNYKaithe", PremiumOverride: 35 },
    { TypeName: "/Lotus/Upgrades/Skins/Effects/LNYKaitheDagathEphemera", PremiumOverride: 60 },
    { TypeName: "/Lotus/Upgrades/Skins/Sigils/WeGameNewYearHorseSigil", PremiumOverride: 40 },
    { TypeName: "/Lotus/Upgrades/Skins/MeleeDangles/LNYFireSugatra", PremiumOverride: 15 },
    { TypeName: "/Lotus/Types/Items/Emotes/LNY2026HorseEmote", PremiumOverride: 15 },
    { TypeName: "/Lotus/Types/Items/ShipLayerCNY", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/ImageGengzi", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2021BlessingsBundle", PremiumOverride: 130 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2021AnewBundle", PremiumOverride: 185 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2021LuminousBundle", PremiumOverride: 470 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2022BundleA", PremiumOverride: 135 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2022BundleB", PremiumOverride: 275 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2022BundleC", PremiumOverride: 515 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2022BundleD", PremiumOverride: 105 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2023BundleA", PremiumOverride: 135 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2023BundleB", PremiumOverride: 265 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2023BundleC", PremiumOverride: 500 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/CNY2023RabbitGlyph", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2024BundleA", PremiumOverride: 135 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2024BundleB", PremiumOverride: 295 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2024BundleC", PremiumOverride: 575 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2024SentinelSkinBundle", PremiumOverride: 95 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageYearOfTheDragonGlyph", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2025BundleA", PremiumOverride: 215 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2025BundleB", PremiumOverride: 590 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2025BundleC", PremiumOverride: 805 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/Seasonal/AvatarImageCNY2025SnakeGlyphB", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Clan/CNY2025SnakeEmblem", RegularOverride: 1 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2026BundleA", PremiumOverride: 295 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2026BundleB", PremiumOverride: 480 },
    { TypeName: "/Lotus/Types/StoreItems/Packages/LNY2026BundleC", PremiumOverride: 700 },
    { TypeName: "/Lotus/Types/StoreItems/AvatarImages/LNY2026HorseGlyph", RegularOverride: 1 },
    { TypeName: "/Lotus/Upgrades/Skins/Clan/LNY2026HorseGlyph", RegularOverride: 1 },
];

export interface IFlashSaleData extends Partial<IFlashSale> {
    TypeName: string;
    minBuildVersionInt?: number;
}
