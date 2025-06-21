import express from "express";
import path from "path";
import { repoDir, rootDir } from "@/src/helpers/pathHelper";
import { args } from "@/src/helpers/commandLineArguments";

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
webuiRouter.get("/webui/inventory", (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});
webuiRouter.get(/webui\/powersuit\/(.+)/, (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/mods", (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/settings", (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/quests", (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/cheats", (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/import", (_req, res) => {
    res.sendFile(path.join(baseDir, "static/webui/index.html"));
});

// Serve static files
webuiRouter.use("/webui", express.static(path.join(baseDir, "static/webui")));

// Serve favicon
webuiRouter.get("/favicon.ico", (_req, res) => {
    res.sendFile(path.join(repoDir, "static/fixed_responses/favicon.ico"));
});

// Serve warframe-riven-info
webuiRouter.get("/webui/riven-tool/", (_req, res) => {
    res.sendFile(path.join(repoDir, "node_modules/warframe-riven-info/index.html"));
});
webuiRouter.get("/webui/riven-tool/RivenParser.js", (_req, res) => {
    res.sendFile(path.join(repoDir, "node_modules/warframe-riven-info/RivenParser.js"));
});

// Serve translations
webuiRouter.get("/translations/:file", (req, res) => {
    res.sendFile(path.join(baseDir, `static/webui/translations/${req.params.file}`));
});

export { webuiRouter };
