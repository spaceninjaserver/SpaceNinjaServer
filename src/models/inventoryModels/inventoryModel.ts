import { Document, Model, Schema, Types, model } from "mongoose";
import {
    IFlavourItem,
    IRawUpgrade,
    ICrewShipSalvagedWeaponSkin,
    IMiscItem,
    IInventoryDatabase,
    IBooster,
    IInventoryResponse,
    ISlots,
    IMailbox,
    IDuviriInfo,
    IPendingRecipe as IPendingRecipeDatabase,
    IPendingRecipeResponse,
    ITypeCount,
    IFocusXP,
    IFocusUpgrades,
    ITypeXPItem,
    IChallengeProgress,
    IStepSequencer,
    IAffiliation,
    INotePacks,
    ICompletedJobChain,
    ISeasonChallenge,
    IPlayerSkills,
    ISettings,
    IInfestedFoundry,
    IHelminthResource,
    IConsumedSuit,
    IQuestProgress,
    IQuestKeyDatabase,
    IQuestKeyResponse,
    IFusionTreasure,
    ISpectreLoadout,
    IWeaponSkinDatabase,
    ITaunt,
    IPeriodicMissionCompletionDatabase,
    IPeriodicMissionCompletionResponse,
    ILoreFragmentScan,
    IEvolutionProgress,
    IEndlessXpProgress,
    ICrewShipPortGuns,
    ICrewShipCustomization,
    ICrewShipWeapon,
    ICrewShipMembers,
    ICrewShip,
    ICrewShipPilotWeapon,
    IShipExterior,
    IHelminthFoodRecord
} from "../../types/inventoryTypes/inventoryTypes";
import { IOid } from "../../types/commonTypes";
import {
    IAbilityOverride,
    IColor,
    IItemConfig,
    IOperatorConfigDatabase,
    IPolarity,
    IEquipmentDatabase,
    IOperatorConfigClient,
    IArchonCrystalUpgrade
} from "@/src/types/inventoryTypes/commonInventoryTypes";
import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { EquipmentSelectionSchema } from "./loadoutModel";

export const typeCountSchema = new Schema<ITypeCount>({ ItemType: String, ItemCount: Number }, { _id: false });

const focusXPSchema = new Schema<IFocusXP>(
    {
        AP_POWER: Number,
        AP_TACTIC: Number,
        AP_DEFENSE: Number,
        AP_ATTACK: Number,
        AP_WARD: Number
    },
    { _id: false }
);

const focusUpgradesSchema = new Schema<IFocusUpgrades>(
    {
        ItemType: String,
        Level: Number,
        IsUniversal: Boolean
    },
    { _id: false }
);

const pendingRecipeSchema = new Schema<IPendingRecipeDatabase>(
    {
        ItemType: String,
        CompletionDate: Date
    },
    { id: false }
);

pendingRecipeSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() };
});

pendingRecipeSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        (returnedObject as IPendingRecipeResponse).CompletionDate = {
            $date: { $numberLong: (returnedObject as IPendingRecipeDatabase).CompletionDate.getTime().toString() }
        };
    }
});

const polaritySchema = new Schema<IPolarity>(
    {
        Slot: Number,
        Value: String
    },
    { _id: false }
);

const abilityOverrideSchema = new Schema<IAbilityOverride>({
    Ability: String,
    Index: Number
});
export const colorSchema = new Schema<IColor>(
    {
        t0: Number,
        t1: Number,
        t2: Number,
        t3: Number,
        en: Number,
        e1: Number,
        m0: Number,
        m1: Number
    },
    { _id: false }
);

const operatorConfigSchema = new Schema<IOperatorConfigDatabase>(
    {
        Skins: [String],
        pricol: colorSchema,
        attcol: colorSchema,
        sigcol: colorSchema,
        eyecol: colorSchema,
        facial: colorSchema,
        syancol: colorSchema,
        cloth: colorSchema,
        Upgrades: [String],
        Name: String, // not sure if possible in operator
        ugly: Boolean // not sure if possible in operator
    },
    { id: false }
);

operatorConfigSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

operatorConfigSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

///TODO: clearly seperate the different config schemas. (suit and weapon and so on)
const ItemConfigSchema = new Schema<IItemConfig>(
    {
        Skins: [String],
        pricol: colorSchema,
        attcol: colorSchema,
        sigcol: colorSchema,
        eyecol: colorSchema,
        facial: colorSchema,
        syancol: colorSchema,
        Upgrades: [String],
        Songs: {
            type: [
                {
                    m: String,
                    b: String,
                    p: String,
                    s: String
                }
            ],
            default: undefined
        },
        Name: String,
        AbilityOverride: abilityOverrideSchema,
        PvpUpgrades: [String],
        ugly: Boolean
    },
    { _id: false }
);

ItemConfigSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
    }
});

const ArchonCrystalUpgradeSchema = new Schema<IArchonCrystalUpgrade>(
    {
        UpgradeType: String,
        Color: String
    },
    { _id: false }
);

ArchonCrystalUpgradeSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
    }
});

const EquipmentSchema = new Schema<IEquipmentDatabase>(
    {
        ItemType: String,
        Configs: [ItemConfigSchema],
        UpgradeVer: Number,
        XP: Number,
        Features: Number,
        Polarized: Number,
        Polarity: [polaritySchema],
        FocusLens: String,
        ModSlotPurchases: Number,
        CustomizationSlotPurchases: Number,
        UpgradeType: String,
        UpgradeFingerprint: String,
        ItemName: String,
        InfestationDate: Date,
        InfestationDays: Number,
        InfestationType: String,
        ModularParts: { type: [String], default: undefined },
        UnlockLevel: Number,
        Expiry: Date,
        SkillTree: String,
        OffensiveUpgrade: String,
        DefensiveUpgrade: String,
        UpgradesExpiry: Date,
        ArchonCrystalUpgrades: { type: [ArchonCrystalUpgradeSchema], default: undefined }
    },
    { id: false }
);

EquipmentSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

EquipmentSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const boosterSchema = new Schema<IBooster>(
    {
        ExpiryDate: Number,
        ItemType: String
    },
    { _id: false }
);

const RawUpgrades = new Schema<IRawUpgrade>(
    {
        ItemType: String,
        ItemCount: Number
    },
    { id: false }
);

RawUpgrades.virtual("LastAdded").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

RawUpgrades.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

//TODO: find out what this is
const upgradesSchema = new Schema(
    {
        UpgradeFingerprint: String,
        ItemType: String
    },
    { id: false }
);

upgradesSchema.virtual("ItemId").get(function () {
    return toOid(this._id);
});

upgradesSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const slotsBinSchema = new Schema<ISlots>(
    {
        Slots: Number,
        Extra: Number
    },
    { _id: false }
);

const FlavourItemSchema = new Schema(
    {
        ItemType: String
    },
    { _id: false }
);

FlavourItemSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

//  "Mailbox": { "LastInboxId": { "$oid": "123456780000000000000000" } }
const MailboxSchema = new Schema<IMailbox>(
    {
        LastInboxId: {
            type: Schema.Types.ObjectId,
            set: (v: IMailbox["LastInboxId"]): string => v.$oid.toString()
        }
    },
    { id: false, _id: false }
);

MailboxSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
        //TODO: there is a lot of any here
        returnedObject.LastInboxId = toOid(returnedObject.LastInboxId as Types.ObjectId);
    }
});

const DuviriInfoSchema = new Schema<IDuviriInfo>(
    {
        Seed: Number,
        NumCompletions: Number
    },
    {
        _id: false,
        id: false
    }
);

DuviriInfoSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject.__v;
    }
});

const TypeXPItemSchema = new Schema<ITypeXPItem>(
    {
        ItemType: String,
        XP: Number
    },
    { _id: false }
);

const challengeProgressSchema = new Schema<IChallengeProgress>(
    {
        Progress: Number,
        Name: String,
        Completed: [String]
    },
    { _id: false }
);

const notePacksSchema = new Schema<INotePacks>(
    {
        MELODY: String,
        BASS: String,
        PERCUSSION: String
    },
    { _id: false }
);

const StepSequencersSchema = new Schema<IStepSequencer>(
    {
        NotePacks: notePacksSchema,
        FingerPrint: String,
        Name: String
    },
    { id: false }
);

StepSequencersSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

StepSequencersSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const affiliationsSchema = new Schema<IAffiliation>(
    {
        Initiated: Boolean,
        Standing: Number,
        Title: Number,
        FreeFavorsEarned: { type: [Number], default: undefined },
        FreeFavorsUsed: { type: [Number], default: undefined },
        Tag: String
    },
    { _id: false }
);

const completedJobChainsSchema = new Schema<ICompletedJobChain>(
    {
        LocationTag: String,
        Jobs: [String]
    },
    { _id: false }
);

