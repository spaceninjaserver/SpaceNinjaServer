/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Types } from "mongoose";
import { IOid, IMongoDate } from "../commonTypes";
import {
    IAbilityOverride,
    IColor,
    FocusSchool,
    IPolarity,
    IItemConfig,
    IOperatorConfigClient
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { ISuitDatabase } from "@/src/types/inventoryTypes/SuitTypes";
import { IOperatorLoadOutSigcol, IWeaponDatabase } from "@/src/types/inventoryTypes/weaponTypes";

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

export interface IGenericItem2 {
    ItemType: string;
    ItemName: string;
    ItemId: IOid;
    XP: number;
    UpgradeVer: number;
    Features: number;
    Polarized: number;
    CustomizationSlotPurchases: number;
    ModSlotPurchases: number;
    FocusLens: string;
    Expiry: IMongoDate;
    Polarity: IPolarity[];
    Configs: IItemConfig[];
    ModularParts: string[];
    SkillTree: string;
    UpgradeType: string;
    UpgradeFingerprint: string;
    OffensiveUpgrade: string;
    DefensiveUpgrade: string;
    UpgradesExpiry: IMongoDate;
    ArchonCrystalUpgrades: [];
}

export interface IGenericItem {
    ItemType: string;
    XP?: number;
    Configs: IItemConfig[];
    UpgradeVer: number;
    ItemId: IOid;
    Features?: number;
    Polarity?: IPolarity[];
    Polarized?: number;
    ModSlotPurchases?: number;
    CustomizationSlotPurchases?: number;
}

export interface IGenericItemDatabase extends Omit<IGenericItem, "ItemId"> {
    _id: Types.ObjectId;
}

export type TGenericItemKey = "Suits" | "LongGuns" | "Pistols" | "Melee";

export interface IDuviriInfo {
    Seed: number;
    NumCompletions: number;
}

export interface IMailbox {
    LastInboxId: IOid;
}

//TODO: perhaps split response and database into their own files

export interface IPendingRecipeResponse extends Omit<IPendingRecipe, "CompletionDate"> {
    CompletionDate: IMongoDate;
}
export interface IInventoryResponse {
    Horses: IGenericItem[];
    DrifterMelee: IGenericItem[];
    DrifterGuns: IGenericItem[];
    DuviriInfo: IDuviriInfo;
    Mailbox: IMailbox;
    KahlLoadOuts: IGenericItem[];
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
    Suits: ISuitDatabase[];
    LongGuns: IWeaponDatabase[];
    Pistols: IWeaponDatabase[];
    Melee: IWeaponDatabase[];
    Ships: IShipInventory[];
    QuestKeys: IQuestKeyResponse[];
    FlavourItems: IFlavourItem[];
    Scoops: IGenericItem[];
    TrainingRetriesLeft: number;
    LoadOutPresets: ILoadOutPresets;
    CurrentLoadOutIds: Array<any[] | IOid>;
    Missions: IMission[];
    RandomUpgradesIdentified: number;
    LastRegionPlayed: string;
    XPInfo: ITypeXPItem[];
    Recipes: ITypeCount[];
    WeaponSkins: IWeaponSkin[];
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
    TauntHistory: ITauntHistory[];
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
    SpaceSuits: IGenericItem[];
    SpaceMelee: IGenericItem[];
    SpaceGuns: ISpaceGun[];
    ArchwingEnabled: boolean;
    PendingSpectreLoadouts: any[];
    SpectreLoadouts: ISpectreLoadout[];
    SentinelWeapons: IWeaponDatabase[];
    Sentinels: IWeaponDatabase[];
    EmailItems: ITypeXPItem[];
    CompletedSyndicates: string[];
    FocusXP: IFocusXP;
    Wishlist: string[];
    Alignment: IAlignment;
    CompletedSorties: string[];
    LastSortieReward: ILastSortieReward[];
    Drones: IDrone[];
    StepSequencers: IStepSequencer[];
    ActiveAvatarImageType: string;
    KubrowPets: IKubrowPet[];
    ShipDecorations: IConsumable[];
    DailyAffiliationCetus: number;
    DailyAffiliationQuills: number;
    DiscoveredMarkers: IDiscoveredMarker[];
    CompletedJobs: ICompletedJob[];
    FocusAbility: string;
    FocusUpgrades: IFocusUpgrade[];
    OperatorAmps: IOperatorAmp[];
    HasContributedToDojo: boolean;
    HWIDProtectEnabled: boolean;
    KubrowPetPrints: IKubrowPetPrint[];
    AlignmentReplay: IAlignment;
    PersonalGoalProgress: IPersonalGoalProgress[];
    DailyAffiliationSolaris: number;
    SpecialItems: IGenericItem[];
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
    Hoverboards: IHoverboard[];
    NodeIntrosCompleted: string[];
    GuildId?: IOid;
    CompletedJobChains: ICompletedJobChain[];
    SeasonChallengeHistory: ISeasonChallengeHistory[];
    MoaPets: IMoaPet[];
    EquippedInstrument: string;
    InvasionChainProgress: IInvasionChainProgress[];
    DataKnives: IGenericItem[];
    NemesisHistory: INemesisHistory[];
    LastNemesisAllySpawnTime: IMongoDate;
    Settings: ISettings;
    PersonalTechProjects: IPersonalTechProject[];
    CrewShips: ICrewShip[];
    PlayerSkills: IPlayerSkills;
    CrewShipAmmo: IConsumable[];
    CrewShipSalvagedWeaponSkins: ICrewShipSalvagedWeaponSkin[];
    CrewShipWeapons: ICrewShipWeapon[];
    CrewShipSalvagedWeapons: ICrewShipWeapon[];
    CrewShipWeaponSkins: ICrewShipSalvagedWeaponSkin[];
    TradeBannedUntil: IMongoDate;
    PlayedParkourTutorial: boolean;
    SubscribedToEmailsPersonalized: number;
    DailyAffiliationEntrati: number;
    DailyAffiliationNecraloid: number;
    MechSuits: ISuitDatabase[];
    InfestedFoundry: IInfestedFoundry;
    BlessingCooldown: IMongoDate;
    CrewShipHarnesses: ICrewShipHarness[];
    CrewShipRawSalvage: IConsumable[];
    CrewMembers: ICrewMember[];
    AdultOperatorLoadOuts: IOperatorConfigClient[];
    LotusCustomization: ILotusCustomization;
    UseAdultOperatorLoadout: boolean;
    DailyAffiliationZariman: number;
    NemesisAbandonedRewards: string[];
    DailyAffiliationKahl: number;
    LastInventorySync: IOid;
    NextRefill: IMongoDate;
    ActiveLandscapeTraps: any[];
    EvolutionProgress: any[];
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

export interface IAdultOperatorLoadOut {
    Skins: string[];
    attcol: IColor;
    eyecol: IColor;
    facial: IColor;
    pricol: IColor;
    Upgrades?: string[];
    ItemId: IOid;
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
    Configs: ICrewMemberConfig[];
    SecondInCommand: boolean;
    ItemId: IOid;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ICrewMemberConfig {}

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

export interface ICrewShipHarness {
    ItemType: string;
    Configs: ICrewShipHarnessConfig[];
    Features: number;
    UpgradeVer: number;
    XP: number;
    Polarity: IPolarity[];
    Polarized: number;
    ItemId: IOid;
}

export interface ICrewShipHarnessConfig {
    Upgrades?: string[];
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
    Configs?: ICrewShipHarnessConfig[];
    UpgradeVer?: number;
    ItemId: IOid;
}

export interface ICrewShip {
    ItemType: string;
    Configs: ICrewShipConfig[];
    Weapon: ICrewshipWeapon;
    Customization: ICustomization;
    ItemName: string;
    RailjackImage: IFlavourItem;
    CrewMembers: ICrewMembers;
    ItemId: IOid;
}

export interface ICrewShipConfig {
    Skins?: string[];
    pricol?: IColor;
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

//TODO: check whether it makes sense to use this specifity of color.
export interface IShipExteriorColors {
    t0: number;
    t1: number;
    t2: number;
    t3: number;
    m0: number;
    en: number;
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

export interface IPilot {
    PRIMARY_A: IL;
    SECONDARY_A: IL;
}

// L? Bozo.
export interface IL {
    ItemId?: IOid;
    mod?: number;
    cus?: number;
    ItemType?: string;
    hide?: boolean;
}

export interface IPortGuns {
    PRIMARY_A: IL;
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

export interface IHoverboard {
    ItemType: string;
    Configs: IHoverboardConfig[];
    ModularParts: string[];
    ItemName?: string;
    Polarity?: IPolarity[];
    UpgradeVer: number;
    XP: number;
    Features: number;
    ItemId: IOid;
}

export interface IHoverboardConfig {
    Upgrades?: string[];
    Skins?: IPurpleSkin[];
    pricol?: IColor;
    sigcol?: ISigcol;
    attcol?: IColor;
}

export enum IPurpleSkin {
    Empty = "",
    The5Be4Af71A38E4A9306040E15 = "5be4af71a38e4a9306040e15",
    The5C930Ac3A38E4A24Bc3Ad5De = "5c930ac3a38e4a24bc3ad5de",
    The5C9C6F9857904A7A3B25656B = "5c9c6f9857904a7a3b25656b",
    The5Dd8A8E3A38E4A321A45E6A0 = "5dd8a8e3a38e4a321a45e6a0"
}

export interface ISigcol {
    t3: number;
}

export interface IInfestedFoundry {
    Name: string;
    Resources: ITypeCount[];
    Slots: number;
    XP: number;
    ConsumedSuits: IConsumedSuit[];
    InvigorationIndex: number;
    InvigorationSuitOfferings: string[];
    InvigorationsApplied: number;
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
    Tail?: Tail;
}

export enum Tail {
    Empty = "",
    LotusTypesGameCatbrowPetTailsCatbrowTailA = "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailA",
    LotusTypesGameCatbrowPetTailsCatbrowTailB = "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailB",
    LotusTypesGameCatbrowPetTailsCatbrowTailC = "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailC",
    LotusTypesGameCatbrowPetTailsCatbrowTailD = "/Lotus/Types/Game/CatbrowPet/Tails/CatbrowTailD"
}

export enum KubrowPetPrintItemType {
    LotusTypesGameKubrowPetImprintedTraitPrint = "/Lotus/Types/Game/KubrowPet/ImprintedTraitPrint"
}

export interface IKubrowPet {
    ItemType: string;
    Configs: IKubrowPetConfig[];
    UpgradeVer: number;
    Details: IDetails;
    XP?: number;
    Polarized?: number;
    Polarity?: IPolarity[];
    Features?: number;
    InfestationDate?: IMongoDate;
    InfestationDays?: number;
    InfestationType?: string;
    ItemId: IOid;
    ModularParts?: string[];
}

export interface IKubrowPetConfig {
    Skins?: string[];
    pricol?: IColor;
    attcol?: IColor;
    Upgrades?: string[];
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
    NORMAL: INormal[];
    NORMAL_PVP: IArchwing[];
    LUNARO: ILunaro[];
    ARCHWING: IArchwing[];
    SENTINEL: IArchwing[];
    OPERATOR: IArchwing[];
    GEAR: IGear[];
    KDRIVE: IKdrive[];
    DATAKNIFE: IArchwing[];
    MECH: IMech[];
    OPERATOR_ADULT: IArchwing[];
}

export interface IArchwing {
    PresetIcon: string;
    Favorite: boolean;
    n?: string;
    s: IL;
    l?: IL;
    m?: IL;
    ItemId: IOid;
    p?: IL;
}

export interface IGear {
    n: string;
    s: IL;
    p: IL;
    l: IL;
    m: IL;
    ItemId: IOid;
}

export interface IKdrive {
    PresetIcon: string;
    Favorite: boolean;
    s: IL;
    ItemId: IOid;
}

export interface ILunaro {
    n: string;
    s: IL;
    m: IL;
    ItemId: IOid;
}

export interface IMech {
    PresetIcon: string;
    Favorite: boolean;
    s: IL;
    h: IL;
    a: IL;
    ItemId: IOid;
}

export interface INormal {
    FocusSchool: FocusSchool;
    PresetIcon: string;
    Favorite: boolean;
    n: string;
    s: IL;
    p: IL;
    l: IL;
    m: IL;
    h: IL;
    a?: IL;
    ItemId: IOid;
}

export enum UpgradeType {
    LotusWeaponsGrineerKuvaLichUpgradesInnateDamageRandomMod = "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod"
}

export interface ILoreFragmentScan {
    Progress: number;
    Region?: string;
    ItemType: string;
}

export interface ILotusCustomization {
    Upgrades: any[];
    PvpUpgrades: any[];
    Skins: string[];
    pricol: IColor;
    attcol: any[];
    sigcol: any[];
    eyecol: any[];
    facial: any[];
    Songs: any[];
    Persona: string;
}

export interface IMission {
    Completes: number;
    Tier?: number;
    Tag: string;
    RewardsCooldownTime?: IMongoDate;
}

export interface IMoaPet {
    ItemType: string;
    Configs: IKubrowPetConfig[];
    UpgradeVer: number;
    ModularParts: string[];
    XP?: number;
    Features?: number;
    ItemName: string;
    Polarity?: IPolarity[];
    ItemId: IOid;
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

export interface IOperatorAmp {
    ItemType: string;
    Configs: IKubrowPetConfig[];
    ModularParts?: string[];
    XP?: number;
    UpgradeVer?: number;
    ItemName?: string;
    Features?: number;
    ItemId: IOid;
}

export interface IOperatorLoadOut {
    Skins: string[];
    pricol?: IColor;
    attcol?: IColor;
    eyecol: IColor;
    facial?: IColor;
    sigcol?: IOperatorLoadOutSigcol;
    OperatorAmp?: IOid;
    Upgrades?: string[];
    AbilityOverride: IAbilityOverride;
    ItemId: IOid;
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
    pol: FocusSchool;
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

export interface ISeasonChallengeHistory {
    challenge: string;
    id: string;
}

export interface ISeasonChallengeCompletions {
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

export interface ISpaceGun {
    ItemType: string;
    Configs: ISpaceGunConfig[];
    XP?: number;
    UpgradeVer?: number;
    ItemId: IOid;
    Features?: number;
    Polarized?: number;
    Polarity?: IPolarity[];
    UpgradeType?: UpgradeType;
    UpgradeFingerprint?: string;
    ItemName?: string;
}

export interface ISpaceGunConfig {
    Skins?: string[];
    pricol?: IColor;
    Upgrades?: string[];
}

export interface IPurpleCol {
    en: number;
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
    ItemId: IOid;
}

export interface INotePacks {
    MELODY: string;
    BASS: string;
    PERCUSSION: string;
}

export interface ITauntHistory {
    node: string;
    state: string;
}

export interface IWeaponSkin {
    ItemType: string;
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
