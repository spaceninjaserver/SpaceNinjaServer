import { Types } from "mongoose";
import type {
    IItemConfig,
    IOperatorConfigClient,
    IOperatorConfigDatabase
} from "../types/inventoryTypes/commonInventoryTypes.ts";
import type { IMongoDateWithLegacySupport } from "../types/commonTypes.ts";
import type {
    IBooster,
    IDialogueClient,
    IDialogueDatabase,
    IDialogueHistoryClient,
    IDialogueHistoryDatabase,
    IInfestedFoundryClient,
    IInfestedFoundryDatabase,
    IFocusLoadoutClient,
    IFocusLoadoutDatabase,
    IInventoryClient,
    INemesisClient,
    INemesisDatabase,
    IRecentVendorPurchaseClient,
    IRecentVendorPurchaseDatabase,
    IVendorPurchaseHistoryEntryClient,
    IVendorPurchaseHistoryEntryDatabase,
    IPendingRecipeClient,
    IPendingRecipeDatabase,
    IQuestKeyClient,
    IQuestKeyDatabase,
    ISlots,
    IUpgradeClient,
    IUpgradeDatabase,
    IWeaponSkinClient,
    IWeaponSkinDatabase,
    IPeriodicMissionCompletionResponse,
    IPeriodicMissionCompletionDatabase,
    INemesisBaseClient,
    INemesisBaseDatabase,
    IFusionTreasure
} from "../types/inventoryTypes/inventoryTypes.ts";
import { equipmentKeys, type IStepSequencerDatabase } from "../types/inventoryTypes/inventoryTypes.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import type {
    ILoadoutConfigClient,
    ILoadoutConfigDatabase,
    ILoadoutDatabase,
    ILoadOutPresets
} from "../types/saveLoadoutTypes.ts";
import { slotNames } from "../types/purchaseTypes.ts";
import {
    eStatus,
    type ICrewShipMemberClient,
    type ICrewShipMemberDatabase,
    type ICrewShipMembersClient,
    type ICrewShipMembersDatabase,
    type ICrewShipWeaponClient,
    type ICrewShipWeaponDatabase,
    type ICrewShipWeaponEmplacementsClient,
    type ICrewShipWeaponEmplacementsDatabase,
    type IEquipmentClient,
    type IEquipmentDatabase,
    type IEquipmentSelectionClient,
    type IEquipmentSelectionDatabase,
    type IKubrowPetDatabase,
    type IKubrowPetDetailsClient,
    type IKubrowPetDetailsDatabase
} from "../types/equipmentTypes.ts";
import type {
    IApartmentClient,
    IApartmentDatabase,
    ICustomizationInfoClient,
    ICustomizationInfoDatabase,
    IFavouriteLoadout,
    IFavouriteLoadoutDatabase,
    IGetShipResponse,
    IOrbiterClient,
    IOrbiterDatabase,
    IPersonalRoomsDatabase,
    IPlacedDecosClient,
    IPlacedDecosDatabase,
    IPlantClient,
    IPlantDatabase,
    IPlanterClient,
    IPlanterDatabase,
    IRoomClient,
    IRoomDatabase,
    ITailorShop,
    ITailorShopDatabase
} from "../types/personalRoomsTypes.ts";
import { fromMongoDate, fromOid } from "../helpers/inventoryHelpers.ts";
import { getRecipe } from "./itemDataService.ts";
import { logger } from "../utils/logger.ts";
import { isEligibleForThousandYearFishDeco, migrateFusionTreasures } from "./inventoryService.ts";
import { BL_LATEST } from "../constants/gameVersions.ts";

const convertOptionalDate = (value: IMongoDateWithLegacySupport | undefined): Date | undefined => {
    return value ? fromMongoDate(value) : undefined;
};

