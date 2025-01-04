import express from "express";

import { getSkuCatalogController } from "@/src/controllers/pay/getSkuCatalogController";
import { steamPacksController } from "@/src/controllers/pay/steamPacksController";

const payRouter = express.Router();

payRouter.get("/getSkuCatalog.php", getSkuCatalogController);
payRouter.post("/steamPacks.php", steamPacksController);

export { payRouter };
