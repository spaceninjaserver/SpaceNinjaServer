import express, { type RequestHandler } from "express";
import path from "path";
import fs from "fs/promises";
import { repoDir, rootDir } from "../helpers/pathHelper.ts";
import { args } from "../helpers/commandLineArguments.ts";
import { config, type IWebuiConfig } from "../services/configService.ts";

const baseDir = args.dev ? repoDir : rootDir;

const webuiRouter = express.Router();

// Redirect / to /webui/
webuiRouter.get("/", (_req, res) => {
    if (config.webui?.enabled ?? true) {
        res.redirect("/webui/");
    } else {
        res.sendStatus(404);
    }
});

// Redirect /webui to /webui/
webuiRouter.use("/webui", (req, res, next) => {
    if (req.originalUrl === "/webui" && (config.webui?.enabled ?? true)) {
        return res.redirect("/webui/");
    }
    next();
});

// Serve virtual routes
const virtualRouteController: RequestHandler = async (_req, res) => {
    if (config.webui?.enabled ?? true) {
        res.set("Content-Type", "text/html;charset=utf8");
        res.send(await fs.readFile(path.join(baseDir, "static/webui/index.html")));
    } else {
        res.sendStatus(404);
    }
};
webuiRouter.get("/webui/", virtualRouteController); // can be handled by express.static, but would not check webui.enabled config.
webuiRouter.get("/webui/inventory", virtualRouteController);
webuiRouter.get("/webui/details", virtualRouteController);
webuiRouter.get("/webui/detailedView", virtualRouteController);
webuiRouter.get("/webui/mods", virtualRouteController);
webuiRouter.get("/webui/cheats", virtualRouteController);
webuiRouter.get("/webui/settings", virtualRouteController);
webuiRouter.get("/webui/import", virtualRouteController);
webuiRouter.get("/webui/clan", virtualRouteController);
webuiRouter.get("/webui/guildView", virtualRouteController);
webuiRouter.get("/webui/users", virtualRouteController);
webuiRouter.get("/webui/admin", virtualRouteController);

// Serve static files
webuiRouter.use("/webui", express.static(path.join(baseDir, "static/webui")));

// Serve favicon
webuiRouter.get("/favicon.ico", async (_req, res) => {
    res.set("Content-Type", "image/vnd.microsoft.icon");
    res.send(await fs.readFile(path.join(repoDir, "static/fixed_responses/favicon.ico")));
});

// Serve config
webuiRouter.get("/webui/config.js", (_req, res) => {
    const client_config: Pick<IWebuiConfig, "defaultLanguage"> = {
        defaultLanguage: config.webui?.defaultLanguage
    };
    res.set("Content-Type", "text/javascript;charset=utf8");
    res.send("webui_conf=" + JSON.stringify(client_config));
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
