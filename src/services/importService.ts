import { Types } from "mongoose";
import {
    IEquipmentClient,
    IEquipmentDatabase,
    IOperatorConfigClient,
    IOperatorConfigDatabase
} from "../types/inventoryTypes/commonInventoryTypes";
import { IMongoDate } from "../types/commonTypes";
import {
    equipmentKeys,
    IDialogueClient,
    IDialogueDatabase,
    IDialogueHistoryClient,
    IDialogueHistoryDatabase,
    IInfestedFoundryClient,
    IInfestedFoundryDatabase,
    IInventoryClient,
    ILoadoutConfigClient,
    ILoadOutPresets,
    ISlots,
    IUpgradeClient,
    IUpgradeDatabase,
    IWeaponSkinClient,
    IWeaponSkinDatabase
} from "../types/inventoryTypes/inventoryTypes";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";
import { ILoadoutConfigDatabase, ILoadoutDatabase } from "../types/saveLoadoutTypes";

const convertDate = (value: IMongoDate): Date => {
    return new Date(parseInt(value.$date.$numberLong));
};

const convertOptionalDate = (value: IMongoDate | undefined): Date | undefined => {
    return value ? convertDate(value) : undefined;
};

const convertEquipment = (client: IEquipmentClient): IEquipmentDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid),
        InfestationDate: convertOptionalDate(client.InfestationDate),
        Expiry: convertOptionalDate(client.Expiry),
        UpgradesExpiry: convertOptionalDate(client.UpgradesExpiry)
    };
};

const convertWeaponSkin = (client: IWeaponSkinClient): IWeaponSkinDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

const convertUpgrade = (client: IUpgradeClient): IUpgradeDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

const convertOperatorConfig = (client: IOperatorConfigClient): IOperatorConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

const replaceArray = <T>(arr: T[], replacement: T[]): void => {
    arr.splice(0, arr.length);
    replacement.forEach(x => {
        arr.push(x);
    });
};

const replaceSlots = (db: ISlots, client: ISlots): void => {
    db.Extra = client.Extra;
    db.Slots = client.Slots;
};

const convertInfestedFoundry = (client: IInfestedFoundryClient): IInfestedFoundryDatabase => {
    return {
        ...client,
        LastConsumedSuit: client.LastConsumedSuit ? convertEquipment(client.LastConsumedSuit) : undefined,
        AbilityOverrideUnlockCooldown: convertOptionalDate(client.AbilityOverrideUnlockCooldown)
    };
};

const convertDialogue = (client: IDialogueClient): IDialogueDatabase => {
    return {
        ...client,
        AvailableDate: convertDate(client.AvailableDate),
        AvailableGiftDate: convertDate(client.AvailableGiftDate),
        RankUpExpiry: convertDate(client.RankUpExpiry),
        BountyChemExpiry: convertDate(client.BountyChemExpiry)
    };
};

const convertDialogueHistory = (client: IDialogueHistoryClient): IDialogueHistoryDatabase => {
    return {
        YearIteration: client.YearIteration,
        Dialogues: client.Dialogues ? client.Dialogues.map(convertDialogue) : undefined
    };
};

export const importInventory = (db: TInventoryDatabaseDocument, client: Partial<IInventoryClient>): void => {
    for (const key of equipmentKeys) {
        if (client[key]) {
            replaceArray<IEquipmentDatabase>(db[key], client[key].map(convertEquipment));
        }
    }
    if (client.WeaponSkins) {
        replaceArray<IWeaponSkinDatabase>(db.WeaponSkins, client.WeaponSkins.map(convertWeaponSkin));
    }
    if (client.Upgrades) {
        replaceArray<IUpgradeDatabase>(db.Upgrades, client.Upgrades.map(convertUpgrade));
    }
    for (const key of ["RawUpgrades", "MiscItems"] as const) {
        if (client[key]) {
            db[key].splice(0, db[key].length);
            client[key].forEach(x => {
                db[key].push({
                    ItemType: x.ItemType,
                    ItemCount: x.ItemCount
                });
            });
        }
    }
    for (const key of ["OperatorLoadOuts", "AdultOperatorLoadOuts"] as const) {
        if (client[key]) {
            replaceArray<IOperatorConfigDatabase>(db[key], client[key].map(convertOperatorConfig));
        }
    }
    for (const key of [
        "SuitBin",
        "WeaponBin",
        "SentinelBin",
        "SpaceSuitBin",
        "SpaceWeaponBin",
        "PvpBonusLoadoutBin",
        "PveBonusLoadoutBin",
        "RandomModBin",
        "MechBin",
        "CrewMemberBin",
        "OperatorAmpBin",
        "CrewShipSalvageBin"
    ] as const) {
        if (client[key]) {
            replaceSlots(db[key], client[key]);
        }
    }
    if (client.UseAdultOperatorLoadout) {
        db.UseAdultOperatorLoadout = client.UseAdultOperatorLoadout;
    }
    for (const key of [
        "PlayerLevel",
        "RegularCredits",
        "PremiumCredits",
        "PremiumCreditsFree",
        "FusionPoints",
        "PrimeTokens"
    ] as const) {
        if (client[key]) {
            db[key] = client[key];
        }
    }
    for (const key of ["ThemeStyle", "ThemeBackground", "ThemeSounds", "EquippedInstrument", "FocusAbility"] as const) {
        if (client[key]) {
            db[key] = client[key];
        }
    }
    for (const key of ["EquippedGear", "EquippedEmotes", "NodeIntrosCompleted"] as const) {
        if (client[key]) {
            db[key] = client[key];
        }
    }
    if (client.CurrentLoadOutIds) {
        db.CurrentLoadOutIds = client.CurrentLoadOutIds;
    }
    if (client.Affiliations) {
        db.Affiliations = client.Affiliations;
    }
    if (client.FocusUpgrades) {
        db.FocusUpgrades = client.FocusUpgrades;
    }
    if (client.InfestedFoundry) {
        db.InfestedFoundry = convertInfestedFoundry(client.InfestedFoundry);
    }
    if (client.DialogueHistory) {
        db.DialogueHistory = convertDialogueHistory(client.DialogueHistory);
    }
};

const convertLoadOutConfig = (client: ILoadoutConfigClient): ILoadoutConfigDatabase => {
    const { ItemId, ...rest } = client;
    return {
        ...rest,
        _id: new Types.ObjectId(ItemId.$oid)
    };
};

export const importLoadOutPresets = (db: ILoadoutDatabase, client: ILoadOutPresets): void => {
    db.NORMAL = client.NORMAL.map(convertLoadOutConfig);
    db.SENTINEL = client.SENTINEL.map(convertLoadOutConfig);
    db.ARCHWING = client.ARCHWING.map(convertLoadOutConfig);
    db.NORMAL_PVP = client.NORMAL_PVP.map(convertLoadOutConfig);
    db.LUNARO = client.LUNARO.map(convertLoadOutConfig);
    db.OPERATOR = client.OPERATOR.map(convertLoadOutConfig);
    db.KDRIVE = client.KDRIVE.map(convertLoadOutConfig);
    db.DATAKNIFE = client.DATAKNIFE.map(convertLoadOutConfig);
    db.MECH = client.MECH.map(convertLoadOutConfig);
    db.OPERATOR_ADULT = client.OPERATOR_ADULT.map(convertLoadOutConfig);
    db.DRIFTER = client.DRIFTER.map(convertLoadOutConfig);
};
