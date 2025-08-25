import express from "express";

import { getSkuCatalogController } from "../controllers/pay/getSkuCatalogController.ts";
import { steamPacksController } from "../controllers/pay/steamPacksController.ts";

const payRouter = express.Router();

payRouter.get("/getSkuCatalog.php", getSkuCatalogController);
payRouter.post("/steamPacks.php", steamPacksController);

export { payRouter };
