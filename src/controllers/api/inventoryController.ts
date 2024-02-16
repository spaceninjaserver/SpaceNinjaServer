/* eslint-disable @typescript-eslint/no-misused-promises */
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Request, RequestHandler, Response } from "express";
import config from "@/config.json";
import allMissions from "@/static/fixed_responses/allMissions.json";
import allQuestKeys from "@/static/fixed_responses/allQuestKeys.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { Ship } from "@/src/models/shipModel";
import { IShipInventory } from "@/src/types/inventoryTypes/inventoryTypes";

const inventoryController: RequestHandler = async (request: Request, response: Response) => {
    const accountId = request.query.accountId;

    if (!accountId) {
        response.status(400).json({ error: "accountId was not provided" });
        return;
    }

    const inventory = await Inventory.findOne({ accountOwnerId: accountId })
        .populate<{
            LoadOutPresets: ILoadoutDatabase;
        }>("LoadOutPresets")
        .populate<{ Ships: IShipInventory }>("Ships", "-ShipInteriorColors -ShipAttachments -SkinFlavourItem");

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    console.log(inventory.Ships);
    // const ships = await Ship.find({ _id: { $in: inventory.Ships } });

    //TODO: make a function that converts from database representation to client
    const inventoryJSON = inventory.toJSON();
    console.log(inventoryJSON.Ships);

    const inventoryResponse = toInventoryResponse(inventoryJSON);

    if (config.unlockAllMissions) inventoryResponse.Missions = allMissions;
    if (config.unlockAllQuests) inventoryResponse.QuestKeys = allQuestKeys;

    (inventoryResponse.ShipDecorations = [
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ChildDrawingA"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ChildDrawingB"
        },
        {
            ItemCount: 85,
            ItemType: "/Lotus/Types/Items/ShipDecos/GlyphPictureFrame"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ChildDrawingC"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ChildDrawingD"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ChildDrawingF"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/OrbiterPictureFrameB"
        },
        {
            ItemCount: 13,
            ItemType: "/Lotus/Types/Items/ShipDecos/ConclaveHeartOroOrnament"
        },
        {
            ItemCount: 18,
            ItemType: "/Lotus/Types/Items/ShipDecos/Vignettes/Enemies/TeralystAFItem"
        },
        {
            ItemCount: 10,
            ItemType: "/Lotus/Types/Items/ShipDecos/Vignettes/Enemies/TeralystBigAFItem"
        },
        {
            ItemCount: 6,
            ItemType: "/Lotus/Types/Items/ShipDecos/Vignettes/Enemies/TeralystRainAFItem"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/Vignettes/Warframes/WarframeAFItem"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/PedistalPrime"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropEidolonShard"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropSentientCore"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyKubrodonUncommon"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyVirminkCommon"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyHorrasqueCommon"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyKubrodonCommon"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyKubrodonRare"
        },
        {
            ItemCount: 10,
            ItemType: "/Lotus/Types/Items/ShipDecos/Vignettes/Enemies/ArachnoidCamperAFItem"
        },
        {
            ItemCount: 3,
            ItemType: "/Lotus/Types/Items/ShipDecos/KubrowBust"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/KavatBust"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/RelayHydroidBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyDesertSkate"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationC"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationD"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardGauss"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationE"
        },
        {
            ItemCount: 3,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationF"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardGrendel"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardAtlas"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/KubrowToyB"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationG"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationH"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyThumper"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyThumperMedium"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardIvara"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardNova"
        },
        {
            ItemCount: 5,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationB"
        },
        {
            ItemCount: 5,
            ItemType: "/Lotus/Types/Items/ShipDecos/BaroKiTeerDecorationA"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ExcaliburArchwingBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusShip/LisetPropGreedCoinGold"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusShip/LisetPropGreedCoinBlue"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusGreedReliefA"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyKuvaFortressBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyEarthBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyMercuryBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyVenusBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyLuaBronze"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusGreedReliefB"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyPhobosBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyMarsBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyCeresBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyJupiterBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyEuropaBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophySaturnBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFBeastMasterBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFChargerBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFEngineerBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFGruntBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFHealerBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFHeavyBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFHellionBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFSniperBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFTankBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyUranusBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusGreedReliefC"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyPlutoBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyErisBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophySednaBronze"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyDerelictBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyNeptuneBronze"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFRollerFloofRucksack"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFRollerFloofBeach"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFRollerFloof"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFRollerFloofRainbow"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/WFRollerFloofMorning"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusGreedReliefD"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusGreedReliefE"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CorpusGreedReliefF"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/ResourceDecoItemArgonCrystal"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/KuvaMetaBallOrnament"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/SUToolBox"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/SUTechToolA"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConG"
        },
        {
            ItemCount: 5,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConE"
        },
        {
            ItemCount: 8,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConI"
        },
        {
            ItemCount: 8,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConF"
        },
        {
            ItemCount: 3,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConJ"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/PlanetTrophies/PlanetTrophyDeimosBronze"
        },
        {
            ItemCount: 5,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConC"
        },
        {
            ItemCount: 5,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConB"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConD"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConH"
        },
        {
            ItemCount: 4,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardTennoConA"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/SUToolBoxLarge"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/SUFoodBox"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank01Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank02Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank03Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank04Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank05Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank06Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank07Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank08Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank09Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank10Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank11Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank12Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank13Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank14Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank15Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank16Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank17Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank18Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank19Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank20Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank21Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank22Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank23Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank24Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank25Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank26Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank27Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank28Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank29Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank30Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Events/TickerValentineWings"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyTicker"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/WeGame/LuckyKavat"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/WeGame/LuckyKavatWhite"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardSevagoth"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/WraithQuestRewardDeco"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/Deimos/PlushyMoonMonsterCommon"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/OrbiterPictureFrameBaro"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/YareliMerulinaBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank31Trophy"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/TarotCardYareli"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/YareliBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropBallasSwordSheath"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/HeartOfDeimosAlbumCoverPoster"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/StalkerBobbleHead"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/GarvLatroxPoster"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Conquera2021Deco"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/TheNewWarKahlCommunityDisplay"
        },
        {
            ItemCount: 2,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/TheNewWarTeshinCommunityDisplay"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/NewWar/LisetPropBallasStaff"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/NewWar/LisetPropFamilyPortrait"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropNarmerMandolin"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropGrineerCutter"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/Deimos/PlushySunMonsterCommon"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropGrineerFlak"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/CNY2021Poster"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Plushies/PlushyTiger"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/LisetPropGyrePulseDecoration"
        },
        {
            ItemCount: 1,
            ItemType: "/Lotus/Types/Items/ShipDecos/Venus/PrideCommunityDisplay"
        }
    ]),
        // (inventoryResponse.Ships = [
        //     {
        //         ItemType: "/Lotus/Types/Items/Ships/BlueSkyShip",
        //         ShipExterior: {
        //             SkinFlavourItem: "/Lotus/Upgrades/Skins/Liset/LisetBlueSkySkinStalker",
        //             Colors: {
        //                 t0: 0,
        //                 t1: 5703424,
        //                 t2: 0,
        //                 t3: 5703424,
        //                 m0: 16742665,
        //                 en: 16742665
        //             }
        //         },
        //         AirSupportPower: "/Lotus/Types/Restoratives/LisetMedStation",
        //         ItemId: {
        //             $oid: "5b9ee83aa38e4a3fb7235e39"
        //         }
        //     },
        //     {
        //         ItemType: "/Lotus/Types/Items/Ships/NoraShip",
        //         AirSupportPower: "/Lotus/Types/Restoratives/LisetMedStation",
        //         ShipExterior: {
        //             Colors: {
        //                 t0: 5703424,
        //                 t1: 5703424,
        //                 t2: 0,
        //                 t3: 5703424,
        //                 m0: 16742665,
        //                 en: 16742665
        //             },
        //             SkinFlavourItem: "/Lotus/Upgrades/Skins/Liset/ZephyrDeluxeShipSkin",
        //             ShipAttachments: {
        //                 HOOD_ORNAMENT: "/Lotus/Upgrades/Skins/Liset/MasteryHoodOrnament"
        //             }
        //         },
        //         ItemId: {
        //             $oid: "5ef21701e56e414c3e5d39f5"
        //         }
        //     }
        // ]);
        response.json(inventoryResponse);
};

export { inventoryController };
