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
    IPendingRecipe as IPendingRecipeDatabase,
    IPendingRecipeResponse,
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
    IKubrowPetDetailsClient
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

const pendingRecipeSchema = new Schema<IPendingRecipeDatabase>(
    {
        ItemType: String,
        CompletionDate: Date
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
        (returnedObject as IPendingRecipeResponse).CompletionDate = {
            $date: { $numberLong: (returnedObject as IPendingRecipeDatabase).CompletionDate.getTime().toString() }
        };
    }
});

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
        NumCompletions: Number
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

const affiliationsSchema = new Schema<IAffiliation>(
    {
        Initiated: Boolean,
        Standing: Number,
        Title: Number,
        FreeFavorsEarned: { type: [Number], default: undefined },
        FreeFavorsUsed: { type: [Number], default: undefined },
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
    TradingRulesConfirmed: Boolean
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

const questProgressSchema = new Schema<IQuestStage>({
    c: Number,
    i: Boolean,
    m: Boolean,
    b: []
});

const questKeysSchema = new Schema<IQuestKeyDatabase>(
    {
        Progress: { type: [questProgressSchema], default: undefined },
        unlock: Boolean,
        Completed: Boolean,
        //CustomData: Schema.Types.Mixed,
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

const fusionTreasuresSchema = new Schema<IFusionTreasure>().add(typeCountSchema).add({ Sockets: Number });

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
        ItemType: String
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

        client.HatchDate = toMongoDate(db.HatchDate);
    }
});

const EquipmentSchema = new Schema<IEquipmentDatabase>(
    {
        ItemType: String,
        Configs: [ItemConfigSchema],
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
        Details: detailsSchema
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

const inventorySchema = new Schema<IInventoryDatabase, InventoryDocumentProps>(
    {
        accountOwnerId: Schema.Types.ObjectId,
        SubscribedToEmails: Number,
        Created: Date,
        RewardSeed: Number,

        //Credit
        RegularCredits: { type: Number, default: 0 },
        //Platinum
        PremiumCredits: { type: Number, default: 50 },
        //Gift Platinum(Non trade)
        PremiumCreditsFree: { type: Number, default: 50 },
        //Endo
        FusionPoints: { type: Number, default: 0 },
        //Regal Aya
        PrimeTokens: { type: Number, default: 0 },

        //Slots
        SuitBin: { type: slotsBinSchema, default: { Slots: 3 } },
        WeaponBin: { type: slotsBinSchema, default: { Slots: 10 } },
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
        MiscItems: [typeCountSchema],

        //Non Upgrade Mods Example:I have 999 item WeaponElectricityDamageMod (only "ItemCount"+"ItemType")
        RawUpgrades: [RawUpgrades],
        //Upgrade Mods\Riven\Arcane Example:"UpgradeFingerprint"+"ItemType"+""
        Upgrades: [upgradeSchema],

        //The Mandachord(Octavia) is a step sequencer
        StepSequencers: [StepSequencersSchema],

        KubrowPetEggs: [Schema.Types.Mixed],
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
        CrewShipRawSalvage: [Schema.Types.Mixed],

        //Default RailJack
        CrewShipAmmo: [typeCountSchema],
        CrewShipWeapons: [Schema.Types.Mixed],
        CrewShipWeaponSkins: [Schema.Types.Mixed],

        //NPC Crew and weapon
        CrewMembers: [Schema.Types.Mixed],
        CrewShipSalvagedWeaponSkins: [Schema.Types.Mixed],
        CrewShipSalvagedWeapons: [Schema.Types.Mixed],

        //Complete Mission\Quests
        Missions: [Schema.Types.Mixed],
        QuestKeys: [questKeysSchema],
        ActiveQuest: { type: String, default: "/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain" }, //TODO: check after mission starting gear
        //item like DojoKey or Boss missions key
        LevelKeys: [Schema.Types.Mixed],
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
        EmailItems: [TypeXPItemSchema],

        //Profile->Wishlist
        Wishlist: [String],

        //https://warframe.fandom.com/wiki/Alignment
        //like "Alignment": { "Wisdom": 9, "Alignment": 1 },
        Alignment: Schema.Types.Mixed,
        AlignmentReplay: Schema.Types.Mixed,

        //https://warframe.fandom.com/wiki/Sortie
        CompletedSorties: [String],
        LastSortieReward: [Schema.Types.Mixed],

        //Resource_Drone[Uselees stuff]
        Drones: [Schema.Types.Mixed],

        //Active profile ico
        ActiveAvatarImageType: String,

        // open location store like EidolonPlainsDiscoverable or OrbVallisCaveDiscoverable
        DiscoveredMarkers: [Schema.Types.Mixed],
        //Open location mission like "JobId" + "StageCompletions"
        CompletedJobs: [Schema.Types.Mixed],

        //Game mission\ivent score example  "Tag": "WaterFight", "Best": 170, "Count": 1258,
        PersonalGoalProgress: [Schema.Types.Mixed],

        //Setting interface Style
        ThemeStyle: String,
        ThemeBackground: String,
        ThemeSounds: String,

        //Daily LoginRewards
        LoginMilestoneRewards: [String],

        //You first Dialog with NPC or use new Item
        NodeIntrosCompleted: [String],

        //Current guild id, if applicable.
        GuildId: { type: Schema.Types.ObjectId, ref: "Guild" },

        //https://warframe.fandom.com/wiki/Heist
        //ProfitTaker(1-4) Example:"LocationTag": "EudicoHeists", "Jobs":Mission name
        CompletedJobChains: [completedJobChainsSchema],
        //Night Wave Challenge
        SeasonChallengeHistory: [seasonChallengeHistorySchema],

        //Cephalon Simaris Entries Example:"TargetType"+"Scans"(1-10)+"Completed": true|false
        LibraryPersonalProgress: [Schema.Types.Mixed],
        //Cephalon Simaris Daily Task
        LibraryAvailableDailyTaskInfo: Schema.Types.Mixed,

        //https://warframe.fandom.com/wiki/Invasion
        InvasionChainProgress: [Schema.Types.Mixed],

        //CorpusLich or GrineerLich
        NemesisAbandonedRewards: [String],
        //CorpusLich\KuvaLich
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

        NextRefill: Schema.Types.Mixed, // Date, convert to IMongoDate

        //Purchase this new permanent skin from the Lotus customization options in Personal Quarters located in your Orbiter.
        //https://warframe.fandom.com/wiki/Lotus#The_New_War
        LotusCustomization: Schema.Types.Mixed,

        //Progress+Rank+ItemType(ZarimanPumpShotgun)
        //https://warframe.fandom.com/wiki/Incarnon
        EvolutionProgress: { type: [evolutionProgressSchema], default: undefined },

        //Unknown and system
        DuviriInfo: DuviriInfoSchema,
        Mailbox: MailboxSchema,
        HandlerPoints: Number,
        ChallengesFixVersion: Number,
        PlayedParkourTutorial: Boolean,
        SubscribedToEmailsPersonalized: Number,
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
        RecentVendorPurchases: [Schema.Types.Mixed],
        Robotics: [Schema.Types.Mixed],
        UsedDailyDeals: [Schema.Types.Mixed],
        CollectibleSeries: [Schema.Types.Mixed],
        HasResetAccount: { type: Boolean, default: false },

        //Discount Coupon
        PendingCoupon: Schema.Types.Mixed,
        //Like BossAladV,BossCaptainVor come for you on missions % chance
        DeathMarks: [String],
        //Zanuka
        Harvestable: Boolean,
        //Grustag three
        DeathSquadable: Boolean,

        EndlessXP: { type: [endlessXpProgressSchema], default: undefined },

        DialogueHistory: dialogueHistorySchema
    },
    { timestamps: { createdAt: "Created", updatedAt: false } }
);

inventorySchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.accountOwnerId;

        const inventoryDatabase = returnedObject as IInventoryDatabase;
        const inventoryResponse = returnedObject as IInventoryClient;

        inventoryResponse.TrainingDate = toMongoDate(inventoryDatabase.TrainingDate);
        inventoryResponse.Created = toMongoDate(inventoryDatabase.Created);
        if (inventoryDatabase.GuildId) {
            inventoryResponse.GuildId = toOid(inventoryDatabase.GuildId);
        }
        if (inventoryResponse.BlessingCooldown) {
            inventoryResponse.BlessingCooldown = toMongoDate(inventoryDatabase.BlessingCooldown);
        }
    }
});

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
} & { [K in TEquipmentKey]: Types.DocumentArray<IEquipmentDatabase> };

// eslint-disable-next-line @typescript-eslint/ban-types
type InventoryModelType = Model<IInventoryDatabase, {}, InventoryDocumentProps>;

export const Inventory = model<IInventoryDatabase, InventoryModelType>("Inventory", inventorySchema);

// eslint-disable-next-line @typescript-eslint/ban-types
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
