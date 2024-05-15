import express from "express";
import path from "path";

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

// Serve static files from the webui directory
webuiRouter.use("/webui", express.static(path.join(__dirname, "../..", "static/webui")));

export { webuiRouter };
