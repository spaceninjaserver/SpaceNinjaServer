import express from "express";
import config from "@/config.json";

const cacheRouter = express.Router();

cacheRouter.get("/B.Cache.Dx11.bin.*", (_req, res) => {
    //console.log("asd", path.join(__dirname, "../data"));
    res.sendFile("static/data/B.Cache.Dx11_33.0.6.bin", { root: "./" });
});

cacheRouter.get("/B.Cache.Windows_en.bin*", (_req, res) => {
    //console.log("asd", path.join(__dirname, "../data"));
    res.sendFile("static/data/B.Cache.Windows_en_33.0.10.bin", { root: "./" });
});

cacheRouter.get(/^\/origin\/([a-zA-Z0-9]+)\/H\.Cache\.bin.*$/, (_req, res) => {
    // console.log("asd", path.join(__dirname, "../data"));
    // console.log("asd", __dirname);
    res.sendFile(`static/data/H.Cache_${config.version}.bin`, { root: "./" });
});

export { cacheRouter };
