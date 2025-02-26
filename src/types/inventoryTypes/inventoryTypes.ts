/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { IOid, IMongoDate } from "../commonTypes";
import {
    ArtifactPolarity,
    IColor,
    IItemConfig,
    IOperatorConfigClient,
    IEquipmentSelection,
    IEquipmentDatabase,
    IEquipmentClient,
    IOperatorConfigDatabase
} from "@/src/types/inventoryTypes/commonInventoryTypes";

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
            | "CrewShipSalvagedWeaponSkins"
            | "CrewShipWeaponSkins"
            | "AdultOperatorLoadOuts"
            | "OperatorLoadOuts"
            | "KahlLoadOuts"
            | "InfestedFoundry"
            | "DialogueHistory"
            | "KubrowPetEggs"
            | "PendingCoupon"
            | "Drones"
            | TEquipmentKey
        >,
        InventoryDatabaseEquipment {
    accountOwnerId: Types.ObjectId;
    Created: Date;
    TrainingDate: Date;
    LoadOutPresets: Types.ObjectId; // LoadOutPresets changed from ILoadOutPresets to Types.ObjectId for population
    Mailbox?: IMailboxDatabase;
    GuildId?: Types.ObjectId;
    PendingRecipes: IPendingRecipe[];
    QuestKeys: IQuestKeyDatabase[];
    BlessingCooldown?: Date;
    Ships: Types.ObjectId[];
    WeaponSkins: IWeaponSkinDatabase[];
    Upgrades: IUpgradeDatabase[];
    CrewShipSalvagedWeaponSkins: IUpgradeDatabase[];
    CrewShipWeaponSkins: IUpgradeDatabase[];
    AdultOperatorLoadOuts: IOperatorConfigDatabase[];
    OperatorLoadOuts: IOperatorConfigDatabase[];
    KahlLoadOuts: IOperatorConfigDatabase[];
    InfestedFoundry?: IInfestedFoundryDatabase;
    DialogueHistory?: IDialogueHistoryDatabase;
    KubrowPetEggs?: IKubrowPetEggDatabase[];
    PendingCoupon?: IPendingCouponDatabase;
    Drones: IDroneDatabase[];
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
    "KubrowPets"
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

export interface IPendingRecipeResponse extends Omit<IPendingRecipe, "CompletionDate"> {
    CompletionDate: IMongoDate;
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
    RewardSeed: number;
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
    CurrentLoadOutIds: IOid[]; //TODO: we store it in the database using this representation as well :/
    Missions: IMission[];
    RandomUpgradesIdentified?: number;
    LastRegionPlayed: TSolarMapRegion;
    XPInfo: ITypeXPItem[];
    Recipes: ITypeCount[];
    WeaponSkins: IWeaponSkinClient[];
    PendingRecipes: IPendingRecipeResponse[];
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
    Upgrades: IUpgradeClient[];
    EquippedGear: string[];
    DeathMarks: string[];
    FusionTreasures: IFusionTreasure[];
    WebFlags: IWebFlags;
    CompletedAlerts: string[];
    Consumables: IConsumable[];
    LevelKeys: IConsumable[];
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
    ArchwingEnabled: boolean;
    PendingSpectreLoadouts?: ISpectreLoadout[];
    SpectreLoadouts?: ISpectreLoadout[];
    EmailItems: ITypeCount[];
    CompletedSyndicates: string[];
    FocusXP?: IFocusXP;
    Wishlist: string[];
    Alignment: IAlignment;
    CompletedSorties: string[];
    LastSortieReward: ILastSortieReward[];
    Drones: IDroneClient[];
    StepSequencers: IStepSequencer[];
    ActiveAvatarImageType: string;
    ShipDecorations: IConsumable[];
    DiscoveredMarkers: IDiscoveredMarker[];
    CompletedJobs: ICompletedJob[];
    FocusAbility?: string;
    FocusUpgrades: IFocusUpgrade[];
    HasContributedToDojo?: boolean;
    HWIDProtectEnabled?: boolean;
    KubrowPetPrints: IKubrowPetPrint[];
    AlignmentReplay: IAlignment;
    PersonalGoalProgress: IPersonalGoalProgress[];
    ThemeStyle: string;
    ThemeBackground: string;
    ThemeSounds: string;
    BountyScore: number;
    ChallengeInstanceStates: IChallengeInstanceState[];
    LoginMilestoneRewards: string[];
    RecentVendorPurchases: Array<number | string>;
    NodeIntrosCompleted: string[];
    GuildId?: IOid;
    CompletedJobChains: ICompletedJobChain[];
    SeasonChallengeHistory: ISeasonChallenge[];
    EquippedInstrument?: string;
    InvasionChainProgress: IInvasionChainProgress[];
    NemesisHistory: INemesisHistory[];
    LastNemesisAllySpawnTime?: IMongoDate;
    Settings: ISettings;
    PersonalTechProjects: IPersonalTechProject[];
    PlayerSkills: IPlayerSkills;
    CrewShipAmmo: IConsumable[];
    CrewShipSalvagedWeaponSkins: IUpgradeClient[];
    CrewShipWeapons: ICrewShipWeapon[];
    CrewShipSalvagedWeapons: ICrewShipWeapon[];
    CrewShipWeaponSkins: IUpgradeClient[];
    TradeBannedUntil?: IMongoDate;
    PlayedParkourTutorial: boolean;
    SubscribedToEmailsPersonalized: number;
    InfestedFoundry?: IInfestedFoundryClient;
    BlessingCooldown?: IMongoDate;
    CrewShipRawSalvage: IConsumable[];
    CrewMembers: ICrewMember[];
    LotusCustomization: ILotusCustomization;
    UseAdultOperatorLoadout?: boolean;
    NemesisAbandonedRewards: string[];
    LastInventorySync: IOid;
    NextRefill: IMongoDate; // Next time argon crystals will have a decay tick
    FoundToday?: IMiscItem[]; // for Argon Crystals
    CustomMarkers?: ICustomMarkers[];
    ActiveLandscapeTraps: any[];
    EvolutionProgress?: IEvolutionProgress[];
    RepVotes: any[];
    LeagueTickets: any[];
    Quests: any[];
    Robotics: any[];
    UsedDailyDeals: any[];
    LibraryPersonalTarget: string;
    LibraryPersonalProgress: ILibraryPersonalProgress[];
    CollectibleSeries: ICollectibleSery[];
    LibraryAvailableDailyTaskInfo?: ILibraryDailyTaskInfo;
    LibraryActiveDailyTaskInfo?: ILibraryDailyTaskInfo;
    HasResetAccount: boolean;
    PendingCoupon?: IPendingCouponClient;
    Harvestable: boolean;
    DeathSquadable: boolean;
    EndlessXP?: IEndlessXpProgress[];
    DialogueHistory?: IDialogueHistoryClient;
    CalendarProgress: ICalendarProgress;
}

export interface IAffiliation {
    Initiated?: boolean;
    Standing: number;
    Title?: number;
    FreeFavorsEarned?: number[];
    FreeFavorsUsed?: number[];
    Tag: string;
}

export interface IAlignment {
    Wisdom: number;
    Alignment: number;
}

export interface IBooster {
    ExpiryDate: number;
    ItemType: string;
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

export interface IChallengeProgress {
    Progress: number;
    Name: string;
    Completed?: string[];
}

export interface ICollectibleSery {
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

export interface IConsumable {
    ItemCount: number;
    ItemType: string;
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
    MECHSUITS = "MechBin",
    PVE_LOADOUTS = "PveBonusLoadoutBin",
    SENTINELS = "SentinelBin"
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
    Name: string;
    IsPuppy: boolean;
    HasCollar: boolean;
    PrintsRemaining: number;
    Status: Status;
    HatchDate: Date;
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

export interface ILastSortieReward {
    SortieId: IOid;
    StoreItem: string;
    Manifest: string;
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

export interface INemesisHistory {
    fp: number;
    manifest: Manifest;
    KillingSuit: string;
    killingDamageType: number;
    ShoulderHelmet: string;
    AgentIdx: number;
    BirthNode: BirthNode;
    Rank: number;
    k: boolean;
    d: IMongoDate;
    GuessHistory?: number[];
    currentGuess?: number;
    Traded?: boolean;
    PrevOwners?: number;
    SecondInCommand?: boolean;
    Faction?: string;
    Weakened?: boolean;
}

export enum BirthNode {
    SolNode181 = "SolNode181",
    SolNode4 = "SolNode4",
    SolNode70 = "SolNode70",
    SolNode76 = "SolNode76"
}

export enum Manifest {
    LotusTypesEnemiesCorpusLawyersLawyerManifest = "/Lotus/Types/Enemies/Corpus/Lawyers/LawyerManifest",
    LotusTypesGameNemesisKuvaLichKuvaLichManifest = "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifest",
    LotusTypesGameNemesisKuvaLichKuvaLichManifestVersionThree = "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionThree",
    LotusTypesGameNemesisKuvaLichKuvaLichManifestVersionTwo = "/Lotus/Types/Game/Nemesis/KuvaLich/KuvaLichManifestVersionTwo"
}

export interface IPendingCouponDatabase {
    Expiry: Date;
    Discount: number;
}

export interface IPendingCouponClient {
    Expiry: IMongoDate;
    Discount: number;
}

export interface IPendingRecipe {
    ItemType: string;
    CompletionDate: Date;
    ItemId: IOid;
    TargetItemId?: string; // likely related to liches
    TargetFingerprint?: string; // likely related to liches
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
    UpgradeFingerprint: IUpgradeFingerprint;
    ItemType: string;
    ItemId: IOid;
}

export interface IUpgradeFingerprint {
    compat: string;
    lim: number;
    lvlReq: number;
    pol: ArtifactPolarity;
    buffs: IBuff[];
    curses: IBuff[];
}

export interface IBuff {
    Tag: string;
    Value: number;
}

export enum GettingSlotOrderInfo {
    Empty = "",
    LotusUpgradesModsRandomizedPlayerMeleeWeaponRandomModRare0 = "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare:0",
    P = "P"
}

export interface IGiving {
    RawUpgrades: IConsumable[];
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

export interface IPersonalTechProject {
    State: number;
    ReqCredits: number;
    ItemType: string;
    ReqItems: IConsumable[];
    CompletionDate?: IMongoDate;
    ItemId: IOid;
    ProductCategory?: string;
    CategoryItemId?: IOid;
    HasContributions?: boolean;
}

export interface IPlayerSkills {
    LPP_NONE: number;
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
    FriendInvRestriction: string;
    GiftMode: string;
    GuildInvRestriction: string;
    ShowFriendInvNotifications: boolean;
    TradingRulesConfirmed: boolean;
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
    Dialogues?: IDialogueClient[];
}

export interface IDialogueHistoryDatabase {
    YearIteration: number;
    Dialogues?: IDialogueDatabase[];
}

export interface IDialogueClient {
    Rank: number;
    Chemistry: number;
    AvailableDate: IMongoDate;
    AvailableGiftDate: IMongoDate;
    RankUpExpiry: IMongoDate;
    BountyChemExpiry: IMongoDate;
    //QueuedDialogues: any[];
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
