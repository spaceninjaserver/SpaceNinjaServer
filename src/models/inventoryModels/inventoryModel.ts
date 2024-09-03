import { Model, Schema, Types, model } from "mongoose";
import {
    IFlavourItem,
    IRawUpgrade,
    ICrewShipSalvagedWeaponSkin,
    IMiscItem,
    IInventoryDatabase,
    IBooster,
    IInventoryResponse,
    ISlots,
    IMailbox,
    IDuviriInfo,
    IPendingRecipe as IPendingRecipeDatabase,
    IPendingRecipeResponse,
    ITypeCount,
    ITypeXPItem,
    IChallengeProgress,
    IStepSequencer,
    INotePacks,
    IPlayerSkills,
    ISettings,
    IQuestProgress,
    IQuestKeyDatabase,
    IQuestKeyResponse,
    IWeaponSkinDatabase,
    IPeriodicMissionCompletionDatabase,
    IPeriodicMissionCompletionResponse
} from "../../types/inventoryTypes/inventoryTypes";
import { IOid } from "../../types/commonTypes";
import {
    IAbilityOverride,
    IColor,
    IItemConfig,
    IOperatorConfigDatabase,
    IPolarity,
    IEquipmentDatabase,
    IOperatorConfigClient,
    IArchonCrystalUpgrade
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";

const typeCountSchema = new Schema<ITypeCount>({ ItemType: String, ItemCount: Number }, { _id: false });

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

const abilityOverrideSchema = new Schema<IAbilityOverride>({
    Ability: String,
    Index: Number
});
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

const EquipmentSchema = new Schema<IEquipmentDatabase>(
    {
        ItemType: String,
        Configs: [ItemConfigSchema],
        UpgradeVer: Number,
        XP: Number,
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
        ArchonCrystalUpgrades: { type: [ArchonCrystalUpgradeSchema], default: undefined }
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

//TODO: find out what this is
const upgradesSchema = new Schema(
    {
        UpgradeFingerprint: String,
        ItemType: String
    },
    { id: false }
);

upgradesSchema.virtual("ItemId").get(function () {
    return toOid(this._id);
});

upgradesSchema.set("toJSON", {
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

//  "Mailbox": { "LastInboxId": { "$oid": "123456780000000000000000" } }
const MailboxSchema = new Schema<IMailbox>(
    {
        LastInboxId: {
            type: Schema.Types.ObjectId,
            set: (v: IMailbox["LastInboxId"]) => v.$oid.toString()
        }
    },
    { id: false, _id: false }
);

MailboxSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
        //TODO: there is a lot of any here
        returnedObject.LastInboxId = toOid(returnedObject.LastInboxId as Types.ObjectId);
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

//TODO: check whether this is complete
const playerSkillsSchema = new Schema<IPlayerSkills>(
    {
        LPP_SPACE: Number,
        LPP_DRIFTER: Number,
        LPS_NONE: Number,
        LPS_PILOTING: Number,
        LPS_GUNNERY: Number,
        LPS_TACTICAL: Number,
        LPS_ENGINEERING: Number,
        LPS_COMMAND: Number,
        LPS_DRIFT_COMBAT: Number,
        LPS_DRIFT_RIDING: Number,
        LPS_DRIFT_OPPORTUNITY: Number,
        LPS_DRIFT_ENDURANCE: Number
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

const questProgressSchema = new Schema<IQuestProgress>({
    c: Number,
    i: Boolean,
    m: Boolean,
    b: []
});

const questKeysSchema = new Schema<IQuestKeyDatabase>(
    {
        Progress: [questProgressSchema],
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
            (questKeysDatabase as IQuestKeyResponse).CompletionDate = toMongoDate(questKeysDatabase.CompletionDate);
        }
    }
});

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

const inventorySchema = new Schema<IInventoryDatabase, InventoryDocumentProps>(
    {
        accountOwnerId: Schema.Types.ObjectId,
        SubscribedToEmails: Number,
        Created: Date,
        RewardSeed: Number,

        //Credit
        RegularCredits: Number,
        //Platinum
        PremiumCredits: Number,

        //Slots
        SuitBin: slotsBinSchema,
        WeaponBin: slotsBinSchema,
        SentinelBin: slotsBinSchema,
        RandomModBin: slotsBinSchema,
        MechBin: slotsBinSchema,

        //Achievement
        ChallengeProgress: [challengeProgressSchema],

        //Account Item like Ferrite,Form,Kuva etc
        MiscItems: [typeCountSchema],

        //Upgrade Mods\Riven\Arcane Example:"UpgradeFingerprint"+"ItemType"+""
        Upgrades: [upgradesSchema],

        //Warframe
        Suits: [EquipmentSchema],
        //Primary    Weapon
        LongGuns: [EquipmentSchema],
        //Secondary  Weapon
        Pistols: [EquipmentSchema],
        //Melee      Weapon
        Melee: [EquipmentSchema],
        //Ability Weapon like Ultimate Mech\Excalibur\Ivara etc
        SpecialItems: [EquipmentSchema],
        //The Mandachord(Octavia) is a step sequencer
        StepSequencers: [StepSequencersSchema],

        //Sentinel(like Helios or modular)
        Sentinels: [EquipmentSchema],
        //Any /Sentinels/SentinelWeapons/ (like warframe weapon)
        SentinelWeapons: [Schema.Types.Mixed],

        //Item for EquippedGear example:Scaner,LoadoutTechSummon etc
        Consumables: [typeCountSchema],
        //Weel Emotes+Gear
        //Equipped Shawzin
        ReceivedStartingGear: Boolean,

        //Complete Mission
        Missions: [Schema.Types.Mixed],

        //Cosmetics like profile glyphs\Kavasa Prime Kubrow Collar\Game Theme etc
        FlavourItems: [FlavourItemSchema],

        //Mastery Rank*(Need item XPInfo to rank up)
        PlayerLevel: Number,
        //Item Mastery Rank exp
        XPInfo: [TypeXPItemSchema],
        //Mastery Rank next availability
        TrainingDate: Date,

        //Blueprints for Foundry
        Recipes: [typeCountSchema],
        //Crafting Blueprint(Item Name + CompletionDate)
        PendingRecipes: [pendingRecipeSchema],

        //Skins for Suits, Weapons etc.
        WeaponSkins: [weaponSkinsSchema],

        //noShow2FA,VisitPrimeVault etc
        WebFlags: Schema.Types.Mixed,
        //Id CompletedAlerts
        CompletedAlerts: [String],

        //Resource,Credit,Affinity etc or Bless any boosters
        Boosters: [boosterSchema],

        //New Quest Email
        EmailItems: [TypeXPItemSchema],

        //https://warframe.fandom.com/wiki/Alignment
        //like "Alignment": { "Wisdom": 9, "Alignment": 1 },
        Alignment: Schema.Types.Mixed,
        AlignmentReplay: Schema.Types.Mixed,

        //Active profile ico
        ActiveAvatarImageType: String,

        //You first Dialog with NPC or use new Item
        NodeIntrosCompleted: [String],

        //Current guild id, if applicable.
        GuildId: { type: Schema.Types.ObjectId, ref: "Guild" },

        //TradingRulesConfirmed,ShowFriendInvNotifications(Option->Social)
        Settings: settingsSchema,

        //Modulars lvl and exp(Railjack|Duviri)
        //https://warframe.fandom.com/wiki/Intrinsics
        PlayerSkills: playerSkillsSchema,

        //TradeBannedUntil data
        TradeBannedUntil: Schema.Types.Mixed,

        //Unknown and system
        Mailbox: MailboxSchema,
        HandlerPoints: Number,
        ChallengesFixVersion: Number,
        PlayedParkourTutorial: Boolean,
        SubscribedToEmailsPersonalized: Number,
        LastInventorySync: Schema.Types.Mixed,
        Robotics: [Schema.Types.Mixed],
        HasResetAccount: Boolean,

        //Discount Coupon
        PendingCoupon: Schema.Types.Mixed,
        //Like BossAladV,BossCaptainVor come for you on missions % chance
        DeathMarks: [String],
        //Zanuka
        Harvestable: Boolean,
        //Grustag three
        DeathSquadable: Boolean
    },
    { timestamps: { createdAt: "Created" } }
);

inventorySchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;

        const inventoryDatabase = returnedObject as IInventoryDatabase;
        const inventoryResponse = returnedObject as IInventoryResponse;

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
type InventoryDocumentProps = {
    Suits: Types.DocumentArray<IEquipmentDatabase>;
    LongGuns: Types.DocumentArray<IEquipmentDatabase>;
    Pistols: Types.DocumentArray<IEquipmentDatabase>;
    Melee: Types.DocumentArray<IEquipmentDatabase>;
    OperatorAmps: Types.DocumentArray<IEquipmentDatabase>;
    FlavourItems: Types.DocumentArray<IFlavourItem>;
    RawUpgrades: Types.DocumentArray<IRawUpgrade>;
    Upgrades: Types.DocumentArray<ICrewShipSalvagedWeaponSkin>;
    MiscItems: Types.DocumentArray<IMiscItem>;
    Boosters: Types.DocumentArray<IBooster>;
    OperatorLoadOuts: Types.DocumentArray<IOperatorConfigClient>;
    SpecialItems: Types.DocumentArray<IEquipmentDatabase>;
    AdultOperatorLoadOuts: Types.DocumentArray<IOperatorConfigClient>; //TODO: this should still contain _id
    MechSuits: Types.DocumentArray<IEquipmentDatabase>;
    Scoops: Types.DocumentArray<IEquipmentDatabase>;
    DataKnives: Types.DocumentArray<IEquipmentDatabase>;
    DrifterMelee: Types.DocumentArray<IEquipmentDatabase>;
    Sentinels: Types.DocumentArray<IEquipmentDatabase>;
    Horses: Types.DocumentArray<IEquipmentDatabase>;
    PendingRecipes: Types.DocumentArray<IPendingRecipeDatabase>;
    SpaceSuits: Types.DocumentArray<IEquipmentDatabase>;
    SpaceGuns: Types.DocumentArray<IEquipmentDatabase>;
    SpaceMelee: Types.DocumentArray<IEquipmentDatabase>;
    SentinelWeapons: Types.DocumentArray<IEquipmentDatabase>;
    Hoverboards: Types.DocumentArray<IEquipmentDatabase>;
    MoaPets: Types.DocumentArray<IEquipmentDatabase>;
    WeaponSkins: Types.DocumentArray<IWeaponSkinDatabase>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type InventoryModelType = Model<IInventoryDatabase, {}, InventoryDocumentProps>;

export const Inventory = model<IInventoryDatabase, InventoryModelType>("Inventory", inventorySchema);
