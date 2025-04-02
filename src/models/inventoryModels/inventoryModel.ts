import { Document, HydratedDocument, Model, Schema, Types, model } from "mongoose";
import {
    IFlavourItem,
    IRawUpgrade,
    IMiscItem,
    IInventoryDatabase,
    IBooster,
    IInventoryClient,
    ISlots,
    IMailboxDatabase,
    IDuviriInfo,
    IPendingRecipeDatabase,
    IPendingRecipeClient,
    ITypeCount,
    IFocusXP,
    IFocusUpgrade,
    ITypeXPItem,
    IChallengeProgress,
    IStepSequencer,
    IAffiliation,
    INotePacks,
    ICompletedJobChain,
    ISeasonChallenge,
    IPlayerSkills,
    ISettings,
    IInfestedFoundryDatabase,
    IHelminthResource,
    IMissionDatabase,
    IConsumedSuit,
    IQuestStage,
    IQuestKeyDatabase,
    IQuestKeyClient,
    IFusionTreasure,
    ISpectreLoadout,
    IWeaponSkinDatabase,
    ITaunt,
    IPeriodicMissionCompletionDatabase,
    IPeriodicMissionCompletionResponse,
    ILoreFragmentScan,
    IEvolutionProgress,
    IEndlessXpProgress,
    ICrewShipPortGuns,
    ICrewShipCustomization,
    ICrewShipWeapon,
    ICrewShipPilotWeapon,
    IShipExterior,
    IHelminthFoodRecord,
    ICrewShipMembersDatabase,
    IDialogueHistoryDatabase,
    IDialogueDatabase,
    IDialogueGift,
    ICompletedDialogue,
    IDialogueClient,
    IUpgradeDatabase,
    ICrewShipMemberDatabase,
    ICrewShipMemberClient,
    IMailboxClient,
    TEquipmentKey,
    equipmentKeys,
    IKubrowPetDetailsDatabase,
    ITraits,
    IKubrowPetDetailsClient,
    IKubrowPetEggDatabase,
    IKubrowPetEggClient,
    ICustomMarkers,
    IMarkerInfo,
    IMarker,
    ICalendarProgress,
    IPendingCouponDatabase,
    IPendingCouponClient,
    ILibraryDailyTaskInfo,
    IDroneDatabase,
    IDroneClient,
    IAlignment,
    ICollectibleEntry,
    IIncentiveState,
    ISongChallenge,
    ILibraryPersonalProgress,
    IRecentVendorPurchaseDatabase,
    IVendorPurchaseHistoryEntryDatabase,
    IVendorPurchaseHistoryEntryClient,
    INemesisDatabase,
    INemesisClient,
    IInfNode,
    IDiscoveredMarker,
    IWeeklyMission,
    ILockedWeaponGroupDatabase
} from "../../types/inventoryTypes/inventoryTypes";
import { IOid } from "../../types/commonTypes";
import {
    IAbilityOverride,
    IColor,
    IItemConfig,
    IOperatorConfigDatabase,
    IPolarity,
    IEquipmentDatabase,
    IArchonCrystalUpgrade,
    IEquipmentClient
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { EquipmentSelectionSchema } from "./loadoutModel";

export const typeCountSchema = new Schema<ITypeCount>({ ItemType: String, ItemCount: Number }, { _id: false });

typeCountSchema.set("toJSON", {
    transform(_doc, obj) {
        if (obj.ItemCount > 2147483647) {
            obj.ItemCount = 2147483647;
        } else if (obj.ItemCount < -2147483648) {
            obj.ItemCount = -2147483648;
        }
    }
});

const focusXPSchema = new Schema<IFocusXP>(
    {
        AP_POWER: Number,
        AP_TACTIC: Number,
        AP_DEFENSE: Number,
        AP_ATTACK: Number,
        AP_WARD: Number
    },
    { _id: false }
);

const focusUpgradeSchema = new Schema<IFocusUpgrade>(
    {
        ItemType: String,
        Level: Number,
        IsUniversal: Boolean
    },
    { _id: false }
);

const polaritySchema = new Schema<IPolarity>(
    {
        Slot: Number,
        Value: String
    },
    { _id: false }
);

const abilityOverrideSchema = new Schema<IAbilityOverride>(
    {
        Ability: String,
        Index: Number
    },
    { _id: false }
);

export const colorSchema = new Schema<IColor>(
    {
        t0: Number,
        t1: Number,
        t2: Number,
        t3: Number,
        en: Number,
        e1: Number,
        m0: Number,
        m1: Number
    },
    { _id: false }
);

const operatorConfigSchema = new Schema<IOperatorConfigDatabase>(
    {
        Skins: [String],
        pricol: colorSchema,
        attcol: colorSchema,
        sigcol: colorSchema,
        eyecol: colorSchema,
        facial: colorSchema,
        syancol: colorSchema,
        cloth: colorSchema,
        Upgrades: [String],
        Name: String, // not sure if possible in operator
        ugly: Boolean // not sure if possible in operator
    },
    { id: false }
);

operatorConfigSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

operatorConfigSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

///TODO: clearly seperate the different config schemas. (suit and weapon and so on)
const ItemConfigSchema = new Schema<IItemConfig>(
    {
        Skins: [String],
        pricol: colorSchema,
        attcol: colorSchema,
        sigcol: colorSchema,
        eyecol: colorSchema,
        facial: colorSchema,
        syancol: colorSchema,
        Upgrades: [String],
        Songs: {
            type: [
                {
                    m: String,
                    b: String,
                    p: String,
                    s: String
                }
            ],
            default: undefined
        },
        Name: String,
        AbilityOverride: abilityOverrideSchema,
        PvpUpgrades: [String],
        ugly: Boolean
    },
    { _id: false }
);

ItemConfigSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
    }
});

const ArchonCrystalUpgradeSchema = new Schema<IArchonCrystalUpgrade>(
    {
        UpgradeType: String,
        Color: String
    },
    { _id: false }
);

ArchonCrystalUpgradeSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
    }
});

