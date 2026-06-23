import type { RequestHandler } from "express";
import { logger } from "../../utils/logger.ts";
import { getRandomElement } from "../../services/rngService.ts";
import type { ITypeCount } from "../../types/commonTypes.ts";
import type { IWeekGuildVaultBonusReward } from "../../types/inventoryTypes/inventoryTypes.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory2 } from "../../services/inventoryService.ts";

export const guildVaultBonusRewardsController: RequestHandler = async (req, res) => {
    if (req.query.gvbMode == "r") {
        const accountId = await getAccountIdForRequest(req);
        const payload = JSON.parse(String(req.body)) as IRollGuildVaultBonusRequest;

        const inventory = await getInventory2(accountId, "WeeklyGuildVaultBonusInfo");
        if (inventory.WeeklyGuildVaultBonusInfo?.WeekCount != payload.WeekCount) {
            const tierAReward = getRandomElement(tierARewards)!;
            const tierBReward = getRandomElement(tierBRewards)!;
            const tierCReward = getRandomElement(tierCRewards)!;
            const tierDReward = getRandomElement(tierDRewards)!;
            inventory.WeeklyGuildVaultBonusInfo = {
                Progress: 0,
                WeekCount: payload.WeekCount,
                BonusRegion: "/Lotus/Language/Locations/Earth", // TODO: Is this the correct format? What planets are eligible? Does the server need to handle anything for this "bonus"?
                Rewards: [
                    {
                        RewardClaimed: false,
                        PointThreshold: 500,
                        ItemCount: tierAReward.ItemCount,
                        Reward: tierAReward.ItemType
                    },
                    {
                        RewardClaimed: false,
                        PointThreshold: 1000,
                        ItemCount: tierBReward.ItemCount,
                        Reward: tierBReward.ItemType
                    },
                    {
                        RewardClaimed: false,
                        PointThreshold: 1500,
                        ItemCount: tierCReward.ItemCount,
                        Reward: tierCReward.ItemType
                    },
                    {
                        RewardClaimed: false,
                        PointThreshold: 2000,
                        ItemCount: tierDReward.ItemCount,
                        Reward: tierDReward.ItemType
                    }
                ]
            };
            await inventory.save();
        }

        res.json({
            NewRewards: inventory.WeeklyGuildVaultBonusInfo.Rewards,
            BonusRegion: inventory.WeeklyGuildVaultBonusInfo.BonusRegion
        } satisfies IRollGuildVaultBonusResponse);
    } else {
        logger.debug(`data provided to ${req.path}: ${String(req.body)}`);
        throw new Error(`unexpected guildVaultBonusRewards mode: ${req.query.gvbMode as string}`);
    }
};

interface IRollGuildVaultBonusRequest {
    WeekCount: number;
}
interface IRollGuildVaultBonusResponse {
    NewRewards: IWeekGuildVaultBonusReward[];
    BonusRegion: string;
}

// https://wiki.warframe.com/w/Clan_Weekly_Initiatives

const tierARewards: ITypeCount[] = [
    // 50 Squad Energy Restore (Large)
    { ItemType: "/Lotus/StoreItems/Types/Restoratives/SyndicateTeamEnergyTotem", ItemCount: 50 },

    // 50 Squad Health Restore (Large)
    { ItemType: "/Lotus/StoreItems/Types/Restoratives/SyndicateTeamHealTotem", ItemCount: 50 },

    // 12 Neurodes
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Neurode", ItemCount: 12 },

    // 12 Neural Sensors
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/NeuralSensor", ItemCount: 12 },

    // 12 Orokin Cell
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/OrokinCell", ItemCount: 12 },

    // 1,000 Endo
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/CircuitRepeatableSteelPathFusionBundle", ItemCount: 1 },

    // 5 Mutagen Mass
    { ItemType: "/Lotus/StoreItems/Types/Items/Research/BioComponent", ItemCount: 5 },

    // 5 Detonite Injector
    { ItemType: "/Lotus/StoreItems/Types/Items/Research/ChemComponent", ItemCount: 5 },

    // 5 Fieldron
    { ItemType: "/Lotus/StoreItems/Types/Items/Research/EnergyComponent", ItemCount: 5 },

    // 3 Aya
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/SchismKey", ItemCount: 3 },

    // Ayatan Anasa Sculpture
    { ItemType: "/Lotus/StoreItems/Types/Items/FusionTreasures/OroFusexF", ItemCount: 1 }
];

const tierBRewards: ITypeCount[] = [
    // 50,000 Credits
    { ItemType: "/Lotus/StoreItems/Types/PickUps/Credits/10000Credits", ItemCount: 5 },

    // 2,000 Endo
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/CircuitRepeatableSteelPathFusionBundle", ItemCount: 2 },

    // 10x Cosmic Specter
    { ItemType: "/Lotus/StoreItems/Types/Restoratives/Consumable/PlatinumSpectre", ItemCount: 10 },

    // 7,000 Kuva
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Kuva", ItemCount: 7000 },

    // 100 Vosfor
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/DistillPoints", ItemCount: 100 },

    // 3 Aya
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/SchismKey", ItemCount: 3 },

    // Forma Blueprint
    { ItemType: "/Lotus/StoreItems/Types/Recipes/Components/FormaBlueprint", ItemCount: 1 },

    // Veiled Riven Mod (random type)
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawMeleeRandomMod", ItemCount: 1 },
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawRifleRandomMod", ItemCount: 1 },
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawPistolRandomMod", ItemCount: 1 },
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawModularMeleeRandomMod", ItemCount: 1 },
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/Randomized/RawModularPistolRandomMod", ItemCount: 1 }
];

const tierCRewards: ITypeCount[] = [
    // 100,000 Credits
    { ItemType: "/Lotus/StoreItems/Types/PickUps/Credits/10000Credits", ItemCount: 10 },

    // 3,000 Endo
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/CircuitRepeatableSteelPathFusionBundle", ItemCount: 3 },

    // 14,000 Kuva
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Kuva", ItemCount: 14000 },

    // 200 Vosfor
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/DistillPoints", ItemCount: 200 },

    // 5 Aya
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/SchismKey", ItemCount: 5 },

    // Orokin Reactor
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/OrokinReactor", ItemCount: 1 },

    // Orokin Catalyst
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/OrokinCatalyst", ItemCount: 1 },

    // 2 Relic Packs
    { ItemType: "/Lotus/StoreItems/Types/BoosterPacks/LoginRewardRandomProjection", ItemCount: 2 }
];

const tierDRewards: ITypeCount[] = [
    // 5,000 Endo
    { ItemType: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/CircuitRepeatableSteelPathFusionBundle", ItemCount: 5 },

    // 21,000 Kuva
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Kuva", ItemCount: 21000 },

    // 200 Vosfor
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/DistillPoints", ItemCount: 200 },

    // Forma (Built)
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Forma", ItemCount: 1 },

    // Eidolon Lens Blueprint
    { ItemType: "/Lotus/StoreItems/Types/Recipes/Lens/GenericLensOstronBlueprint", ItemCount: 1 },

    // Omni Forma (Built)
    { ItemType: "/Lotus/StoreItems/Types/Items/MiscItems/FormaAura", ItemCount: 1 }
];
