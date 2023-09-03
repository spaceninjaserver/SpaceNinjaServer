import { Model, Schema, Types, model } from "mongoose";
import {
    IFlavourItem,
    IRawUpgrade,
    IMiscItem,
    IInventoryDatabase,
    IBooster
} from "../types/inventoryTypes/inventoryTypes";
import { IOid } from "../types/commonTypes";
import { ISuitDatabase, ISuitDocument } from "@/src/types/inventoryTypes/SuitTypes";
import { IWeaponDatabase } from "@/src/types/inventoryTypes/weaponTypes";

const abilityOverrideSchema = new Schema({
    Ability: String,
    Index: Number
});
const colorSchema = new Schema({
    t0: Number,
    t1: Number,
    t2: Number,
    t3: Number,
    en: Number,
    e1: Number,
    m0: Number,
    m1: Number
});

const longGunConfigSchema = new Schema({
    Skins: [String],
    pricol: colorSchema,
    attcol: colorSchema,
    eyecol: colorSchema,
    sigcol: colorSchema,
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
});

// longGunConfigSchema.set("toJSON", {
//     transform(_document, returnedObject: ISuitDocument) {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//         returnedObject.ItemId = { $oid: returnedObject._id.toString() } satisfies Oid;
//         delete returnedObject._id;
//         delete returnedObject.__v;
//     }
// });

const WeaponSchema = new Schema({
    ItemType: String,
    Configs: [longGunConfigSchema],
    UpgradeVer: Number,
    XP: Number,
    Features: Number,
    Polarized: Number,
    Polarity: Schema.Types.Mixed, //todo
    FocusLens: String,
    ModSlotPurchases: Number,
    UpgradeType: Schema.Types.Mixed, //todo
    UpgradeFingerprint: String,
    ItemName: String,
    ModularParts: [String],
    UnlockLevel: Number
});

const BoosterSchema = new Schema({
    ExpiryDate: Number,
    ItemType: String
});

WeaponSchema.set("toJSON", {
    transform(_document, returnedObject) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject.ItemId = { $oid: returnedObject._id.toString() } satisfies IOid;
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const polaritySchema = new Schema({
    Slot: Number,
    Value: String
});

const suitConfigSchema = new Schema({
    Skins: [String],
    pricol: colorSchema,
    attcol: colorSchema,
    eyecol: colorSchema,
    sigcol: colorSchema,
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
});

suitConfigSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const suitSchema = new Schema<ISuitDatabase>({
    ItemType: String,
    Configs: [suitConfigSchema],
    UpgradeVer: Number,
    XP: Number,
    InfestationDate: Date,
    Features: Number,
    Polarity: [polaritySchema],
    Polarized: Number,
    ModSlotPurchases: Number,
    FocusLens: String,
    UnlockLevel: Number
});

suitSchema.set("toJSON", {
    transform(_document, returnedObject) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject.ItemId = { $oid: returnedObject._id.toString() } satisfies IOid;
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const slotsBinSchema = new Schema(
    {
        Slots: Number
    },
    { _id: false }
);

const FlavourItemSchema = new Schema({
    ItemType: String
});

FlavourItemSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const inventorySchema = new Schema<IInventoryDatabase, InventoryDocumentProps>({
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
    SpaceSuitBin: Schema.Types.Mixed,
    SpaceWeaponBin: Schema.Types.Mixed,
    PvpBonusLoadoutBin: Schema.Types.Mixed,
    PveBonusLoadoutBin: Schema.Types.Mixed,
    RandomModBin: Schema.Types.Mixed,
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
    RawUpgrades: [Schema.Types.Mixed],
    ReceivedStartingGear: Boolean,
    Suits: [suitSchema],
    LongGuns: [WeaponSchema],
    Pistols: [WeaponSchema],
    Melee: [WeaponSchema],
    Ships: [Schema.Types.Mixed],
    QuestKeys: [Schema.Types.Mixed],
    FlavourItems: [FlavourItemSchema],
    Scoops: [Schema.Types.Mixed],
    TrainingRetriesLeft: Number,
    LoadOutPresets: Schema.Types.Mixed,
    CurrentLoadOutIds: [Schema.Types.Mixed],
    Missions: [Schema.Types.Mixed],
    RandomUpgradesIdentified: Number,
    LastRegionPlayed: String,
    XPInfo: [Schema.Types.Mixed],
    Recipes: [Schema.Types.Mixed],
    WeaponSkins: [Schema.Types.Mixed],
    PendingRecipes: [Schema.Types.Mixed],
    TrainingDate: Schema.Types.Mixed,
    PlayerLevel: Number,
    Upgrades: [Schema.Types.Mixed],
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
    SpaceSuits: [Schema.Types.Mixed],
    SpaceMelee: [Schema.Types.Mixed],
    SpaceGuns: [Schema.Types.Mixed],
    ArchwingEnabled: Boolean,
    PendingSpectreLoadouts: [Schema.Types.Mixed],
    SpectreLoadouts: [Schema.Types.Mixed],
    SentinelWeapons: [Schema.Types.Mixed],
    Sentinels: [Schema.Types.Mixed],
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
    OperatorAmpBin: Schema.Types.Mixed,
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
    OperatorLoadOuts: [Schema.Types.Mixed],
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
    DataKnives: [Schema.Types.Mixed],
    NemesisHistory: [Schema.Types.Mixed],
    LastNemesisAllySpawnTime: Schema.Types.Mixed,
    Settings: Schema.Types.Mixed,
    PersonalTechProjects: [Schema.Types.Mixed],
    CrewShips: [Schema.Types.Mixed],
    CrewShipSalvageBin: Schema.Types.Mixed,
    PlayerSkills: Schema.Types.Mixed,
    CrewShipAmmo: [Schema.Types.Mixed],
    CrewShipSalvagedWeaponSkins: [Schema.Types.Mixed],
    CrewShipWeapons: [Schema.Types.Mixed],
    CrewShipSalvagedWeapons: [Schema.Types.Mixed],
    CrewShipWeaponSkins: [Schema.Types.Mixed],
    TradeBannedUntil: Schema.Types.Mixed,
    PlayedParkourTutorial: Boolean,
    SubscribedToEmailsPersonalized: Number,
    MechBin: Schema.Types.Mixed,
    DailyAffiliationEntrati: Number,
    DailyAffiliationNecraloid: Number,
    MechSuits: [Schema.Types.Mixed],
    InfestedFoundry: Schema.Types.Mixed,
    BlessingCooldown: Schema.Types.Mixed,
    CrewMemberBin: Schema.Types.Mixed,
    CrewShipHarnesses: [Schema.Types.Mixed],
    CrewShipRawSalvage: [Schema.Types.Mixed],
    CrewMembers: [Schema.Types.Mixed],
    AdultOperatorLoadOuts: [Schema.Types.Mixed],
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
};

type InventoryModelType = Model<IInventoryDatabase, {}, InventoryDocumentProps>;

const Inventory = model<IInventoryDatabase, InventoryModelType>("Inventory", inventorySchema);

export { Inventory };