const boosterSchema = new Schema<IBooster>(
    {
        ExpiryDate: Number,
        ItemType: String
    },
    { _id: false }
);

const RawUpgrades = new Schema<IRawUpgrade>(
    {
        ItemType: String,
        ItemCount: Number
    },
    { id: false }
);

RawUpgrades.virtual("LastAdded").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

RawUpgrades.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const upgradeSchema = new Schema<IUpgradeDatabase>(
    {
        UpgradeFingerprint: String,
        PendingRerollFingerprint: { type: String, required: false },
        ItemType: String
    },
    { id: false }
);

upgradeSchema.virtual("ItemId").get(function () {
    return toOid(this._id);
});

upgradeSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const slotsBinSchema = new Schema<ISlots>(
    {
        Slots: Number,
        Extra: Number
    },
    { _id: false }
);

const FlavourItemSchema = new Schema(
    {
        ItemType: String
    },
    { _id: false }
);

FlavourItemSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const MailboxSchema = new Schema<IMailboxDatabase>(
    {
        LastInboxId: Schema.Types.ObjectId
    },
    { id: false, _id: false }
);

MailboxSchema.set("toJSON", {
    transform(_document, returnedObject) {
        const mailboxDatabase = returnedObject as HydratedDocument<IMailboxDatabase, { __v?: number }>;
        delete mailboxDatabase.__v;
        (returnedObject as IMailboxClient).LastInboxId = toOid(mailboxDatabase.LastInboxId);
    }
});

const DuviriInfoSchema = new Schema<IDuviriInfo>(
    {
        Seed: Number,
        NumCompletions: { type: Number, default: 0 }
    },
    {
        _id: false,
        id: false
    }
);

DuviriInfoSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
    }
});

const TypeXPItemSchema = new Schema<ITypeXPItem>(
    {
        ItemType: String,
        XP: Number
    },
    { _id: false }
);

const droneSchema = new Schema<IDroneDatabase>(
    {
        ItemType: String,
        CurrentHP: Number,
        RepairStart: { type: Date, default: undefined },

        DeployTime: { type: Date, default: undefined },
        System: Number,
        DamageTime: { type: Date, default: undefined },
        PendingDamage: Number,
        ResourceType: String,
        ResourceCount: Number
    },
    { id: false }
);
droneSchema.set("toJSON", {
    virtuals: true,
    transform(_document, obj) {
        const client = obj as IDroneClient;
        const db = obj as IDroneDatabase;

        client.ItemId = toOid(db._id);
        if (db.RepairStart) {
            client.RepairStart = toMongoDate(db.RepairStart);
        }

        delete db.DeployTime;
        delete db.System;
        delete db.DamageTime;
        delete db.PendingDamage;
        delete db.ResourceType;
        delete db.ResourceCount;

        delete obj._id;
        delete obj.__v;
    }
});

const discoveredMarkerSchema = new Schema<IDiscoveredMarker>(
    {
        tag: String,
        discoveryState: [Number]
    },
    { _id: false }
);

const challengeProgressSchema = new Schema<IChallengeProgress>(
    {
        Progress: Number,
        Name: String,
        Completed: [String]
    },
    { _id: false }
);

const notePacksSchema = new Schema<INotePacks>(
    {
        MELODY: String,
        BASS: String,
        PERCUSSION: String
    },
    { _id: false }
);

const StepSequencersSchema = new Schema<IStepSequencer>(
    {
        NotePacks: notePacksSchema,
        FingerPrint: String,
        Name: String
    },
    { id: false }
);

StepSequencersSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

StepSequencersSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const kubrowPetEggSchema = new Schema<IKubrowPetEggDatabase>(
    {
        ItemType: String
    },
    { id: false }
);
kubrowPetEggSchema.set("toJSON", {
    virtuals: true,
    transform(_document, obj) {
        const client = obj as IKubrowPetEggClient;
        const db = obj as IKubrowPetEggDatabase;

        client.ExpirationDate = { $date: { $numberLong: "2000000000000" } };
        client.ItemId = toOid(db._id);

        delete obj._id;
        delete obj.__v;
    }
});

const weeklyMissionSchema = new Schema<IWeeklyMission>(
    {
        MissionIndex: Number,
        CompletedMission: Boolean,
        JobManifest: String,
        Challenges: [String],
        ChallengesReset: Boolean,
        WeekCount: Number
    },
    { _id: false }
);

const affiliationsSchema = new Schema<IAffiliation>(
    {
        Initiated: Boolean,
        Standing: Number,
        Title: Number,
        FreeFavorsEarned: { type: [Number], default: undefined },
        FreeFavorsUsed: { type: [Number], default: undefined },
        WeeklyMissions: { type: [weeklyMissionSchema], default: undefined },
        Tag: String
    },
    { _id: false }
);

const completedJobChainsSchema = new Schema<ICompletedJobChain>(
    {
        LocationTag: String,
        Jobs: [String]
    },
    { _id: false }
);

const seasonChallengeHistorySchema = new Schema<ISeasonChallenge>(
    {
        challenge: String,
        id: String
    },
    { _id: false }
);

//TODO: check whether this is complete
const playerSkillsSchema = new Schema<IPlayerSkills>(
    {
        LPP_SPACE: { type: Number, default: 0 },
        LPS_PILOTING: { type: Number, default: 0 },
        LPS_GUNNERY: { type: Number, default: 0 },
        LPS_TACTICAL: { type: Number, default: 0 },
        LPS_ENGINEERING: { type: Number, default: 0 },
        LPS_COMMAND: { type: Number, default: 0 },
        LPP_DRIFTER: { type: Number, default: 0 },
        LPS_DRIFT_COMBAT: { type: Number, default: 0 },
        LPS_DRIFT_RIDING: { type: Number, default: 0 },
        LPS_DRIFT_OPPORTUNITY: { type: Number, default: 0 },
        LPS_DRIFT_ENDURANCE: { type: Number, default: 0 }
    },
    { _id: false }
);

