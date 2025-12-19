import { Types } from "mongoose";
import type {
    IItemConfig,
    IOperatorConfigClient,
    IOperatorConfigDatabase
} from "../types/inventoryTypes/commonInventoryTypes.ts";
import type { IMongoDate } from "../types/commonTypes.ts";
import type {
    IBooster,
    IDialogueClient,
    IDialogueDatabase,
    IDialogueHistoryClient,
    IDialogueHistoryDatabase,
    IInfestedFoundryClient,
    IInfestedFoundryDatabase,
    IInventoryClient,
    INemesisClient,
    INemesisDatabase,
    IPendingRecipeClient,
    IPendingRecipeDatabase,
    IQuestKeyClient,
    IQuestKeyDatabase,
    ISlots,
    IUpgradeClient,
    IUpgradeDatabase,
    IWeaponSkinClient,
    IWeaponSkinDatabase
} from "../types/inventoryTypes/inventoryTypes.ts";
import { equipmentKeys } from "../types/inventoryTypes/inventoryTypes.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import type {
    ILoadoutConfigClient,
    ILoadoutConfigDatabase,
    ILoadoutDatabase,
    ILoadOutPresets
} from "../types/saveLoadoutTypes.ts";
import { slotNames } from "../types/purchaseTypes.ts";
import type {
    ICrewShipMemberClient,
    ICrewShipMemberDatabase,
    ICrewShipMembersClient,
    ICrewShipMembersDatabase,
    ICrewShipWeaponClient,
    ICrewShipWeaponDatabase,
    ICrewShipWeaponEmplacementsClient,
    ICrewShipWeaponEmplacementsDatabase,
    IEquipmentClient,
    IEquipmentDatabase,
    IEquipmentSelectionClient,
    IEquipmentSelectionDatabase,
    IKubrowPetDetailsClient,
    IKubrowPetDetailsDatabase
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
import { fromMongoDate } from "../helpers/inventoryHelpers.ts";

const convertDate = (value: IMongoDate): Date => {
    return new Date(parseInt(value.$date.$numberLong));
};

const convertOptionalDate = (value: IMongoDate | undefined): Date | undefined => {
    return value ? convertDate(value) : undefined;
};

const convertEquipment = (client: IEquipmentClient): IEquipmentDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid),
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
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

const convertUpgrade = (client: IUpgradeClient): IUpgradeDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

const convertOperatorConfig = (client: IOperatorConfigClient): IOperatorConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
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
        ItemId: ItemId ? new Types.ObjectId(ItemId.$oid) : undefined
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
        return { ItemId: new Types.ObjectId(crewMemberId.ItemId.$oid) };
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
        AvailableDate: convertDate(client.AvailableDate),
        AvailableGiftDate: convertDate(client.AvailableGiftDate),
        RankUpExpiry: convertDate(client.RankUpExpiry),
        BountyChemExpiry: convertDate(client.BountyChemExpiry)
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
        HatchDate: convertDate(client.HatchDate)
    };
};

const convertQuestKey = (client: IQuestKeyClient): IQuestKeyDatabase => {
    return {
        ...client,
        CompletionDate: convertOptionalDate(client.CompletionDate)
    };
};

const convertPendingRecipe = (client: IPendingRecipeClient): IPendingRecipeDatabase => {
    return {
        ...client,
        CompletionDate: convertDate(client.CompletionDate)
    };
};

const convertNemesis = (client: INemesisClient): INemesisDatabase => {
    return {
        ...client,
        fp: BigInt(client.fp),
        d: convertDate(client.d)
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

export const importInventory = (db: TInventoryDatabaseDocument, client: Partial<IInventoryClient>): void => {
    for (const key of equipmentKeys) {
        if (client[key] !== undefined) {
            replaceArray<IEquipmentDatabase>(db[key], client[key].map(convertEquipment));
        }
    }
    if (client.WeaponSkins !== undefined) {
        replaceArray<IWeaponSkinDatabase>(db.WeaponSkins, client.WeaponSkins.map(convertWeaponSkin));
    }
    for (const key of ["Upgrades", "CrewShipSalvagedWeaponSkins", "CrewShipWeaponSkins"] as const) {
        if (client[key] !== undefined) {
            replaceArray<IUpgradeDatabase>(db[key], client[key].map(convertUpgrade));
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
        "PlayedParkourTutorial",
        "Staff",
        "Moderator",
        "Partner",
        "Counselor",
        "Harvestable",
        "DeathSquadable"
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
        "EchoesHexConquestCacheScoreMission"
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
        "DeathMarks",
        "Wishlist",
        "NemesisAbandonedRewards",
        "EntratiLabConquestActiveFrameVariants",
        "EchoesHexConquestActiveFrameVariants",
        "EchoesHexConquestActiveStickers"
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
        db.CurrentLoadOutIds = client.CurrentLoadOutIds;
    }
    if (client.Affiliations !== undefined) {
        db.Affiliations = client.Affiliations;
    }
    if (client.FusionTreasures !== undefined) {
        db.FusionTreasures = client.FusionTreasures;
    }
    if (client.FocusUpgrades !== undefined) {
        db.FocusUpgrades = client.FocusUpgrades;
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
    if (client.PendingRecipes !== undefined) {
        replaceArray<IPendingRecipeDatabase>(db.PendingRecipes, client.PendingRecipes.map(convertPendingRecipe));
    }
    if (client.TauntHistory !== undefined) {
        db.TauntHistory = client.TauntHistory;
    }
    if (client.LoreFragmentScans !== undefined) {
        db.LoreFragmentScans = client.LoreFragmentScans;
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
        db.StepSequencers = client.StepSequencers;
    }
    if (client.CompletedJobChains !== undefined) {
        db.CompletedJobChains = client.CompletedJobChains;
    }
    if (client.Nemesis !== undefined) {
        db.Nemesis = convertNemesis(client.Nemesis);
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
};

export const importLoadOutConfig = (client: ILoadoutConfigClient): ILoadoutConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid),
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
        _id: new Types.ObjectId(id.$oid)
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
        FavouriteLoadoutId: client.FavouriteLoadoutId ? new Types.ObjectId(client.FavouriteLoadoutId.$oid) : undefined
    };
};

const convertPlant = (client: IPlantClient): IPlantDatabase => {
    return {
        ...client,
        EndTime: convertDate(client.EndTime)
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
        LoadoutId: new Types.ObjectId(client.LoadoutId.$oid)
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
