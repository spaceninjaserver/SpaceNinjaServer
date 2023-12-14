import { Model, Schema, Types, model } from "mongoose";
import {
    IFlavourItem,
    IRawUpgrade,
    IMiscItem,
    IInventoryDatabase,
    IBooster,
    IInventoryResponse,
    IInventoryDatabaseDocument,
    ISlots,
    IGenericItem,
    IMailbox,
    IDuviriInfo
} from "../../types/inventoryTypes/inventoryTypes";
import { IMongoDate, IOid } from "../../types/commonTypes";
import { ISuitDatabase } from "@/src/types/inventoryTypes/SuitTypes";
import { IWeaponDatabase } from "@/src/types/inventoryTypes/weaponTypes";
import {
    IAbilityOverride,
    IColor,
    IItemConfig,
    IOperatorConfigClient,
    IOperatorConfigDatabase,
    IPolarity
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { toOid } from "@/src/helpers/inventoryHelpers";

const polaritySchema = new Schema<IPolarity>({
    Slot: Number,
    Value: String
});

const abilityOverrideSchema = new Schema<IAbilityOverride>({
    Ability: String,
    Index: Number
});
const colorSchema = new Schema<IColor>(
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
        Songs: [
            {
                m: String,
                b: String,
                p: String,
                s: String
            }
        ],
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

//TODO: migrate to one schema for weapons and suits.. and possibly others
const WeaponSchema = new Schema<IWeaponDatabase>(
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
        UpgradeType: Schema.Types.Mixed, //todo
        UpgradeFingerprint: String,
        ItemName: String,
        ModularParts: [String],
        UnlockLevel: Number
    },
    { id: false }
);

WeaponSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

WeaponSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const BoosterSchema = new Schema<IBooster>({
    ExpiryDate: Number,
    ItemType: String
});

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
const Upgrade = new Schema({
    UpgradeFingerprint: String,
    ItemType: String
});

Upgrade.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

Upgrade.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

//TODO: reduce weapon and suit schemas to one schema if reasonable
const suitSchema = new Schema<ISuitDatabase>(
    {
        ItemType: String,
        Configs: [ItemConfigSchema],
        UpgradeVer: Number,
        XP: Number,
        InfestationDate: Date,
        Features: Number,
        Polarity: [polaritySchema],
        Polarized: Number,
        ModSlotPurchases: Number,
        FocusLens: String,
        UnlockLevel: Number
    },
    { id: false }
);

suitSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

suitSchema.set("toJSON", {
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

const GenericItemSchema = new Schema<IGenericItem>(
    {
        ItemType: String,
        Configs: [ItemConfigSchema],
        UpgradeVer: Number //this is probably just __v
    },
    { id: false }
);

GenericItemSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

GenericItemSchema.set("toJSON", {
    virtuals: true,
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

const inventorySchema = new Schema<IInventoryDatabase, InventoryDocumentProps>({
    Horses: [GenericItemSchema],
    DrifterMelee: [GenericItemSchema],
    DrifterGuns: [GenericItemSchema],
    DuviriInfo: DuviriInfoSchema,
    Mailbox: MailboxSchema,
    KahlLoadOuts: [Schema.Types.Mixed],
    accountOwnerId: Schema.Types.ObjectId,
    SubscribedToEmails: Number,
    Created: Schema.Types.Mixed,
    RewardSeed: Number,
    RegularCredits: Number,
    PremiumCredits: Number,
    PremiumCreditsFree: Number,
    FusionPoints: Number,
    SuitBin: slotsBinSchema,
    WeaponBin: slotsBinSchema,
    SentinelBin: slotsBinSchema,
    SpaceSuitBin: slotsBinSchema,
    SpaceWeaponBin: slotsBinSchema,
    PvpBonusLoadoutBin: slotsBinSchema,
    PveBonusLoadoutBin: slotsBinSchema,
    RandomModBin: slotsBinSchema,
    OperatorAmpBin: slotsBinSchema,
    CrewShipSalvageBin: slotsBinSchema,
    MechBin: slotsBinSchema,
    CrewMemberBin: slotsBinSchema,
    TradesRemaining: Number,
    DailyAffiliation: Number,
    DailyAffiliationPvp: Number,
    DailyAffiliationLibrary: Number,
    DailyFocus: Number,
    GiftsRemaining: Number,
    HandlerPoints: Number,
    MiscItems: [Schema.Types.Mixed],
    ChallengesFixVersion: Number,
    ChallengeProgress: [Schema.Types.Mixed],
    RawUpgrades: [RawUpgrades],
    ReceivedStartingGear: Boolean,
    Suits: [suitSchema],
    LongGuns: [WeaponSchema],
    Pistols: [WeaponSchema],
    Melee: [WeaponSchema],
    Ships: [Schema.Types.Mixed],
    QuestKeys: [Schema.Types.Mixed],
    FlavourItems: [FlavourItemSchema],
    Scoops: [GenericItemSchema],
    TrainingRetriesLeft: Number,
    LoadOutPresets: { type: Schema.Types.ObjectId, ref: "Loadout" },
    CurrentLoadOutIds: [Schema.Types.Mixed],
    Missions: [Schema.Types.Mixed],
    RandomUpgradesIdentified: Number,
    LastRegionPlayed: String,
    XPInfo: [Schema.Types.Mixed],
    Recipes: [Schema.Types.Mixed],
    WeaponSkins: [Schema.Types.Mixed],
    PendingRecipes: [Schema.Types.Mixed],
    TrainingDate: Date,
    PlayerLevel: Number,
    Upgrades: [Upgrade],
    EquippedGear: [String],
    DeathMarks: [String],
    FusionTreasures: [Schema.Types.Mixed],
    WebFlags: Schema.Types.Mixed,
    CompletedAlerts: [String],
    Consumables: [Schema.Types.Mixed],
    LevelKeys: [Schema.Types.Mixed],
    TauntHistory: [Schema.Types.Mixed],
    StoryModeChoice: String,
    PeriodicMissionCompletions: [Schema.Types.Mixed],
    KubrowPetEggs: [Schema.Types.Mixed],
    LoreFragmentScans: [Schema.Types.Mixed],
    EquippedEmotes: [String],
    PendingTrades: [Schema.Types.Mixed],
    Boosters: [BoosterSchema],
    ActiveDojoColorResearch: String,
    SentientSpawnChanceBoosters: Schema.Types.Mixed,
    Affiliations: [Schema.Types.Mixed],
    QualifyingInvasions: [Schema.Types.Mixed],
    FactionScores: [Number],
    SpaceSuits: [GenericItemSchema],
    SpaceMelee: [GenericItemSchema],
    SpaceGuns: [Schema.Types.Mixed],
    ArchwingEnabled: Boolean,
    PendingSpectreLoadouts: [Schema.Types.Mixed],
    SpectreLoadouts: [Schema.Types.Mixed],
    Sentinels: [WeaponSchema],
    SentinelWeapons: [WeaponSchema],
    EmailItems: [Schema.Types.Mixed],
    CompletedSyndicates: [String],
    FocusXP: Schema.Types.Mixed,
    Wishlist: [String],
    Alignment: Schema.Types.Mixed,
    CompletedSorties: [String],
    LastSortieReward: [Schema.Types.Mixed],
    Drones: [Schema.Types.Mixed],
    StepSequencers: [Schema.Types.Mixed],
    ActiveAvatarImageType: String,
    KubrowPets: [Schema.Types.Mixed],
    ShipDecorations: [Schema.Types.Mixed],
    DailyAffiliationCetus: Number,
    DailyAffiliationQuills: Number,
    DiscoveredMarkers: [Schema.Types.Mixed],
    CompletedJobs: [Schema.Types.Mixed],
    FocusAbility: String,
    FocusUpgrades: [Schema.Types.Mixed],
    OperatorAmps: [Schema.Types.Mixed],
    HasContributedToDojo: Boolean,
    HWIDProtectEnabled: Boolean,
    KubrowPetPrints: [Schema.Types.Mixed],
    AlignmentReplay: Schema.Types.Mixed,
    PersonalGoalProgress: [Schema.Types.Mixed],
    DailyAffiliationSolaris: Number,
    SpecialItems: [Schema.Types.Mixed],
    ThemeStyle: String,
    ThemeBackground: String,
    ThemeSounds: String,
    BountyScore: Number,
    ChallengeInstanceStates: [Schema.Types.Mixed],
    LoginMilestoneRewards: [String],
    OperatorLoadOuts: [operatorConfigSchema],
    DailyAffiliationVentkids: Number,
    DailyAffiliationVox: Number,
    RecentVendorPurchases: [Schema.Types.Mixed],
    Hoverboards: [Schema.Types.Mixed],
    NodeIntrosCompleted: [String],
    CompletedJobChains: [Schema.Types.Mixed],
    SeasonChallengeHistory: [Schema.Types.Mixed],
    MoaPets: [Schema.Types.Mixed],
    EquippedInstrument: String,
    InvasionChainProgress: [Schema.Types.Mixed],
    DataKnives: [GenericItemSchema],
    NemesisHistory: [Schema.Types.Mixed],
    LastNemesisAllySpawnTime: Schema.Types.Mixed,
    Settings: Schema.Types.Mixed,
    PersonalTechProjects: [Schema.Types.Mixed],
    CrewShips: [Schema.Types.Mixed],
    PlayerSkills: Schema.Types.Mixed,
    CrewShipAmmo: [Schema.Types.Mixed],
    CrewShipSalvagedWeaponSkins: [Schema.Types.Mixed],
    CrewShipWeapons: [Schema.Types.Mixed],
    CrewShipSalvagedWeapons: [Schema.Types.Mixed],
    CrewShipWeaponSkins: [Schema.Types.Mixed],
    TradeBannedUntil: Schema.Types.Mixed,
    PlayedParkourTutorial: Boolean,
    SubscribedToEmailsPersonalized: Number,
    DailyAffiliationEntrati: Number,
    DailyAffiliationNecraloid: Number,
    MechSuits: [suitSchema],
    InfestedFoundry: Schema.Types.Mixed,
    BlessingCooldown: Schema.Types.Mixed,
    CrewShipHarnesses: [Schema.Types.Mixed],
    CrewShipRawSalvage: [Schema.Types.Mixed],
    CrewMembers: [Schema.Types.Mixed],
    AdultOperatorLoadOuts: [operatorConfigSchema],
    LotusCustomization: Schema.Types.Mixed,
    UseAdultOperatorLoadout: Boolean,
    DailyAffiliationZariman: Number,
    NemesisAbandonedRewards: [String],
    DailyAffiliationKahl: Number,
    LastInventorySync: Schema.Types.Mixed,
    NextRefill: Schema.Types.Mixed,
    ActiveLandscapeTraps: [Schema.Types.Mixed],
    EvolutionProgress: [Schema.Types.Mixed],
    RepVotes: [Schema.Types.Mixed],
    LeagueTickets: [Schema.Types.Mixed],
    Quests: [Schema.Types.Mixed],
    Robotics: [Schema.Types.Mixed],
    UsedDailyDeals: [Schema.Types.Mixed],
    LibraryPersonalProgress: [Schema.Types.Mixed],
    CollectibleSeries: [Schema.Types.Mixed],
    LibraryAvailableDailyTaskInfo: Schema.Types.Mixed,
    HasResetAccount: Boolean,
    PendingCoupon: Schema.Types.Mixed,
    Harvestable: Boolean,
    DeathSquadable: Boolean
});

inventorySchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;

        const trainingDate = (returnedObject as IInventoryDatabaseDocument).TrainingDate;

        (returnedObject as IInventoryResponse).TrainingDate = {
            $date: {
                $numberLong: trainingDate.getTime().toString()
            }
        } satisfies IMongoDate;
    }
});

type InventoryDocumentProps = {
    Suits: Types.DocumentArray<ISuitDatabase>;
    LongGuns: Types.DocumentArray<IWeaponDatabase>;
    Pistols: Types.DocumentArray<IWeaponDatabase>;
    Melee: Types.DocumentArray<IWeaponDatabase>;
    FlavourItems: Types.DocumentArray<IFlavourItem>;
    RawUpgrades: Types.DocumentArray<IRawUpgrade>;
    MiscItems: Types.DocumentArray<IMiscItem>;
    Boosters: Types.DocumentArray<IBooster>;
    OperatorLoadOuts: Types.DocumentArray<IOperatorConfigClient>;
    AdultOperatorLoadOuts: Types.DocumentArray<IOperatorConfigClient>;
    MechSuits: Types.DocumentArray<ISuitDatabase>;
    Scoops: Types.DocumentArray<IGenericItem>;
    DataKnives: Types.DocumentArray<IGenericItem>;
    DrifterMelee: Types.DocumentArray<IGenericItem>;
    Sentinels: Types.DocumentArray<IWeaponDatabase>;
    Horses: Types.DocumentArray<IGenericItem>;
};

type InventoryModelType = Model<IInventoryDatabase, {}, InventoryDocumentProps>;

const Inventory = model<IInventoryDatabase, InventoryModelType>("Inventory", inventorySchema);

export { Inventory };