const seasonChallengeHistorySchema = new Schema<ISeasonChallenge>(
    {
        challenge: String,
        id: String
    },
    { _id: false }
);

//TODO: check whether this is complete
const playerSkillsSchema = new Schema<IPlayerSkills>(
    {
        LPP_SPACE: { type: Number, default: 0 },
        LPS_PILOTING: { type: Number, default: 0 },
        LPS_GUNNERY: { type: Number, default: 0 },
        LPS_TACTICAL: { type: Number, default: 0 },
        LPS_ENGINEERING: { type: Number, default: 0 },
        LPS_COMMAND: { type: Number, default: 0 },
        LPP_DRIFTER: { type: Number, default: 0 },
        LPS_DRIFT_COMBAT: { type: Number, default: 0 },
        LPS_DRIFT_RIDING: { type: Number, default: 0 },
        LPS_DRIFT_OPPORTUNITY: { type: Number, default: 0 },
        LPS_DRIFT_ENDURANCE: { type: Number, default: 0 }
    },
    { _id: false }
);

const settingsSchema = new Schema<ISettings>({
    FriendInvRestriction: String,
    GiftMode: String,
    GuildInvRestriction: String,
    ShowFriendInvNotifications: Boolean,
    TradingRulesConfirmed: Boolean
});

const consumedSchuitsSchema = new Schema<IConsumedSuit>(
    {
        s: String,
        c: colorSchema
    },
    { _id: false }
);

const helminthFoodRecordSchema = new Schema<IHelminthFoodRecord>(
    {
        ItemType: String,
        Date: Number
    },
    { _id: false }
);

const helminthResourceSchema = new Schema<IHelminthResource>(
    {
        ItemType: String,
        Count: Number,
        RecentlyConvertedResources: { type: [helminthFoodRecordSchema], default: undefined }
    },
    { _id: false }
);

const infestedFoundrySchema = new Schema<IInfestedFoundry>(
    {
        Name: String,
        Resources: { type: [helminthResourceSchema], default: undefined },
        Slots: Number,
        XP: Number,
        ConsumedSuits: { type: [consumedSchuitsSchema], default: undefined },
        InvigorationIndex: Number,
        InvigorationSuitOfferings: { type: [String], default: undefined },
        InvigorationsApplied: Number,
        LastConsumedSuit: { type: EquipmentSchema, default: undefined },
        AbilityOverrideUnlockCooldown: Date
    },
    { _id: false }
);

infestedFoundrySchema.set("toJSON", {
    transform(_doc, ret, _options) {
        if (ret.AbilityOverrideUnlockCooldown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            ret.AbilityOverrideUnlockCooldown = toMongoDate(ret.AbilityOverrideUnlockCooldown);
        }
    }
});

const questProgressSchema = new Schema<IQuestProgress>({
    c: Number,
    i: Boolean,
    m: Boolean,
    b: []
});

const questKeysSchema = new Schema<IQuestKeyDatabase>(
    {
        Progress: [questProgressSchema],
        unlock: Boolean,
        Completed: Boolean,
        //CustomData: Schema.Types.Mixed,
        CompletionDate: Date,
        ItemType: String
    },
    {
        _id: false
    }
);

questKeysSchema.set("toJSON", {
    transform(_doc, ret, _options) {
        const questKeysDatabase = ret as IQuestKeyDatabase;

        if (questKeysDatabase.CompletionDate) {
            (questKeysDatabase as IQuestKeyResponse).CompletionDate = toMongoDate(questKeysDatabase.CompletionDate);
        }
    }
});

const fusionTreasuresSchema = new Schema<IFusionTreasure>().add(typeCountSchema).add({ Sockets: Number });

const spectreLoadoutsSchema = new Schema<ISpectreLoadout>(
    {
        ItemType: String,
        Suits: String,
        LongGuns: String,
        LongGunsModularParts: { type: [String], default: undefined },
        Pistols: String,
        PistolsModularParts: { type: [String], default: undefined },
        Melee: String,
        MeleeModularParts: { type: [String], default: undefined }
    },
    { _id: false }
);

const weaponSkinsSchema = new Schema<IWeaponSkinDatabase>(
    {
        ItemType: String
    },
    { id: false }
);

weaponSkinsSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() };
});

weaponSkinsSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
    }
});

const tauntSchema = new Schema<ITaunt>(
    {
        node: String,
        state: String
    },
    { _id: false }
);

