/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { IOid, IMongoDate } from "../commonTypes";
import {
    IColor,
    IItemConfig,
    IOperatorConfigClient,
    IEquipmentSelection,
    IEquipmentDatabase,
    IEquipmentClient,
    IOperatorConfigDatabase
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IFingerprintStat, RivenFingerprint } from "@/src/helpers/rivenHelper";

export type InventoryDatabaseEquipment = {
    [_ in TEquipmentKey]: IEquipmentDatabase[];
};

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
            | "PendingCoupon"
            | "Drones"
            | "RecentVendorPurchases"
            | "NextRefill"
            | "Nemesis"
            | "EntratiVaultCountResetDate"
            | "BrandedSuits"
            | "LockedWeaponGroup"
            | "PersonalTechProjects"
            | "LastSortieReward"
            | "LastLiteSortieReward"
            | TEquipmentKey
        >,
        InventoryDatabaseEquipment {
    accountOwnerId: Types.ObjectId;
    Created: Date;
    TrainingDate: Date;
    LoadOutPresets: Types.ObjectId; // LoadOutPresets changed from ILoadOutPresets to Types.ObjectId for population
    Mailbox?: IMailboxDatabase;
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
    KubrowPetEggs?: IKubrowPetEggDatabase[];
    PendingCoupon?: IPendingCouponDatabase;
    Drones: IDroneDatabase[];
    RecentVendorPurchases?: IRecentVendorPurchaseDatabase[];
    NextRefill?: Date;
    Nemesis?: INemesisDatabase;
    EntratiVaultCountResetDate?: Date;
    BrandedSuits?: Types.ObjectId[];
    LockedWeaponGroup?: ILockedWeaponGroupDatabase;
    PersonalTechProjects: IPersonalTechProjectDatabase[];
    LastSortieReward?: ILastSortieRewardDatabase[];
    LastLiteSortieReward?: ILastSortieRewardDatabase[];
}

export interface IQuestKeyDatabase {
    Progress?: IQuestStage[];
    unlock?: boolean;
    Completed?: boolean;
    CustomData?: string;
    ItemType: string;
    CompletionDate?: Date;
}

export interface ITypeCount {
    ItemType: string;
    ItemCount: number;
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
    Seed: number;
    NumCompletions: number;
}

export interface IMailboxClient {
    LastInboxId: IOid;
}

