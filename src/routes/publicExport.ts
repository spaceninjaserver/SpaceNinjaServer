import express from "express";
import path from "path";
import fs from "fs/promises";
import { repoDir } from "../helpers/pathHelper.ts";
import {
    getExportCustoms,
    getExportDrones,
    getExportFlavour,
    getExportFusionBundles,
    getExportGear,
    getExportKeys,
    getExportManifest,
    getExportRecipes,
    getExportRegions,
    getExportRelicArcane,
    getExportResources,
    getExportSentinels,
    getExportSortieRewards,
    getExportUpgrades,
    getExportWarframes,
    getExportWeapons
} from "../services/publicExportService.ts";

const publicExportRouter = express.Router();

publicExportRouter.get(/^\/Lotus\/Interface\/.+$/, (req, res) => {
    res.sendFile(req.path.split("!")[0], { root: "./static/data/PublicExport" });
});

publicExportRouter.get(/^\/index_[a-z]{2}\.txt\.lzma$/, async (req, res) => {
    res.send(await fs.readFile(path.join(repoDir, "static/fixed_responses/PublicExport/", req.path)));
});

publicExportRouter.get(/^\/Manifest\/ExportCustoms_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportCustoms(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportDrones_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportDrones(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportFlavour_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportFlavour(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportFusionBundles_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportFusionBundles(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportKeys_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportKeys(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportGear_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportGear(req.params[0]));
});

// Gets passed a language code even tho it's language-agnostic
publicExportRouter.get(/^\/Manifest\/ExportRecipes_([a-z]{2})\.json!.+$/, (_req, res) => {
    res.json(getExportRecipes());
});

publicExportRouter.get(/^\/Manifest\/ExportRegions_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportRegions(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportRelicArcane_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportRelicArcane(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportResources_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportResources(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportSentinels_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportSentinels(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportSortieRewards_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportSortieRewards(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportUpgrades_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportUpgrades(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportWarframes_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportWarframes(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportWeapons_([a-z]{2})\.json!.+$/, (req, res) => {
    res.json(getExportWeapons(req.params[0]));
});

publicExportRouter.get(/^\/Manifest\/ExportManifest\.json!.+$/, (_req, res) => {
    res.json(getExportManifest());
});

export { publicExportRouter };
