import express from "express";
import path from "path";

const webuiRouter = express.Router();
const rootDir = path.join(__dirname, "../..");
const repoDir = path.basename(rootDir) == "build" ? path.join(rootDir, "..") : rootDir;

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
    res.sendFile(path.join(rootDir, "static/webui/index.html"));
});
webuiRouter.get(/webui\/powersuit\/(.+)/, (_req, res) => {
    res.sendFile(path.join(rootDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/mods", (_req, res) => {
    res.sendFile(path.join(rootDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/settings", (_req, res) => {
    res.sendFile(path.join(rootDir, "static/webui/index.html"));
});
webuiRouter.get("/webui/cheats", (_req, res) => {
    res.sendFile(path.join(rootDir, "static/webui/index.html"));
});

// Serve static files
webuiRouter.use("/webui", express.static(path.join(rootDir, "static/webui")));

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

export { webuiRouter };
