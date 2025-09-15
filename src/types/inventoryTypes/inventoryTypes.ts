import type { Types } from "mongoose";
import type { IOid, IMongoDate, IOidWithLegacySupport, ITypeCount } from "../commonTypes.ts";
import type {
    IColor,
    IItemConfig,
    IOperatorConfigClient,
    IOperatorConfigDatabase,
    IFlavourItem,
    ILotusCustomization,
    IShipCustomization
} from "./commonInventoryTypes.ts";
import type { IFingerprintStat, RivenFingerprint } from "../../helpers/rivenHelper.ts";
import type { IOrbiterClient } from "../personalRoomsTypes.ts";
import type { ICountedStoreItem } from "warframe-public-export-plus";
import type { IEquipmentClient, IEquipmentDatabase, ITraits } from "../equipmentTypes.ts";
import type { ILoadOutPresets } from "../saveLoadoutTypes.ts";

export type InventoryDatabaseEquipment = {
    [_ in TEquipmentKey]: IEquipmentDatabase[];
};

// Fields specific to SNS
export interface IAccountCheats {
    skipAllDialogue?: boolean;
    dontSubtractPurchaseCreditCost?: boolean;
    dontSubtractPurchasePlatinumCost?: boolean;
    dontSubtractPurchaseItemCost?: boolean;
    dontSubtractPurchaseStandingCost?: boolean;
    dontSubtractVoidTraces?: boolean;
    dontSubtractConsumables?: boolean;
    finishInvasionsInOneMission?: boolean;
    infiniteCredits?: boolean;
    infinitePlatinum?: boolean;
    infiniteEndo?: boolean;
    infiniteRegalAya?: boolean;
    infiniteHelminthMaterials?: boolean;
    universalPolarityEverywhere?: boolean;
    unlockDoubleCapacityPotatoesEverywhere?: boolean;
    unlockExilusEverywhere?: boolean;
    unlockArcanesEverywhere?: boolean;
    syndicateMissionsRepeatable?: boolean;
    instantFinishRivenChallenge?: boolean;
    noDailyStandingLimits?: boolean;
    noDailyFocusLimit?: boolean;
    noArgonCrystalDecay?: boolean;
    noMasteryRankUpCooldown?: boolean;
    noVendorPurchaseLimits?: boolean;
    noDeathMarks?: boolean;
    noKimCooldowns?: boolean;
    claimingBlueprintRefundsIngredients?: boolean;
    instantResourceExtractorDrones?: boolean;
    noResourceExtractorDronesDamage?: boolean;
    missionsCanGiveAllRelics?: boolean;
    exceptionalRelicsAlwaysGiveBronzeReward?: boolean;
    flawlessRelicsAlwaysGiveSilverReward?: boolean;
    radiantRelicsAlwaysGiveGoldReward?: boolean;
    disableDailyTribute?: boolean;
}

export interface IInventoryDatabase
    extends Omit<
            IInventoryClient,
            | "TrainingDate"
            | "LoadOutPresets"
            | "Mailbox"
            | "GuildId"
            | "PendingRecipes"
            | "Created"
            | "QuestKeys"
            | "BlessingCooldown"
            | "Ships"
            | "WeaponSkins"
            | "Upgrades"
            | "CrewShipWeaponSkins"
            | "CrewShipSalvagedWeaponSkins"
            | "AdultOperatorLoadOuts"
            | "OperatorLoadOuts"
            | "KahlLoadOuts"
            | "InfestedFoundry"
            | "DialogueHistory"
            | "KubrowPetEggs"
            | "KubrowPetPrints"
            | "PendingCoupon"
            | "Drones"
            | "RecentVendorPurchases"
            | "NextRefill"
            | "Nemesis"
            | "NemesisHistory"
            | "EntratiVaultCountResetDate"
            | "BrandedSuits"
            | "LockedWeaponGroup"
            | "PersonalTechProjects"
            | "LastSortieReward"
            | "LastLiteSortieReward"
            | "CrewMembers"
            | "QualifyingInvasions"
            | "LastInventorySync"
            | "EndlessXP"
            | "PersonalGoalProgress"
            | "CurrentLoadOutIds"
            | TEquipmentKey
        >,
        InventoryDatabaseEquipment,
        IAccountCheats {
    accountOwnerId: Types.ObjectId;
    Created: Date;
    CurrentLoadOutIds: Types.ObjectId[] | IOid[]; // should be Types.ObjectId[] but might be IOid[] because of old commits
    TrainingDate: Date;
    LoadOutPresets: Types.ObjectId; // LoadOutPresets changed from ILoadOutPresets to Types.ObjectId for population
    //Mailbox?: IMailboxDatabase;
    GuildId?: Types.ObjectId;
    PendingRecipes: IPendingRecipeDatabase[];
    QuestKeys: IQuestKeyDatabase[];
    BlessingCooldown?: Date;
    Ships: Types.ObjectId[];
    WeaponSkins: IWeaponSkinDatabase[];
    Upgrades: IUpgradeDatabase[];
    CrewShipWeaponSkins: IUpgradeDatabase[];
    CrewShipSalvagedWeaponSkins: IUpgradeDatabase[];
    AdultOperatorLoadOuts: IOperatorConfigDatabase[];
    OperatorLoadOuts: IOperatorConfigDatabase[];
    KahlLoadOuts: IOperatorConfigDatabase[];
    InfestedFoundry?: IInfestedFoundryDatabase;
    DialogueHistory?: IDialogueHistoryDatabase;
    KubrowPetEggs: IKubrowPetEggDatabase[];
    KubrowPetPrints: IKubrowPetPrintDatabase[];
    PendingCoupon?: IPendingCouponDatabase;
    Drones: IDroneDatabase[];
    RecentVendorPurchases?: IRecentVendorPurchaseDatabase[];
    NextRefill?: Date;
    Nemesis?: INemesisDatabase;
    NemesisHistory?: INemesisBaseDatabase[];
    EntratiVaultCountResetDate?: Date;
    BrandedSuits?: Types.ObjectId[];
    LockedWeaponGroup?: ILockedWeaponGroupDatabase;
    PersonalTechProjects: IPersonalTechProjectDatabase[];
    LastSortieReward?: ILastSortieRewardDatabase[];
    LastLiteSortieReward?: ILastSortieRewardDatabase[];
    CrewMembers: ICrewMemberDatabase[];
    QualifyingInvasions: IInvasionProgressDatabase[];
    LastInventorySync?: Types.ObjectId;
    EndlessXP?: IEndlessXpProgressDatabase[];
    PersonalGoalProgress?: IGoalProgressDatabase[];
}

