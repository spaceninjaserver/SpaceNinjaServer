/* eslint-disable @typescript-eslint/no-explicit-any */

import { Document, Types } from "mongoose";
import { Oid } from "./commonTypes";

export interface IInventoryDatabase extends IInventoryResponse {
    accountOwnerId: Types.ObjectId;
}

export interface IInventoryResponse {
    SubscribedToEmails: number;
    Created: Date;
    RewardSeed: number;
    RegularCredits: number;
    PremiumCredits: number;
    PremiumCreditsFree: number;
    FusionPoints: number;
    SuitBin: CrewShipSalvageBinClass;
    WeaponBin: CrewShipSalvageBinClass;
    SentinelBin: CrewShipSalvageBinClass;
    SpaceSuitBin: CrewShipSalvageBinClass;
    SpaceWeaponBin: CrewShipSalvageBinClass;
    PvpBonusLoadoutBin: CrewMemberBinClass;
    PveBonusLoadoutBin: CrewShipSalvageBinClass;
    RandomModBin: CrewShipSalvageBinClass;
    TradesRemaining: number;
    DailyAffiliation: number;
    DailyAffiliationPvp: number;
    DailyAffiliationLibrary: number;
    DailyFocus: number;
    GiftsRemaining: number;
    HandlerPoints: number;
    MiscItems: Consumable[];
    ChallengesFixVersion: number;
    ChallengeProgress: ChallengeProgress[];
    RawUpgrades: RawUpgrade[];
    ReceivedStartingGear: boolean;
    Suits: ISuitDatabase[];
    LongGuns: LongGun[];
    Pistols: LongGun[];
    Melee: Melee[];
    Ships: Ship[];
    QuestKeys: QuestKey[];
    FlavourItems: FlavourItem[];
    Scoops: Scoop[];
    TrainingRetriesLeft: number;
    LoadOutPresets: LoadOutPresets;
    CurrentLoadOutIds: Array<any[] | Oid>;
    Missions: Mission[];
    RandomUpgradesIdentified: number;
    LastRegionPlayed: string;
    XPInfo: EmailItem[];
    Recipes: Consumable[];
    WeaponSkins: WeaponSkin[];
    PendingRecipes: PendingRecipe[];
    TrainingDate: Date;
    PlayerLevel: number;
    Upgrades: CrewShipSalvagedWeaponSkin[];
    EquippedGear: string[];
    DeathMarks: string[];
    FusionTreasures: FusionTreasure[];
    WebFlags: WebFlags;
    CompletedAlerts: string[];
    Consumables: Consumable[];
    LevelKeys: Consumable[];
    TauntHistory: TauntHistory[];
    StoryModeChoice: string;
    PeriodicMissionCompletions: PeriodicMissionCompletion[];
    KubrowPetEggs: KubrowPetEgg[];
    LoreFragmentScans: LoreFragmentScan[];
    EquippedEmotes: string[];
    PendingTrades: PendingTrade[];
    Boosters: Booster[];
    ActiveDojoColorResearch: string;
    SentientSpawnChanceBoosters: SentientSpawnChanceBoosters;
    Affiliations: Affiliation[];
    QualifyingInvasions: any[];
    FactionScores: number[];
    SpaceSuits: Space[];
    SpaceMelee: Space[];
    SpaceGuns: SpaceGun[];
    ArchwingEnabled: boolean;
    PendingSpectreLoadouts: any[];
    SpectreLoadouts: SpectreLoadout[];
    SentinelWeapons: SentinelWeapon[];
    Sentinels: Sentinel[];
    EmailItems: EmailItem[];
    CompletedSyndicates: string[];
    FocusXP: FocusXP;
    Wishlist: string[];
    Alignment: Alignment;
    CompletedSorties: string[];
    LastSortieReward: LastSortieReward[];
    Drones: Drone[];
    StepSequencers: StepSequencer[];
    ActiveAvatarImageType: string;
    KubrowPets: KubrowPet[];
    ShipDecorations: Consumable[];
    OperatorAmpBin: CrewShipSalvageBinClass;
    DailyAffiliationCetus: number;
    DailyAffiliationQuills: number;
    DiscoveredMarkers: DiscoveredMarker[];
    CompletedJobs: CompletedJob[];
    FocusAbility: string;
    FocusUpgrades: FocusUpgrade[];
    OperatorAmps: OperatorAmp[];
    HasContributedToDojo: boolean;
    HWIDProtectEnabled: boolean;
    KubrowPetPrints: KubrowPetPrint[];
    AlignmentReplay: Alignment;
    PersonalGoalProgress: PersonalGoalProgress[];
    DailyAffiliationSolaris: number;
    SpecialItems: SpecialItem[];
    ThemeStyle: string;
    ThemeBackground: string;
    ThemeSounds: string;
    BountyScore: number;
    ChallengeInstanceStates: ChallengeInstanceState[];
    LoginMilestoneRewards: string[];
    OperatorLoadOuts: OperatorLoadOut[];
    DailyAffiliationVentkids: number;
    DailyAffiliationVox: number;
    RecentVendorPurchases: Array<number | string>;
    Hoverboards: Hoverboard[];
    NodeIntrosCompleted: string[];
    CompletedJobChains: CompletedJobChain[];
    SeasonChallengeHistory: SeasonChallengeHistory[];
    MoaPets: MoaPet[];
    EquippedInstrument: string;
    InvasionChainProgress: InvasionChainProgress[];
    DataKnives: DataKnife[];
    NemesisHistory: NemesisHistory[];
    LastNemesisAllySpawnTime: Date;
    Settings: Settings;
    PersonalTechProjects: PersonalTechProject[];
    CrewShips: CrewShip[];
    CrewShipSalvageBin: CrewShipSalvageBinClass;
    PlayerSkills: PlayerSkills;
    CrewShipAmmo: Consumable[];
    CrewShipSalvagedWeaponSkins: CrewShipSalvagedWeaponSkin[];
    CrewShipWeapons: CrewShipWeapon[];
    CrewShipSalvagedWeapons: CrewShipWeapon[];
    CrewShipWeaponSkins: CrewShipSalvagedWeaponSkin[];
    TradeBannedUntil: Date;
    PlayedParkourTutorial: boolean;
    SubscribedToEmailsPersonalized: number;
    MechBin: CrewMemberBinClass;
    DailyAffiliationEntrati: number;
    DailyAffiliationNecraloid: number;
    MechSuits: MechSuit[];
    InfestedFoundry: InfestedFoundry;
    BlessingCooldown: Date;
    CrewMemberBin: CrewMemberBinClass;
    CrewShipHarnesses: CrewShipHarness[];
    CrewShipRawSalvage: Consumable[];
    CrewMembers: CrewMember[];
    AdultOperatorLoadOuts: AdultOperatorLoadOut[];
    LotusCustomization: LotusCustomization;
    UseAdultOperatorLoadout: boolean;
    DailyAffiliationZariman: number;
    NemesisAbandonedRewards: string[];
    DailyAffiliationKahl: number;
    LastInventorySync: Oid;
    NextRefill: Date;
    ActiveLandscapeTraps: any[];
    EvolutionProgress: any[];
    RepVotes: any[];
    LeagueTickets: any[];
    Quests: any[];
    Robotics: any[];
    UsedDailyDeals: any[];
    LibraryPersonalProgress: LibraryPersonalProgress[];
    CollectibleSeries: CollectibleSery[];
    LibraryAvailableDailyTaskInfo: LibraryAvailableDailyTaskInfo;
    HasResetAccount: boolean;
    PendingCoupon: PendingCoupon;
    Harvestable: boolean;
    DeathSquadable: boolean;
}