const settingsSchema = new Schema<ISettings>({
    FriendInvRestriction: String,
    GiftMode: String,
    GuildInvRestriction: String,
    ShowFriendInvNotifications: Boolean,
    TradingRulesConfirmed: Boolean,
    SubscribedToSurveys: Boolean
});

const consumedSchuitsSchema = new Schema<IConsumedSuit>(
    {
        s: String,
        c: colorSchema
    },
    { _id: false }
);

const helminthFoodRecordSchema = new Schema<IHelminthFoodRecord>(
    {
        ItemType: String,
        Date: Number
    },
    { _id: false }
);

const helminthResourceSchema = new Schema<IHelminthResource>(
    {
        ItemType: String,
        Count: Number,
        RecentlyConvertedResources: { type: [helminthFoodRecordSchema], default: undefined }
    },
    { _id: false }
);

const missionSchema = new Schema<IMissionDatabase>(
    {
        Tag: String,
        Completes: { type: Number, default: 0 },
        Tier: { type: Number, required: false }
    },
    { _id: false }
);

const questProgressSchema = new Schema<IQuestStage>(
    {
        c: Number,
        i: Boolean,
        m: Boolean,
        b: []
    },
    { _id: false }
);

const questKeysSchema = new Schema<IQuestKeyDatabase>(
    {
        Progress: { type: [questProgressSchema], default: [] },
        unlock: Boolean,
        Completed: Boolean,
        CustomData: String,
        CompletionDate: Date,
        ItemType: String
    },
    {
        _id: false
    }
);

questKeysSchema.set("toJSON", {
    transform(_doc, ret, _options) {
        const questKeysDatabase = ret as IQuestKeyDatabase;

        if (questKeysDatabase.CompletionDate) {
            (questKeysDatabase as IQuestKeyClient).CompletionDate = toMongoDate(questKeysDatabase.CompletionDate);
        }
    }
});

export const fusionTreasuresSchema = new Schema<IFusionTreasure>().add(typeCountSchema).add({ Sockets: Number });

const spectreLoadoutsSchema = new Schema<ISpectreLoadout>(
    {
        ItemType: String,
        Suits: String,
        LongGuns: String,
        LongGunsModularParts: { type: [String], default: undefined },
        Pistols: String,
        PistolsModularParts: { type: [String], default: undefined },
        Melee: String,
        MeleeModularParts: { type: [String], default: undefined }
    },
    { _id: false }
);

const weaponSkinsSchema = new Schema<IWeaponSkinDatabase>(
    {
        ItemType: String,
        IsNew: Boolean
    },
    { id: false }
);

weaponSkinsSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() };
});

weaponSkinsSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
    }
});

const tauntSchema = new Schema<ITaunt>(
    {
        node: String,
        state: String
    },
    { _id: false }
);

const periodicMissionCompletionsSchema = new Schema<IPeriodicMissionCompletionDatabase>(
    {
        date: Date,
        tag: String,
        count: Number
    },
    { _id: false }
);

periodicMissionCompletionsSchema.set("toJSON", {
    transform(_doc, ret, _options) {
        const periodicMissionCompletionDatabase = ret as IPeriodicMissionCompletionDatabase;

        (periodicMissionCompletionDatabase as unknown as IPeriodicMissionCompletionResponse).date = toMongoDate(
            periodicMissionCompletionDatabase.date
        );
    }
});

const loreFragmentScansSchema = new Schema<ILoreFragmentScan>(
    {
        Progress: Number,
        Region: String,
        ItemType: String
    },
    { _id: false }
);

const evolutionProgressSchema = new Schema<IEvolutionProgress>(
    {
        Progress: Number,
        Rank: Number,
        ItemType: String
    },
    { _id: false }
);

const endlessXpProgressSchema = new Schema<IEndlessXpProgress>(
    {
        Category: String,
        Choices: [String]
    },
    { _id: false }
);

const crewShipPilotWeaponSchema = new Schema<ICrewShipPilotWeapon>(
    {
        PRIMARY_A: EquipmentSelectionSchema,
        SECONDARY_A: EquipmentSelectionSchema
    },
    { _id: false }
);

const crewShipPortGunsSchema = new Schema<ICrewShipPortGuns>(
    {
        PRIMARY_A: EquipmentSelectionSchema
    },
    { _id: false }
);

const crewShipWeaponSchema = new Schema<ICrewShipWeapon>(
    {
        PILOT: crewShipPilotWeaponSchema,
        PORT_GUNS: crewShipPortGunsSchema
    },
    { _id: false }
);

const shipExteriorSchema = new Schema<IShipExterior>(
    {
        SkinFlavourItem: String,
        Colors: colorSchema,
        ShipAttachments: { HOOD_ORNAMENT: String }
    },
    { _id: false }
);

const crewShipCustomizationSchema = new Schema<ICrewShipCustomization>(
    {
        CrewshipInterior: shipExteriorSchema
    },
    { _id: false }
);

const crewShipMemberSchema = new Schema<ICrewShipMemberDatabase>(
    {
        ItemId: { type: Schema.Types.ObjectId, required: false },
        NemesisFingerprint: { type: Number, required: false }
    },
    { _id: false }
);
crewShipMemberSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, obj) {
        const db = obj as ICrewShipMemberDatabase;
        const client = obj as ICrewShipMemberClient;
        if (db.ItemId) {
            client.ItemId = toOid(db.ItemId);
        }
    }
});

const crewShipMembersSchema = new Schema<ICrewShipMembersDatabase>(
    {
        SLOT_A: { type: crewShipMemberSchema, required: false },
        SLOT_B: { type: crewShipMemberSchema, required: false },
        SLOT_C: { type: crewShipMemberSchema, required: false }
    },
    { _id: false }
);

const dialogueGiftSchema = new Schema<IDialogueGift>(
    {
        Item: String,
        GiftedQuantity: Number
    },
    { _id: false }
);

const completedDialogueSchema = new Schema<ICompletedDialogue>(
    {
        Id: { type: String, required: true },
        Booleans: { type: [String], required: true },
        Choices: { type: [Number], required: true }
    },
    { _id: false }
);