export interface IQuestKeyDatabase {
    Progress?: IQuestStage[];
    unlock?: boolean;
    Completed?: boolean;
    CustomData?: string;
    ItemType: string;
    CompletionDate?: Date;
}

export const equipmentKeys = [
    "Suits",
    "LongGuns",
    "Pistols",
    "Melee",
    "SpecialItems",
    "Sentinels",
    "SentinelWeapons",
    "SpaceSuits",
    "SpaceGuns",
    "SpaceMelee",
    "Hoverboards",
    "OperatorAmps",
    "MoaPets",
    "Scoops",
    "Horses",
    "DrifterGuns",
    "DrifterMelee",
    "Motorcycles",
    "CrewShips",
    "DataKnives",
    "MechSuits",
    "CrewShipHarnesses",
    "KubrowPets",
    "CrewShipWeapons",
    "CrewShipSalvagedWeapons"
] as const;

export type TEquipmentKey = (typeof equipmentKeys)[number];

export interface IDuviriInfo {
    Seed: bigint;
    NumCompletions: number;
}

export interface IMailboxClient {
    LastInboxId: IOid;
}

/*export interface IMailboxDatabase {
    LastInboxId: Types.ObjectId;
}*/

export type TSolarMapRegion =
    | "Earth"
    | "Ceres"
    | "Eris"
    | "Europa"
    | "Jupiter"
    | "Mars"
    | "Mercury"
    | "Neptune"
    | "Phobos"
    | "Pluto"
    | "Saturn"
    | "Sedna"
    | "Uranus"
    | "Venus"
    | "Void"
    | "SolarMapDeimosName"
    | "1999MapName";

//TODO: perhaps split response and database into their own files

export enum LoadoutIndex {
    NORMAL = 0,
    DATAKNIFE = 7
}

export interface IDailyAffiliations {
    DailyAffiliation: number;
    DailyAffiliationPvp: number;
    DailyAffiliationLibrary: number;
    DailyAffiliationCetus: number;
    DailyAffiliationQuills: number;
    DailyAffiliationSolaris: number;
    DailyAffiliationVentkids: number;
    DailyAffiliationVox: number;
    DailyAffiliationEntrati: number;
    DailyAffiliationNecraloid: number;
    DailyAffiliationZariman: number;
    DailyAffiliationKahl: number;
    DailyAffiliationCavia: number;
    DailyAffiliationHex: number;
}

export type InventoryClientEquipment = {
    [_ in TEquipmentKey]: IEquipmentClient[];
};

export interface IInventoryClient extends IDailyAffiliations, InventoryClientEquipment {
    AdultOperatorLoadOuts: IOperatorConfigClient[];
    OperatorLoadOuts: IOperatorConfigClient[];
    KahlLoadOuts: IOperatorConfigClient[];

