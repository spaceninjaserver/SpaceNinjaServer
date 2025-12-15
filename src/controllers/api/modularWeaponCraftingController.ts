import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import {
    getInventory,
    updateCurrency,
    addEquipment,
    addMiscItems,
    applyDefaultUpgrades,
    occupySlot,
    productCategoryToInventoryBin,
    combineInventoryChanges,
    addSpecialItem
} from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { getDefaultUpgrades } from "../../services/itemDataService.ts";
import { modularWeaponTypes } from "../../helpers/modularWeaponHelper.ts";
import { getRandomInt } from "../../services/rngService.ts";
import type { IDefaultUpgrade } from "warframe-public-export-plus";
import { ExportSentinels, ExportWeapons } from "warframe-public-export-plus";
import type { IEquipmentDatabase } from "../../types/equipmentTypes.ts";
import { Status } from "../../types/equipmentTypes.ts";

interface IModularCraftRequest {
    WeaponType: string;
    Parts: string[];
    isWebUi?: boolean;
}

export const modularWeaponCraftingController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IModularCraftRequest>(String(req.body));
    if (!(data.WeaponType in modularWeaponTypes)) {
        throw new Error(`unknown modular weapon type: ${data.WeaponType}`);
    }
    const category = modularWeaponTypes[data.WeaponType];
    const inventory = await getInventory(accountId);

    let defaultUpgrades: IDefaultUpgrade[] | undefined;
    const defaultOverwrites: Partial<IEquipmentDatabase> = {
        ModularParts: data.Parts
    };
    const inventoryChanges: IInventoryChanges = {};
    if (category == "KubrowPets") {
        const traits = {
            "/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit": {
                BaseColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareBase",
                SecondaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareSecondary",
                TertiaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareTertiary",
                AccentColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareAccent",
                EyeColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorRareEyes",
                FurPattern: "/Lotus/Types/Game/InfestedKavatPet/Patterns/InfestedCritterPatternDefault",
                Personality: data.WeaponType,
                BodyType: "/Lotus/Types/Game/CatbrowPet/BodyTypes/InfestedCatbrowPetRegularBodyType",
                Head: "/Lotus/Types/Game/InfestedKavatPet/Heads/InfestedCritterHeadC"
            },
            "/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit": {
                BaseColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorUncommonBase",
                SecondaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorUncommonSecondary",
                TertiaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorUncommonTertiary",
                AccentColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorUncommonAccent",
                EyeColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorUncommonEyes",
                FurPattern: "/Lotus/Types/Game/InfestedKavatPet/Patterns/InfestedCritterPatternDefault",
                Personality: data.WeaponType,
                BodyType: "/Lotus/Types/Game/CatbrowPet/BodyTypes/InfestedCatbrowPetRegularBodyType",
                Head: "/Lotus/Types/Game/InfestedKavatPet/Heads/InfestedCritterHeadB"
            },
            "/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit": {
                BaseColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareBase",
                SecondaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareSecondary",
                TertiaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareTertiary",
                AccentColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareAccent",
                EyeColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorRareEyes",
                FurPattern: "/Lotus/Types/Game/InfestedPredatorPet/Patterns/InfestedPredatorPatternDefault",
                Personality: data.WeaponType,
                BodyType: "/Lotus/Types/Game/KubrowPet/BodyTypes/InfestedKubrowPetBodyType",
                Head: "/Lotus/Types/Game/InfestedPredatorPet/Heads/InfestedPredatorHeadA"
            },
            "/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit": {
                BaseColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorUncommonBase",
                SecondaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorUncommonSecondary",
                TertiaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorUncommonTertiary",
                AccentColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorUncommonAccent",
                EyeColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorUncommonEyes",
                FurPattern: "/Lotus/Types/Game/InfestedPredatorPet/Patterns/InfestedPredatorPatternDefault",
                Personality: data.WeaponType,
                BodyType: "/Lotus/Types/Game/KubrowPet/BodyTypes/InfestedKubrowPetBodyType",
                Head: "/Lotus/Types/Game/InfestedPredatorPet/Heads/InfestedPredatorHeadB"
            },
            "/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit": {
                BaseColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorCommonBase",
                SecondaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorCommonSecondary",
                TertiaryColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorCommonTertiary",
                AccentColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorCommonAccent",
                EyeColor: "/Lotus/Types/Game/InfestedPredatorPet/Colors/InfestedPredatorColorCommonEyes",
                FurPattern: "/Lotus/Types/Game/InfestedPredatorPet/Patterns/InfestedPredatorPatternDefault",
                Personality: data.WeaponType,
                BodyType: "/Lotus/Types/Game/KubrowPet/BodyTypes/InfestedKubrowPetBodyType",
                Head: "/Lotus/Types/Game/InfestedPredatorPet/Heads/InfestedPredatorHeadC"
            },
            "/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit": {
                BaseColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorCommonBase",
                SecondaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorCommonSecondary",
                TertiaryColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorCommonTertiary",
                AccentColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorCommonAccent",
                EyeColor: "/Lotus/Types/Game/InfestedKavatPet/Colors/InfestedKavatColorCommonEyes",
                FurPattern: "/Lotus/Types/Game/InfestedKavatPet/Patterns/InfestedCritterPatternDefault",
                Personality: data.WeaponType,
                BodyType: "/Lotus/Types/Game/CatbrowPet/BodyTypes/InfestedCatbrowPetRegularBodyType",
                Head: "/Lotus/Types/Game/InfestedKavatPet/Heads/InfestedCritterHeadA"
            }
        }[data.WeaponType];

        if (!traits) {
            throw new Error(`unknown KubrowPets type: ${data.WeaponType}`);
        }

        defaultOverwrites.Details = {
            Name: "",
            IsPuppy: false,
            HasCollar: true,
            PrintsRemaining: 2,
            Status: Status.StatusStasis,
            HatchDate: new Date(Math.trunc(Date.now() / 86400000) * 86400000),
            IsMale: !!getRandomInt(0, 1),
            Size: getRandomInt(70, 100) / 100,
            DominantTraits: traits,
            RecessiveTraits: traits
        };

        // Only save mutagen & antigen in the ModularParts.
        defaultOverwrites.ModularParts = [data.Parts[1], data.Parts[2]];

        const meta = ExportSentinels[data.WeaponType];

        for (const specialItem of meta.exalted!) {
            addSpecialItem(inventory, specialItem, inventoryChanges);
        }

        defaultUpgrades = meta.defaultUpgrades;
    } else {
        defaultUpgrades = getDefaultUpgrades(data.Parts);
    }

    if (category == "MoaPets") {
        const weapon = ExportSentinels[data.WeaponType].defaultWeapon;
        if (weapon) {
            const category = ExportWeapons[weapon].productCategory;
            addEquipment(inventory, category, weapon, undefined, inventoryChanges);
            combineInventoryChanges(
                inventoryChanges,
                occupySlot(inventory, productCategoryToInventoryBin(category)!, !!data.isWebUi)
            );
        }
    }
    defaultOverwrites.Configs = applyDefaultUpgrades(inventory, defaultUpgrades, inventoryChanges);
    addEquipment(inventory, category, data.WeaponType, defaultOverwrites, inventoryChanges);
    combineInventoryChanges(
        inventoryChanges,
        occupySlot(inventory, productCategoryToInventoryBin(category)!, !!data.isWebUi)
    );
    if (defaultUpgrades) {
        inventoryChanges.RawUpgrades = defaultUpgrades.map(x => ({ ItemType: x.ItemType, ItemCount: 1 }));
    }

    // Remove credits & parts
    const miscItemChanges = [];
    let currencyChanges = {};
    if (!data.isWebUi) {
        for (const part of data.Parts) {
            miscItemChanges.push({
                ItemType: part,
                ItemCount: -1
            });
        }
        currencyChanges = updateCurrency(
            inventory,
            category == "Hoverboards" ||
                category == "MoaPets" ||
                category == "LongGuns" ||
                category == "Pistols" ||
                category == "KubrowPets"
                ? 5000
                : 4000, // Definitely correct for Melee & OperatorAmps
            false
        );
        addMiscItems(inventory, miscItemChanges);
    }

    await inventory.save();
    // Tell client what we did
    res.json({
        InventoryChanges: {
            ...inventoryChanges,
            ...currencyChanges,
            MiscItems: miscItemChanges
        }
    });
    broadcastInventoryUpdate(req);
};
