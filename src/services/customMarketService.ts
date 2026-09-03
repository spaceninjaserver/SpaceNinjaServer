import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { repoDir } from "../helpers/pathHelper.ts";
import { toMongoDate2 } from "../helpers/inventoryHelpers.ts";
import type { IWorldState } from "../types/worldStateTypes.ts";
import varzia from "../constants/varzia.ts";
import { BV_LATEST } from "../constants/gameVersions.ts";

export type TCustomMarketCurrency = "credits" | "platinum";

export interface ICustomMarketCategory {
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
}

export interface ICustomMarketItem {
    typeName: string;
    categoryId: string;
    enabled: boolean;
    currency: TCustomMarketCurrency;
    price: number;
}

export interface ICustomMarketCatalog {
    version: 1;
    enabled: boolean;
    useMetadataPatch: boolean;
    categories: ICustomMarketCategory[];
    items: ICustomMarketItem[];
}

export const customMarketCatalogPath = path.join(repoDir, "customMarket", "catalog.json");

const emptyCatalog = (): ICustomMarketCatalog => ({
    version: 1,
    enabled: true,
    useMetadataPatch: false,
    categories: [],
    items: []
});

const normalizeCategoryId = (value: unknown): string =>
    String(value ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_");

const validateCatalog = (value: unknown): ICustomMarketCatalog => {
    if (!value || typeof value != "object") throw new Error("catalog must be an object");
    const input = value as Partial<ICustomMarketCatalog>;
    const categories: ICustomMarketCategory[] = [];
    const categoryIds = new Set<string>();
    for (const raw of Array.isArray(input.categories) ? input.categories : []) {
        const id = normalizeCategoryId(raw.id);
        if (!id) throw new Error("category id cannot be empty");
        if (categoryIds.has(id)) throw new Error(`duplicate category id: ${id}`);
        categoryIds.add(id);
        const name = String(raw.name ?? "").trim();
        const icon = String(raw.icon ?? "").trim();
        if (!name) throw new Error(`category ${id} has no name`);
        if (!icon) throw new Error(`category ${id} has no icon`);
        categories.push({
            id,
            name,
            icon,
            enabled: raw.enabled !== false
        });
    }

    const items: ICustomMarketItem[] = [];
    const itemTypes = new Set<string>();
    for (const raw of Array.isArray(input.items) ? input.items : []) {
        const typeName = String(raw.typeName ?? "").trim();
        const categoryId = normalizeCategoryId(raw.categoryId);
        const price = Number(raw.price);
        if (!typeName.startsWith("/Lotus/")) throw new Error(`invalid item path: ${typeName}`);
        if (itemTypes.has(typeName)) throw new Error(`duplicate item path: ${typeName}`);
        if (!categoryIds.has(categoryId)) throw new Error(`item ${typeName} refers to unknown category ${categoryId}`);
        if (raw.currency != "credits" && raw.currency != "platinum") {
            throw new Error(`item ${typeName} has an invalid currency`);
        }
        if (!Number.isSafeInteger(price) || price < 0) throw new Error(`item ${typeName} has an invalid price`);
        itemTypes.add(typeName);
        items.push({
            typeName,
            categoryId,
            enabled: raw.enabled !== false,
            currency: raw.currency,
            price
        });
    }

    return {
        version: 1,
        enabled: input.enabled !== false,
        useMetadataPatch: input.useMetadataPatch === true,
        categories,
        items
    };
};

const loadCatalog = (): ICustomMarketCatalog => {
    try {
        return validateCatalog(JSON.parse(fs.readFileSync(customMarketCatalogPath, "utf8")));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code != "ENOENT") throw error;
        return emptyCatalog();
    }
};

let catalog = loadCatalog();

export const getCustomMarketCatalog = (): ICustomMarketCatalog => structuredClone(catalog);

export const saveCustomMarketCatalog = async (value: unknown): Promise<ICustomMarketCatalog> => {
    const validated = validateCatalog(value);
    await fsPromises.mkdir(path.dirname(customMarketCatalogPath), { recursive: true });
    const temporaryPath = `${customMarketCatalogPath}.tmp`;
    await fsPromises.writeFile(temporaryPath, JSON.stringify(validated, null, 2));
    await fsPromises.rename(temporaryPath, customMarketCatalogPath);
    catalog = validated;
    return getCustomMarketCatalog();
};