    DuviriInfo?: IDuviriInfo;
    Mailbox?: IMailboxClient;
    SubscribedToEmails: number;
    Created: IMongoDate;
    RewardSeed: bigint;
    RegularCredits: number;
    PremiumCredits: number;
    PremiumCreditsFree: number;
    FusionPoints: number;
    CrewShipFusionPoints: number; //Dirac (pre-rework Railjack)
    PrimeTokens: number;
    SuitBin: ISlots;
    WeaponBin: ISlots;
    SentinelBin: ISlots;
    SpaceSuitBin: ISlots;
    SpaceWeaponBin: ISlots;
    PvpBonusLoadoutBin: ISlots;
    PveBonusLoadoutBin: ISlots;
    RandomModBin: ISlots;
    MechBin: ISlots;
    CrewMemberBin: ISlots;
    OperatorAmpBin: ISlots;
    CrewShipSalvageBin: ISlots;
    TradesRemaining: number;
    DailyFocus: number;
    GiftsRemaining: number;
    HandlerPoints: number;
    MiscItems: IMiscItem[];
    HasOwnedVoidProjectionsPreviously?: boolean;
    ChallengesFixVersion?: number;
    ChallengeProgress: IChallengeProgress[];
    RawUpgrades: IRawUpgrade[];
    ReceivedStartingGear: boolean;
    Ships: IShipInventory[];
    QuestKeys: IQuestKeyClient[];
    ActiveQuest: string;
    FlavourItems: IFlavourItem[];
    LoadOutPresets: ILoadOutPresets;
    CurrentLoadOutIds: IOid[];
    Missions: IMission[];
    RandomUpgradesIdentified?: number;
    LastRegionPlayed: TSolarMapRegion;
    XPInfo: ITypeXPItem[];
    Recipes: ITypeCount[];
    WeaponSkins: IWeaponSkinClient[];
    PendingRecipes: IPendingRecipeClient[];
    TrainingDate: IMongoDate;
    PlayerLevel: number;
    Staff?: boolean;
    Founder?: number;
    Guide?: number;
    Moderator?: boolean;
    Partner?: boolean;
    Accolades?: IAccolades;
    Counselor?: boolean;
    Upgrades: IUpgradeClient[];
    EquippedGear: string[];
    DeathMarks: string[];
    FusionTreasures: IFusionTreasure[];
    //WebFlags: IWebFlags;
    CompletedAlerts: string[];
    Consumables: ITypeCount[];
    LevelKeys: ITypeCount[];
    TauntHistory?: ITaunt[];
    StoryModeChoice: string;
    PeriodicMissionCompletions: IPeriodicMissionCompletionDatabase[];
    KubrowPetEggs?: IKubrowPetEggClient[];
    LoreFragmentScans: ILoreFragmentScan[];
    EquippedEmotes: string[];
    //PendingTrades: IPendingTrade[];
    Boosters: IBooster[];
    ActiveDojoColorResearch: string;
    //SentientSpawnChanceBoosters: ISentientSpawnChanceBoosters;
    SupportedSyndicate?: string;
    Affiliations: IAffiliation[];
    QualifyingInvasions: IInvasionProgressClient[];
    FactionScores: number[];
    ArchwingEnabled?: boolean;
    PendingSpectreLoadouts?: ISpectreLoadout[];
    SpectreLoadouts?: ISpectreLoadout[];
    UsedDailyDeals: string[];
    EmailItems: ITypeCount[];
    CompletedSyndicates: string[];
    FocusXP?: IFocusXP;
    Wishlist: string[];
    Alignment?: IAlignment;
    CompletedSorties: string[];
    LastSortieReward?: ILastSortieRewardClient[];
    LastLiteSortieReward?: ILastSortieRewardClient[];
    SortieRewardAttenuation?: IRewardAttenuation[];
    Drones: IDroneClient[];
    StepSequencers: IStepSequencer[];
    ActiveAvatarImageType?: string;
    ShipDecorations: ITypeCount[];
    DiscoveredMarkers: IDiscoveredMarker[];
    //CompletedJobs: ICompletedJob[];
    FocusAbility?: string;
    FocusUpgrades: IFocusUpgrade[];
    HasContributedToDojo?: boolean;
    HWIDProtectEnabled?: boolean;
    KubrowPetPrints: IKubrowPetPrintClient[];
    AlignmentReplay?: IAlignment;
    PersonalGoalProgress?: IGoalProgressClient[];
    ThemeStyle: string;
    ThemeBackground: string;
    ThemeSounds: string;
    BountyScore: number;
    //ChallengeInstanceStates: IChallengeInstanceState[];
    LoginMilestoneRewards: string[];
    RecentVendorPurchases?: IRecentVendorPurchaseClient[];
    NodeIntrosCompleted: string[];
    GuildId?: IOid;
    CompletedJobChains?: ICompletedJobChain[];
    SeasonChallengeHistory: ISeasonChallenge[];
    EquippedInstrument?: string;
    //InvasionChainProgress: IInvasionChainProgress[];
    Nemesis?: INemesisClient;
    NemesisHistory?: INemesisBaseClient[];
    //LastNemesisAllySpawnTime?: IMongoDate;
    Settings?: ISettings;
    PersonalTechProjects: IPersonalTechProjectClient[];
    PlayerSkills: IPlayerSkills;
    CrewShipAmmo: ITypeCount[];
    CrewShipWeaponSkins: IUpgradeClient[];
    CrewShipSalvagedWeaponSkins: IUpgradeClient[];
    //TradeBannedUntil?: IMongoDate;
    PlayedParkourTutorial: boolean;
    SubscribedToEmailsPersonalized: number;
    InfestedFoundry?: IInfestedFoundryClient;
    BlessingCooldown?: IMongoDate;
    CrewShipRawSalvage: ITypeCount[];
    CrewMembers: ICrewMemberClient[];
    LotusCustomization?: ILotusCustomization;
    UseAdultOperatorLoadout?: boolean;
    OperatorCustomizationSlotPurchases?: number;
    NemesisAbandonedRewards: string[];
    LastInventorySync?: IOid;
    NextRefill?: IMongoDate;
    FoundToday?: IMiscItem[]; // for Argon Crystals
    CustomMarkers?: ICustomMarkers[];
    //ActiveLandscapeTraps: any[];
    EvolutionProgress?: IEvolutionProgress[];
    //RepVotes: any[];
    //LeagueTickets: any[];
    //Quests: any[];
    //Robotics: any[];
    LibraryPersonalTarget?: string;
    LibraryPersonalProgress: ILibraryPersonalProgress[];
    CollectibleSeries?: ICollectibleEntry[];
    LibraryAvailableDailyTaskInfo?: ILibraryDailyTaskInfo;
    LibraryActiveDailyTaskInfo?: ILibraryDailyTaskInfo;
    HasResetAccount: boolean;
    PendingCoupon?: IPendingCouponClient;
    Harvestable: boolean;
    DeathSquadable: boolean;
    EndlessXP?: IEndlessXpProgressClient[];
    DialogueHistory?: IDialogueHistoryClient;
    CalendarProgress?: ICalendarProgress;
    SongChallenges?: ISongChallenge[];
    EntratiVaultCountLastPeriod?: number;
    EntratiVaultCountResetDate?: IMongoDate;
    EntratiLabConquestUnlocked?: number;
    EntratiLabConquestHardModeStatus?: number;
    EntratiLabConquestCacheScoreMission?: number;
    EntratiLabConquestActiveFrameVariants?: string[];
    EchoesHexConquestUnlocked?: number;
    EchoesHexConquestHardModeStatus?: number;
    EchoesHexConquestCacheScoreMission?: number;
    EchoesHexConquestActiveFrameVariants?: string[];
    EchoesHexConquestActiveStickers?: string[];
    BrandedSuits?: IOidWithLegacySupport[];
    LockedWeaponGroup?: ILockedWeaponGroupClient;
    HubNpcCustomizations?: IHubNpcCustomization[];
    Ship?: IOrbiterClient; // U22 and below, response only
    ClaimedJunctionChallengeRewards?: string[]; // U39
    SpecialItemRewardAttenuation?: IRewardAttenuation[]; // Baro's Void Surplus
}