const periodicMissionCompletionsSchema = new Schema<IPeriodicMissionCompletionDatabase>(
    {
        date: Date,
        tag: String,
        count: Number
    },
    { _id: false }
);

periodicMissionCompletionsSchema.set("toJSON", {
    transform(_doc, ret, _options) {
        const periodicMissionCompletionDatabase = ret as IPeriodicMissionCompletionDatabase;

        (periodicMissionCompletionDatabase as unknown as IPeriodicMissionCompletionResponse).date = toMongoDate(
            periodicMissionCompletionDatabase.date
        );
    }
});

const loreFragmentScansSchema = new Schema<ILoreFragmentScan>(
    {
        Progress: Number,
        Region: String,
        ItemType: String
    },
    { _id: false }
);

const evolutionProgressSchema = new Schema<IEvolutionProgress>(
    {
        Progress: Number,
        Rank: Number,
        ItemType: String
    },
    { _id: false }
);

const endlessXpProgressSchema = new Schema<IEndlessXpProgress>(
    {
        Category: String,
        Choices: [String]
    },
    { _id: false }
);

const crewShipPilotWeaponSchema = new Schema<ICrewShipPilotWeapon>(
    {
        PRIMARY_A: EquipmentSelectionSchema,
        SECONDARY_A: EquipmentSelectionSchema
    },
    { _id: false }
);

const crewShipPortGunsSchema = new Schema<ICrewShipPortGuns>(
    {
        PRIMARY_A: EquipmentSelectionSchema
    },
    { _id: false }
);

const crewShipWeaponSchema = new Schema<ICrewShipWeapon>(
    {
        PILOT: crewShipPilotWeaponSchema,
        PORT_GUNS: crewShipPortGunsSchema
    },
    { _id: false }
);

const shipExteriorSchema = new Schema<IShipExterior>(
    {
        SkinFlavourItem: String,
        Colors: colorSchema,
        ShipAttachments: { HOOD_ORNAMENT: String }
    },
    { _id: false }
);

const crewShipCustomizationSchema = new Schema<ICrewShipCustomization>(
    {
        CrewshipInterior: shipExteriorSchema
    },
    { _id: false }
);

const crewShipMembersSchema = new Schema<ICrewShipMembers>(
    {
        SLOT_A: Schema.Types.ObjectId,
        SLOT_B: Schema.Types.ObjectId,
        SLOT_C: Schema.Types.ObjectId
    },
    { _id: false }
);
crewShipMembersSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ret.SLOT_A = { ItemId: toOid(ret.SLOT_A) };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ret.SLOT_B = { ItemId: toOid(ret.SLOT_B) };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ret.SLOT_C = { ItemId: toOid(ret.SLOT_C) };
    }
});

const crewShipSchema = new Schema<ICrewShip>({
    ItemType: { type: String, required: true },
    Configs: { type: [ItemConfigSchema], default: [] },
    Weapon: { type: crewShipWeaponSchema, default: undefined },
    Customization: { type: crewShipCustomizationSchema, default: undefined },
    ItemName: { type: String, default: "" },
    RailjackImage: { type: FlavourItemSchema, default: undefined },
    CrewMembers: { type: crewShipMembersSchema, default: undefined }
});
crewShipSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() };
});
crewShipSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
    }
});

