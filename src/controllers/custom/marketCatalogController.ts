import type { RequestHandler } from "express";
import { getAccountForRequest, isAdministrator } from "../../services/loginService.ts";
import {
    getPrimeItemsForCustomMarket,
    getCustomMarketCatalog,
    saveCustomMarketCatalog,
    toMarketTypeName
} from "../../services/customMarketService.ts";
import { sendWsBroadcast } from "../../services/wsService.ts";
import { getDict, getItemName, getPrice, getString, toStoreItem } from "../../services/itemDataService.ts";
import { BL_LATEST } from "../../constants/gameVersions.ts";
import { getItemLists, type ListedItem } from "./getItemListsController.ts";
import { ExportBundles } from "warframe-public-export-plus";

const REGAL_AYA_TO_CREDITS_RATIO = 375_000;
const MAX_ORIGINAL_PLATINUM_PRICE = 10_000;
const MAX_CATEGORY_PLATINUM_PRICE = 1_000;
const PRIME_PRICE_MULTIPLIER = 3;
const MODULAR_PART_PRICE = 15;
const ANIMAL_COMPANION_PRICE = 75;
const categoryMaximumPlatinumPrices = new Map<string, number | null>();
let marketPricingItemLists: ReturnType<typeof getItemLists> | undefined;

const isPrimeItem = (typeName: string): boolean => /prime/i.test(typeName);

const isUsableOriginalPlatinumPrice = (price: number | null): price is number =>
    price !== null && price > 1 && price < MAX_ORIGINAL_PLATINUM_PRICE && price % 1_000 !== 0;

const isUsableCategoryMaximumPrice = (price: number | null): price is number =>
    isUsableOriginalPlatinumPrice(price) && price <= MAX_CATEGORY_PLATINUM_PRICE;

const getOriginalPrice = (typeName: string, usePremium: boolean): number | null => {
    const candidates = [typeName];
    try {
        const storeItem = toStoreItem(typeName);
        if (!candidates.includes(storeItem)) candidates.push(storeItem);
    } catch {}

    for (const candidate of candidates) {
        try {
            return getPrice(candidate, 1, 0, usePremium, BL_LATEST, true);
        } catch {}
    }
    return null;
};

const getCategoryItems = (source: string): ListedItem[] => {
    marketPricingItemLists ??= getItemLists("en");
    if (source.startsWith("ModularParts-")) {
        const partType = source.substring("ModularParts-".length);
        return marketPricingItemLists.ModularParts.filter(item => item.partType == partType);
    }
    const list = (marketPricingItemLists as unknown as Record<string, unknown>)[source];
    return Array.isArray(list) ? (list as ListedItem[]) : [];
};

const isBundleItem = (typeName: string, listedItem?: ListedItem): boolean =>
    listedItem?.isBundle === true || typeName in ExportBundles;

const getCategoryMaximumPlatinumPrice = (sources: string[], bundle: boolean): number | null => {
    const key = `${bundle ? "bundle" : "single"}|${[...new Set(sources)].sort().join("|")}`;
    const cached = categoryMaximumPlatinumPrices.get(key);
    if (cached !== undefined) return cached;

    let maximum: number | null = null;
    const seen = new Set<string>();
    for (const source of sources) {
        for (const item of getCategoryItems(source)) {
            if (isBundleItem(item.uniqueName, item) != bundle) continue;
            if (seen.has(item.uniqueName) || isPrimeItem(item.uniqueName)) continue;
            seen.add(item.uniqueName);
            const price =
                item.marketPlatinumPrice !== undefined
                    ? item.marketPlatinumPrice
                    : getOriginalPrice(item.uniqueName, true);
            if (isUsableCategoryMaximumPrice(price)) {
                maximum = Math.max(maximum ?? 0, price);
            }
        }
    }
    categoryMaximumPlatinumPrices.set(key, maximum);
    return maximum;
};

export const getMarketCatalogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) return void res.status(401).end();
    res.json(getCustomMarketCatalog());
};

export const setMarketCatalogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) return void res.status(401).end();
    try {
        const catalog = await saveCustomMarketCatalog(req.body);
        sendWsBroadcast({ sync_world_state: true });
        res.json(catalog);
    } catch (error) {
        res.status(400).send(error instanceof Error ? error.message : String(error));
    }
};