export interface IAffiliation {
    Initiated?: boolean;
    Standing: number;
    Title?: number;
    FreeFavorsEarned?: number[];
    FreeFavorsUsed?: number[];
    WeeklyMissions?: IWeeklyMission[]; // Kahl
    Tag: string;
}

export interface IWeeklyMission {
    MissionIndex: number;
    CompletedMission: boolean;
    JobManifest: string;
    Challenges: string[];
    ChallengesReset?: boolean;
    WeekCount: number;
}

export interface IAlignment {
    Wisdom: number;
    Alignment: number;
}

export interface IBooster {
    ExpiryDate: number;
    ItemType: string;
    UsesRemaining?: number;
}

export interface IChallengeInstanceState {
    id: IOid;
    Progress: number;
    params: IParam[];
    IsRewardCollected: boolean;
}

export interface IParam {
    n: string;
    v: string;
}

export interface IRecentVendorPurchaseClient {
    VendorType: string;
    PurchaseHistory: IVendorPurchaseHistoryEntryClient[];
}

export interface IVendorPurchaseHistoryEntryClient {
    Expiry: IMongoDate;
    NumPurchased: number;
    ItemId: string;
}

export interface IRecentVendorPurchaseDatabase {
    VendorType: string;
    PurchaseHistory: IVendorPurchaseHistoryEntryDatabase[];
}

export interface IVendorPurchaseHistoryEntryDatabase {
    Expiry: Date;
    NumPurchased: number;
    ItemId: string;
}

export interface IChallengeProgress {
    Progress: number;
    Completed?: string[];
    ReceivedJunctionReward?: boolean; // U39
    Name: string;
}

export interface ICollectibleEntry {
    CollectibleType: string;
    Count: number;
    Tracking: string;
    ReqScans: number;
    IncentiveStates: IIncentiveState[];
}