const convertEquipment = (client: IEquipmentClient): IEquipmentDatabase | IKubrowPetDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(fromOid(ItemId)),
        InfestationDate: convertOptionalDate(client.InfestationDate),
        Expiry: convertOptionalDate(client.Expiry),
        UpgradesExpiry: convertOptionalDate(client.UpgradesExpiry),
        UmbraDate: convertOptionalDate(client.UmbraDate),
        Weapon: client.Weapon ? importCrewShipWeapon(client.Weapon) : undefined,
        CrewMembers: client.CrewMembers ? importCrewShipMembers(client.CrewMembers) : undefined,
        Details: client.Details ? convertKubrowDetails(client.Details) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        Configs: client.Configs
            ? client.Configs.map(obj =>
                  Object.fromEntries(
                      Object.entries(obj).filter(([_, value]) => !Array.isArray(value) || value.length > 0)
                  )
              )
            : [],
        AltWeaponModeId: client.AltWeaponModeId ? new Types.ObjectId(client.AltWeaponModeId.$oid) : undefined
    };
};

const convertWeaponSkin = (client: IWeaponSkinClient): IWeaponSkinDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(fromOid(ItemId))
    };
};

export const importUpgrade = (client: IUpgradeClient): IUpgradeDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(fromOid(ItemId))
    };
};

const convertOperatorConfig = (client: IOperatorConfigClient): IOperatorConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(fromOid(ItemId))
    };
};

const replaceArray = <T>(arr: T[], replacement: T[]): void => {
    arr.splice(0, arr.length);
    replacement.forEach(x => {
        arr.push(x);
    });
};

const replaceSlots = (db: ISlots, client: ISlots): void => {
    db.Extra = client.Extra;
    db.Slots = client.Slots;
};

const convertEquipmentSelection = (es: IEquipmentSelectionClient): IEquipmentSelectionDatabase => {
    const { ItemId, ...rest } = es;
    return {
        ...rest,
        ItemId: ItemId ? new Types.ObjectId(fromOid(ItemId)) : undefined
    };
};

const convertFocusLoadout = (client: IFocusLoadoutClient): IFocusLoadoutDatabase => {
    return {
        ...client,
        Preset: convertEquipmentSelection(client.Preset)
    };
};

const convertCrewShipWeaponEmplacements = (
    obj: ICrewShipWeaponEmplacementsClient
): ICrewShipWeaponEmplacementsDatabase => {
    return {
        PRIMARY_A: obj.PRIMARY_A ? convertEquipmentSelection(obj.PRIMARY_A) : undefined,
        PRIMARY_B: obj.PRIMARY_B ? convertEquipmentSelection(obj.PRIMARY_B) : undefined,
        SECONDARY_A: obj.SECONDARY_A ? convertEquipmentSelection(obj.SECONDARY_A) : undefined,
        SECONDARY_B: obj.SECONDARY_B ? convertEquipmentSelection(obj.SECONDARY_B) : undefined
    };
};

export const importCrewShipWeapon = (weapon: ICrewShipWeaponClient): ICrewShipWeaponDatabase => {
    return {
        PILOT: weapon.PILOT ? convertCrewShipWeaponEmplacements(weapon.PILOT) : undefined,
        PORT_GUNS: weapon.PORT_GUNS ? convertCrewShipWeaponEmplacements(weapon.PORT_GUNS) : undefined,
        STARBOARD_GUNS: weapon.STARBOARD_GUNS ? convertCrewShipWeaponEmplacements(weapon.STARBOARD_GUNS) : undefined,
        ARTILLERY: weapon.ARTILLERY ? convertCrewShipWeaponEmplacements(weapon.ARTILLERY) : undefined,
        SCANNER: weapon.SCANNER ? convertCrewShipWeaponEmplacements(weapon.SCANNER) : undefined
    };
};

const importCrewMemberId = (crewMemberId: ICrewShipMemberClient): ICrewShipMemberDatabase => {
    if (crewMemberId.ItemId) {
        return { ItemId: new Types.ObjectId(fromOid(crewMemberId.ItemId)) };
    }
    return { NemesisFingerprint: BigInt(crewMemberId.NemesisFingerprint ?? 0) };
};

