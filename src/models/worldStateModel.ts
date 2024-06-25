import { model, Schema } from "mongoose";
import {
    IEvent,
    IFlashSale,
    IJob,
    ILink,
    IMessage,
    IPVPChallengeInstance,
    ICategory,
    IPVPChallengeInstanceParam,
    IWorldState,
    IMission,
    IAlert,
    ICountedItems,
    IReward,
    ISortie,
    ILiteSortie,
    ISortieMission,
    ISyndicateMission,
    IActiveMission,
    IGlobalUpgrade,
    IInGameMarket,
    ILandingPage,
    IInvasion,
    IInvasionMissionInfo,
    INodeOverride,
    IVoidTrader,
    IVoidTraderItem,
    IVoidTraderScheduleInfo,
    IVoidStorm,
    IPrimeAccessAvailability,
    IDailyDeal,
    ILibraryInfo,
    IEndlessXpChoice,
    IFeaturedGuild,
    IActiveChallenge,
    ISeasonInfo
} from "@/src/types/worldStateTypes";

const messageSchema = new Schema<IMessage>(
    {
        LanguageCode: String,
        Message: String
    },
    { _id: false }
);

const linkSchema = new Schema<ILink>(
    {
        LanguageCode: String,
        Link: String
    },
    { _id: false }
);

const EventSchema = new Schema<IEvent>({
    Messages: [messageSchema],
    Prop: String,
    Links: [linkSchema],
    Date: Number,
    Icon: String,
    EventStartDate: Number,
    EventEndDate: Number,
    ImageUrl: String,
    Priority: Boolean,
    MobileOnly: Boolean,
    HideEndDateModifier: Boolean,
    Community: Boolean
});

EventSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Date = { $date: { $numberLong: returnedObject.Date.toString() } };
        returnedObject.EventStartDate = { $date: { $numberLong: returnedObject.EventStartDate.toString() } };
        returnedObject.EventEndDate = { $date: { $numberLong: returnedObject.EventEndDate.toString() } };
    }
});

const CountedItemsSchema = new Schema<ICountedItems>(
    {
        ItemType: String,
        ItemCount: Number
    },
    { _id: false }
);

const RewardSchema = new Schema<IReward>(
    {
        credits: Number,
        xp: Number,
        items: [String],
        countedItems: [CountedItemsSchema]
    },
    { _id: false }
);

const MissionSchema = new Schema<IMission>(
    {
        location: String,
        missionType: String,
        faction: String,
        difficulty: Number,
        missionReward: RewardSchema,
        levelOverride: String,
        enemySpec: String,
        minEnemyLevel: Number,
        maxEnemyLevel: Number,
        descText: String,
        maxWaveNum: Number,
        exclusiveWeapon: String,
        nightmare: Boolean,
        archwingRequired: Boolean,
        isSharkwing: Boolean,
        advancedSpawners: [String],
        requiredItems: [String],
        consumeRequiredItems: Boolean,
        vipAgent: Boolean,
        leadersAlwaysAllowed: Boolean,
        goalTag: String,
        levelAuras: [String]
    },
    { _id: false }
);

const AlertSchema = new Schema<IAlert>({
    Activation: Number,
    Expiry: Number,
    MissionInfo: MissionSchema,
    ForceUnlock: Boolean,
    Tag: String
});

AlertSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const SortieMissionSchema = new Schema<ISortieMission>(
    {
        missionType: String,
        modifierType: String,
        node: String,
        tileset: String
    },
    { _id: false }
);

const LiteSortieSchema = new Schema<ILiteSortie>({
    Activation: Number,
    Expiry: Number,
    Reward: String,
    Seed: Number,
    Boss: String,
    Missions: [SortieMissionSchema]
});

LiteSortieSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const SortieSchema = new Schema<ISortie>({
    Activation: Number,
    Expiry: Number,
    Reward: String,
    Seed: Number,
    Boss: String,
    ExtraDrops: [String],
    Variants: [SortieMissionSchema],
    Twitter: Boolean
});

SortieSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const JobSchema = new Schema<IJob>(
    {
        jobType: String,
        rewards: String,
        masteryReq: Number,
        minEnemyLevel: Number,
        maxEnemyLevel: Number,
        xpAmounts: [Number],
        endless: Boolean,
        bonusXpMultiplier: Number,
        locationTag: String,
        isVault: Boolean
    },
    { _id: false }
);