export interface IIncentiveState {
    threshold: number;
    complete: boolean;
    sent: boolean;
}

export interface ICompletedJobChain {
    LocationTag: string;
    Jobs: string[];
}

export interface ICompletedJob {
    JobId: string;
    StageCompletions: number[];
}

export interface ICrewMemberSkill {
    Assigned: number;
}

export interface ICrewMemberSkillEfficiency {
    PILOTING: ICrewMemberSkill;
    GUNNERY: ICrewMemberSkill;
    ENGINEERING: ICrewMemberSkill;
    COMBAT: ICrewMemberSkill;
    SURVIVABILITY: ICrewMemberSkill;
}

export interface ICrewMemberClient {
    ItemType: string;
    NemesisFingerprint: bigint;
    Seed: bigint;
    AssignedRole?: number;
    SkillEfficiency: ICrewMemberSkillEfficiency;
    WeaponConfigIdx: number;
    WeaponId: IOid;
    XP: number;
    PowersuitType: string;
    Configs: IItemConfig[];
    SecondInCommand: boolean; // on call
    ItemId: IOid;
}

export interface ICrewMemberDatabase extends Omit<ICrewMemberClient, "WeaponId" | "ItemId"> {
    WeaponId: Types.ObjectId;
    _id: Types.ObjectId;
}

export enum InventorySlot {
    SUITS = "SuitBin",
    WEAPONS = "WeaponBin",
    SPACESUITS = "SpaceSuitBin",
    SPACEWEAPONS = "SpaceWeaponBin",
    MECHSUITS = "MechBin",
    PVE_LOADOUTS = "PveBonusLoadoutBin",
    SENTINELS = "SentinelBin",
    AMPS = "OperatorAmpBin",
    RJ_COMPONENT_AND_ARMAMENTS = "CrewShipSalvageBin",
    CREWMEMBERS = "CrewMemberBin",
    RIVENS = "RandomModBin"
}

export interface ISlots {
    Extra?: number;
    Slots: number;
}

export interface IUpgradeClient {
    ItemType: string;
    UpgradeFingerprint?: string;
    PendingRerollFingerprint?: string;
    ItemId: IOid;
}

export interface IUpgradeDatabase extends Omit<IUpgradeClient, "ItemId"> {
    _id: Types.ObjectId;
}

export interface IUpgradeFromClient {
    ItemType: string;
    ItemId: IOidWithLegacySupport;
    FromSKU?: boolean;
    UpgradeFingerprint: string;
    PendingRerollFingerprint: string;
    ItemCount: number;
    LastAdded: IOidWithLegacySupport;
}

export type IMiscItem = ITypeCount;

export interface IDiscoveredMarker {
    tag: string;
    discoveryState: number[];
}

export interface IDroneClient {
    ItemType: string;
    CurrentHP: number;
    ItemId: IOid;
    RepairStart?: IMongoDate;
}

export interface IDroneDatabase {
    ItemType: string;
    CurrentHP: number;
    _id: Types.ObjectId;
    RepairStart?: Date;

    DeployTime?: Date;
    System?: number;
    DamageTime?: Date;
    PendingDamage?: number;
    ResourceType?: string;
    ResourceCount?: number;
}

export interface ITypeXPItem {
    ItemType: string;
    XP: number;
}

export interface IFocusUpgrade {
    ItemType: string;
    Level?: number;
    IsUniversal?: boolean;
}

export interface IFocusXP {
    AP_POWER?: number;
    AP_TACTIC?: number;
    AP_DEFENSE?: number;
    AP_ATTACK?: number;
    AP_WARD?: number;
}

export type TFocusPolarity = keyof IFocusXP;

export interface IFusionTreasure {
    ItemCount: number;
    ItemType: string;
    Sockets: number;
}

export interface IHelminthFoodRecord {
    ItemType: string;
    Date: number;
}

export interface IHelminthResource {
    ItemType: string;
    Count: number;
    RecentlyConvertedResources?: IHelminthFoodRecord[];
}

export interface IInfestedFoundryClient {
    Name?: string;
    Resources?: IHelminthResource[];
    Slots?: number;
    XP?: number;
    ConsumedSuits?: IConsumedSuit[];
    InvigorationIndex?: number;
    InvigorationSuitOfferings?: string[];
    InvigorationsApplied?: number;
    LastConsumedSuit?: IEquipmentClient;
    AbilityOverrideUnlockCooldown?: IMongoDate;
}

export interface IInfestedFoundryDatabase
    extends Omit<IInfestedFoundryClient, "LastConsumedSuit" | "AbilityOverrideUnlockCooldown"> {
    LastConsumedSuit?: IEquipmentDatabase;
    AbilityOverrideUnlockCooldown?: Date;
}

export interface IConsumedSuit {
    s: string;
    c?: IColor;
}