export interface IMailboxDatabase {
    LastInboxId: Types.ObjectId;
}

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

    DuviriInfo: IDuviriInfo;
    Mailbox?: IMailboxClient;
    SubscribedToEmails: number;
    Created: IMongoDate;
    RewardSeed: number | bigint;
    RegularCredits: number;
    PremiumCredits: number;
    PremiumCreditsFree: number;
    FusionPoints: number;
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
    ChallengesFixVersion: number;
    ChallengeProgress: IChallengeProgress[];
    RawUpgrades: IRawUpgrade[];
    ReceivedStartingGear: boolean;
    Ships: IShipInventory[];
    QuestKeys: IQuestKeyClient[];
    ActiveQuest: string;
    FlavourItems: IFlavourItem[];
    LoadOutPresets: ILoadOutPresets;
    CurrentLoadOutIds: IOid[]; // we store it in the database using this representation as well :/
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
    Accolades?: {
        Heirloom?: boolean;
    };
    Counselor?: boolean;
    Upgrades: IUpgradeClient[];
    EquippedGear: string[];
    DeathMarks: string[];
    FusionTreasures: IFusionTreasure[];
    WebFlags: IWebFlags;
    CompletedAlerts: string[];
    Consumables: ITypeCount[];
    LevelKeys: ITypeCount[];
    TauntHistory?: ITaunt[];
    StoryModeChoice: string;
    PeriodicMissionCompletions: IPeriodicMissionCompletionDatabase[];
    KubrowPetEggs?: IKubrowPetEggClient[];
    LoreFragmentScans: ILoreFragmentScan[];
    EquippedEmotes: string[];
    PendingTrades: IPendingTrade[];
    Boosters: IBooster[];
    ActiveDojoColorResearch: string;
    SentientSpawnChanceBoosters: ISentientSpawnChanceBoosters;
    SupportedSyndicate?: string;
    Affiliations: IAffiliation[];
    QualifyingInvasions: any[];
    FactionScores: number[];
    ArchwingEnabled?: boolean;
    PendingSpectreLoadouts?: ISpectreLoadout[];
    SpectreLoadouts?: ISpectreLoadout[];
    EmailItems: ITypeCount[];
    CompletedSyndicates: string[];
    FocusXP?: IFocusXP;
    Wishlist: string[];
    Alignment?: IAlignment;
    CompletedSorties: string[];
    LastSortieReward?: ILastSortieRewardClient[];
    LastLiteSortieReward?: ILastSortieRewardClient[];
    Drones: IDroneClient[];
    StepSequencers: IStepSequencer[];
    ActiveAvatarImageType: string;
    ShipDecorations: ITypeCount[];
    DiscoveredMarkers: IDiscoveredMarker[];
    CompletedJobs: ICompletedJob[];
    FocusAbility?: string;
    FocusUpgrades: IFocusUpgrade[];
    HasContributedToDojo?: boolean;
    HWIDProtectEnabled?: boolean;
    KubrowPetPrints: IKubrowPetPrint[];
    AlignmentReplay?: IAlignment;
    PersonalGoalProgress: IPersonalGoalProgress[];
    ThemeStyle: string;
    ThemeBackground: string;
    ThemeSounds: string;
    BountyScore: number;
    ChallengeInstanceStates: IChallengeInstanceState[];
    LoginMilestoneRewards: string[];
    RecentVendorPurchases?: IRecentVendorPurchaseClient[];
    NodeIntrosCompleted: string[];
    GuildId?: IOid;
    CompletedJobChains?: ICompletedJobChain[];
    SeasonChallengeHistory: ISeasonChallenge[];
    EquippedInstrument?: string;
    InvasionChainProgress: IInvasionChainProgress[];
    Nemesis?: INemesisClient;
    NemesisHistory: INemesisBaseClient[];
    LastNemesisAllySpawnTime?: IMongoDate;
    Settings?: ISettings;
    PersonalTechProjects: IPersonalTechProjectClient[];
    PlayerSkills: IPlayerSkills;
    CrewShipAmmo: ITypeCount[];
    CrewShipWeaponSkins: IUpgradeClient[];
    CrewShipSalvagedWeaponSkins: IUpgradeClient[];
    TradeBannedUntil?: IMongoDate;
    PlayedParkourTutorial: boolean;
    SubscribedToEmailsPersonalized: number;
    InfestedFoundry?: IInfestedFoundryClient;
    BlessingCooldown?: IMongoDate;
    CrewShipRawSalvage: ITypeCount[];
    CrewMembers: ICrewMember[];
    LotusCustomization: ILotusCustomization;
    UseAdultOperatorLoadout?: boolean;
    NemesisAbandonedRewards: string[];
    LastInventorySync: IOid;
    NextRefill?: IMongoDate;
    FoundToday?: IMiscItem[]; // for Argon Crystals
    CustomMarkers?: ICustomMarkers[];
    ActiveLandscapeTraps: any[];
    EvolutionProgress?: IEvolutionProgress[];
    RepVotes: any[];
    LeagueTickets: any[];
    Quests: any[];
    Robotics: any[];
    UsedDailyDeals: any[];
    LibraryPersonalTarget?: string;
    LibraryPersonalProgress: ILibraryPersonalProgress[];
    CollectibleSeries?: ICollectibleEntry[];
    LibraryAvailableDailyTaskInfo?: ILibraryDailyTaskInfo;
    LibraryActiveDailyTaskInfo?: ILibraryDailyTaskInfo;
    HasResetAccount: boolean;
    PendingCoupon?: IPendingCouponClient;
    Harvestable: boolean;
    DeathSquadable: boolean;
    EndlessXP?: IEndlessXpProgress[];
    DialogueHistory?: IDialogueHistoryClient;
    CalendarProgress: ICalendarProgress;
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
    BrandedSuits?: IOid[];
    LockedWeaponGroup?: ILockedWeaponGroupClient;
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
    Name: string;
    Completed?: string[];
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

export interface ICrewMember {
    ItemType: string;
    NemesisFingerprint: number;
    Seed: number;
    HireDate: IMongoDate;
    AssignedRole: number;
    SkillEfficiency: ISkillEfficiency;
    WeaponConfigIdx: number;
    WeaponId: IOid;
    XP: number;
    PowersuitType: string;
    Configs: IItemConfig[];
    SecondInCommand: boolean;
    ItemId: IOid;
}

