import express from "express";
import path from "path";

const webuiRouter = express.Router();

webuiRouter.get("/", (_req, res) => {
    res.redirect("/webui/");
});

const rootDir = path.join(__dirname, "../..");

webuiRouter.get("/webui/", (req, res) => {
    if (req.path != "/webui/") {
        res.redirect("/webui/");
    } else {
        res.sendFile(path.join(rootDir, "static/webui/index.html"));
    }
});

webuiRouter.get("/webui/script.js", (_req, res) => {
    res.sendFile(path.join(rootDir, "static/webui/script.js"));
});

export { webuiRouter };