export interface IInvasionChainProgress {
    id: IOid;
    count: number;
}

export interface IInvasionProgressClient {
    _id: IOid;
    Delta: number;
    AttackerScore: number;
    DefenderScore: number;
}

export interface IInvasionProgressDatabase extends Omit<IInvasionProgressClient, "_id"> {
    invasionId: Types.ObjectId;
}

export interface IKubrowPetEggClient {
    ItemType: string;
    ExpirationDate: IMongoDate; // seems to be set to 7 days ahead @ 0 UTC
    ItemId: IOid;
}

export interface IKubrowPetEggDatabase {
    ItemType: string;
    _id: Types.ObjectId;
}

export interface IKubrowPetPrintClient {
    ItemType: "/Lotus/Types/Game/KubrowPet/ImprintedTraitPrint";
    Name: string;
    IsMale: boolean;
    Size: number; // seems to be 0.7 to 1.0
    DominantTraits: ITraits;
    RecessiveTraits: ITraits;
    ItemId: IOid;
    InheritedModularParts?: any[];
}

export interface IKubrowPetPrintDatabase extends Omit<IKubrowPetPrintClient, "ItemId" | "InheritedModularParts"> {
    _id: Types.ObjectId;
}

export interface ILastSortieRewardClient {
    SortieId: IOid;
    StoreItem: string;
    Manifest: string;
}

export interface ILastSortieRewardDatabase extends Omit<ILastSortieRewardClient, "SortieId"> {
    SortieId: Types.ObjectId;
}

export interface IRewardAttenuation {
    Tag: string;
    Atten: number;
}

export interface ILibraryDailyTaskInfo {
    EnemyTypes: string[];
    EnemyLocTag: string;
    EnemyIcon: string;
    Scans?: number;
    ScansRequired: number;
    RewardStoreItem: string;
    RewardQuantity: number;
    RewardStanding: number;
}

export interface ILibraryPersonalProgress {
    TargetType: string;
    Scans: number;
    Completed: boolean;
}

export enum UpgradeType {
    LotusWeaponsGrineerKuvaLichUpgradesInnateDamageRandomMod = "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod"
}

export interface ILoreFragmentScan {
    Progress: number;
    Region: string;
    ItemType: string;
}

export interface IMissionDatabase {
    Tag: string;
    Completes: number;
    Tier?: number;
}

export interface IMission extends IMissionDatabase {
    RewardsCooldownTime?: IMongoDate;
}

export type TNemesisFaction = "FC_GRINEER" | "FC_CORPUS" | "FC_INFESTATION";

export interface INemesisBaseClient {
    fp: bigint | number;
    manifest: string;
    KillingSuit: string;
    killingDamageType: number;
    ShoulderHelmet: string;
    WeaponIdx: number;
    AgentIdx: number;
    BirthNode: string;
    Faction: TNemesisFaction;
    Rank: number;
    k: boolean;
    Traded: boolean;
    d: IMongoDate;
    PrevOwners: number;
    SecondInCommand: boolean;
    Weakened: boolean;
}

export interface INemesisBaseDatabase extends Omit<INemesisBaseClient, "fp" | "d"> {
    fp: bigint;
    d: Date;
}

export interface INemesisClient extends INemesisBaseClient {
    InfNodes: IInfNode[];
    HenchmenKilled: number;
    HintProgress: number;
    Hints: number[];
    GuessHistory: number[];
    MissionCount: number;
    LastEnc: number;
}

export interface INemesisDatabase extends Omit<INemesisClient, "fp" | "d"> {
    fp: bigint;
    d: Date;
}

export interface IInfNode {
    Node: string;
    Influence: number;
}

export interface IPendingCouponDatabase {
    Expiry: Date;
    Discount: number;
}

export interface IPendingCouponClient {
    Expiry: IMongoDate;
    Discount: number;
}

export interface IPendingRecipeDatabase {
    ItemType: string;
    CompletionDate: Date;
    ItemId: IOid;
    TargetItemId?: string; // unsure what this is for
    TargetFingerprint?: string;
    LongGuns?: IEquipmentDatabase[];
    Pistols?: IEquipmentDatabase[];
    Melee?: IEquipmentDatabase[];
    SuitToUnbrand?: Types.ObjectId;
    KubrowPet?: Types.ObjectId;
}

export interface IPendingRecipeClient
    extends Omit<
        IPendingRecipeDatabase,
        "CompletionDate" | "LongGuns" | "Pistols" | "Melee" | "SuitToUnbrand" | "KubrowPet"
    > {
    CompletionDate: IMongoDate;
}

export interface IAccolades {
    Heirloom?: boolean;
}

export interface IPendingTrade {
    State: number;
    SelfReady: boolean;
    BuddyReady: boolean;
    Giving?: IGiving;
    Revision: number;
    Getting: IGetting;
    ItemId: IOid;
    ClanTax?: number;
}