export const toMarketTypeName = (typeName: string): string => {
    if (typeName.startsWith("/Lotus/StoreItems/")) {
        return "/Lotus/" + typeName.substring("/Lotus/StoreItems/".length);
    }
    return typeName;
};

export const toMarketStoreItemPath = (typeName: string): string => {
    if (typeName.startsWith("/Lotus/Types/StoreItems/") || typeName.startsWith("/Lotus/StoreItems/")) {
        return typeName;
    }
    if (typeName.startsWith("/Lotus/Types/Boosters/")) {
        return `/Lotus/Types/StoreItems/Boosters/${typeName.substring("/Lotus/Types/Boosters/".length)}StoreItem`;
    }
    return `/Lotus/StoreItems/${typeName.substring("/Lotus/".length)}`;
};

export const getPrimeItemsForCustomMarket = (): { typeName: string; primePrice: number }[] => {
    const prices = new Map<string, number>();
    const add = (typeName: string, primePrice: number | undefined): void => {
        if (typeof primePrice == "number") prices.set(toMarketTypeName(typeName), primePrice);
    };
    for (const offer of varzia.evergreen) add(offer.ItemType, offer.PrimePrice);
    for (const [dualPackType, dualPack] of Object.entries(varzia.primeDualPacks)) {
        if (dualPack.minBuildVersionInt > BV_LATEST) continue;
        add(dualPackType, 10);
        for (const singlePackType of dualPack.SinglePacks) {
            add(singlePackType, 6);
            const singlePack = varzia.primeSinglePacks[singlePackType];
            for (const offer of singlePack.Items) add(offer.ItemType, offer.PrimePrice);
            for (const bobbleHead of singlePack.BobbleHeads) add(bobbleHead, 1);
        }
    }
    return [...prices].map(([typeName, primePrice]) => ({ typeName, primePrice }));
};

export const applyCustomMarketCatalog = (worldState: IWorldState, buildVersion: number): void => {
    const configuredTypeNames = new Set(catalog.items.map(item => toMarketTypeName(item.typeName)));
    if (!catalog.enabled) return;

    const enabledCategories = catalog.categories.filter(category => category.enabled);
    const enabledCategoryIds = new Set(enabledCategories.map(category => category.id));
    worldState.InGameMarket.LandingPage.Categories = [];

    for (const category of enabledCategories) {
        worldState.InGameMarket.LandingPage.Categories.push({
            CategoryName: category.id,
            Name: category.name,
            Icon: category.icon,
            AddToMenu: true,
            Items: [] as string[]
        });
    }

    worldState.FlashSales = worldState.FlashSales.filter(
        sale => !configuredTypeNames.has(toMarketTypeName(sale.TypeName))
    );
    for (const category of worldState.InGameMarket.LandingPage.Categories) {
        if (category.Items) category.Items = category.Items.filter(typeName => !configuredTypeNames.has(typeName));
    }

    // FlashSales requires a date range even for ordinary Market products. Do not send
    // ProductExpiryOverride for enabled custom products, so the server does not add a limited-time marker.
    const startDate = toMongoDate2(new Date("2020-01-01T00:00:00.000Z"), buildVersion);
    const endDate = toMongoDate2(new Date("9999-12-31T23:59:59.999Z"), buildVersion);
    for (const item of catalog.items) {
        const typeName = toMarketTypeName(item.typeName);
        if (!item.enabled || !enabledCategoryIds.has(item.categoryId)) continue;
        const category = worldState.InGameMarket.LandingPage.Categories.find(
            current => current.CategoryName == item.categoryId
        )!;
        category.Items!.push(toMarketStoreItemPath(item.typeName));
        if (catalog.useMetadataPatch) continue;
        worldState.FlashSales.push({
            TypeName: typeName,
            StartDate: startDate,
            EndDate: endDate,
            ShowInMarket: true,
            HideFromMarket: false,
            SupporterPack: false,
            Discount: 0,
            BogoBuy: 0,
            BogoGet: 0,
            RegularOverride: item.currency == "credits" ? item.price : 0,
            PremiumOverride: item.currency == "platinum" ? item.price : 0
        });
    }
};
