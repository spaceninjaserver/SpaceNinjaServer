import express from "express";
import buildConfig from "@/static/data/buildConfig.json";
import fs from "fs";

const cacheRouter = express.Router();

cacheRouter.get("/B.Cache.Dx11.bin.*", (_req, res) => {
    res.sendFile("static/data/B.Cache.Dx11_33.0.6.bin", { root: "./" });
});

cacheRouter.get("/B.Cache.Windows_en.bin*", (_req, res) => {
    res.sendFile("static/data/B.Cache.Windows_en_33.0.10.bin", { root: "./" });
});

cacheRouter.get(/^\/origin\/[a-zA-Z0-9]+\/[0-9]+\/H\.Cache\.bin.*$/, (_req, res) => {
    res.sendFile(`static/data/H.Cache_${buildConfig.version}.bin`, { root: "./" });
});

cacheRouter.get(/\.bk2!/, async (req, res) => {
    const dir = req.path.substr(0, req.path.lastIndexOf("/"));
    const file = req.path.substr(dir.length + 1);

    // Return file if we have it
    if (fs.existsSync(`static/data${dir}/${file}`)) {
        res.send(fs.readFileSync(`static/data${dir}/${file}`, null));
        return;
    }

    // 404 if we don't
    res.status(404).end();
});

export { cacheRouter };