export interface IGetting {
    RandomUpgrades?: IRandomUpgrade[];
    _SlotOrderInfo: GettingSlotOrderInfo[];
    PremiumCredits?: number;
}

export interface IRandomUpgrade {
    UpgradeFingerprint: RivenFingerprint;
    ItemType: string;
    ItemId: IOid;
}

export interface IInnateDamageFingerprint {
    compat: string;
    buffs: IFingerprintStat[];
}

export interface ICrewShipComponentFingerprint extends IInnateDamageFingerprint {
    SubroutineIndex?: number;
}

export interface INemesisWeaponTargetFingerprint {
    ItemType: string;
    UpgradeFingerprint: IInnateDamageFingerprint;
    Name: string;
}

export interface INemesisPetTargetFingerprint {
    Parts: string[];
    Name: string;
}

export enum GettingSlotOrderInfo {
    Empty = "",
    LotusUpgradesModsRandomizedPlayerMeleeWeaponRandomModRare0 = "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare:0",
    P = "P"
}

export interface IGiving {
    RawUpgrades: ITypeCount[];
    _SlotOrderInfo: GivingSlotOrderInfo[];
}

export enum GivingSlotOrderInfo {
    Empty = "",
    LotusTypesSentinelsSentinelPreceptsItemVacum = "/Lotus/Types/Sentinels/SentinelPrecepts/ItemVacum",
    LotusUpgradesModsPistolDualStatElectEventPistolMod = "/Lotus/Upgrades/Mods/Pistol/DualStat/ElectEventPistolMod"
}

export interface IPeriodicMissionCompletionDatabase {
    date: Date;
    tag: string;
    count?: number;
}

export interface IPeriodicMissionCompletionResponse extends Omit<IPeriodicMissionCompletionDatabase, "date"> {
    date: IMongoDate;
}

export interface IGoalProgressClient {
    Best?: number;
    Count: number;
    Tag: string;
    _id: IOid;
    //ReceivedClanReward0?: boolean;
    //ReceivedClanReward1?: boolean;
}

export interface IGoalProgressDatabase extends Omit<IGoalProgressClient, "_id"> {
    goalId: Types.ObjectId;
}

export interface IPersonalTechProjectDatabase {
    State: number;
    ReqCredits: number;
    ItemType: string;
    ProductCategory?: string;
    CategoryItemId?: Types.ObjectId;
    ReqItems: ITypeCount[];
    HasContributions?: boolean;
    CompletionDate?: Date;
}

export interface IPersonalTechProjectClient
    extends Omit<IPersonalTechProjectDatabase, "CategoryItemId" | "CompletionDate"> {
    CategoryItemId?: IOid;
    CompletionDate?: IMongoDate;
    ItemId: IOid;
}

export interface IPlayerSkills {
    LPP_SPACE: number;
    LPS_PILOTING: number;
    LPS_GUNNERY: number;
    LPS_TACTICAL: number;
    LPS_ENGINEERING: number;
    LPS_COMMAND: number;
    LPP_DRIFTER: number;
    LPS_DRIFT_COMBAT: number;
    LPS_DRIFT_RIDING: number;
    LPS_DRIFT_OPPORTUNITY: number;
    LPS_DRIFT_ENDURANCE: number;
}

export interface IQuestKeyClient extends Omit<IQuestKeyDatabase, "CompletionDate"> {
    CompletionDate?: IMongoDate;
}

export interface IQuestStage {
    c: number;
    i: boolean;
    m: boolean;
    b: any[];
}

export interface IRawUpgrade {
    ItemType: string;
    ItemCount: number;
    LastAdded?: IOidWithLegacySupport;
}

export interface ISeasonChallenge {
    challenge: string;
    id: string;
}

export interface ISentientSpawnChanceBoosters {
    numOceanMissionsCompleted: number;
}

export interface ISettings {
    FriendInvRestriction: "GIFT_MODE_ALL" | "GIFT_MODE_FRIENDS" | "GIFT_MODE_NONE";
    GiftMode: "GIFT_MODE_ALL" | "GIFT_MODE_FRIENDS" | "GIFT_MODE_NONE";
    GuildInvRestriction: "GIFT_MODE_ALL" | "GIFT_MODE_FRIENDS" | "GIFT_MODE_NONE";
    ShowFriendInvNotifications: boolean;
    TradingRulesConfirmed: boolean;
    SubscribedToSurveys?: boolean;
}

export interface IShipInventory {
    ItemType: string;
    ShipExterior: IShipCustomization;
    AirSupportPower: string;
    ItemId: IOid;
}

export interface ISpectreLoadout {
    ItemType: string;
    Suits: string;
    LongGuns: string;
    LongGunsModularParts?: string[];
    Pistols: string;
    PistolsModularParts?: string[];
    Melee: string;
    MeleeModularParts?: string[];
}