const inventorySchema = new Schema<IInventoryDatabase, InventoryDocumentProps>(
    {
        accountOwnerId: Schema.Types.ObjectId,
        SubscribedToEmails: Number,
        Created: Date,
        RewardSeed: Number,

        //Credit
        RegularCredits: { type: Number, default: 3000 },
        //Platinum
        PremiumCredits: { type: Number, default: 50 },
        //Gift Platinum(Non trade)
        PremiumCreditsFree: { type: Number, default: 50 },
        //Endo
        FusionPoints: { type: Number, default: 0 },
        //Regal Aya
        PrimeTokens: { type: Number, default: 0 },

        //Slots
        SuitBin: slotsBinSchema,
        WeaponBin: slotsBinSchema,
        SentinelBin: slotsBinSchema,
        SpaceSuitBin: slotsBinSchema,
        SpaceWeaponBin: slotsBinSchema,
        PvpBonusLoadoutBin: slotsBinSchema,
        PveBonusLoadoutBin: slotsBinSchema,
        RandomModBin: slotsBinSchema,
        OperatorAmpBin: slotsBinSchema,
        CrewShipSalvageBin: slotsBinSchema,
        MechBin: slotsBinSchema,
        CrewMemberBin: slotsBinSchema,

        //How many trades do you have left
        TradesRemaining: { type: Number, default: 0 },
        //How many Gift do you have left*(gift spends the trade)
        GiftsRemaining: { type: Number, default: 8 },
        //Curent trade info Giving or Getting items
        PendingTrades: [Schema.Types.Mixed],

        //Syndicate currently being pledged to.
        SupportedSyndicate: String,
        //Curent Syndicates rank\exp
        Affiliations: [affiliationsSchema],
        //Syndicates Missions complate(Navigation->Syndicate)
        CompletedSyndicates: [String],
        //Daily Syndicates Exp
        DailyAffiliation: { type: Number, default: 0 },
        DailyAffiliationPvp: { type: Number, default: 0 },
        DailyAffiliationLibrary: { type: Number, default: 0 },
        DailyAffiliationCetus: { type: Number, default: 0 },
        DailyAffiliationQuills: { type: Number, default: 0 },
        DailyAffiliationSolaris: { type: Number, default: 0 },
        DailyAffiliationVentkids: { type: Number, default: 0 },
        DailyAffiliationVox: { type: Number, default: 0 },
        DailyAffiliationEntrati: { type: Number, default: 0 },
        DailyAffiliationNecraloid: { type: Number, default: 0 },
        DailyAffiliationZariman: { type: Number, default: 0 },
        DailyAffiliationKahl: { type: Number, default: 0 },
        DailyAffiliationCavia: { type: Number, default: 0 },
        DailyAffiliationHex: { type: Number, default: 0 },

        //Daily Focus limit
        DailyFocus: { type: Number, default: 250000 },
        //Focus XP per School
        FocusXP: focusXPSchema,
        //Curent active like Active school focuses is = "Zenurik"
        FocusAbility: String,
        //The treeways of the Focus school.(Active and passive Ability)
        FocusUpgrades: [focusUpgradesSchema],

        //Achievement
        ChallengeProgress: [challengeProgressSchema],

        //Account Item like Ferrite,Form,Kuva etc
        MiscItems: [typeCountSchema],

        //Non Upgrade Mods Example:I have 999 item WeaponElectricityDamageMod (only "ItemCount"+"ItemType")
        RawUpgrades: [RawUpgrades],
        //Upgrade Mods\Riven\Arcane Example:"UpgradeFingerprint"+"ItemType"+""
        Upgrades: [upgradesSchema],

        //Warframe
        Suits: [EquipmentSchema],
        //Primary    Weapon
        LongGuns: [EquipmentSchema],
        //Secondary  Weapon
        Pistols: [EquipmentSchema],
        //Melee      Weapon
        Melee: [EquipmentSchema],
        //Ability Weapon like Ultimate Mech\Excalibur\Ivara etc
        SpecialItems: [EquipmentSchema],
        //The Mandachord(Octavia) is a step sequencer
        StepSequencers: [StepSequencersSchema],

        //Sentinel(like Helios or modular)
        Sentinels: [EquipmentSchema],
        //Any /Sentinels/SentinelWeapons/ (like warframe weapon)
        SentinelWeapons: [EquipmentSchema],
        //Modular Pets
        MoaPets: [EquipmentSchema],

        KubrowPetEggs: [Schema.Types.Mixed],
        //Like PowerSuit Cat\Kubrow or etc Pets
        KubrowPets: [EquipmentSchema],
        //Prints   Cat(3 Prints)\Kubrow(2 Prints) Pets
        KubrowPetPrints: [Schema.Types.Mixed],

        //Item for EquippedGear example:Scaner,LoadoutTechSummon etc
        Consumables: [typeCountSchema],
        //Weel Emotes+Gear
        EquippedEmotes: [String],
        EquippedGear: [String],
        //Equipped Shawzin
        EquippedInstrument: String,
        ReceivedStartingGear: Boolean,

        //to use add SummonItem to Consumables+EquippedGear
        //Archwing need Suits+Melee+Guns
        SpaceSuits: [EquipmentSchema],
        SpaceMelee: [EquipmentSchema],
        SpaceGuns: [EquipmentSchema],
        ArchwingEnabled: Boolean,
        //Mech need Suits+SpaceGuns+SpecialItem
        MechSuits: [EquipmentSchema],
        ///Restoratives/HoverboardSummon (like Suit)
        Hoverboards: [EquipmentSchema],

        //Use Operator\Drifter
        UseAdultOperatorLoadout: Boolean,
        //Operator\Drifter Weapon
        OperatorAmps: [EquipmentSchema],
        //Operator
        OperatorLoadOuts: [operatorConfigSchema],
        //Drifter
        AdultOperatorLoadOuts: [operatorConfigSchema],
        DrifterMelee: [EquipmentSchema],
        DrifterGuns: [EquipmentSchema],
        //ErsatzHorsePowerSuit
        Horses: [EquipmentSchema],

        //LandingCraft like Liset
        Ships: { type: [Schema.Types.ObjectId], ref: "Ships" },
        // /Lotus/Types/Items/ShipDecos/
        ShipDecorations: [typeCountSchema],

        //RailJack Setting(Mods,Skin,Weapon,etc)
        CrewShipHarnesses: [EquipmentSchema],
        //Railjack/Components(https://warframe.fandom.com/wiki/Railjack/Components)
        CrewShipRawSalvage: [Schema.Types.Mixed],

        //Default RailJack
        CrewShips: [crewShipSchema],
        CrewShipAmmo: [typeCountSchema],
        CrewShipWeapons: [Schema.Types.Mixed],
        CrewShipWeaponSkins: [Schema.Types.Mixed],

        //NPC Crew and weapon
        CrewMembers: [Schema.Types.Mixed],
        CrewShipSalvagedWeaponSkins: [Schema.Types.Mixed],
        CrewShipSalvagedWeapons: [Schema.Types.Mixed],

        //Complete Mission\Quests
        Missions: [Schema.Types.Mixed],
        QuestKeys: [questKeysSchema],
        //item like DojoKey or Boss missions key
        LevelKeys: [Schema.Types.Mixed],
        //Active quests
        Quests: [Schema.Types.Mixed],

        //Cosmetics like profile glyphs\Kavasa Prime Kubrow Collar\Game Theme etc
        FlavourItems: [FlavourItemSchema],

        //Lunaro Weapon
        Scoops: [EquipmentSchema],

        //Mastery Rank*(Need item XPInfo to rank up)
        PlayerLevel: { type: Number, default: 0 },
        //Item Mastery Rank exp
        XPInfo: [TypeXPItemSchema],
        //Mastery Rank next availability
        TrainingDate: Date,
        //Retries rank up(3 time)
        TrainingRetriesLeft: Number,

        //you saw last played Region when you opened the star map
        LastRegionPlayed: String,

        //Blueprints for Foundry
        Recipes: [typeCountSchema],
        //Crafting Blueprint(Item Name + CompletionDate)
        PendingRecipes: [pendingRecipeSchema],

        //Skins for Suits, Weapons etc.
        WeaponSkins: [weaponSkinsSchema],

        //Ayatan Item
        FusionTreasures: [fusionTreasuresSchema],
        //only used for Maroo apparently - { "node": "TreasureTutorial", "state": "TS_COMPLETED" }
        TauntHistory: { type: [tauntSchema], default: undefined },

        //noShow2FA,VisitPrimeVault etc
        WebFlags: Schema.Types.Mixed,
        //Id CompletedAlerts
        CompletedAlerts: [String],

        //Warframe\Duviri
        StoryModeChoice: String,

        //Alert->Kuva Siphon
        PeriodicMissionCompletions: [periodicMissionCompletionsSchema],

        //Codex->LoreFragment
        LoreFragmentScans: [loreFragmentScansSchema],

        //Resource,Credit,Affinity etc or Bless any boosters
        Boosters: [boosterSchema],
        BlessingCooldown: Date, // Date convert to IMongoDate

        //the color your clan requests like Items/Research/DojoColors/DojoColorPlainsB
        ActiveDojoColorResearch: String,

        SentientSpawnChanceBoosters: Schema.Types.Mixed,

        QualifyingInvasions: [Schema.Types.Mixed],
        FactionScores: [Number],

        // https://warframe.fandom.com/wiki/Specter_(Tenno)
        PendingSpectreLoadouts: { type: [spectreLoadoutsSchema], default: undefined },
        SpectreLoadouts: { type: [spectreLoadoutsSchema], default: undefined },

        //New Quest Email
        EmailItems: [TypeXPItemSchema],

        //Profile->Wishlist
        Wishlist: [String],

        //https://warframe.fandom.com/wiki/Alignment
        //like "Alignment": { "Wisdom": 9, "Alignment": 1 },
        Alignment: Schema.Types.Mixed,
        AlignmentReplay: Schema.Types.Mixed,

        //https://warframe.fandom.com/wiki/Sortie
        CompletedSorties: [String],
        LastSortieReward: [Schema.Types.Mixed],

        //Resource_Drone[Uselees stuff]
        Drones: [Schema.Types.Mixed],

        //Active profile ico
        ActiveAvatarImageType: String,

        // open location store like EidolonPlainsDiscoverable or OrbVallisCaveDiscoverable
        DiscoveredMarkers: [Schema.Types.Mixed],
        //Open location mission like "JobId" + "StageCompletions"
        CompletedJobs: [Schema.Types.Mixed],

        //Game mission\ivent score example  "Tag": "WaterFight", "Best": 170, "Count": 1258,
        PersonalGoalProgress: [Schema.Types.Mixed],

        //Setting interface Style
        ThemeStyle: String,
        ThemeBackground: String,
        ThemeSounds: String,

        //Daily LoginRewards
        LoginMilestoneRewards: [String],

        //You first Dialog with NPC or use new Item
        NodeIntrosCompleted: [String],

        //Current guild id, if applicable.
        GuildId: { type: Schema.Types.ObjectId, ref: "Guild" },

        //https://warframe.fandom.com/wiki/Heist
        //ProfitTaker(1-4) Example:"LocationTag": "EudicoHeists", "Jobs":Mission name
        CompletedJobChains: [completedJobChainsSchema],
        //Night Wave Challenge
        SeasonChallengeHistory: [seasonChallengeHistorySchema],

        //Cephalon Simaris Entries Example:"TargetType"+"Scans"(1-10)+"Completed": true|false
        LibraryPersonalProgress: [Schema.Types.Mixed],
        //Cephalon Simaris Daily Task
        LibraryAvailableDailyTaskInfo: Schema.Types.Mixed,

        //https://warframe.fandom.com/wiki/Invasion
        InvasionChainProgress: [Schema.Types.Mixed],

        //https://warframe.fandom.com/wiki/Parazon
        DataKnives: [EquipmentSchema],

        Motorcycles: [EquipmentSchema],

        //CorpusLich or GrineerLich
        NemesisAbandonedRewards: [String],
        //CorpusLich\KuvaLich
        NemesisHistory: [Schema.Types.Mixed],
        LastNemesisAllySpawnTime: Schema.Types.Mixed,

        //TradingRulesConfirmed,ShowFriendInvNotifications(Option->Social)
        Settings: settingsSchema,

        //Railjack craft
        //https://warframe.fandom.com/wiki/Rising_Tide
        PersonalTechProjects: [Schema.Types.Mixed],

        //Modulars lvl and exp(Railjack|Duviri)
        //https://warframe.fandom.com/wiki/Intrinsics
        PlayerSkills: { type: playerSkillsSchema, default: {} },

        //TradeBannedUntil data
        TradeBannedUntil: Schema.Types.Mixed,

        //https://warframe.fandom.com/wiki/Helminth
        InfestedFoundry: infestedFoundrySchema,

        NextRefill: Schema.Types.Mixed, // Date, convert to IMongoDate

        //Purchase this new permanent skin from the Lotus customization options in Personal Quarters located in your Orbiter.
        //https://warframe.fandom.com/wiki/Lotus#The_New_War
        LotusCustomization: Schema.Types.Mixed,

        //Progress+Rank+ItemType(ZarimanPumpShotgun)
        //https://warframe.fandom.com/wiki/Incarnon
        EvolutionProgress: { type: [evolutionProgressSchema], default: undefined },

        //Unknown and system
        DuviriInfo: DuviriInfoSchema,
        Mailbox: MailboxSchema,
        KahlLoadOuts: [Schema.Types.Mixed],
        HandlerPoints: Number,
        ChallengesFixVersion: Number,
        PlayedParkourTutorial: Boolean,
        SubscribedToEmailsPersonalized: Number,
        LastInventorySync: Schema.Types.Mixed, // this should be Schema.Types.ObjectId, but older inventories may break with that.
        ActiveLandscapeTraps: [Schema.Types.Mixed],
        RepVotes: [Schema.Types.Mixed],
        LeagueTickets: [Schema.Types.Mixed],
        HasContributedToDojo: Boolean,
        HWIDProtectEnabled: Boolean,
        LoadOutPresets: { type: Schema.Types.ObjectId, ref: "Loadout" },
        CurrentLoadOutIds: [Schema.Types.Mixed],
        RandomUpgradesIdentified: Number,
        BountyScore: Number,
        ChallengeInstanceStates: [Schema.Types.Mixed],
        RecentVendorPurchases: [Schema.Types.Mixed],
        Robotics: [Schema.Types.Mixed],
        UsedDailyDeals: [Schema.Types.Mixed],
        CollectibleSeries: [Schema.Types.Mixed],
        HasResetAccount: { type: Boolean, default: false },

        //Discount Coupon
        PendingCoupon: Schema.Types.Mixed,
        //Like BossAladV,BossCaptainVor come for you on missions % chance
        DeathMarks: [String],
        //Zanuka
        Harvestable: Boolean,
        //Grustag three
        DeathSquadable: Boolean,

        EndlessXP: { type: [endlessXpProgressSchema], default: undefined }
    },
    { timestamps: { createdAt: "Created" } }
);

inventorySchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.accountOwnerId;

        const inventoryDatabase = returnedObject as IInventoryDatabase;
        const inventoryResponse = returnedObject as IInventoryResponse;

        inventoryResponse.TrainingDate = toMongoDate(inventoryDatabase.TrainingDate);
        inventoryResponse.Created = toMongoDate(inventoryDatabase.Created);
        if (inventoryDatabase.GuildId) {
            inventoryResponse.GuildId = toOid(inventoryDatabase.GuildId);
        }
        if (inventoryResponse.BlessingCooldown) {
            inventoryResponse.BlessingCooldown = toMongoDate(inventoryDatabase.BlessingCooldown);
        }
    }
});

// type overwrites for subdocuments/subdocument arrays
type InventoryDocumentProps = {
    Suits: Types.DocumentArray<IEquipmentDatabase>;
    LongGuns: Types.DocumentArray<IEquipmentDatabase>;
    Pistols: Types.DocumentArray<IEquipmentDatabase>;
    Melee: Types.DocumentArray<IEquipmentDatabase>;
    OperatorAmps: Types.DocumentArray<IEquipmentDatabase>;
    FlavourItems: Types.DocumentArray<IFlavourItem>;
    RawUpgrades: Types.DocumentArray<IRawUpgrade>;
    Upgrades: Types.DocumentArray<ICrewShipSalvagedWeaponSkin>;
    MiscItems: Types.DocumentArray<IMiscItem>;
    Boosters: Types.DocumentArray<IBooster>;
    OperatorLoadOuts: Types.DocumentArray<IOperatorConfigClient>;
    SpecialItems: Types.DocumentArray<IEquipmentDatabase>;
    AdultOperatorLoadOuts: Types.DocumentArray<IOperatorConfigClient>; //TODO: this should still contain _id
    MechSuits: Types.DocumentArray<IEquipmentDatabase>;
    Scoops: Types.DocumentArray<IEquipmentDatabase>;
    DataKnives: Types.DocumentArray<IEquipmentDatabase>;
    Motorcycles: Types.DocumentArray<IEquipmentDatabase>;
    DrifterMelee: Types.DocumentArray<IEquipmentDatabase>;
    Sentinels: Types.DocumentArray<IEquipmentDatabase>;
    Horses: Types.DocumentArray<IEquipmentDatabase>;
    PendingRecipes: Types.DocumentArray<IPendingRecipeDatabase>;
    SpaceSuits: Types.DocumentArray<IEquipmentDatabase>;
    SpaceGuns: Types.DocumentArray<IEquipmentDatabase>;
    SpaceMelee: Types.DocumentArray<IEquipmentDatabase>;
    SentinelWeapons: Types.DocumentArray<IEquipmentDatabase>;
    Hoverboards: Types.DocumentArray<IEquipmentDatabase>;
    MoaPets: Types.DocumentArray<IEquipmentDatabase>;
    WeaponSkins: Types.DocumentArray<IWeaponSkinDatabase>;
    CrewShips: Types.DocumentArray<ICrewShip>;
    CrewShipHarnesses: Types.DocumentArray<IEquipmentDatabase>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type InventoryModelType = Model<IInventoryDatabase, {}, InventoryDocumentProps>;

export const Inventory = model<IInventoryDatabase, InventoryModelType>("Inventory", inventorySchema);

// eslint-disable-next-line @typescript-eslint/ban-types
export type TInventoryDatabaseDocument = Document<unknown, {}, IInventoryDatabase> &
    Omit<
        IInventoryDatabase & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        },
        keyof InventoryDocumentProps
    > &
    InventoryDocumentProps;
