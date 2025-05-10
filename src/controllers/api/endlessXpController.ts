import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { combineInventoryChanges, getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IEndlessXpReward, IInventoryClient, TEndlessXpCategory } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { ExportRewards, ICountedStoreItem } from "warframe-public-export-plus";
import { getRandomElement } from "@/src/services/rngService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

export const endlessXpController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IEndlessXpRequest>(String(req.body));
    if (payload.Mode == "r") {
        const inventory = await getInventory(accountId, "EndlessXP");
        inventory.EndlessXP ??= [];
        let entry = inventory.EndlessXP.find(x => x.Category == payload.Category);
        if (!entry) {
            entry = {
                Category: payload.Category,
                Earn: 0,
                Claim: 0,
                Choices: payload.Choices,
                PendingRewards: []
            };
            inventory.EndlessXP.push(entry);
        }

        const weekStart = 1734307200_000 + Math.trunc((Date.now() - 1734307200_000) / 604800000) * 604800000;
        const weekEnd = weekStart + 604800000;

        entry.Earn = 0;
        entry.Claim = 0;
        entry.BonusAvailable = new Date(weekStart);
        entry.Expiry = new Date(weekEnd);
        entry.Choices = payload.Choices;
        entry.PendingRewards =
            payload.Category == "EXC_HARD"
                ? generateHardModeRewards(payload.Choices)
                : generateNormalModeRewards(payload.Choices);

        await inventory.save();
        res.json({
            NewProgress: inventory.toJSON<IInventoryClient>().EndlessXP!.find(x => x.Category == payload.Category)!
        });
    } else if (payload.Mode == "c") {
        const inventory = await getInventory(accountId);
        const entry = inventory.EndlessXP!.find(x => x.Category == payload.Category)!;
        const inventoryChanges: IInventoryChanges = {};
        for (const reward of entry.PendingRewards) {
            if (entry.Claim < reward.RequiredTotalXp && reward.RequiredTotalXp <= entry.Earn) {
                combineInventoryChanges(
                    inventoryChanges,
                    (
                        await handleStoreItemAcquisition(
                            reward.Rewards[0].StoreItem,
                            inventory,
                            reward.Rewards[0].ItemCount
                        )
                    ).InventoryChanges
                );
            }
        }
        entry.Claim = entry.Earn;
        await inventory.save();
        res.json({
            InventoryChanges: inventoryChanges,
            ClaimedXp: entry.Claim
        });
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unexpected endlessXp mode: ${payload.Mode}`);
    }
};

type IEndlessXpRequest =
    | {
          Mode: "r";
          Category: TEndlessXpCategory;
          Choices: string[];
      }
    | {
          Mode: "c" | "something else";
          Category: TEndlessXpCategory;
      };

const generateRandomRewards = (deckName: string): ICountedStoreItem[] => {
    const reward = getRandomElement(ExportRewards[deckName][0])!;
    return [
        {
            StoreItem: reward.type,
            ItemCount: reward.itemCount
        }
    ];
};

const normalModeChosenRewards: Record<string, string[]> = {
    Excalibur: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ExcaliburHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ExcaliburChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Excalibur/RadialJavelinAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ExcaliburSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ExcaliburBlueprint"
    ],
    Trinity: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrinityHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrinityChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Trinity/EnergyVampireAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrinitySystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrinityBlueprint"
    ],
    Ember: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/EmberHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/EmberChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Ember/WorldOnFireAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/EmberSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/EmberBlueprint"
    ],
    Loki: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/LOKIHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/LOKIChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Loki/InvisibilityAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/LOKISystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/LOKIBlueprint"
    ],
    Mag: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Mag/CrushAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagBlueprint"
    ],
    Rhino: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RhinoHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RhinoChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Rhino/RhinoChargeAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RhinoSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RhinoBlueprint"
    ],
    Ash: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/AshHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/AshChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Ninja/GlaiveAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/AshSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/AshBlueprint"
    ],
    Frost: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FrostHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FrostChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Frost/IceShieldAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FrostSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FrostBlueprint"
    ],
    Nyx: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NyxHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NyxChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Jade/SelfBulletAttractorAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NyxSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NyxBlueprint"
    ],
    Saryn: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/SarynHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/SarynChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Saryn/PoisonAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/SarynSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/SarynBlueprint"
    ],
    Vauban: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrapperHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrapperChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Trapper/LevTrapAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrapperSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/TrapperBlueprint"
    ],
    Nova: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NovaHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NovaChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/AntiMatter/MolecularPrimeAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NovaSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NovaBlueprint"
    ],
    Nekros: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NecroHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NecroChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Necro/CloneTheDeadAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NecroSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NecroBlueprint"
    ],
    Valkyr: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BerserkerHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BerserkerChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Berserker/IntimidateAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BerserkerSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BerserkerBlueprint"
    ],
    Oberon: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PaladinHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PaladinChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Paladin/RegenerationAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PaladinSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PaladinBlueprint"
    ],
    Hydroid: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HydroidHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HydroidChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Pirate/CannonBarrageAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HydroidSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HydroidBlueprint"
    ],
    Mirage: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HarlequinHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HarlequinChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Harlequin/LightAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HarlequinSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/HarlequinBlueprint"
    ],
    Limbo: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagicianHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagicianChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Magician/TearInSpaceAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagicianSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MagicianBlueprint"
    ],
    Mesa: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GunslingerHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GunslingerChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Cowgirl/GunFuPvPAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GunslingerSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GunslingerBlueprint"
    ],
    Chroma: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Dragon/DragonLuckAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/ChromaBlueprint"
    ],
    Atlas: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BrawlerHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BrawlerChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Brawler/BrawlerPassiveAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BrawlerSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/BrawlerBlueprint"
    ],
    Ivara: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RangerHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RangerChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Ranger/RangerStealAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RangerSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RangerBlueprint"
    ],
    Inaros: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MummyHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MummyChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Sandman/SandmanSwarmAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MummySystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/MummyBlueprint"
    ],
    Titania: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FairyHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FairyChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Fairy/FairyFlightAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FairySystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/FairyBlueprint"
    ],
    Nidus: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NidusHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NidusChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Infestation/InfestPodsAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NidusSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/NidusBlueprint"
    ],
    Octavia: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/OctaviaHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/OctaviaChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Bard/BardCharmAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/OctaviaSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/OctaviaBlueprint"
    ],
    Harrow: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PriestHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PriestChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Priest/PriestPactAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PriestSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PriestBlueprint"
    ],
    Gara: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GlassHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GlassChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Glass/GlassFragmentAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GlassSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GlassBlueprint"
    ],
    Khora: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/KhoraHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/KhoraChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Khora/KhoraCrackAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/KhoraSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/KhoraBlueprint"
    ],
    Revenant: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RevenantHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RevenantChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Revenant/RevenantMarkAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RevenantSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/RevenantBlueprint"
    ],
    Garuda: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GarudaHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GarudaChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Garuda/GarudaUnstoppableAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GarudaSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/GarudaBlueprint"
    ],
    Baruuk: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PacifistHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PacifistChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/Pacifist/PacifistFistAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PacifistSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/PacifistBlueprint"
    ],
    Hildryn: [
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/IronframeHelmetBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/IronframeChassisBlueprint",
        "/Lotus/StoreItems/Powersuits/IronFrame/IronFrameStripAugmentCard",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/IronframeSystemsBlueprint",
        "/Lotus/StoreItems/Types/Recipes/WarframeRecipes/IronframeBlueprint"
    ]
};

const generateNormalModeRewards = (choices: string[]): IEndlessXpReward[] => {
    const choiceRewards = normalModeChosenRewards[choices[0]];
    return [
        {
            RequiredTotalXp: 190,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessNormalSilverRewards"
            )
        },
        {
            RequiredTotalXp: 400,
            Rewards: [
                {
                    StoreItem: choiceRewards[0],
                    ItemCount: 1
                }
            ]
        },
        {
            RequiredTotalXp: 630,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessNormalSilverRewards"
            )
        },
        {
            RequiredTotalXp: 890,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessNormalMODRewards"
            )
        },
        {
            RequiredTotalXp: 1190,
            Rewards: [
                {
                    StoreItem: choiceRewards[1],
                    ItemCount: 1
                }
            ]
        },
        {
            RequiredTotalXp: 1540,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessNormalGoldRewards"
            )
        },
        {
            RequiredTotalXp: 1950,
            Rewards: [
                {
                    StoreItem: choiceRewards[2],
                    ItemCount: 1
                }
            ]
        },
        {
            RequiredTotalXp: 2430,
            Rewards: [
                {
                    StoreItem: choiceRewards[3],
                    ItemCount: 1
                }
            ]
        },
        {
            RequiredTotalXp: 2990,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessNormalArcaneRewards"
            )
        },
        {
            RequiredTotalXp: 3640,
            Rewards: [
                {
                    StoreItem: choiceRewards[4],
                    ItemCount: 1
                }
            ]
        }
    ];
};

const hardModeChosenRewards: Record<string, string> = {
    Braton: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/BratonIncarnonUnlocker",
    Lato: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/LatoIncarnonUnlocker",
    Skana: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/SkanaIncarnonUnlocker",
    Paris: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/ParisIncarnonUnlocker",
    Kunai: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/KunaiIncarnonUnlocker",
    Boar: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/BoarIncarnonUnlocker",
    Gammacor: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/GammacorIncarnonUnlocker",
    Anku: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/AnkuIncarnonUnlocker",
    Gorgon: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/GorgonIncarnonUnlocker",
    Angstrum: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/AngstrumIncarnonUnlocker",
    Bo: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/BoIncarnonUnlocker",
    Latron: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/LatronIncarnonUnlocker",
    Furis: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/FurisIncarnonUnlocker",
    Furax: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/FuraxIncarnonUnlocker",
    Strun: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/StrunIncarnonUnlocker",
    Lex: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/LexIncarnonUnlocker",
    Magistar: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/MagistarIncarnonUnlocker",
    Boltor: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/BoltorIncarnonUnlocker",
    Bronco: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/BroncoIncarnonUnlocker",
    CeramicDagger: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/CeramicDaggerIncarnonUnlocker",
    Torid: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/ToridIncarnonUnlocker",
    DualToxocyst: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/DualToxocystIncarnonUnlocker",
    DualIchor: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/DualIchorIncarnonUnlocker",
    Miter: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/MiterIncarnonUnlocker",
    Atomos: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/AtomosIncarnonUnlocker",
    AckAndBrunt: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/AckAndBruntIncarnonUnlocker",
    Soma: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/SomaIncarnonUnlocker",
    Vasto: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/VastoIncarnonUnlocker",
    NamiSolo: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/NamiSoloIncarnonUnlocker",
    Burston: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/BurstonIncarnonUnlocker",
    Zylok: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/ZylokIncarnonUnlocker",
    Sibear: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/SibearIncarnonUnlocker",
    Dread: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/DreadIncarnonUnlocker",
    Despair: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/DespairIncarnonUnlocker",
    Hate: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/HateIncarnonUnlocker",
    Dera: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/DeraIncarnonUnlocker",
    Cestra: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/CestraIncarnonUnlocker",
    Okina: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Melee/OkinaIncarnonUnlocker",
    Sybaris: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Primary/SybarisIncarnonUnlocker",
    Sicarus: "/Lotus/StoreItems/Types/Items/MiscItems/IncarnonAdapters/Secondary/SicarusIncarnonUnlocker",
    RivenPrimary: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawRifleRandomMod",
    RivenSecondary: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawPistolRandomMod",
    RivenMelee: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawMeleeRandomMod",
    Kuva: "/Lotus/Types/Game/DuviriEndless/CircuitSteelPathBIGKuvaReward"
};

const generateHardModeRewards = (choices: string[]): IEndlessXpReward[] => {
    return [
        {
            RequiredTotalXp: 285,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathSilverRewards"
            )
        },
        {
            RequiredTotalXp: 600,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathArcaneRewards"
            )
        },
        {
            RequiredTotalXp: 945,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathSilverRewards"
            )
        },
        {
            RequiredTotalXp: 1335,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathSilverRewards"
            )
        },
        {
            RequiredTotalXp: 1785,
            Rewards: [
                {
                    StoreItem: hardModeChosenRewards[choices[0]],
                    ItemCount: 1
                }
            ]
        },
        {
            RequiredTotalXp: 2310,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathGoldRewards"
            )
        },
        {
            RequiredTotalXp: 2925,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathGoldRewards"
            )
        },
        {
            RequiredTotalXp: 3645,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathArcaneRewards"
            )
        },
        {
            RequiredTotalXp: 4485,
            Rewards: generateRandomRewards(
                "/Lotus/Types/Game/MissionDecks/DuviriEndlessCircuitRewards/DuviriEndlessSteelPathSteelEssenceRewards"
            )
        },
        {
            RequiredTotalXp: 5460,
            Rewards: [
                {
                    StoreItem: hardModeChosenRewards[choices[1]],
                    ItemCount: 1
                }
            ]
        }
    ];
};