export interface IStepSequencer {
    NotePacks: INotePacks;
    FingerPrint: string;
    Name: string;
    ItemId?: IOid;
}

export interface INotePacks {
    MELODY: string;
    BASS: string;
    PERCUSSION: string;
}

export interface ITaunt {
    node: string;
    state: "TS_UNLOCKED" | "TS_COMPLETED";
}

export interface IWeaponSkinDatabase {
    ItemType: string;
    Favorite?: boolean;
    IsNew?: boolean;
    _id: Types.ObjectId;
}

export interface IWeaponSkinClient extends Omit<IWeaponSkinDatabase, "_id"> {
    ItemId: IOid;
}

export interface IWebFlags {
    activeBuyPlat: number;
    noShow2FA: boolean;
    Tennocon2018Digital: boolean;
    VisitPrimeAccess: IMongoDate;
    VisitTennocon2019: IMongoDate;
    enteredSC2019: IMongoDate;
    VisitPrimeVault: IMongoDate;
    VisitBuyPlatinum: IMongoDate;
    ClickedSku_640_Page__en_buyplatinum: IMongoDate;
    ClickedSku_640_Page__buyplatinum: IMongoDate;
    VisitStarterPack: IMongoDate;
    Tennocon2020Digital: boolean;
    Anniversary2021: boolean;
    HitDownloadBtn: IMongoDate;
}

export interface IEvolutionProgress {
    Progress: number;
    Rank: number;
    ItemType: string;
}

export type TEndlessXpCategory = "EXC_NORMAL" | "EXC_HARD";

export interface IEndlessXpProgressDatabase {
    Category: TEndlessXpCategory;
    Earn: number;
    Claim: number;
    BonusAvailable?: Date;
    Expiry?: Date;
    Choices: string[];
    PendingRewards: IEndlessXpReward[];
}

export interface IEndlessXpProgressClient extends Omit<IEndlessXpProgressDatabase, "BonusAvailable" | "Expiry"> {
    BonusAvailable?: IMongoDate;
    Expiry?: IMongoDate;
}

export interface IEndlessXpReward {
    RequiredTotalXp: number;
    Rewards: ICountedStoreItem[];
}

export interface IDialogueHistoryClient {
    YearIteration?: number;
    Resets?: number; // added in 38.5.0
    Dialogues?: IDialogueClient[];
}

export interface IDialogueHistoryDatabase {
    YearIteration?: number;
    Resets?: number;
    Dialogues?: IDialogueDatabase[];
}

export interface IDialogueClient {
    Rank: number;
    Chemistry: number;
    AvailableDate: IMongoDate;
    AvailableGiftDate: IMongoDate;
    RankUpExpiry: IMongoDate;
    BountyChemExpiry: IMongoDate;
    QueuedDialogues: string[];
    Gifts: IDialogueGift[];
    Booleans: string[];
    Completed: ICompletedDialogue[];
    DialogueName: string;
}

export interface IDialogueDatabase
    extends Omit<IDialogueClient, "AvailableDate" | "AvailableGiftDate" | "RankUpExpiry" | "BountyChemExpiry"> {
    AvailableDate: Date;
    AvailableGiftDate: Date;
    RankUpExpiry: Date;
    BountyChemExpiry: Date;
}

export interface IDialogueGift {
    Item: string;
    GiftedQuantity: number;
}

export interface ICompletedDialogue {
    Id: string;
    Booleans: string[];
    Choices: number[];
}

export interface ICustomMarkers {
    tag: string;
    markerInfos: IMarkerInfo[];
}

export interface IMarkerInfo {
    icon: string;
    markers: IMarker[];
}

export interface IMarker {
    anchorName: string;
    color: number;
    label?: string;
    x: number;
    y: number;
    z: number;
    showInHud: boolean;
}

export interface ISeasonProgress {
    SeasonType: "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL";
    LastCompletedDayIdx: number;
    LastCompletedChallengeDayIdx: number;
    ActivatedChallenges: string[];
}

export interface ICalendarProgress {
    Version: number;
    Iteration: number;
    YearProgress: { Upgrades: string[] };
    SeasonProgress: ISeasonProgress;
}

export interface ISongChallenge {
    Song: string;
    Difficulties: number[];
}

export interface ILockedWeaponGroupClient {
    s: IOid;
    p?: IOid;
    l?: IOid;
    m?: IOid;
    sn?: IOid;
}

export interface ILockedWeaponGroupDatabase {
    s: Types.ObjectId;
    p?: Types.ObjectId;
    l?: Types.ObjectId;
    m?: Types.ObjectId;
    sn?: Types.ObjectId;
}

export type TPartialStartingGear = Pick<IInventoryClient, "LongGuns" | "Suits" | "Pistols" | "Melee">;

export interface IHubNpcCustomization {
    Colors?: IColor;
    Pattern: string;
    Tag: string;
}