export interface AdultOperatorLoadOut {
    Skins: string[];
    attcol: Color;
    eyecol: Color;
    facial: Color;
    pricol: Color;
    Upgrades?: string[];
    ItemId: Oid;
}

export interface Color {
    t0?: number;
    t1?: number;
    t2?: number;
    t3?: number;
    en?: number;
    e1?: number;
    m0?: number;
    m1?: number;
}

export interface Affiliation {
    Initiated?: boolean;
    Standing: number;
    Title?: number;
    FreeFavorsEarned?: number[];
    FreeFavorsUsed?: number[];
    Tag: string;
}

export interface Alignment {
    Wisdom: number;
    Alignment: number;
}

export interface Date {
    $date: { $numberLong: string };
}

export interface Booster {
    ExpiryDate: number;
    ItemType: string;
}

export interface ChallengeInstanceState {
    id: Oid;
    Progress: number;
    params: Param[];
    IsRewardCollected: boolean;
}

export interface Param {
    n: string;
    v: string;
}

export interface ChallengeProgress {
    Progress: number;
    Name: string;
    Completed?: string[];
}

export interface CollectibleSery {
    CollectibleType: string;
    Count: number;
    Tracking: string;
    ReqScans: number;
    IncentiveStates: IncentiveState[];
}

export interface IncentiveState {
    threshold: number;
    complete: boolean;
    sent: boolean;
}