const dialogueSchema = new Schema<IDialogueDatabase>(
    {
        Rank: Number,
        Chemistry: Number,
        AvailableDate: Date,
        AvailableGiftDate: Date,
        RankUpExpiry: Date,
        BountyChemExpiry: Date,
        //QueuedDialogues: ???
        Gifts: { type: [dialogueGiftSchema], default: [] },
        Booleans: { type: [String], default: [] },
        Completed: { type: [completedDialogueSchema], default: [] },
        DialogueName: String
    },
    { _id: false }
);
dialogueSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret) {
        const db = ret as IDialogueDatabase;
        const client = ret as IDialogueClient;

        client.AvailableDate = toMongoDate(db.AvailableDate);
        client.AvailableGiftDate = toMongoDate(db.AvailableGiftDate);
        client.RankUpExpiry = toMongoDate(db.RankUpExpiry);
        client.BountyChemExpiry = toMongoDate(db.BountyChemExpiry);
    }
});

const dialogueHistorySchema = new Schema<IDialogueHistoryDatabase>(
    {
        YearIteration: { type: Number, required: true },
        Dialogues: { type: [dialogueSchema], required: false }
    },
    { _id: false }
);

const traitsSchema = new Schema<ITraits>(
    {
        BaseColor: String,
        SecondaryColor: String,
        TertiaryColor: String,
        AccentColor: String,
        EyeColor: String,
        FurPattern: String,
        Personality: String,
        BodyType: String,
        Head: { type: String, required: false },
        Tail: { type: String, required: false }
    },
    { _id: false }
);

const detailsSchema = new Schema<IKubrowPetDetailsDatabase>(
    {
        Name: String,
        IsPuppy: Boolean,
        HasCollar: Boolean,
        PrintsRemaining: Number,
        Status: String,
        HatchDate: Date,
        DominantTraits: traitsSchema,
        RecessiveTraits: traitsSchema,
        IsMale: Boolean,
        Size: Number
    },
    { _id: false }
);

detailsSchema.set("toJSON", {
    transform(_doc, returnedObject) {
        delete returnedObject.__v;

        const db = returnedObject as IKubrowPetDetailsDatabase;
        const client = returnedObject as IKubrowPetDetailsClient;

        if (db.HatchDate) {
            client.HatchDate = toMongoDate(db.HatchDate);
        }
    }
});

const EquipmentSchema = new Schema<IEquipmentDatabase>(
    {
        ItemType: String,
        Configs: { type: [ItemConfigSchema], default: [] },
        UpgradeVer: { type: Number, default: 101 },
        XP: { type: Number, default: 0 },
        Features: Number,
        Polarized: Number,
        Polarity: [polaritySchema],
        FocusLens: String,
        ModSlotPurchases: Number,
        CustomizationSlotPurchases: Number,
        UpgradeType: String,
        UpgradeFingerprint: String,
        ItemName: String,
        InfestationDate: Date,
        InfestationDays: Number,
        InfestationType: String,
        ModularParts: { type: [String], default: undefined },
        UnlockLevel: Number,
        Expiry: Date,
        SkillTree: String,
        OffensiveUpgrade: String,
        DefensiveUpgrade: String,
        UpgradesExpiry: Date,
        ArchonCrystalUpgrades: { type: [ArchonCrystalUpgradeSchema], default: undefined },
        Weapon: crewShipWeaponSchema,
        Customization: crewShipCustomizationSchema,
        RailjackImage: FlavourItemSchema,
        CrewMembers: crewShipMembersSchema,
        Details: detailsSchema,
        IsNew: Boolean
    },
    { id: false }
);

EquipmentSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

EquipmentSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;

        const db = returnedObject as IEquipmentDatabase;
        const client = returnedObject as IEquipmentClient;

        if (db.InfestationDate) {
            client.InfestationDate = toMongoDate(db.InfestationDate);
        }
    }
});

const equipmentFields: Record<string, { type: (typeof EquipmentSchema)[] }> = {};

equipmentKeys.forEach(key => {
    equipmentFields[key] = { type: [EquipmentSchema] };
});

const pendingRecipeSchema = new Schema<IPendingRecipeDatabase>(
    {
        ItemType: String,
        CompletionDate: Date,
        LongGuns: { type: [EquipmentSchema], default: undefined },
        Pistols: { type: [EquipmentSchema], default: undefined },
        Melee: { type: [EquipmentSchema], default: undefined },
        SuitToUnbrand: { type: Schema.Types.ObjectId, default: undefined }
    },
    { id: false }
);

pendingRecipeSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() };
});

pendingRecipeSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.LongGuns;
        delete returnedObject.Pistols;
        delete returnedObject.Melees;
        delete returnedObject.SuitToUnbrand;
        (returnedObject as IPendingRecipeClient).CompletionDate = {
            $date: { $numberLong: (returnedObject as IPendingRecipeDatabase).CompletionDate.getTime().toString() }
        };
    }
});

const infestedFoundrySchema = new Schema<IInfestedFoundryDatabase>(
    {
        Name: String,
        Resources: { type: [helminthResourceSchema], default: undefined },
        Slots: Number,
        XP: Number,
        ConsumedSuits: { type: [consumedSchuitsSchema], default: undefined },
        InvigorationIndex: Number,
        InvigorationSuitOfferings: { type: [String], default: undefined },
        InvigorationsApplied: Number,
        LastConsumedSuit: { type: EquipmentSchema, default: undefined },
        AbilityOverrideUnlockCooldown: Date
    },
    { _id: false }
);

infestedFoundrySchema.set("toJSON", {
    transform(_doc, ret, _options) {
        if (ret.AbilityOverrideUnlockCooldown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            ret.AbilityOverrideUnlockCooldown = toMongoDate(ret.AbilityOverrideUnlockCooldown);
        }
    }
});

const markerSchema = new Schema<IMarker>(
    {
        anchorName: String,
        color: Number,
        label: String,
        x: Number,
        y: Number,
        z: Number,
        showInHud: Boolean
    },
    { _id: false }
);

