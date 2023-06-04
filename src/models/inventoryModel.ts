import { Document, Schema, model } from "mongoose";
import { IInventoryDatabase, IInventoryResponse, ISuitDatabase, ISuitDocument, Oid } from "../types/inventoryTypes";

const polaritySchema = new Schema({
    Slot: Number,
    Value: String
});

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

const suitSchema = new Schema({
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
    transform(_document, returnedObject: ISuitDocument) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject.ItemId = { $oid: returnedObject._id.toString() } satisfies Oid;
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const inventorySchema = new Schema({
    accountOwnerId: Schema.Types.ObjectId,
    SubscribedToEmails: Number,
    Created: Schema.Types.Mixed,
    RewardSeed: Number,
    RegularCredits: Number,
    PremiumCredits: Number,
    PremiumCreditsFree: Number,
    FusionPoints: Number,
    SuitBin: Schema.Types.Mixed,
    WeaponBin: Schema.Types.Mixed,
    SentinelBin: Schema.Types.Mixed,
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
    LongGuns: [Schema.Types.Mixed],
    Pistols: [Schema.Types.Mixed],
    Melee: [Schema.Types.Mixed],
    Ships: [Schema.Types.Mixed],
    QuestKeys: [Schema.Types.Mixed],
    FlavourItems: [Schema.Types.Mixed],
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
    Boosters: [Schema.Types.Mixed],
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
    transform(_document, returnedObject: ISuitDocument) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const Suit = model<ISuitDatabase>("Suit", suitSchema);
const Inventory = model<IInventoryDatabase>("Inventory", inventorySchema);

export { Inventory, Suit };
