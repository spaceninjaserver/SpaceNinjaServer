import express from "express";
import buildConfig from "@/static/data/buildConfig.json";
import fs from "fs/promises";

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

// eslint-disable-next-line @typescript-eslint/no-misused-promises
cacheRouter.get(/\.bk2!/, async (req, res) => {
    try {
        const dir = req.path.substr(0, req.path.lastIndexOf("/"));
        const file = req.path.substr(dir.length + 1);
        const filePath = `static/data${dir}/${file}`;

        // Return file if we have it
        await fs.access(filePath);
        const data = await fs.readFile(filePath, null);
        res.send(data);
    } catch (err) {
        // 404 if we don't
        res.status(404).end();
    }
});

export { cacheRouter };