const markerInfoSchema = new Schema<IMarkerInfo>(
    {
        icon: String,
        markers: [markerSchema]
    },
    { _id: false }
);

const CustomMarkersSchema = new Schema<ICustomMarkers>(
    {
        tag: String,
        markerInfos: [markerInfoSchema]
    },
    { _id: false }
);

const calenderProgressSchema = new Schema<ICalendarProgress>(
    {
        Version: { type: Number, default: 19 },
        Iteration: { type: Number, default: 2 },
        YearProgress: {
            Upgrades: { type: [] }
        },
        SeasonProgress: {
            SeasonType: String,
            LastCompletedDayIdx: { type: Number, default: -1 },
            LastCompletedChallengeDayIdx: { type: Number, default: -1 },
            ActivatedChallenges: []
        }
    },
    { _id: false }
);

const incentiveStateSchema = new Schema<IIncentiveState>(
    {
        threshold: Number,
        complete: Boolean,
        sent: Boolean
    },
    { _id: false }
);

const vendorPurchaseHistoryEntrySchema = new Schema<IVendorPurchaseHistoryEntryDatabase>(
    {
        Expiry: Date,
        NumPurchased: Number,
        ItemId: String
    },
    { _id: false }
);

vendorPurchaseHistoryEntrySchema.set("toJSON", {
    transform(_doc, obj) {
        const db = obj as IVendorPurchaseHistoryEntryDatabase;
        const client = obj as IVendorPurchaseHistoryEntryClient;
        client.Expiry = toMongoDate(db.Expiry);
    }
});

const recentVendorPurchaseSchema = new Schema<IRecentVendorPurchaseDatabase>(
    {
        VendorType: String,
        PurchaseHistory: [vendorPurchaseHistoryEntrySchema]
    },
    { _id: false }
);

const collectibleEntrySchema = new Schema<ICollectibleEntry>(
    {
        CollectibleType: String,
        Count: Number,
        Tracking: String,
        ReqScans: Number,
        IncentiveStates: [incentiveStateSchema]
    },
    { _id: false }
);

const songChallengeSchema = new Schema<ISongChallenge>(
    {
        Song: String,
        Difficulties: [Number]
    },
    { _id: false }
);

const pendingCouponSchema = new Schema<IPendingCouponDatabase>(
    {
        Expiry: { type: Date, default: new Date(0) },
        Discount: { type: Number, default: 0 }
    },
    { _id: false }
);

pendingCouponSchema.set("toJSON", {
    transform(_doc, ret, _options) {
        (ret as IPendingCouponClient).Expiry = toMongoDate((ret as IPendingCouponDatabase).Expiry);
    }
});

const libraryPersonalProgressSchema = new Schema<ILibraryPersonalProgress>(
    {
        TargetType: String,
        Scans: Number,
        Completed: Boolean
    },
    { _id: false }
);

const libraryDailyTaskInfoSchema = new Schema<ILibraryDailyTaskInfo>(
    {
        EnemyTypes: [String],
        EnemyLocTag: String,
        EnemyIcon: String,
        Scans: Number,
        ScansRequired: Number,
        RewardStoreItem: String,
        RewardQuantity: Number,
        RewardStanding: Number
    },
    { _id: false }
);

const infNodeSchema = new Schema<IInfNode>(
    {
        Node: String,
        Influence: Number
    },
    { _id: false }
);

const nemesisSchema = new Schema<INemesisDatabase>(
    {
        fp: BigInt,
        manifest: String,
        KillingSuit: String,
        killingDamageType: Number,
        ShoulderHelmet: String,
        WeaponIdx: Number,
        AgentIdx: Number,
        BirthNode: String,
        Faction: String,
        Rank: Number,
        k: Boolean,
        Traded: Boolean,
        d: Date,
        PrevOwners: Number,
        SecondInCommand: Boolean,
        Weakened: Boolean,
        InfNodes: [infNodeSchema],
        HenchmenKilled: Number,
        HintProgress: Number,
        Hints: [Number],
        GuessHistory: [Number],
        MissionCount: Number,
        LastEnc: Number
    },
    { _id: false }
);

nemesisSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, obj) {
        const db = obj as INemesisDatabase;
        const client = obj as INemesisClient;

        client.d = toMongoDate(db.d);

        delete obj._id;
        delete obj.__v;
    }
});

const alignmentSchema = new Schema<IAlignment>(
    {
        Alignment: Number,
        Wisdom: Number
    },
    { _id: false }
);

const lockedWeaponGroupSchema = new Schema<ILockedWeaponGroupDatabase>(
    {
        s: Schema.Types.ObjectId,
        p: Schema.Types.ObjectId,
        l: Schema.Types.ObjectId,
        m: Schema.Types.ObjectId,
        sn: Schema.Types.ObjectId
    },
    { _id: false }
);

