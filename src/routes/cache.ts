import express from "express";
import { buildConfig } from "@/src/services/buildConfigService";
import fs from "fs/promises";

const cacheRouter = express.Router();

cacheRouter.get(/^\/origin\/[a-zA-Z0-9]+\/[0-9]+\/H\.Cache\.bin.*$/, (req, res) => {
    if (typeof req.query.version == "string" && req.query.version.match(/^\d\d\d\d\.\d\d\.\d\d\.\d\d\.\d\d$/)) {
        res.sendFile(`static/data/H.Cache_${req.query.version}.bin`, { root: "./" });
    } else {
        res.sendFile(`static/data/H.Cache_${buildConfig.version}.bin`, { root: "./" });
    }
});

cacheRouter.get(/^\/0\/Lotus\/.+!.+$/, async (req, res) => {
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
