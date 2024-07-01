/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Types } from "mongoose";
import { IOid, IMongoDate } from "../commonTypes";
import {
    ArtifactPolarity,
    IColor,
    IItemConfig,
    IOperatorConfigClient,
    IEquipmentSelection,
    IEquipmentDatabase
} from "@/src/types/inventoryTypes/commonInventoryTypes";

//Document extends will be deleted soon. TODO: delete and migrate uses to ...
export interface IInventoryDatabaseDocument extends IInventoryDatabase, Document {}
export interface IInventoryDatabase
    extends Omit<
        IInventoryResponse,
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
    > {
    accountOwnerId: Types.ObjectId;
    Created: Date;
    TrainingDate: Date; // TrainingDate changed from IMongoDate to Date
    LoadOutPresets: Types.ObjectId; // LoadOutPresets changed from ILoadOutPresets to Types.ObjectId for population
    Mailbox: Types.ObjectId; // Mailbox changed from IMailbox to Types.ObjectId
    GuildId?: Types.ObjectId; // GuildId changed from ?IOid to ?Types.ObjectId
    PendingRecipes: IPendingRecipe[];
    QuestKeys: IQuestKeyDatabase[];
    BlessingCooldown: Date;
    Ships: Types.ObjectId[];
    WeaponSkins: IWeaponSkinDatabase[];
}

export interface IInventoryResponseDocument extends IInventoryResponse, Document {}

export interface IQuestKeyDatabase {
    Progress?: IQuestProgress[];
    unlock?: boolean;
    Completed?: boolean;
    CustomData?: string; //TODO: check whether this actually exists
    ItemType: string;
    CompletionDate?: Date;
}

export interface IFocusUpgrades {
    ItemType: string;
    Level: number;
    IsUniversal: boolean;
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
    "MoaPets"
] as const;

export type TEquipmentKey = (typeof equipmentKeys)[number];

export interface IDuviriInfo {
    Seed: number;
    NumCompletions: number;
}

