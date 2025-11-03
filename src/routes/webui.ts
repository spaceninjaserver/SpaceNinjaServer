import express from "express";
import path from "path";
import fs from "fs/promises";
import { repoDir, rootDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";

const baseDir = args.dev ? repoDir : rootDir;

const webuiRouter = express.Router();

// Redirect / to /webui/
webuiRouter.get("/", (_req, res) => {
    res.redirect("/webui/");
});

// Redirect /webui to /webui/
webuiRouter.use("/webui", (req, res, next) => {
    if (req.originalUrl === "/") {
        return res.redirect("/webui/");
    }
    next();
});

// Serve virtual routes
webuiRouter.get("/webui/inventory", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/detailedView", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/mods", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/settings", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/quests", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/cheats", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/import", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});
webuiRouter.get("/webui/guildView", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
});

// Serve static files
webuiRouter.use("/webui", express.static(path.join(baseDir, "static/webui")));

// Serve favicon
webuiRouter.get("/favicon.ico", async (_req, res) => {
    res.set("Content-Type", "image/vnd.microsoft.icon");
    res.send(await fs.readFile(path.join(repoDir, "static/fixed_responses/favicon.ico")));
});

// Serve warframe-riven-info
webuiRouter.get("/webui/riven-tool/", async (_req, res) => {
    res.set("Content-Type", "text/html;charset=utf8");
    res.send(await fs.readFile(path.join(repoDir, "node_modules/warframe-riven-info/index.html")));
});
webuiRouter.get("/webui/riven-tool/RivenParser.js", async (_req, res) => {
    res.set("Content-Type", "text/javascript;charset=utf8");
    res.send(await fs.readFile(path.join(repoDir, "node_modules/warframe-riven-info/RivenParser.js")));
});

// Serve translations
webuiRouter.get("/translations/:file", async (req, res) => {
    res.set("Content-Type", "text/javascript;charset=utf8");
    res.send(await fs.readFile(path.join(baseDir, `static/webui/translations/${req.params.file}`)));
});

export { webuiRouter };