export interface ISkillEfficiency {
    PILOTING: ICombat;
    GUNNERY: ICombat;
    ENGINEERING: ICombat;
    COMBAT: ICombat;
    SURVIVABILITY: ICombat;
}

export interface ICombat {
    Assigned: number;
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
    CREWMEMBERS = "CrewMemberBin"
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

export interface ICrewShipMembersClient {
    SLOT_A?: ICrewShipMemberClient;
    SLOT_B?: ICrewShipMemberClient;
    SLOT_C?: ICrewShipMemberClient;
}

export interface ICrewShipMembersDatabase {
    SLOT_A?: ICrewShipMemberDatabase;
    SLOT_B?: ICrewShipMemberDatabase;
    SLOT_C?: ICrewShipMemberDatabase;
}

export interface ICrewShipMemberClient {
    ItemId?: IOid;
    NemesisFingerprint?: number;
}

export interface ICrewShipMemberDatabase {
    ItemId?: Types.ObjectId;
    NemesisFingerprint?: number;
}

export interface ICrewShipCustomization {
    CrewshipInterior: IShipExterior;
}

export interface IShipExterior {
    SkinFlavourItem?: string;
    Colors: IColor;
    ShipAttachments?: IShipAttachments;
}

export interface IShipAttachments {
    HOOD_ORNAMENT: string;
}

export interface IFlavourItem {
    ItemType: string;
}

export type IMiscItem = ITypeCount;

// inventory.CrewShips[0].Weapon
export interface ICrewShipWeapon {
    PILOT: ICrewShipPilotWeapon;
    PORT_GUNS: ICrewShipPortGuns;
}

export interface ICrewShipPilotWeapon {
    PRIMARY_A: IEquipmentSelection;
    SECONDARY_A: IEquipmentSelection;
}

export interface ICrewShipPortGuns {
    PRIMARY_A: IEquipmentSelection;
}

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
    AP_POWER: number;
    AP_TACTIC: number;
    AP_DEFENSE: number;
    AP_ATTACK: number;
    AP_WARD: number;
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

export interface IKubrowPetEggClient {
    ItemType: string;
    ExpirationDate: IMongoDate; // seems to be set to 7 days ahead @ 0 UTC
    ItemId: IOid;
}

export interface IKubrowPetEggDatabase {
    ItemType: string;
    _id: Types.ObjectId;
}

export interface IKubrowPetPrint {
    ItemType: KubrowPetPrintItemType;
    Name: string;
    IsMale: boolean;
    Size: number; // seems to be 0.7 to 1.0
    DominantTraits: ITraits;
    RecessiveTraits: ITraits;
    ItemId: IOid;
    InheritedModularParts?: any[];
}

export interface ITraits {
    BaseColor: string;
    SecondaryColor: string;
    TertiaryColor: string;
    AccentColor: string;
    EyeColor: string;
    FurPattern: string;
    Personality: string;
    BodyType: string;
    Head?: string;
    Tail?: string;
}

export enum KubrowPetPrintItemType {
    LotusTypesGameKubrowPetImprintedTraitPrint = "/Lotus/Types/Game/KubrowPet/ImprintedTraitPrint"
}

export interface IKubrowPetDetailsDatabase {
    Name?: string;
    IsPuppy?: boolean;
    HasCollar: boolean;
    PrintsRemaining?: number;
    Status: Status;
    HatchDate?: Date;
    DominantTraits: ITraits;
    RecessiveTraits: ITraits;
    IsMale: boolean;
    Size: number;
}

export interface IKubrowPetDetailsClient extends Omit<IKubrowPetDetailsDatabase, "HatchDate"> {
    HatchDate: IMongoDate;
}

export enum Status {
    StatusAvailable = "STATUS_AVAILABLE",
    StatusStasis = "STATUS_STASIS"
}

export interface ILastSortieRewardClient {
    SortieId: IOid;
    StoreItem: string;
    Manifest: string;
}

export interface ILastSortieRewardDatabase extends Omit<ILastSortieRewardClient, "SortieId"> {
    SortieId: Types.ObjectId;
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

// keep in sync with ILoadoutDatabase
export interface ILoadOutPresets {
    NORMAL: ILoadoutConfigClient[];
    NORMAL_PVP: ILoadoutConfigClient[];
    LUNARO: ILoadoutConfigClient[];
    ARCHWING: ILoadoutConfigClient[];
    SENTINEL: ILoadoutConfigClient[];
    OPERATOR: ILoadoutConfigClient[];
    GEAR: ILoadoutConfigClient[];
    KDRIVE: ILoadoutConfigClient[];
    DATAKNIFE: ILoadoutConfigClient[];
    MECH: ILoadoutConfigClient[];
    OPERATOR_ADULT: ILoadoutConfigClient[];
    DRIFTER: ILoadoutConfigClient[];
}

export enum FocusSchool {
    Attack = "AP_ATTACK",
    Defense = "AP_DEFENSE",
    Power = "AP_POWER",
    Tactic = "AP_TACTIC",
    Ward = "AP_WARD"
}

export interface ILoadoutConfigClient {
    FocusSchool?: FocusSchool;
    PresetIcon?: string;
    Favorite?: boolean;
    n?: string; // Loadout name
    s?: IEquipmentSelection; // Suit
    p?: IEquipmentSelection; // Secondary weapon
    l?: IEquipmentSelection; // Primary weapon
    m?: IEquipmentSelection; // Melee weapon
    h?: IEquipmentSelection; // Gravimag weapon
    a?: IEquipmentSelection; // Necromech exalted weapon
    ItemId: IOid;
    Remove?: boolean; // when client wants to remove a config, it only includes ItemId & Remove.
}

export enum UpgradeType {
    LotusWeaponsGrineerKuvaLichUpgradesInnateDamageRandomMod = "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod"
}

export interface ILoreFragmentScan {
    Progress: number;
    Region?: string;
    ItemType: string;
}

export interface ILotusCustomization extends IItemConfig {
    Persona: string;
}

export interface IMissionDatabase {
    Tag: string;
    Completes: number;
    Tier?: number;
}

export interface IMission extends IMissionDatabase {
    RewardsCooldownTime?: IMongoDate;
}

export interface INemesisBaseClient {
    fp: bigint;
    manifest: string;
    KillingSuit: string;
    killingDamageType: number;
    ShoulderHelmet: string;
    WeaponIdx: number;
    AgentIdx: number;
    BirthNode: string;
    Faction: string;
    Rank: number;
    k: boolean;
    Traded: boolean;
    d: IMongoDate;
    PrevOwners: number;
    SecondInCommand: boolean;
    Weakened: boolean;
}

export interface INemesisBaseDatabase extends Omit<INemesisBaseClient, "d"> {
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

export interface INemesisDatabase extends Omit<INemesisClient, "d"> {
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
    TargetItemId?: string; // likely related to liches
    TargetFingerprint?: string; // likely related to liches
    LongGuns?: IEquipmentDatabase[];
    Pistols?: IEquipmentDatabase[];
    Melee?: IEquipmentDatabase[];
    SuitToUnbrand?: Types.ObjectId;
}

export interface IPendingRecipeClient
    extends Omit<IPendingRecipeDatabase, "CompletionDate" | "LongGuns" | "Pistols" | "Melee" | "SuitToUnbrand"> {
    CompletionDate: IMongoDate;
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

export interface IPersonalGoalProgress {
    Count: number;
    Tag: string;
    Best?: number;
    _id: IOid;
    ReceivedClanReward0?: boolean;
    ReceivedClanReward1?: boolean;
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
    c?: number;
    i?: boolean;
    m?: boolean;
    b?: any[];
}

export interface IRawUpgrade {
    ItemType: string;
    ItemCount: number;
    LastAdded?: IOid;
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
    ShipExterior: IShipExterior;
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

export interface IEndlessXpProgress {
    Category: TEndlessXpCategory;
    Choices: string[];
}

export interface IDialogueHistoryClient {
    YearIteration: number;
    Resets?: number; // added in 38.5.0
    Dialogues?: IDialogueClient[];
}

export interface IDialogueHistoryDatabase {
    YearIteration: number;
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
    SeasonType: "CST_UNDEFINED" | "CST_WINTER" | "CST_SPRING" | "CST_SUMMER" | "CST_FALL";
    LastCompletedDayIdx: number;
    LastCompletedChallengeDayIdx: number;
    ActivatedChallenges: unknown[];
}

export interface ICalendarProgress {
    Version: number;
    Iteration: number;
    YearProgress: { Upgrades: unknown[] };
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