const SyndicateMissionSchema = new Schema<ISyndicateMission>({
    Activation: Number,
    Expiry: Number,
    Tag: String,
    Seed: Number,
    Nodes: [String],
    Jobs: [JobSchema]
});

SyndicateMissionSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const ActiveMissionSchema = new Schema<IActiveMission>({
    Activation: Number,
    Expiry: Number,
    Region: Number,
    Seed: Number,
    Node: String,
    MissionType: String,
    Modifier: String,
    Hard: Boolean
});

ActiveMissionSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const GlobalUpgradeSchema = new Schema<IGlobalUpgrade>({
    Activation: Number,
    Expiry: Number,
    UpgradeType: String,
    OperationType: String,
    Value: String
});

GlobalUpgradeSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const FlashSaleSchema = new Schema<IFlashSale>(
    {
        TypeName: String,
        StartDate: Number,
        EndDate: Number,
        ShowInMarket: Boolean,
        HideFromMarket: Boolean,
        SupporterPack: Boolean,
        Discount: Number,
        RegularOverride: Number,
        PremiumOverride: Number,
        BogoBuy: Number,
        BogoGet: Number
    },
    { _id: false }
);

FlashSaleSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject.StartDate = { $date: { $numberLong: returnedObject.StartDate.toString() } };
        returnedObject.EndDate = { $date: { $numberLong: returnedObject.EndDate.toString() } };
    }
});

const ShopCategorySchema = new Schema<ICategory>(
    {
        CategoryName: String,
        Name: String,
        Icon: String,
        AddToMenu: Boolean,
        Items: [String]
    },
    { _id: false }
);

const LandingPageSchema = new Schema<ILandingPage>(
    {
        Categories: ShopCategorySchema
    },
    { _id: false }
);

const InGameMarketSchema = new Schema<IInGameMarket>(
    {
        LandingPage: LandingPageSchema
    },
    { _id: false }
);

const InvasionMissionInfoSchema = new Schema<IInvasionMissionInfo>(
    {
        seed: Number,
        faction: String
    },
    { _id: false }
);

const InvasionSchema = new Schema<IInvasion>({
    Activation: Number,
    Faction: String,
    DefenderFaction: String,
    Node: String,
    Count: Number,
    Goal: Number,
    LocTag: String,
    Completed: Boolean,
    ChainID: Schema.Types.ObjectId,
    AttackerReward: RewardSchema,
    AttackerMissionInfo: InvasionMissionInfoSchema,
    DefenderReward: RewardSchema,
    DefenderMissionInfo: InvasionMissionInfoSchema
});

InvasionSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
    }
});

const NodeOverrideSchema = new Schema<INodeOverride>({
    Activation: Number,
    Expiry: Number,
    Node: String,
    Faction: String,
    CustomNpcEncounters: [String],
    LevelOverride: String,
    Seed: Number,
    Hide: Boolean
});

NodeOverrideSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        if (returnedObject.Activation !== undefined) {
            returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        }
        if (returnedObject.Expiry !== undefined) {
            returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
        }
    }
});

const VoidTraderItemSchema = new Schema<IVoidTraderItem>(
    {
        ItemType: String,
        PrimePrice: Number,
        RegularPrice: Number
    },
    { _id: false }
);

const VoidTraderScheduleInfoSchema = new Schema<IVoidTraderScheduleInfo>(
    {
        Expiry: Number,
        PreviewHiddenUntil: Number,
        FeaturedItem: String
    },
    { _id: false }
);

VoidTraderScheduleInfoSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
        returnedObject.PreviewHiddenUntil = { $date: { $numberLong: returnedObject.PreviewHiddenUntil.toString() } };
    }
});

const VoidTraderSchema = new Schema<IVoidTrader>({
    Activation: Number,
    Expiry: Number,
    Character: String,
    Node: String,
    Completed: Boolean,
    Manifest: [VoidTraderItemSchema],
    EvergreenManifest: [VoidTraderItemSchema],
    ScheduleInfo: [VoidTraderScheduleInfoSchema]
});

VoidTraderSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const VoidStormSchema = new Schema<IVoidStorm>({
    Activation: Number,
    Expiry: Number,
    Node: String,
    ActiveMissionTier: String
});

VoidStormSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const PrimeAccessAvailabilitySchema = new Schema<IPrimeAccessAvailability>(
    {
        State: String
    },
    { _id: false }
);

const DailyDealSchema = new Schema<IDailyDeal>(
    {
        Activation: Number,
        Expiry: Number,
        StoreItem: String,
        Discount: Number,
        OriginalPrice: Number,
        SalePrice: Number,
        AmountTotal: Number,
        AmountSold: Number
    },
    { _id: false }
);

DailyDealSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const LibraryInfoSchema = new Schema<ILibraryInfo>(
    {
        LastCompletedTargetType: String
    },
    { _id: false }
);

const PVPChallengeInstanceParam = new Schema<IPVPChallengeInstanceParam>(
    {
        n: String,
        v: Number
    },
    { _id: false }
);

const PVPChallengeInstanceSchema = new Schema<IPVPChallengeInstance>({
    challengeTypeRefID: String,
    startDate: Number,
    endDate: Number,
    params: [PVPChallengeInstanceParam],
    isGenerated: Boolean,
    PVPMode: String,
    subChallenges: [Schema.Types.ObjectId],
    Category: String
});

PVPChallengeInstanceSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.startDate = { $date: { $numberLong: returnedObject.startDate.toString() } };
        returnedObject.endDate = { $date: { $numberLong: returnedObject.endDate.toString() } };
    }
});

const EndlessXpChoiceSchema = new Schema<IEndlessXpChoice>(
    {
        Category: String,
        Choices: [String]
    },
    { _id: false }
);

const FeaturedGuildShema = new Schema<IFeaturedGuild>({
    Name: String,
    Tier: Number,
    Emblem: Boolean,
    OriginalPlatform: Number,
    AllianceId: Schema.Types.ObjectId
});

FeaturedGuildShema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const ActiveChallengeSchema = new Schema<IActiveChallenge>({
    Activation: Number,
    Expiry: Number,
    Daily: Boolean,
    Challenge: String
});

ActiveChallengeSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const SeasonInfoSchema = new Schema<ISeasonInfo>(
    {
        AffiliationTag: String,
        Activation: Number,
        Expiry: Number,
        Season: Number,
        Phase: Number,
        Params: String,
        ActiveChallenges: [ActiveChallengeSchema],
        UsedChallenges: [String]
    },
    { _id: false }
);

SeasonInfoSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.UsedChallenges;
        returnedObject.Activation = { $date: { $numberLong: returnedObject.Activation.toString() } };
        returnedObject.Expiry = { $date: { $numberLong: returnedObject.Expiry.toString() } };
    }
});

const WorldStateSchema = new Schema<IWorldState>({
    Events: [EventSchema],
    // Goals: [GoalSchema],
    Alerts: [AlertSchema],
    Sorties: [SortieSchema],
    LiteSorties: [LiteSortieSchema],
    SyndicateMissions: [SyndicateMissionSchema],
    ActiveMissions: [ActiveMissionSchema],
    GlobalUpgrades: [GlobalUpgradeSchema],
    FlashSales: [FlashSaleSchema],
    InGameMarket: InGameMarketSchema,
    Invasions: [InvasionSchema],
    NodeOverrides: [NodeOverrideSchema],
    VoidTraders: [VoidTraderSchema],
    PrimeVaultTraders: [VoidTraderSchema],
    VoidStorms: [VoidStormSchema],
    PrimeAccessAvailability: PrimeAccessAvailabilitySchema,
    DailyDeals: [DailyDealSchema],
    LibraryInfo: LibraryInfoSchema,
    PVPChallengeInstances: [PVPChallengeInstanceSchema],
    ProjectPct: [Number],
    EndlessXpChoices: [EndlessXpChoiceSchema],
    FeaturedGuilds: [FeaturedGuildShema],
    SeasonInfo: SeasonInfoSchema,
    Tmp: String
});

WorldStateSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
        delete returnedObject._id;
    }
});

export const WorldState = model<IWorldState>("WorldState", WorldStateSchema);
