import { Types } from "mongoose";
import {
    IItemConfig,
    IOperatorConfigClient,
    IOperatorConfigDatabase
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IMongoDate } from "@/src/types/commonTypes";
import {
    equipmentKeys,
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
} from "@/src/types/inventoryTypes/inventoryTypes";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import {
    ILoadoutConfigClient,
    ILoadoutConfigDatabase,
    ILoadoutDatabase,
    ILoadOutPresets
} from "@/src/types/saveLoadoutTypes";
import { slotNames } from "@/src/types/purchaseTypes";
import {
    ICrewShipMemberClient,
    ICrewShipMemberDatabase,
    ICrewShipMembersClient,
    ICrewShipMembersDatabase,
    IEquipmentClient,
    IEquipmentDatabase,
    IKubrowPetDetailsClient,
    IKubrowPetDetailsDatabase
} from "@/src/types/equipmentTypes";
import {
    IApartmentClient,
    IApartmentDatabase,
    IFavouriteLoadout,
    IFavouriteLoadoutDatabase,
    IGetShipResponse,
    IOrbiterClient,
    IOrbiterDatabase,
    IPersonalRoomsDatabase,
    IPlantClient,
    IPlantDatabase,
    IPlanterClient,
    IPlanterDatabase,
    ITailorShop,
    ITailorShopDatabase
} from "@/src/types/personalRoomsTypes";

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
        CrewMembers: client.CrewMembers ? convertCrewShipMembers(client.CrewMembers) : undefined,
        Details: client.Details ? convertKubrowDetails(client.Details) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        Configs: client.Configs
            ? client.Configs.map(obj =>
                  Object.fromEntries(
                      Object.entries(obj).filter(([_, value]) => !Array.isArray(value) || value.length > 0)
                  )
              )
            : []
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

export const importCrewMemberId = (crewMemberId: ICrewShipMemberClient): ICrewShipMemberDatabase => {
    if (crewMemberId.ItemId) {
        return { ItemId: new Types.ObjectId(crewMemberId.ItemId.$oid) };
    }
    return { NemesisFingerprint: BigInt(crewMemberId.NemesisFingerprint ?? 0) };
};

const convertCrewShipMembers = (client: ICrewShipMembersClient): ICrewShipMembersDatabase => {
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
        "Counselor"
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
        "Guide"
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
        "ActiveAvatarImageType"
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
        "NemesisAbandonedRewards"
    ] as const) {
        if (client[key] !== undefined) {
            db[key] = client[key];
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
};

const convertLoadOutConfig = (client: ILoadoutConfigClient): ILoadoutConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

export const importLoadOutPresets = (db: ILoadoutDatabase, client: ILoadOutPresets): void => {
    db.NORMAL = client.NORMAL.map(convertLoadOutConfig);
    db.SENTINEL = client.SENTINEL.map(convertLoadOutConfig);
    db.ARCHWING = client.ARCHWING.map(convertLoadOutConfig);
    db.NORMAL_PVP = client.NORMAL_PVP.map(convertLoadOutConfig);
    db.LUNARO = client.LUNARO.map(convertLoadOutConfig);
    db.OPERATOR = client.OPERATOR.map(convertLoadOutConfig);
    db.GEAR = client.GEAR.map(convertLoadOutConfig);
    db.KDRIVE = client.KDRIVE.map(convertLoadOutConfig);
    db.DATAKNIFE = client.DATAKNIFE.map(convertLoadOutConfig);
    db.MECH = client.MECH.map(convertLoadOutConfig);
    db.OPERATOR_ADULT = client.OPERATOR_ADULT.map(convertLoadOutConfig);
    db.DRIFTER = client.DRIFTER.map(convertLoadOutConfig);
};

const convertShip = (client: IOrbiterClient): IOrbiterDatabase => {
    return {
        ...client,
        ShipInterior: {
            ...client.ShipInterior,
            Colors: Array.isArray(client.ShipInterior.Colors) ? {} : client.ShipInterior.Colors
        },
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
        Gardening: { Planters: client.Gardening.Planters.map(convertPlanter) },
        FavouriteLoadouts: client.FavouriteLoadouts ? client.FavouriteLoadouts.map(convertFavouriteLoadout) : []
    };
};

const convertTailorShop = (client: ITailorShop): ITailorShopDatabase => {
    return {
        ...client,
        Colors: Array.isArray(client.Colors) ? {} : client.Colors,
        FavouriteLoadouts: client.FavouriteLoadouts ? client.FavouriteLoadouts.map(convertFavouriteLoadout) : []
    };
};

export const importPersonalRooms = (db: IPersonalRoomsDatabase, client: Partial<IGetShipResponse>): void => {
    if (client.Ship !== undefined) db.Ship = convertShip(client.Ship);
    if (client.Apartment !== undefined) db.Apartment = convertApartment(client.Apartment);
    if (client.TailorShop !== undefined) db.TailorShop = convertTailorShop(client.TailorShop);
};