export interface CompletedJobChain {
    LocationTag: string;
    Jobs: string[];
}

export interface CompletedJob {
    JobId: string;
    StageCompletions: number[];
}

export interface Consumable {
    ItemCount: number;
    ItemType: string;
}

export interface CrewMemberBinClass {
    Slots: number;
}

export interface CrewMember {
    ItemType: string;
    NemesisFingerprint: number;
    Seed: number;
    HireDate: Date;
    AssignedRole: number;
    SkillEfficiency: SkillEfficiency;
    WeaponConfigIdx: number;
    WeaponId: Oid;
    XP: number;
    PowersuitType: string;
    Configs: CrewMemberConfig[];
    SecondInCommand: boolean;
    ItemId: Oid;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CrewMemberConfig {}

export interface SkillEfficiency {
    PILOTING: Combat;
    GUNNERY: Combat;
    ENGINEERING: Combat;
    COMBAT: Combat;
    SURVIVABILITY: Combat;
}

export interface Combat {
    Assigned: number;
}

export interface CrewShipHarness {
    ItemType: string;
    Configs: CrewShipHarnessConfig[];
    Features: number;
    UpgradeVer: number;
    XP: number;
    Polarity: Polarity[];
    Polarized: number;
    ItemId: Oid;
}

export interface CrewShipHarnessConfig {
    Upgrades?: string[];
}

export interface Polarity {
    Slot: number;
    Value: FocusSchool;
}

export enum FocusSchool {
    ApAny = "AP_ANY",
    ApAttack = "AP_ATTACK",
    ApDefense = "AP_DEFENSE",
    ApPower = "AP_POWER",
    ApPrecept = "AP_PRECEPT",
    ApTactic = "AP_TACTIC",
    ApUmbra = "AP_UMBRA",
    ApUniversal = "AP_UNIVERSAL",
    ApWard = "AP_WARD"
}

export interface CrewShipSalvageBinClass {
    Extra: number;
    Slots: number;
}

export interface CrewShipSalvagedWeaponSkin {
    ItemType: string;
    UpgradeFingerprint?: string;
    ItemId: Oid;
}

export interface CrewShipWeapon {
    ItemType: string;
    UpgradeType?: string;
    UpgradeFingerprint?: string;
    Configs?: CrewShipHarnessConfig[];
    UpgradeVer?: number;
    ItemId: Oid;
}

export interface CrewShip {
    ItemType: string;
    Configs: CrewShipConfig[];
    Weapon: Weapon;
    Customization: Customization;
    ItemName: string;
    RailjackImage: FlavourItem;
    CrewMembers: CrewMembers;
    ItemId: Oid;
}

export interface CrewShipConfig {
    Skins?: string[];
    pricol?: Color;
}

export interface CrewMembers {
    SLOT_A: Slot;
    SLOT_B: Slot;
    SLOT_C: Slot;
}

export interface Slot {
    ItemId: Oid;
}

export interface Customization {
    CrewshipInterior: Terior;
}

export interface Terior {
    SkinFlavourItem: string;
    Colors: Color;
    ShipAttachments?: ShipAttachments;
}

export interface ShipAttachments {
    HOOD_ORNAMENT: string;
}

export interface FlavourItem {
    ItemType: string;
}

export interface Weapon {
    PILOT: Pilot;
    PORT_GUNS: PortGuns;
}

export interface Pilot {
    PRIMARY_A: L;
    SECONDARY_A: L;
}

export interface L {
    ItemId?: Oid;
    mod?: number;
    cus?: number;
    ItemType?: string;
    hide?: boolean;
}

export interface PortGuns {
    PRIMARY_A: L;
}

export interface DataKnife {
    ItemType: string;
    XP: number;
    Configs: DataKnifeConfig[];
    UpgradeVer: number;
    ItemId: Oid;
}

export interface DataKnifeConfig {
    Upgrades?: string[];
    pricol?: Color;
    Skins: string[];
    attcol?: Color;
    sigcol?: Color;
}

export interface DiscoveredMarker {
    tag: string;
    discoveryState: number[];
}

export interface Drone {
    ItemType: string;
    CurrentHP: number;
    ItemId: Oid;
    RepairStart?: Date;
}

export interface EmailItem {
    ItemType: string;
    XP: number;
}

export interface FocusUpgrade {
    ItemType: string;
    Level?: number;
    IsUniversal?: boolean;
}

export interface FocusXP {
    AP_POWER: number;
    AP_TACTIC: number;
    AP_DEFENSE: number;
    AP_ATTACK: number;
    AP_WARD: number;
}

export interface FusionTreasure {
    ItemCount: number;
    ItemType: string;
    Sockets: number;
}

export interface Hoverboard {
    ItemType: string;
    Configs: HoverboardConfig[];
    ModularParts: string[];
    ItemName?: string;
    Polarity?: Polarity[];
    UpgradeVer: number;
    XP: number;
    Features: number;
    ItemId: Oid;
}

export interface HoverboardConfig {
    Upgrades?: string[];
    Skins?: PurpleSkin[];
    pricol?: Color;
    sigcol?: Sigcol;
    attcol?: Color;
}

export enum PurpleSkin {
    Empty = "",
    The5Be4Af71A38E4A9306040E15 = "5be4af71a38e4a9306040e15",
    The5C930Ac3A38E4A24Bc3Ad5De = "5c930ac3a38e4a24bc3ad5de",
    The5C9C6F9857904A7A3B25656B = "5c9c6f9857904a7a3b25656b",
    The5Dd8A8E3A38E4A321A45E6A0 = "5dd8a8e3a38e4a321a45e6a0"
}

export interface Sigcol {
    t3: number;
}

export interface InfestedFoundry {
    Name: string;
    Resources: Resource[];
    Slots: number;
    XP: number;
    ConsumedSuits: ConsumedSuit[];
    InvigorationIndex: number;
    InvigorationSuitOfferings: string[];
    InvigorationsApplied: number;
}

export interface ConsumedSuit {
    s: string;
    c?: Color;
}

export interface Resource {
    ItemType: string;
    Count: number;
}

export interface InvasionChainProgress {
    id: Oid;
    count: number;
}

export interface KubrowPetEgg {
    ItemType: KubrowPetEggItemType;
    ExpirationDate: Date;
    ItemId: Oid;
}

export enum KubrowPetEggItemType {
    LotusTypesGameKubrowPetEggsKubrowEgg = "/Lotus/Types/Game/KubrowPet/Eggs/KubrowEgg"
}

export interface KubrowPetPrint {
    ItemType: KubrowPetPrintItemType;
    Name: string;
    IsMale: boolean;
    Size: number;
    DominantTraits: Traits;
    RecessiveTraits: Traits;
    ItemId: Oid;
    InheritedModularParts?: any[];
}

export interface Traits {
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

export interface KubrowPet {
    ItemType: string;
    Configs: KubrowPetConfig[];
    UpgradeVer: number;
    Details: Details;
    XP?: number;
    Polarized?: number;
    Polarity?: Polarity[];
    Features?: number;
    InfestationDate?: Date;
    InfestationDays?: number;
    InfestationType?: string;
    ItemId: Oid;
    ModularParts?: string[];
}

export interface KubrowPetConfig {
    Skins?: string[];
    pricol?: Color;
    attcol?: Color;
    Upgrades?: string[];
}

export interface Details {
    Name: string;
    IsPuppy: boolean;
    HasCollar: boolean;
    PrintsRemaining: number;
    Status: Status;
    HatchDate: Date;
    DominantTraits: Traits;
    RecessiveTraits: Traits;
    IsMale: boolean;
    Size: number;
}

export enum Status {
    StatusAvailable = "STATUS_AVAILABLE",
    StatusStasis = "STATUS_STASIS"
}

export interface LastSortieReward {
    SortieId: Oid;
    StoreItem: string;
    Manifest: string;
}

export interface LibraryAvailableDailyTaskInfo {
    EnemyTypes: string[];
    EnemyLocTag: string;
    EnemyIcon: string;
    ScansRequired: number;
    RewardStoreItem: string;
    RewardQuantity: number;
    RewardStanding: number;
}

export interface LibraryPersonalProgress {
    TargetType: string;
    Scans: number;
    Completed: boolean;
}

export interface LoadOutPresets {
    NORMAL: Normal[];
    NORMAL_PVP: Archwing[];
    LUNARO: Lunaro[];
    ARCHWING: Archwing[];
    SENTINEL: Archwing[];
    OPERATOR: Archwing[];
    GEAR: Gear[];
    KDRIVE: Kdrive[];
    DATAKNIFE: Archwing[];
    MECH: Mech[];
    OPERATOR_ADULT: Archwing[];
}

export interface Archwing {
    PresetIcon: string;
    Favorite: boolean;
    n?: string;
    s: L;
    l?: L;
    m?: L;
    ItemId: Oid;
    p?: L;
}

export interface Gear {
    n: string;
    s: L;
    p: L;
    l: L;
    m: L;
    ItemId: Oid;
}

export interface Kdrive {
    PresetIcon: string;
    Favorite: boolean;
    s: L;
    ItemId: Oid;
}

export interface Lunaro {
    n: string;
    s: L;
    m: L;
    ItemId: Oid;
}

export interface Mech {
    PresetIcon: string;
    Favorite: boolean;
    s: L;
    h: L;
    a: L;
    ItemId: Oid;
}

export interface Normal {
    FocusSchool: FocusSchool;
    PresetIcon: string;
    Favorite: boolean;
    n: string;
    s: L;
    p: L;
    l: L;
    m: L;
    h: L;
    a?: L;
    ItemId: Oid;
}

export interface LongGun {
    ItemType: string;
    Configs: LongGunConfig[];
    UpgradeVer?: number;
    XP?: number;
    Features?: number;
    ItemId: Oid;
    Polarized?: number;
    Polarity?: Polarity[];
    FocusLens?: string;
    ModSlotPurchases?: number;
    UpgradeType?: UpgradeType;
    UpgradeFingerprint?: string;
    ItemName?: string;
    ModularParts?: string[];
    UnlockLevel?: number;
}

export interface LongGunConfig {
    Upgrades?: string[];
    Skins?: string[];
    pricol?: Color;
    attcol?: Color;
    PvpUpgrades?: string[];
    Name?: string;
}

export enum UpgradeType {
    LotusWeaponsGrineerKuvaLichUpgradesInnateDamageRandomMod = "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod"
}

export interface LoreFragmentScan {
    Progress: number;
    Region?: string;
    ItemType: string;
}

export interface LotusCustomization {
    Upgrades: any[];
    PvpUpgrades: any[];
    Skins: string[];
    pricol: Color;
    attcol: any[];
    sigcol: any[];
    eyecol: any[];
    facial: any[];
    Songs: any[];
    Persona: string;
}

export interface MechSuit {
    ItemType: string;
    Configs: DataKnifeConfig[];
    Features: number;
    UpgradeVer: number;
    XP: number;
    Polarity: Polarity[];
    Polarized: number;
    ItemId: Oid;
}

export interface Melee {
    ItemType: string;
    Configs: MeleeConfig[];
    UpgradeVer?: number;
    XP?: number;
    Features?: number;
    Polarity?: Polarity[];
    Polarized?: number;
    ModSlotPurchases?: number;
    ItemId: Oid;
    FocusLens?: string;
    ModularParts?: string[];
    ItemName?: string;
    UpgradeType?: UpgradeType;
    UpgradeFingerprint?: string;
    UnlockLevel?: number;
}

export interface MeleeConfig {
    Skins?: string[];
    pricol?: Color;
    Upgrades?: string[];
    attcol?: Color;
    eyecol?: OperatorLoadOutSigcol;
    Name?: string;
    PvpUpgrades?: string[];
}

export interface OperatorLoadOutSigcol {
    t0?: number;
    t1?: number;
    en?: number;
}

export interface Mission {
    Completes: number;
    Tier?: number;
    Tag: string;
    RewardsCooldownTime?: Date;
}

export interface MoaPet {
    ItemType: string;
    Configs: KubrowPetConfig[];
    UpgradeVer: number;
    ModularParts: string[];
    XP?: number;
    Features?: number;
    ItemName: string;
    Polarity?: Polarity[];
    ItemId: Oid;
}

export interface NemesisHistory {
    fp: number;
    manifest: Manifest;
    KillingSuit: string;
    killingDamageType: number;
    ShoulderHelmet: string;
    AgentIdx: number;
    BirthNode: BirthNode;
    Rank: number;
    k: boolean;
    d: Date;
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

export interface OperatorAmp {
    ItemType: string;
    Configs: KubrowPetConfig[];
    ModularParts?: string[];
    XP?: number;
    UpgradeVer?: number;
    ItemName?: string;
    Features?: number;
    ItemId: Oid;
}

export interface OperatorLoadOut {
    Skins: string[];
    pricol?: Color;
    attcol?: Color;
    eyecol: Color;
    facial?: Color;
    sigcol?: OperatorLoadOutSigcol;
    OperatorAmp?: Oid;
    Upgrades?: string[];
    AbilityOverride: AbilityOverride;
    ItemId: Oid;
}

export interface AbilityOverride {
    Ability: string;
    Index: number;
}

export interface PendingCoupon {
    Expiry: Date;
    Discount: number;
}

export interface PendingRecipe {
    ItemType: string;
    CompletionDate: Date;
    ItemId: Oid;
}

export interface PendingTrade {
    State: number;
    SelfReady: boolean;
    BuddyReady: boolean;
    Giving?: Giving;
    Revision: number;
    Getting: Getting;
    ItemId: Oid;
    ClanTax?: number;
}

export interface Getting {
    RandomUpgrades?: RandomUpgrade[];
    _SlotOrderInfo: GettingSlotOrderInfo[];
    PremiumCredits?: number;
}

export interface RandomUpgrade {
    UpgradeFingerprint: UpgradeFingerprint;
    ItemType: string;
    ItemId: Oid;
}

export interface UpgradeFingerprint {
    compat: string;
    lim: number;
    lvlReq: number;
    pol: FocusSchool;
    buffs: Buff[];
    curses: Buff[];
}

export interface Buff {
    Tag: string;
    Value: number;
}

export enum GettingSlotOrderInfo {
    Empty = "",
    LotusUpgradesModsRandomizedPlayerMeleeWeaponRandomModRare0 = "/Lotus/Upgrades/Mods/Randomized/PlayerMeleeWeaponRandomModRare:0",
    P = "P"
}

export interface Giving {
    RawUpgrades: Consumable[];
    _SlotOrderInfo: GivingSlotOrderInfo[];
}

export enum GivingSlotOrderInfo {
    Empty = "",
    LotusTypesSentinelsSentinelPreceptsItemVacum = "/Lotus/Types/Sentinels/SentinelPrecepts/ItemVacum",
    LotusUpgradesModsPistolDualStatElectEventPistolMod = "/Lotus/Upgrades/Mods/Pistol/DualStat/ElectEventPistolMod"
}

export interface PeriodicMissionCompletion {
    date: Date;
    tag: string;
    count?: number;
}

export interface PersonalGoalProgress {
    Count: number;
    Tag: string;
    Best?: number;
    _id: Oid;
    ReceivedClanReward0?: boolean;
    ReceivedClanReward1?: boolean;
}

export interface PersonalTechProject {
    State: number;
    ReqCredits: number;
    ItemType: string;
    ReqItems: Consumable[];
    CompletionDate?: Date;
    ItemId: Oid;
    ProductCategory?: string;
    CategoryItemId?: Oid;
    HasContributions?: boolean;
}

export interface PlayerSkills {
    LPP_SPACE: number;
    LPS_GUNNERY: number;
    LPS_PILOTING: number;
    LPS_ENGINEERING: number;
    LPS_TACTICAL: number;
    LPS_COMMAND: number;
}

export interface QuestKey {
    Progress: Progress[];
    unlock: boolean;
    Completed: boolean;
    ItemType: string;
    CompletionDate?: Date;
}

export interface Progress {
    c: number;
    i: boolean;
    m: boolean;
    b?: any[];
}

export interface RawUpgrade {
    ItemCount: number;
    LastAdded: Oid;
    ItemType: string;
}

export interface Scoop {
    ItemType: string;
    Configs: ScoopConfig[];
    UpgradeVer: number;
    ItemId: Oid;
}

export interface ScoopConfig {
    pricol?: Color;
}

export interface SeasonChallengeHistory {
    challenge: string;
    id: string;
}

export interface SentientSpawnChanceBoosters {
    numOceanMissionsCompleted: number;
}

export interface SentinelWeapon {
    ItemType: string;
    Configs: SentinelWeaponConfig[];
    UpgradeVer?: number;
    XP?: number;
    ItemId: Oid;
    Features?: number;
    Polarity?: Polarity[];
    Polarized?: number;
}

export interface SentinelWeaponConfig {
    Skins?: FluffySkin[];
    Upgrades?: string[];
}

export enum FluffySkin {
    Empty = "",
    LotusUpgradesSkinsHolsterCustomizationsGlaiveInPlace = "/Lotus/Upgrades/Skins/HolsterCustomizations/GlaiveInPlace",
    LotusUpgradesSkinsHolsterCustomizationsPistolHipsR = "/Lotus/Upgrades/Skins/HolsterCustomizations/PistolHipsR",
    LotusUpgradesSkinsHolsterCustomizationsRifleUpperBack = "/Lotus/Upgrades/Skins/HolsterCustomizations/RifleUpperBack"
}

export interface Sentinel {
    ItemType: string;
    Configs: KubrowPetConfig[];
    UpgradeVer: number;
    XP: number;
    Features?: number;
    Polarity?: Polarity[];
    Polarized?: number;
    ItemId: Oid;
}

export interface Settings {
    FriendInvRestriction: string;
    GiftMode: string;
    GuildInvRestriction: string;
    ShowFriendInvNotifications: boolean;
    TradingRulesConfirmed: boolean;
}

export interface Ship {
    ItemType: string;
    ShipExterior: Terior;
    AirSupportPower: string;
    ItemId: Oid;
}

export interface SpaceGun {
    ItemType: string;
    Configs: SpaceGunConfig[];
    XP?: number;
    UpgradeVer?: number;
    ItemId: Oid;
    Features?: number;
    Polarized?: number;
    Polarity?: Polarity[];
    UpgradeType?: UpgradeType;
    UpgradeFingerprint?: string;
    ItemName?: string;
}

export interface SpaceGunConfig {
    Skins?: string[];
    pricol?: Color;
    Upgrades?: string[];
}

export interface Space {
    ItemType: string;
    Configs: KubrowPetConfig[];
    XP: number;
    UpgradeVer: number;
    ItemId: Oid;
    Features?: number;
}

export interface SpecialItem {
    ItemType: string;
    Configs: SpecialItemConfig[];
    XP?: number;
    UpgradeVer?: number;
    Features: number;
    ItemId: Oid;
    Polarized?: number;
    Polarity?: Polarity[];
    ModSlotPurchases?: number;
}

export interface SpecialItemConfig {
    Upgrades?: string[];
    pricol?: Color;
    Skins?: string[];
    attcol?: Color;
    eyecol?: PurpleCol;
    sigcol?: PurpleCol;
    Name?: string;
}

export interface PurpleCol {
    en: number;
}

export interface SpectreLoadout {
    LongGuns: string;
    Melee: string;
    Pistols: string;
    PistolsFeatures: number;
    PistolsModularParts: string[];
    Suits: string;
    ItemType: string;
}

export interface StepSequencer {
    NotePacks: NotePacks;
    FingerPrint: string;
    Name: string;
    ItemId: Oid;
}

export interface NotePacks {
    MELODY: string;
    BASS: string;
    PERCUSSION: string;
}

export interface ISuitDocument extends ISuitDatabase, Document {}

export interface ISuitResponse extends ISuitDatabase {
    ItemId: Oid;
}

export interface ISuitDatabase {
    ItemType: string;
    Configs: SuitConfig[];
    UpgradeVer?: number;
    XP?: number;
    InfestationDate?: Date;
    Features?: number;
    Polarity?: Polarity[];
    Polarized?: number;
    ModSlotPurchases?: number;
    ItemId: Oid;
    FocusLens?: string;
    UnlockLevel?: number;
}

export interface SuitConfig {
    Skins?: string[];
    pricol?: Color;
    attcol?: Color;
    eyecol?: Color;
    sigcol?: Color;
    Upgrades?: string[];
    Songs?: Song[];
    Name?: string;
    AbilityOverride?: AbilityOverride;
    PvpUpgrades?: string[];
    ugly?: boolean;
}

export interface Song {
    m?: string;
    b?: string;
    p?: string;
    s: string;
}

export interface TauntHistory {
    node: string;
    state: string;
}

export interface WeaponSkin {
    ItemType: string;
    ItemId: Oid;
}

export interface WebFlags {
    activeBuyPlat: number;
    noShow2FA: boolean;
    Tennocon2018Digital: boolean;
    VisitPrimeAccess: Date;
    VisitTennocon2019: Date;
    enteredSC2019: Date;
    VisitPrimeVault: Date;
    VisitBuyPlatinum: Date;
    ClickedSku_640_Page__en_buyplatinum: Date;
    ClickedSku_640_Page__buyplatinum: Date;
    VisitStarterPack: Date;
    Tennocon2020Digital: boolean;
    Anniversary2021: boolean;
    HitDownloadBtn: Date;
}