export interface IMailbox {
    LastInboxId: IOid;
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
    | "SolarMapDeimosName";

//TODO: perhaps split response and database into their own files

export interface IPendingRecipeResponse extends Omit<IPendingRecipe, "CompletionDate"> {
    CompletionDate: IMongoDate;
}
export interface IInventoryResponse {
    Horses: IEquipmentDatabase[];
    DrifterMelee: IEquipmentDatabase[];
    DrifterGuns: IEquipmentDatabase[];
    DuviriInfo: IDuviriInfo;
    Mailbox: IMailbox;
    KahlLoadOuts: IEquipmentDatabase[];
    SubscribedToEmails: number;
    Created: IMongoDate;
    RewardSeed: number;
    RegularCredits: number;
    PremiumCredits: number;
    PremiumCreditsFree: number;
    FusionPoints: number;
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
    DailyAffiliation: number;
    DailyAffiliationPvp: number;
    DailyAffiliationLibrary: number;
    DailyFocus: number;
    GiftsRemaining: number;
    HandlerPoints: number;
    MiscItems: IMiscItem[];
    ChallengesFixVersion: number;
    ChallengeProgress: IChallengeProgress[];
    RawUpgrades: IRawUpgrade[];
    ReceivedStartingGear: boolean;
    Suits: IEquipmentDatabase[];
    LongGuns: IEquipmentDatabase[];
    Pistols: IEquipmentDatabase[];
    Melee: IEquipmentDatabase[];
    Ships: IShipInventory[];
    QuestKeys: IQuestKeyResponse[];
    FlavourItems: IFlavourItem[];
    Scoops: IEquipmentDatabase[];
    TrainingRetriesLeft: number;
    LoadOutPresets: ILoadOutPresets;
    CurrentLoadOutIds: Array<any[] | IOid>;
    Missions: IMission[];
    RandomUpgradesIdentified?: number;
    LastRegionPlayed: TSolarMapRegion;
    XPInfo: ITypeXPItem[];
    Recipes: ITypeCount[];
    WeaponSkins: IWeaponSkinClient[];
    PendingRecipes: IPendingRecipeResponse[];
    TrainingDate: IMongoDate;
    PlayerLevel: number;
    Upgrades: ICrewShipSalvagedWeaponSkin[];
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
    KubrowPetEggs: IKubrowPetEgg[];
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
    SpaceSuits: IEquipmentDatabase[];
    SpaceMelee: IEquipmentDatabase[];
    SpaceGuns: IEquipmentDatabase[];
    ArchwingEnabled: boolean;
    PendingSpectreLoadouts: any[];
    SpectreLoadouts: ISpectreLoadout[];
    SentinelWeapons: IEquipmentDatabase[];
    Sentinels: IEquipmentDatabase[];
    EmailItems: ITypeCount[];
    CompletedSyndicates: string[];
    FocusXP: IFocusXP;
    Wishlist: string[];
    Alignment: IAlignment;
    CompletedSorties: string[];
    LastSortieReward: ILastSortieReward[];
    Drones: IDrone[];
    StepSequencers: IStepSequencer[];
    ActiveAvatarImageType: string;
    KubrowPets: IEquipmentDatabase[];
    ShipDecorations: IConsumable[];
    DailyAffiliationCetus: number;
    DailyAffiliationQuills: number;
    DiscoveredMarkers: IDiscoveredMarker[];
    CompletedJobs: ICompletedJob[];
    FocusAbility: string;
    FocusUpgrades: IFocusUpgrade[];
    OperatorAmps: IEquipmentDatabase[];
    HasContributedToDojo?: boolean;
    HWIDProtectEnabled: boolean;
    KubrowPetPrints: IKubrowPetPrint[];
    AlignmentReplay: IAlignment;
    PersonalGoalProgress: IPersonalGoalProgress[];
    DailyAffiliationSolaris: number;
    SpecialItems: IEquipmentDatabase[];
    ThemeStyle: string;
    ThemeBackground: string;
    ThemeSounds: string;
    BountyScore: number;
    ChallengeInstanceStates: IChallengeInstanceState[];
    LoginMilestoneRewards: string[];
    OperatorLoadOuts: IOperatorConfigClient[];
    DailyAffiliationVentkids: number;
    DailyAffiliationVox: number;
    RecentVendorPurchases: Array<number | string>;
    Hoverboards: IEquipmentDatabase[];
    NodeIntrosCompleted: string[];
    GuildId?: IOid;
    CompletedJobChains: ICompletedJobChain[];
    SeasonChallengeHistory: ISeasonChallenge[];
    MoaPets: IEquipmentDatabase[];
    EquippedInstrument: string;
    InvasionChainProgress: IInvasionChainProgress[];
    DataKnives: IEquipmentDatabase[];
    NemesisHistory: INemesisHistory[];
    LastNemesisAllySpawnTime?: IMongoDate;
    Settings: ISettings;
    PersonalTechProjects: IPersonalTechProject[];
    CrewShips: ICrewShip[];
    PlayerSkills: IPlayerSkills;
    CrewShipAmmo: IConsumable[];
    CrewShipSalvagedWeaponSkins: ICrewShipSalvagedWeaponSkin[];
    CrewShipWeapons: ICrewShipWeapon[];
    CrewShipSalvagedWeapons: ICrewShipWeapon[];
    CrewShipWeaponSkins: ICrewShipSalvagedWeaponSkin[];
    TradeBannedUntil?: IMongoDate;
    PlayedParkourTutorial: boolean;
    SubscribedToEmailsPersonalized: number;
    DailyAffiliationEntrati: number;
    DailyAffiliationNecraloid: number;
    MechSuits: IEquipmentDatabase[];
    InfestedFoundry?: IInfestedFoundry;
    BlessingCooldown: IMongoDate;
    CrewShipHarnesses: IEquipmentDatabase[];
    CrewShipRawSalvage: IConsumable[];
    CrewMembers: ICrewMember[];
    AdultOperatorLoadOuts: IOperatorConfigClient[];
    LotusCustomization: ILotusCustomization;
    UseAdultOperatorLoadout?: boolean;
    DailyAffiliationZariman: number;
    NemesisAbandonedRewards: string[];
    DailyAffiliationKahl: number;
    DailyAffiliationCavia: number;
    LastInventorySync: IOid;
    NextRefill: IMongoDate; // Next time argon crystals will have a decay tick
    FoundToday?: IMiscItem[]; // for Argon Crystals
    ActiveLandscapeTraps: any[];
    EvolutionProgress?: IEvolutionProgress[];
    RepVotes: any[];
    LeagueTickets: any[];
    Quests: any[];
    Robotics: any[];
    UsedDailyDeals: any[];
    LibraryPersonalProgress: ILibraryPersonalProgress[];
    CollectibleSeries: ICollectibleSery[];
    LibraryAvailableDailyTaskInfo: ILibraryAvailableDailyTaskInfo;
    HasResetAccount: boolean;
    PendingCoupon: IPendingCoupon;
    Harvestable: boolean;
    DeathSquadable: boolean;
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
    Extra: number; // can be undefined, but not if used via mongoose
    Slots: number;
}

export interface ICrewShipSalvagedWeaponSkin {
    ItemType: string;
    UpgradeFingerprint?: string;
    ItemId?: IOid;
    _id?: Types.ObjectId;
}

export interface ICrewShipWeapon {
    ItemType: string;
    UpgradeType?: string;
    UpgradeFingerprint?: string;
    Configs?: IItemConfig[];
    UpgradeVer?: number;
    ItemId: IOid;
}

export interface ICrewShip {
    ItemType: string;
    Configs: IItemConfig[];
    Weapon: ICrewshipWeapon;
    Customization: ICustomization;
    ItemName: string;
    RailjackImage: IFlavourItem;
    CrewMembers: ICrewMembers;
    ItemId: IOid;
    _id: Types.ObjectId;
}

export interface ICrewMembers {
    SLOT_A: ISlot;
    SLOT_B: ISlot;
    SLOT_C: ISlot;
}

export interface ISlot {
    ItemId: IOid;
}

export interface ICustomization {
    CrewshipInterior: IShipExterior;
}

export interface IShipExterior {
    SkinFlavourItem?: string;
    Colors: IColor;
    ShipAttachments?: IShipAttachments;
}

export interface IShipAttachments {
    HOOD_ORNAMENT: string; //TODO: Others are probably possible
}

export interface IFlavourItem {
    ItemType: string;
}

export interface IMiscItem {
    ItemCount: number;
    ItemType: string;
}

export interface ICrewshipWeapon {
    PILOT: IPilot;
    PORT_GUNS: IPortGuns;
}

export interface IPortGuns {
    PRIMARY_A: IEquipmentSelection;
}

export interface IPilot extends IPortGuns {
    SECONDARY_A: IEquipmentSelection;
}

export interface IDiscoveredMarker {
    tag: string;
    discoveryState: number[];
}

export interface IDrone {
    ItemType: string;
    CurrentHP: number;
    ItemId: IOid;
    RepairStart?: IMongoDate;
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

export interface IInfestedFoundry {
    Name?: string;
    Resources?: ITypeCount[];
    Slots?: number;
    XP?: number;
    ConsumedSuits?: IConsumedSuit[];
    InvigorationIndex?: number;
    InvigorationSuitOfferings?: string[];
    InvigorationsApplied?: number;
}

export interface IConsumedSuit {
    s: string;
    c?: IColor;
}

export interface IInvasionChainProgress {
    id: IOid;
    count: number;
}

export interface IKubrowPetEgg {
    ItemType: KubrowPetEggItemType;
    ExpirationDate: IMongoDate;
    ItemId: IOid;
}

export enum KubrowPetEggItemType {
    LotusTypesGameKubrowPetEggsKubrowEgg = "/Lotus/Types/Game/KubrowPet/Eggs/KubrowEgg"
}

export interface IKubrowPetPrint {
    ItemType: KubrowPetPrintItemType;
    Name: string;
    IsMale: boolean;
    Size: number;
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

export interface IDetails {
    Name: string;
    IsPuppy: boolean;
    HasCollar: boolean;
    PrintsRemaining: number;
    Status: Status;
    HatchDate: IMongoDate;
    DominantTraits: ITraits;
    RecessiveTraits: ITraits;
    IsMale: boolean;
    Size: number;
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

export interface ILibraryAvailableDailyTaskInfo {
    EnemyTypes: string[];
    EnemyLocTag: string;
    EnemyIcon: string;
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

//this needs to be checked against ILoadoutDatabase
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

export interface IMission {
    Completes: number;
    Tier?: number;
    Tag: string;
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

export interface IPendingCoupon {
    Expiry: IMongoDate;
    Discount: number;
}

export interface IPendingRecipe {
    ItemType: string;
    CompletionDate: Date;
    ItemId: IOid;
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
    LPP_SPACE: number;
    LPP_DRIFTER: number;
    LPS_NONE: number;
    LPS_PILOTING: number;
    LPS_GUNNERY: number;
    LPS_TACTICAL: number;
    LPS_ENGINEERING: number;
    LPS_COMMAND: number;
    LPS_DRIFT_COMBAT: number;
    LPS_DRIFT_RIDING: number;
    LPS_DRIFT_OPPORTUNITY: number;
    LPS_DRIFT_ENDURANCE: number;
}

export interface IQuestKeyResponse extends Omit<IQuestKeyDatabase, "CompletionDate"> {
    CompletionDate?: IMongoDate;
}

export interface IQuestProgress {
    c: number;
    i: boolean;
    m: boolean;
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
    LongGuns: string;
    Melee: string;
    Pistols: string;
    PistolsFeatures: number;
    PistolsModularParts: string[];
    Suits: string;
    ItemType: string;
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
}

export interface IWeaponSkinClient extends IWeaponSkinDatabase {
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