const inventorySchema = new Schema<IInventoryDatabase, InventoryDocumentProps>(
    {
        accountOwnerId: Schema.Types.ObjectId,
        SubscribedToEmails: { type: Number, default: 0 },
        SubscribedToEmailsPersonalized: { type: Number, default: 0 },
        RewardSeed: Number,

        //Credit
        RegularCredits: { type: Number, default: 0 },
        //Platinum
        PremiumCredits: { type: Number, default: 0 },
        //Gift Platinum(Non trade)
        PremiumCreditsFree: { type: Number, default: 0 },
        //Endo
        FusionPoints: { type: Number, default: 0 },
        //Regal Aya
        PrimeTokens: { type: Number, default: 0 },

        //Slots
        SuitBin: { type: slotsBinSchema, default: { Slots: 3 } },
        WeaponBin: { type: slotsBinSchema, default: { Slots: 11 } },
        SentinelBin: { type: slotsBinSchema, default: { Slots: 10 } },
        SpaceSuitBin: { type: slotsBinSchema, default: { Slots: 4 } },
        SpaceWeaponBin: { type: slotsBinSchema, default: { Slots: 4 } },
        PvpBonusLoadoutBin: { type: slotsBinSchema, default: { Slots: 0 } },
        PveBonusLoadoutBin: { type: slotsBinSchema, default: { Slots: 0 } },
        RandomModBin: { type: slotsBinSchema, default: { Slots: 15 } },
        OperatorAmpBin: { type: slotsBinSchema, default: { Slots: 8 } },
        CrewShipSalvageBin: { type: slotsBinSchema, default: { Slots: 8 } },
        MechBin: { type: slotsBinSchema, default: { Slots: 4 } },
        CrewMemberBin: { type: slotsBinSchema, default: { Slots: 3 } },

        ...equipmentFields,

        //How many trades do you have left
        TradesRemaining: { type: Number, default: 0 },
        //How many Gift do you have left*(gift spends the trade)
        GiftsRemaining: { type: Number, default: 8 },
        //Curent trade info Giving or Getting items
        PendingTrades: [Schema.Types.Mixed],

        //Syndicate currently being pledged to.
        SupportedSyndicate: String,
        //Curent Syndicates rank\exp
        Affiliations: [affiliationsSchema],
        //Syndicates Missions complate(Navigation->Syndicate)
        CompletedSyndicates: [String],
        //Daily Syndicates Exp
        DailyAffiliation: { type: Number, default: 16000 },
        DailyAffiliationPvp: { type: Number, default: 16000 },
        DailyAffiliationLibrary: { type: Number, default: 16000 },
        DailyAffiliationCetus: { type: Number, default: 16000 },
        DailyAffiliationQuills: { type: Number, default: 16000 },
        DailyAffiliationSolaris: { type: Number, default: 16000 },
        DailyAffiliationVentkids: { type: Number, default: 16000 },
        DailyAffiliationVox: { type: Number, default: 16000 },
        DailyAffiliationEntrati: { type: Number, default: 16000 },
        DailyAffiliationNecraloid: { type: Number, default: 16000 },
        DailyAffiliationZariman: { type: Number, default: 16000 },
        DailyAffiliationKahl: { type: Number, default: 16000 },
        DailyAffiliationCavia: { type: Number, default: 16000 },
        DailyAffiliationHex: { type: Number, default: 16000 },

        //Daily Focus limit
        DailyFocus: { type: Number, default: 250000 },
        //Focus XP per School
        FocusXP: focusXPSchema,
        //Curent active like Active school focuses is = "Zenurik"
        FocusAbility: String,
        //The treeways of the Focus school.(Active and passive Ability)
        FocusUpgrades: [focusUpgradeSchema],

        //Achievement
        ChallengeProgress: [challengeProgressSchema],

        //Account Item like Ferrite,Form,Kuva etc
        MiscItems: { type: [typeCountSchema], default: [] },
        FoundToday: { type: [typeCountSchema], default: undefined },

        //Non Upgrade Mods Example:I have 999 item WeaponElectricityDamageMod (only "ItemCount"+"ItemType")
        RawUpgrades: [RawUpgrades],
        //Upgrade Mods\Riven\Arcane Example:"UpgradeFingerprint"+"ItemType"+""
        Upgrades: [upgradeSchema],

        //The Mandachord(Octavia) is a step sequencer
        StepSequencers: [StepSequencersSchema],

        KubrowPetEggs: [kubrowPetEggSchema],
        //Prints   Cat(3 Prints)\Kubrow(2 Prints) Pets
        KubrowPetPrints: [Schema.Types.Mixed],

        //Item for EquippedGear example:Scaner,LoadoutTechSummon etc
        Consumables: [typeCountSchema],
        //Weel Emotes+Gear
        EquippedEmotes: [String],
        EquippedGear: [String],
        //Equipped Shawzin
        EquippedInstrument: String,
        ReceivedStartingGear: Boolean,

        ArchwingEnabled: Boolean,
        HasOwnedVoidProjectionsPreviously: Boolean,

        //Use Operator\Drifter
        UseAdultOperatorLoadout: Boolean,
        //Operator
        OperatorLoadOuts: [operatorConfigSchema],
        //Drifter
        AdultOperatorLoadOuts: [operatorConfigSchema],
        // Kahl
        KahlLoadOuts: [operatorConfigSchema],

        //LandingCraft like Liset
        Ships: { type: [Schema.Types.ObjectId], ref: "Ships" },
        // /Lotus/Types/Items/ShipDecos/
        ShipDecorations: [typeCountSchema],

        //Railjack/Components(https://warframe.fandom.com/wiki/Railjack/Components)
        CrewShipRawSalvage: [typeCountSchema],

        //Default RailJack
        CrewShipAmmo: [typeCountSchema],
        CrewShipWeaponSkins: [upgradeSchema],
        CrewShipSalvagedWeaponSkins: [upgradeSchema],

        //RailJack Crew
        CrewMembers: [Schema.Types.Mixed],

        //Complete Mission\Quests
        Missions: [missionSchema],
        QuestKeys: [questKeysSchema],
        ActiveQuest: { type: String, default: "" },
        //item like DojoKey or Boss missions key
        LevelKeys: [typeCountSchema],
        //Active quests
        Quests: [Schema.Types.Mixed],

        //Cosmetics like profile glyphs\Kavasa Prime Kubrow Collar\Game Theme etc
        FlavourItems: [FlavourItemSchema],

        //Mastery Rank*(Need item XPInfo to rank up)
        PlayerLevel: { type: Number, default: 0 },
        //Item Mastery Rank exp
        XPInfo: [TypeXPItemSchema],
        //Mastery Rank next availability
        TrainingDate: { type: Date, default: new Date(0) },

        //you saw last played Region when you opened the star map
        LastRegionPlayed: String,

        //Blueprints for Foundry
        Recipes: [typeCountSchema],
        //Crafting Blueprint(Item Name + CompletionDate)
        PendingRecipes: [pendingRecipeSchema],

        //Skins for Suits, Weapons etc.
        WeaponSkins: [weaponSkinsSchema],

        //Ayatan Item
        FusionTreasures: [fusionTreasuresSchema],
        //only used for Maroo apparently - { "node": "TreasureTutorial", "state": "TS_COMPLETED" }
        TauntHistory: { type: [tauntSchema], default: undefined },

        //noShow2FA,VisitPrimeVault etc
        WebFlags: Schema.Types.Mixed,
        //Id CompletedAlerts
        CompletedAlerts: [String],

        //Warframe\Duviri
        StoryModeChoice: { type: String, default: "WARFRAME" },

        //Alert->Kuva Siphon
        PeriodicMissionCompletions: [periodicMissionCompletionsSchema],

        //Codex->LoreFragment
        LoreFragmentScans: [loreFragmentScansSchema],

        //Resource,Credit,Affinity etc or Bless any boosters
        Boosters: [boosterSchema],
        BlessingCooldown: Date, // Date convert to IMongoDate

        //the color your clan requests like Items/Research/DojoColors/DojoColorPlainsB
        ActiveDojoColorResearch: String,

        SentientSpawnChanceBoosters: Schema.Types.Mixed,

        QualifyingInvasions: [Schema.Types.Mixed],
        FactionScores: [Number],

        // https://warframe.fandom.com/wiki/Specter_(Tenno)
        PendingSpectreLoadouts: { type: [spectreLoadoutsSchema], default: undefined },
        SpectreLoadouts: { type: [spectreLoadoutsSchema], default: undefined },

        //New Quest Email
        EmailItems: [typeCountSchema],

        //Profile->Wishlist
        Wishlist: [String],

        //https://warframe.fandom.com/wiki/Alignment
        //like "Alignment": { "Wisdom": 9, "Alignment": 1 },
        Alignment: alignmentSchema,
        AlignmentReplay: alignmentSchema,

        //https://warframe.fandom.com/wiki/Sortie
        CompletedSorties: [String],
        LastSortieReward: [Schema.Types.Mixed],

        // Resource Extractor Drones
        Drones: [droneSchema],

        //Active profile ico
        ActiveAvatarImageType: { type: String, default: "/Lotus/Types/StoreItems/AvatarImages/AvatarImageDefault" },

        // open location store like EidolonPlainsDiscoverable or OrbVallisCaveDiscoverable
        DiscoveredMarkers: [discoveredMarkerSchema],
        //Open location mission like "JobId" + "StageCompletions"
        CompletedJobs: [Schema.Types.Mixed],

        //Game mission\ivent score example  "Tag": "WaterFight", "Best": 170, "Count": 1258,
        PersonalGoalProgress: [Schema.Types.Mixed],

        //Setting interface Style
        ThemeStyle: String,
        ThemeBackground: String,
        ThemeSounds: String,

        //Daily LoginRewards
        LoginMilestoneRewards: { type: [String], default: [] },

        //You first Dialog with NPC or use new Item
        NodeIntrosCompleted: [String],

        //Current guild id, if applicable.
        GuildId: { type: Schema.Types.ObjectId, ref: "Guild" },

        //https://warframe.fandom.com/wiki/Heist
        //ProfitTaker(1-4) Example:"LocationTag": "EudicoHeists", "Jobs":Mission name
        CompletedJobChains: [completedJobChainsSchema],
        //Night Wave Challenge
        SeasonChallengeHistory: [seasonChallengeHistorySchema],

        LibraryPersonalTarget: String,
        //Cephalon Simaris Entries Example:"TargetType"+"Scans"(1-10)+"Completed": true|false
        LibraryPersonalProgress: { type: [libraryPersonalProgressSchema], default: [] },
        //Cephalon Simaris Daily Task
        LibraryAvailableDailyTaskInfo: libraryDailyTaskInfoSchema,
        LibraryActiveDailyTaskInfo: libraryDailyTaskInfoSchema,

        //https://warframe.fandom.com/wiki/Invasion
        InvasionChainProgress: [Schema.Types.Mixed],

        //CorpusLich or GrineerLich
        NemesisAbandonedRewards: { type: [String], default: [] },
        Nemesis: nemesisSchema,
        NemesisHistory: [Schema.Types.Mixed],
        LastNemesisAllySpawnTime: Schema.Types.Mixed,

        //TradingRulesConfirmed,ShowFriendInvNotifications(Option->Social)
        Settings: settingsSchema,

        //Railjack craft
        //https://warframe.fandom.com/wiki/Rising_Tide
        PersonalTechProjects: [Schema.Types.Mixed],

        //Modulars lvl and exp(Railjack|Duviri)
        //https://warframe.fandom.com/wiki/Intrinsics
        PlayerSkills: { type: playerSkillsSchema, default: {} },

        //TradeBannedUntil data
        TradeBannedUntil: Schema.Types.Mixed,

        //https://warframe.fandom.com/wiki/Helminth
        InfestedFoundry: infestedFoundrySchema,

        NextRefill: { type: Date, default: undefined },

        //Purchase this new permanent skin from the Lotus customization options in Personal Quarters located in your Orbiter.
        //https://warframe.fandom.com/wiki/Lotus#The_New_War
        LotusCustomization: Schema.Types.Mixed,

        //Progress+Rank+ItemType(ZarimanPumpShotgun)
        //https://warframe.fandom.com/wiki/Incarnon
        EvolutionProgress: { type: [evolutionProgressSchema], default: undefined },

        //https://warframe.fandom.com/wiki/Loc-Pin
        CustomMarkers: { type: [CustomMarkersSchema], default: undefined },

        //Unknown and system
        DuviriInfo: DuviriInfoSchema,
        Mailbox: MailboxSchema,
        HandlerPoints: Number,
        ChallengesFixVersion: Number,
        PlayedParkourTutorial: Boolean,
        ActiveLandscapeTraps: [Schema.Types.Mixed],
        RepVotes: [Schema.Types.Mixed],
        LeagueTickets: [Schema.Types.Mixed],
        HasContributedToDojo: Boolean,
        HWIDProtectEnabled: Boolean,
        LoadOutPresets: { type: Schema.Types.ObjectId, ref: "Loadout" },
        CurrentLoadOutIds: [Schema.Types.Mixed],
        RandomUpgradesIdentified: Number,
        BountyScore: Number,
        ChallengeInstanceStates: [Schema.Types.Mixed],
        RecentVendorPurchases: { type: [recentVendorPurchaseSchema], default: undefined },
        Robotics: [Schema.Types.Mixed],
        UsedDailyDeals: [Schema.Types.Mixed],
        CollectibleSeries: { type: [collectibleEntrySchema], default: undefined },
        HasResetAccount: { type: Boolean, default: false },

        //Discount Coupon
        PendingCoupon: pendingCouponSchema,
        //Like BossAladV,BossCaptainVor come for you on missions % chance
        DeathMarks: { type: [String], default: [] },
        //Zanuka
        Harvestable: Boolean,
        //Grustag three
        DeathSquadable: Boolean,

        EndlessXP: { type: [endlessXpProgressSchema], default: undefined },

        DialogueHistory: dialogueHistorySchema,
        CalendarProgress: calenderProgressSchema,

        SongChallenges: { type: [songChallengeSchema], default: undefined },

        // Netracells + Deep Archimedea
        EntratiVaultCountLastPeriod: { type: Number, default: undefined },
        EntratiVaultCountResetDate: { type: Date, default: undefined },
        EntratiLabConquestUnlocked: { type: Number, default: undefined },
        EntratiLabConquestHardModeStatus: { type: Number, default: undefined },
        EntratiLabConquestCacheScoreMission: { type: Number, default: undefined },
        EntratiLabConquestActiveFrameVariants: { type: [String], default: undefined },
        EchoesHexConquestUnlocked: { type: Number, default: undefined },
        EchoesHexConquestHardModeStatus: { type: Number, default: undefined },
        EchoesHexConquestCacheScoreMission: { type: Number, default: undefined },
        EchoesHexConquestActiveFrameVariants: { type: [String], default: undefined },
        EchoesHexConquestActiveStickers: { type: [String], default: undefined },

        // G3 + Zanuka
        BrandedSuits: { type: [Schema.Types.ObjectId], default: undefined },
        LockedWeaponGroup: { type: lockedWeaponGroupSchema, default: undefined }
    },
    { timestamps: { createdAt: "Created", updatedAt: false } }
);

inventorySchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.accountOwnerId;

        const inventoryDatabase = returnedObject as Partial<IInventoryDatabase>;
        const inventoryResponse = returnedObject as IInventoryClient;

        if (inventoryDatabase.TrainingDate) {
            inventoryResponse.TrainingDate = toMongoDate(inventoryDatabase.TrainingDate);
        }
        if (inventoryDatabase.Created) {
            inventoryResponse.Created = toMongoDate(inventoryDatabase.Created);
        }
        if (inventoryDatabase.GuildId) {
            inventoryResponse.GuildId = toOid(inventoryDatabase.GuildId);
        }
        if (inventoryDatabase.BlessingCooldown) {
            inventoryResponse.BlessingCooldown = toMongoDate(inventoryDatabase.BlessingCooldown);
        }
        if (inventoryDatabase.NextRefill) {
            inventoryResponse.NextRefill = toMongoDate(inventoryDatabase.NextRefill);
        }
        if (inventoryDatabase.EntratiVaultCountResetDate) {
            inventoryResponse.EntratiVaultCountResetDate = toMongoDate(inventoryDatabase.EntratiVaultCountResetDate);
        }
        if (inventoryDatabase.BrandedSuits) {
            inventoryResponse.BrandedSuits = inventoryDatabase.BrandedSuits.map(toOid);
        }
        if (inventoryDatabase.LockedWeaponGroup) {
            inventoryResponse.LockedWeaponGroup = {
                s: toOid(inventoryDatabase.LockedWeaponGroup.s),
                l: inventoryDatabase.LockedWeaponGroup.l ? toOid(inventoryDatabase.LockedWeaponGroup.l) : undefined,
                p: inventoryDatabase.LockedWeaponGroup.p ? toOid(inventoryDatabase.LockedWeaponGroup.p) : undefined,
                m: inventoryDatabase.LockedWeaponGroup.m ? toOid(inventoryDatabase.LockedWeaponGroup.m) : undefined,
                sn: inventoryDatabase.LockedWeaponGroup.sn ? toOid(inventoryDatabase.LockedWeaponGroup.sn) : undefined
            };
        }
    }
});