export const importCrewShipMembers = (client: ICrewShipMembersClient): ICrewShipMembersDatabase => {
    return {
        SLOT_A: client.SLOT_A ? importCrewMemberId(client.SLOT_A) : undefined,
        SLOT_B: client.SLOT_B ? importCrewMemberId(client.SLOT_B) : undefined,
        SLOT_C: client.SLOT_C ? importCrewMemberId(client.SLOT_C) : undefined
    };
};

const convertInfestedFoundry = (client: IInfestedFoundryClient): IInfestedFoundryDatabase => {
    return {
        ...client,
        LastConsumedSuit: client.LastConsumedSuit ? convertEquipment(client.LastConsumedSuit) : undefined,
        AbilityOverrideUnlockCooldown: convertOptionalDate(client.AbilityOverrideUnlockCooldown)
    };
};

const convertDialogue = (client: IDialogueClient): IDialogueDatabase => {
    return {
        ...client,
        AvailableDate: fromMongoDate(client.AvailableDate),
        AvailableGiftDate: fromMongoDate(client.AvailableGiftDate),
        RankUpExpiry: fromMongoDate(client.RankUpExpiry),
        BountyChemExpiry: fromMongoDate(client.BountyChemExpiry)
    };
};

const convertDialogueHistory = (client: IDialogueHistoryClient): IDialogueHistoryDatabase => {
    return {
        YearIteration: client.YearIteration,
        Dialogues: client.Dialogues ? client.Dialogues.map(convertDialogue) : undefined
    };
};

const convertKubrowDetails = (client: IKubrowPetDetailsClient): IKubrowPetDetailsDatabase => {
    return {
        ...client,
        HatchDate: fromMongoDate(client.HatchDate)
    };
};

const convertQuestKey = (client: IQuestKeyClient): IQuestKeyDatabase => {
    return {
        ...client,
        CompletionDate: convertOptionalDate(client.CompletionDate)
    };
};

const convertRecentVendorPurchases = (client: IRecentVendorPurchaseClient): IRecentVendorPurchaseDatabase => {
    return {
        ...client,
        PurchaseHistory: client.PurchaseHistory.map(convertPurchaseHistory)
    };
};

const convertPurchaseHistory = (client: IVendorPurchaseHistoryEntryClient): IVendorPurchaseHistoryEntryDatabase => {
    return {
        ...client,
        Expiry: fromMongoDate(client.Expiry)
    };
};

const convertPendingRecipe = (client: IPendingRecipeClient): IPendingRecipeDatabase => {
    return {
        ...client,
        CompletionDate: fromMongoDate(client.CompletionDate),
        KubrowPet: client.TargetItemId ? new Types.ObjectId(client.TargetItemId) : undefined
    };
};

const convertNemesisBase = (client: INemesisBaseClient): INemesisBaseDatabase => {
    return {
        ...client,
        fp: BigInt(client.fp),
        d: fromMongoDate(client.d)
    };
};

const convertNemesis = (client: INemesisClient): INemesisDatabase => {
    return {
        ...client,
        fp: BigInt(client.fp),
        d: fromMongoDate(client.d)
    };
};

// Empty objects from live may have been encoded as empty arrays because of PHP.
const convertItemConfig = <T extends IItemConfig>(client: T): T => {
    return {
        ...client,
        pricol: Array.isArray(client.pricol) ? {} : client.pricol,
        attcol: Array.isArray(client.attcol) ? {} : client.attcol,
        sigcol: Array.isArray(client.sigcol) ? {} : client.sigcol,
        eyecol: Array.isArray(client.eyecol) ? {} : client.eyecol,
        facial: Array.isArray(client.facial) ? {} : client.facial,
        cloth: Array.isArray(client.cloth) ? {} : client.cloth,
        syancol: Array.isArray(client.syancol) ? {} : client.syancol
    };
};