export const setMarketCatalogSettingsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) return void res.status(401).end();
    try {
        const current = getCustomMarketCatalog();
        const catalog = await saveCustomMarketCatalog({
            ...current,
            enabled: req.body?.enabled !== false,
            useMetadataPatch: req.body?.useMetadataPatch === true
        });
        sendWsBroadcast({ sync_world_state: true });
        res.json({ enabled: catalog.enabled, useMetadataPatch: catalog.useMetadataPatch });
    } catch (error) {
        res.status(400).send(error instanceof Error ? error.message : String(error));
    }
};

export const getPrimeMarketItemsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) return void res.status(401).end();
    const lang = getDict(typeof req.query.lang == "string" ? req.query.lang : "en");
    const items = getPrimeItemsForCustomMarket().map(offer => {
        const typeName = toMarketTypeName(offer.typeName);
        const nameKey = getItemName(typeName) ?? getItemName(offer.typeName);
        return {
            typeName,
            label: nameKey ? getString(nameKey, lang) : typeName.substring(typeName.lastIndexOf("/") + 1),
            price: offer.primePrice * REGAL_AYA_TO_CREDITS_RATIO
        };
    });
    res.json(items);
};

const getMarketItemPricing = (
    typeName: string,
    categorySources: string[]
): { creditsPrice: number | null; platinumPrice: number | null } => {
    const normalizedTypeName = toMarketTypeName(typeName);
    const categoryItem = categorySources
        .flatMap(source => getCategoryItems(source))
        .find(item => toMarketTypeName(item.uniqueName) == normalizedTypeName);
    let creditsPrice =
        categoryItem?.marketCreditsPrice !== undefined
            ? categoryItem.marketCreditsPrice
            : getOriginalPrice(typeName, false);
    let platinumPrice =
        categoryItem?.marketPlatinumPrice !== undefined
            ? categoryItem.marketPlatinumPrice
            : getOriginalPrice(typeName, true);
    const isModularPartCategory =
        categorySources.length > 0 && categorySources.every(source => source.startsWith("ModularParts-"));
    const isAnimalCompanionCategory = categorySources.length == 1 && categorySources[0] == "KubrowPets";
    const bundle = isBundleItem(typeName, categoryItem);
    const categoryMaximum =
        categorySources.length && !isModularPartCategory && !isAnimalCompanionCategory
            ? getCategoryMaximumPlatinumPrice(categorySources, bundle)
            : null;
    const primeItem = isPrimeItem(typeName);

    if (isModularPartCategory) {
        creditsPrice = null;
        platinumPrice = MODULAR_PART_PRICE;
    } else if (isAnimalCompanionCategory) {
        creditsPrice = null;
        platinumPrice = ANIMAL_COMPANION_PRICE;
    } else if (categoryMaximum !== null && primeItem) {
        creditsPrice = null;
        platinumPrice = categoryMaximum * PRIME_PRICE_MULTIPLIER;
    } else if (
        categoryMaximum !== null &&
        ((creditsPrice === null && platinumPrice === null) ||
            (platinumPrice !== null && !isUsableOriginalPlatinumPrice(platinumPrice)))
    ) {
        platinumPrice = categoryMaximum;
    }

    return { creditsPrice, platinumPrice };
};

const normalizeCategorySources = (value: unknown): string[] => {
    const sources = Array.isArray(value) ? value : typeof value == "string" ? value.split("|") : [];
    return sources
        .filter((source): source is string => typeof source == "string")
        .map(source => source.trim())
        .filter(Boolean)
        .slice(0, 10);
};

export const getMarketItemPriceController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) return void res.status(401).end();
    const typeName = typeof req.query.typeName == "string" ? req.query.typeName : "";
    if (!typeName.startsWith("/Lotus/")) return void res.status(400).send("invalid item path");
    res.json(getMarketItemPricing(typeName, normalizeCategorySources(req.query.categorySources)));
};

export const getMarketItemPricesController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!isAdministrator(account)) return void res.status(401).end();
    const typeNames = Array.isArray(req.body?.typeNames)
        ? req.body.typeNames
              .filter((typeName: unknown): typeName is string =>
                  typeof typeName == "string" && typeName.startsWith("/Lotus/")
              )
              .slice(0, 10_000)
        : [];
    const categorySources = normalizeCategorySources(req.body?.categorySources);
    res.json(
        Object.fromEntries(typeNames.map(typeName => [typeName, getMarketItemPricing(typeName, categorySources)]))
    );
};
