import express from "express";

import { tunablesController } from "@/src/controllers/custom/tunablesController";
import { getItemListsController } from "@/src/controllers/custom/getItemListsController";
import { pushArchonCrystalUpgradeController } from "@/src/controllers/custom/pushArchonCrystalUpgradeController";
import { popArchonCrystalUpgradeController } from "@/src/controllers/custom/popArchonCrystalUpgradeController";
import { deleteAccountController } from "@/src/controllers/custom/deleteAccountController";
import { getNameController } from "@/src/controllers/custom/getNameController";
import { renameAccountController } from "@/src/controllers/custom/renameAccountController";
import { ircDroppedController } from "@/src/controllers/custom/ircDroppedController";

import { createAccountController } from "@/src/controllers/custom/createAccountController";
import { createMessageController } from "@/src/controllers/custom/createMessageController";
import { addCurrencyController } from "../controllers/custom/addCurrencyController";
import { addItemsController } from "@/src/controllers/custom/addItemsController";
import { addXpController } from "@/src/controllers/custom/addXpController";
import { importController } from "@/src/controllers/custom/importController";

import { getConfigDataController } from "@/src/controllers/custom/getConfigDataController";
import { updateConfigDataController } from "@/src/controllers/custom/updateConfigDataController";
import { manageQuestsController } from "@/src/controllers/custom/manageQuestsController";

const customRouter = express.Router();

customRouter.get("/tunables.json", tunablesController);
customRouter.get("/getItemLists", getItemListsController);
customRouter.get("/pushArchonCrystalUpgrade", pushArchonCrystalUpgradeController);
customRouter.get("/popArchonCrystalUpgrade", popArchonCrystalUpgradeController);
customRouter.get("/deleteAccount", deleteAccountController);
customRouter.get("/getName", getNameController);
customRouter.get("/renameAccount", renameAccountController);
customRouter.get("/ircDropped", ircDroppedController);

customRouter.post("/createAccount", createAccountController);
customRouter.post("/createMessage", createMessageController);
customRouter.post("/addCurrency", addCurrencyController);
customRouter.post("/addItems", addItemsController);
customRouter.post("/addXp", addXpController);
customRouter.post("/import", importController);
customRouter.post("/manageQuests", manageQuestsController);

customRouter.get("/config", getConfigDataController);
customRouter.post("/config", updateConfigDataController);

export { customRouter };