inventorySchema.index({ accountOwnerId: 1 }, { unique: true });

// type overwrites for subdocuments/subdocument arrays
export type InventoryDocumentProps = {
    FlavourItems: Types.DocumentArray<IFlavourItem>;
    RawUpgrades: Types.DocumentArray<IRawUpgrade>;
    Upgrades: Types.DocumentArray<IUpgradeDatabase>;
    MiscItems: Types.DocumentArray<IMiscItem>;
    Boosters: Types.DocumentArray<IBooster>;
    OperatorLoadOuts: Types.DocumentArray<IOperatorConfigDatabase>;
    AdultOperatorLoadOuts: Types.DocumentArray<IOperatorConfigDatabase>;
    KahlLoadOuts: Types.DocumentArray<IOperatorConfigDatabase>;
    PendingRecipes: Types.DocumentArray<IPendingRecipeDatabase>;
    WeaponSkins: Types.DocumentArray<IWeaponSkinDatabase>;
    QuestKeys: Types.DocumentArray<IQuestKeyDatabase>;
    Drones: Types.DocumentArray<IDroneDatabase>;
    CrewShipWeaponSkins: Types.DocumentArray<IUpgradeDatabase>;
    CrewShipSalvagedWeaponsSkins: Types.DocumentArray<IUpgradeDatabase>;
} & { [K in TEquipmentKey]: Types.DocumentArray<IEquipmentDatabase> };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type InventoryModelType = Model<IInventoryDatabase, {}, InventoryDocumentProps>;

export const Inventory = model<IInventoryDatabase, InventoryModelType>("Inventory", inventorySchema);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TInventoryDatabaseDocument = Document<unknown, {}, IInventoryDatabase> &
    Omit<
        IInventoryDatabase & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        },
        keyof InventoryDocumentProps
    > &
    InventoryDocumentProps;