const convertPeriodicMissionCompletion = (
    client: IPeriodicMissionCompletionResponse
): IPeriodicMissionCompletionDatabase => {
    return {
        ...client,
        date: fromMongoDate(client.date)
    };
};

export const importInventory = (db: TInventoryDatabaseDocument, client: Partial<IInventoryClient>): void => {
    for (const key of equipmentKeys) {
        if (client[key] !== undefined) {
            replaceArray<IEquipmentDatabase>(db[key], client[key].map(convertEquipment));
        }
    }
    if (client.OperatorSuits !== undefined) {
        replaceArray<IEquipmentDatabase>(db.OperatorSuits, client.OperatorSuits.map(convertEquipment));
    }
    if (client.WeaponSkins !== undefined) {
        replaceArray<IWeaponSkinDatabase>(db.WeaponSkins, client.WeaponSkins.map(convertWeaponSkin));
    }
    for (const key of ["Upgrades", "CrewShipSalvagedWeaponSkins", "CrewShipWeaponSkins"] as const) {
        if (client[key] !== undefined) {
            replaceArray<IUpgradeDatabase>(db[key], client[key].map(importUpgrade));
        }
    }
    for (const key of [
        "RawUpgrades",
        "MiscItems",
        "Consumables",
        "Recipes",
        "LevelKeys",
        "EmailItems",
        "ShipDecorations",
        "CrewShipAmmo",
        "CrewShipRawSalvage"
    ] as const) {
        if (client[key] !== undefined) {
            db[key].splice(0, db[key].length);
            client[key].forEach(x => {
                db[key].push({
                    ItemType: x.ItemType,
                    ItemCount: x.ItemCount
                });
            });
        }
    }
    for (const key of ["AdultOperatorLoadOuts", "OperatorLoadOuts", "KahlLoadOuts"] as const) {
        if (client[key] !== undefined) {
            replaceArray<IOperatorConfigDatabase>(db[key], client[key].map(convertOperatorConfig));
        }
    }
    for (const key of slotNames) {
        if (client[key] !== undefined) {
            replaceSlots(db[key], client[key]);
        }
    }
    // boolean
    for (const key of [
        "UseAdultOperatorLoadout",
        "HasOwnedVoidProjectionsPreviously",
        "ReceivedStartingGear",
        "ArchwingEnabled",
        "HasResetAccount",
        "PlayedParkourTutorial",
        "MadeStoryModeDecision",
        "Staff",
        "Moderator",
        "Partner",
        "Counselor",
        "Harvestable",
        "DeathSquadable",
        "RetroFastTyping",
        "RetroPlayAllConvos",
        "RetroDisableKissInboxMessage"
    ] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    // number
    for (const key of [
        "PlayerLevel",
        "RegularCredits",
        "PremiumCredits",
        "PremiumCreditsFree",
        "FusionPoints",
        "PrimeTokens",
        "TradesRemaining",
        "GiftsRemaining",
        "ChallengesFixVersion",
        "Founder",
        "Guide",
        "BountyScore",
        "EntratiVaultCountLastPeriod",
        "EntratiLabConquestUnlocked",
        "EntratiLabConquestHardModeStatus",
        "EntratiLabConquestCacheScoreMission",
        "EchoesHexConquestUnlocked",
        "EchoesHexConquestHardModeStatus",
        "EchoesHexConquestCacheScoreMission",
        "RetroWallpaperId",
        "FocusCapacity"
    ] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    // string
    for (const key of [
        "ThemeStyle",
        "ThemeBackground",
        "ThemeSounds",
        "EquippedInstrument",
        "FocusAbility",
        "ActiveQuest",
        "SupportedSyndicate",
        "ActiveAvatarImageType",
        "TitleType"
    ] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    // string[]
    for (const key of [
        "EquippedGear",
        "EquippedEmotes",
        "NodeIntrosCompleted",
        "CompletedAlerts",
        "CompletedSyndicates",
        "DeathMarks",
        "UsedDailyDeals",
        "Wishlist",
        "NemesisAbandonedRewards",
        //"OneTimePurchases", // TODO: Import Antiques
        "EntratiLabConquestActiveFrameVariants",
        "EchoesHexConquestActiveFrameVariants",
        "EchoesHexConquestActiveStickers",
        "ClaimedJunctionChallengeRewards"
    ] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    // IMongoDate
    for (const key of [
        "Created",
        "TrainingDate",
        "BlessingCooldown",
        "LastNemesisAllySpawnTime",
        "NextRefill",
        "EntratiVaultCountResetDate"
    ] as const) {
        if (client[key] !== undefined) {
            db[key] = fromMongoDate(client[key]);
        }
    }
    // IRewardAtten[]
    for (const key of ["SortieRewardAttenuation", "SpecialItemRewardAttenuation"] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    if (client.XPInfo !== undefined) {
        db.XPInfo = client.XPInfo;
    }
    if (client.CurrentLoadOutIds !== undefined) {
        db.CurrentLoadOutIds = client.CurrentLoadOutIds.map(x => new Types.ObjectId(fromOid(x)));
    }
    if (client.Affiliations !== undefined) {
        db.Affiliations = client.Affiliations;
    }
    if (client.FusionTreasures !== undefined) {
        db.HybridFusionTreasures.splice(0, db.HybridFusionTreasures.length);
        migrateFusionTreasures(db, client.FusionTreasures as IFusionTreasure[]);
    }
    if (client.FocusUpgrades !== undefined) {
        db.FocusUpgrades = client.FocusUpgrades;
    }
    if (client.FocusLoadouts !== undefined) {
        db.FocusLoadouts = client.FocusLoadouts.map(convertFocusLoadout);
    }
    if (client.EvolutionProgress !== undefined) {
        db.EvolutionProgress = client.EvolutionProgress;
    }
    if (client.InfestedFoundry !== undefined) {
        db.InfestedFoundry = convertInfestedFoundry(client.InfestedFoundry);
    }
    if (client.DialogueHistory !== undefined) {
        db.DialogueHistory = convertDialogueHistory(client.DialogueHistory);
    }
    if (client.CustomMarkers !== undefined) {
        db.CustomMarkers = client.CustomMarkers;
    }
    if (client.ChallengeProgress !== undefined) {
        db.ChallengeProgress = client.ChallengeProgress;
    }
    if (client.QuestKeys !== undefined) {
        replaceArray<IQuestKeyDatabase>(db.QuestKeys, client.QuestKeys.map(convertQuestKey));
    }
    if (client.LastRegionPlayed !== undefined) {
        db.LastRegionPlayed = client.LastRegionPlayed;
    }
    if (client.RecentVendorPurchases !== undefined) {
        db.RecentVendorPurchases = client.RecentVendorPurchases.map(convertRecentVendorPurchases);
    }
    if (client.PendingRecipes !== undefined) {
        replaceArray<IPendingRecipeDatabase>(db.PendingRecipes, client.PendingRecipes.map(convertPendingRecipe));
    }
    if (client.TauntHistory !== undefined) {
        db.TauntHistory = client.TauntHistory;
    }
    if (client.LoreFragmentScans !== undefined) {
        db.LoreFragmentScans = client.LoreFragmentScans;
        if (!db.receivedThousandYearFishDeco && isEligibleForThousandYearFishDeco(db)) {
            db.receivedThousandYearFishDeco = true;
        }
    }
    for (const key of ["PendingSpectreLoadouts", "SpectreLoadouts"] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    if (client.FocusXP !== undefined) {
        db.FocusXP = client.FocusXP;
    }
    for (const key of ["Alignment", "AlignmentReplay"] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    if (client.StepSequencers !== undefined) {
        replaceArray<IStepSequencerDatabase>(
            db.StepSequencers,
            client.StepSequencers.map(stepSequencer => {
                const { ItemId, ...rest } = stepSequencer;
                return {
                    ...rest,
                    _id: new Types.ObjectId(ItemId.$oid)
                };
            })
        );
    }
    if (client.CompletedJobChains !== undefined) {
        db.CompletedJobChains = client.CompletedJobChains;
    }
    if (client.Nemesis !== undefined) {
        db.Nemesis = convertNemesis(client.Nemesis);
    }
    if (client.NemesisHistory !== undefined) {
        db.NemesisHistory = client.NemesisHistory.map(convertNemesisBase);
    }
    if (client.PlayerSkills !== undefined) {
        db.PlayerSkills = client.PlayerSkills;
    }
    if (client.LotusCustomization !== undefined) {
        db.LotusCustomization = convertItemConfig(client.LotusCustomization);
    }
    if (client.CollectibleSeries !== undefined) {
        db.CollectibleSeries = client.CollectibleSeries;
    }
    for (const key of ["LibraryAvailableDailyTaskInfo", "LibraryActiveDailyTaskInfo"] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
        }
    }
    if (client.SongChallenges !== undefined) {
        db.SongChallenges = client.SongChallenges;
    }
    if (client.Missions !== undefined) {
        db.Missions = client.Missions;
    }
    if (client.PeriodicMissionCompletions !== undefined) {
        db.PeriodicMissionCompletions = client.PeriodicMissionCompletions.map(convertPeriodicMissionCompletion);
    }
    if (client.FlavourItems !== undefined) {
        db.FlavourItems.splice(0, db.FlavourItems.length);
        client.FlavourItems.forEach(x => {
            db.FlavourItems.push({
                ItemType: x.ItemType
            });
        });
    }
    if (client.Accolades !== undefined) {
        db.Accolades = client.Accolades;
    }
    if (client.Boosters !== undefined) {
        replaceArray<IBooster>(db.Boosters, client.Boosters);
    }
    if (client.Settings !== undefined) {
        db.Settings = client.Settings;
    }
    if (client.NokkoColony !== undefined) {
        db.NokkoColony = client.NokkoColony;
    }
    if (client.Sketches !== undefined) {
        db.Sketches = client.Sketches;
    }

    // Final sanity check over data
    for (const pr of db.PendingRecipes) {
        const recipe = getRecipe(pr.ItemType, BL_LATEST);
        if (recipe?.secretIngredientAction == "SIA_CREATE_KUBROW" && !pr.KubrowPet) {
            pr.KubrowPet = db.KubrowPets.find(x => x.Details.Status == eStatus.StatusIncubating)?._id;
            logger.warn(
                `imported recipe ${pr._id.toString()} (${pr.ItemType}) had no TargetItemId; best guess fixup is ${pr.KubrowPet?.toString()}`
            );
        }
    }
};

export const importLoadOutConfig = (client: ILoadoutConfigClient): ILoadoutConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(fromOid(ItemId)),
        s: client.s ? convertEquipmentSelection(client.s) : undefined,
        p: client.p ? convertEquipmentSelection(client.p) : undefined,
        l: client.l ? convertEquipmentSelection(client.l) : undefined,
        m: client.m ? convertEquipmentSelection(client.m) : undefined,
        h: client.h ? convertEquipmentSelection(client.h) : undefined,
        a: client.a ? convertEquipmentSelection(client.a) : undefined
    };
};

export const importLoadOutPresets = (db: ILoadoutDatabase, client: ILoadOutPresets): void => {
    db.NORMAL = client.NORMAL.map(importLoadOutConfig);
    db.SENTINEL = client.SENTINEL.map(importLoadOutConfig);
    db.ARCHWING = client.ARCHWING.map(importLoadOutConfig);
    db.NORMAL_PVP = client.NORMAL_PVP.map(importLoadOutConfig);
    db.LUNARO = client.LUNARO.map(importLoadOutConfig);
    db.OPERATOR = client.OPERATOR.map(importLoadOutConfig);
    db.GEAR = client.GEAR?.map(importLoadOutConfig);
    db.KDRIVE = client.KDRIVE.map(importLoadOutConfig);
    db.DATAKNIFE = client.DATAKNIFE.map(importLoadOutConfig);
    db.MECH = client.MECH.map(importLoadOutConfig);
    db.OPERATOR_ADULT = client.OPERATOR_ADULT.map(importLoadOutConfig);
    db.DRIFTER = client.DRIFTER.map(importLoadOutConfig);
};

export const convertCustomizationInfo = (client: ICustomizationInfoClient): ICustomizationInfoDatabase => {
    return {
        ...client,
        LoadOutPreset: client.LoadOutPreset ? importLoadOutConfig(client.LoadOutPreset) : undefined,
        VehiclePreset: client.VehiclePreset ? importLoadOutConfig(client.VehiclePreset) : undefined
    };
};

const convertDeco = (client: IPlacedDecosClient): IPlacedDecosDatabase => {
    const { id, ...rest } = client;
    return {
        ...rest,
        CustomizationInfo: client.CustomizationInfo ? convertCustomizationInfo(client.CustomizationInfo) : undefined,
        _id: new Types.ObjectId(fromOid(id))
    };
};

const convertRoom = (client: IRoomClient): IRoomDatabase => {
    return {
        ...client,
        PlacedDecos: client.PlacedDecos ? client.PlacedDecos.map(convertDeco) : []
    };
};

const convertShip = (client: IOrbiterClient): IOrbiterDatabase => {
    return {
        ...client,
        ShipInterior: {
            ...client.ShipInterior,
            Colors: typeof client.ShipInterior == "object" ? client.ShipInterior.Colors : undefined
        },
        Rooms: client.Rooms.map(convertRoom),
        FavouriteLoadoutId: client.FavouriteLoadoutId
            ? new Types.ObjectId(fromOid(client.FavouriteLoadoutId))
            : undefined
    };
};

const convertPlant = (client: IPlantClient): IPlantDatabase => {
    return {
        ...client,
        EndTime: fromMongoDate(client.EndTime)
    };
};

const convertPlanter = (client: IPlanterClient): IPlanterDatabase => {
    return {
        ...client,
        Plants: client.Plants.map(convertPlant)
    };
};

const convertFavouriteLoadout = (client: IFavouriteLoadout): IFavouriteLoadoutDatabase => {
    return {
        ...client,
        LoadoutId: new Types.ObjectId(fromOid(client.LoadoutId))
    };
};

const convertApartment = (client: IApartmentClient): IApartmentDatabase => {
    return {
        ...client,
        Rooms: client.Rooms.map(convertRoom),
        Gardening: { Planters: client.Gardening.Planters.map(convertPlanter) },
        FavouriteLoadouts: client.FavouriteLoadouts ? client.FavouriteLoadouts.map(convertFavouriteLoadout) : []
    };
};

const convertTailorShop = (client: ITailorShop): ITailorShopDatabase => {
    return {
        ...client,
        Rooms: client.Rooms.map(convertRoom),
        Colors: Array.isArray(client.Colors) ? {} : client.Colors,
        FavouriteLoadouts: client.FavouriteLoadouts ? client.FavouriteLoadouts.map(convertFavouriteLoadout) : []
    };
};

export const importPersonalRooms = (db: IPersonalRoomsDatabase, client: Partial<IGetShipResponse>): void => {
    if (client.Ship?.Rooms) db.Ship = convertShip(client.Ship);
    if (client.Apartment !== undefined) db.Apartment = convertApartment(client.Apartment);
    if (client.TailorShop !== undefined) db.TailorShop = convertTailorShop(client.TailorShop);
};
