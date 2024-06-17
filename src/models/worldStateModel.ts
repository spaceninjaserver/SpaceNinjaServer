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
    Date: Date,
    Icon: String,
    EventStartDate: Date,
    EventEndDate: Date,
    ImageUrl: String,
    Priority: Boolean,
    MobileOnly: Boolean,
    HideEndDateModifier: Boolean,
    Community: Boolean
});

EventSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
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
    Activation: Date,
    Expiry: Date,
    MissionInfo: MissionSchema,
    ForceUnlock: Boolean,
    Tag: String
});

AlertSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const SortieMissionSchema = new Schema<ISortieMission>({
    missionType: String,
    modifierType: String,
    node: String,
    tileset: String
});

SortieMissionSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const LiteSortieSchema = new Schema<ILiteSortie>({
    Activation: Date,
    Expiry: Date,
    Reward: String,
    Seed: String,
    Boss: String,
    Missions: [SortieMissionSchema]
});

LiteSortieSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const SortieSchema = new Schema<ISortie>({
    Activation: Date,
    Expiry: Date,
    Reward: String,
    Seed: String,
    Boss: String,
    Variants: [SortieMissionSchema],
    Twitter: Boolean
});

SortieSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
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
    Activation: Date,
    Expiry: Date,
    Tag: String,
    Seed: String,
    Nodes: [String],
    Jobs: [JobSchema]
});

SyndicateMissionSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const ActiveMissionSchema = new Schema<IActiveMission>({
    Activation: Date,
    Expiry: Date,
    Region: String,
    Seed: String,
    Node: String,
    MissionType: String,
    Modifier: String,
    Hard: Boolean
});

ActiveMissionSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const GlobalUpgradeSchema = new Schema<IGlobalUpgrade>({
    Activation: Date,
    Expiry: Date,
    UpgradeType: String,
    OperationType: String,
    Value: String
});

GlobalUpgradeSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const FlashSaleSchema = new Schema<IFlashSale>(
    {
        TypeName: String,
        StartDate: Date,
        EndDate: Date,
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
    Activation: Date,
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
    }
});

const NodeOverrideSchema = new Schema<INodeOverride>({
    Activation: Date,
    Expiry: Date,
    Node: String,
    Faction: String,
    CustomNpcEncounters: [String],
    LevelOverride: String
});

NodeOverrideSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
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
        Expiry: Date,
        PreviewHiddenUntil: Date,
        FeaturedItem: String
    },
    { _id: false }
);

const VoidTraderSchema = new Schema<IVoidTrader>({
    Activation: Date,
    Expiry: Date,
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
    }
});

const VoidStormSchema = new Schema<IVoidStorm>({
    Activation: Date,
    Expiry: Date,
    Node: String,
    ActiveMissionTier: String
});

VoidStormSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
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
        Activation: Date,
        Expiry: Date,
        StoreItem: String,
        Discount: Number,
        OriginalPrice: Number,
        SalePrice: Number,
        AmountTotal: Number,
        AmountSold: Number
    },
    { _id: false }
);

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
    startDate: Date,
    endDate: Date,
    params: [PVPChallengeInstanceParam],
    isGenerated: Boolean,
    PVPMode: String,
    subChallenges: [Schema.Types.ObjectId],
    Category: String
});

PVPChallengeInstanceSchema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
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
    Activation: Date,
    Expiry: Date,
    Daily: Boolean,
    Challenge: String
});

FeaturedGuildShema.set("toJSON", {
    transform(_document, returnedObject) {
        returnedObject._id = { $oid: returnedObject._id.toString() };
    }
});

const SeasonInfoSchema = new Schema<ISeasonInfo>(
    {
        AffiliationTag: String,
        Season: Number,
        Phase: Number,
        Params: String,
        ActiveChallenges: [ActiveChallengeSchema]
    },
    { _id: false }
);

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
