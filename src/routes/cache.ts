import express from "express";
import fs from "fs/promises";

const cacheRouter = express.Router();

cacheRouter.get(/^\/origin\/[a-zA-Z0-9]+\/[0-9]+\/H\.Cache\.bin.*$/, (_req, res) => {
    res.sendFile(`static/data/H.Cache.bin`, { root: "./" });
});

const strippedAssetsDir = "static/data/0"; // If users have the stripped assets repo checked out, it's at this path.

cacheRouter.get(/^\/0(?:_[a-z]{2})?\/.+!.+$/, async (req, res) => {
    try {
        const dir = req.path.substring(0, req.path.lastIndexOf("/"));
        const file = req.path.substring(dir.length + 1);
        const filePath = `${strippedAssetsDir}${dir}/${file}`;

        // Return file if we have it
        await fs.access(filePath);
        const data = await fs.readFile(filePath, null);
        res.send(data);
    } catch (err) {
        // 404 if we don't
        res.status(404).end();
    }
});

// routes for android and possibly other non-PC platforms
cacheRouter.get(/^\/origin\/[a-zA-Z0-9]+\/index\.txt\.lzma.*$/, (_, res) => {
    res.sendFile(`static/data/content/index.txt.lzma`, { root: "./" });
});

cacheRouter.get(/^\/[0-9]+\/H\.Cache\.bin.*$/, (_req, res) => {
    res.sendFile(`static/data/H.Cache.bin`, { root: "./" });
});

cacheRouter.get(/^(\/\/|\/)(SplitCaches|Lotus|Tools|7|7_en)\/.*$/, async (req, res) => {
    try {
        const dir = req.path.replaceAll("//", "/").substring(0, req.path.lastIndexOf("/"));
        const file = req.path.substring(dir.length + 1);
        const filePath = `static/data/content${dir}/${file}`;
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
