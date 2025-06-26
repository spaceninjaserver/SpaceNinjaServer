import express from "express";

import { tunablesController } from "@/src/controllers/custom/tunablesController";
import { getItemListsController } from "@/src/controllers/custom/getItemListsController";
import { pushArchonCrystalUpgradeController } from "@/src/controllers/custom/pushArchonCrystalUpgradeController";
import { popArchonCrystalUpgradeController } from "@/src/controllers/custom/popArchonCrystalUpgradeController";
import { deleteAccountController } from "@/src/controllers/custom/deleteAccountController";
import { getNameController } from "@/src/controllers/custom/getNameController";
import { getAccountInfoController } from "@/src/controllers/custom/getAccountInfoController";
import { renameAccountController } from "@/src/controllers/custom/renameAccountController";
import { ircDroppedController } from "@/src/controllers/custom/ircDroppedController";
import { unlockAllIntrinsicsController } from "@/src/controllers/custom/unlockAllIntrinsicsController";
import { addMissingMaxRankModsController } from "@/src/controllers/custom/addMissingMaxRankModsController";
import { webuiFileChangeDetectedController } from "@/src/controllers/custom/webuiFileChangeDetectedController";
import { completeAllMissionsController } from "@/src/controllers/custom/completeAllMissionsController";
import { addMissingHelminthBlueprintsController } from "@/src/controllers/custom/addMissingHelminthBlueprintsController";

import { createAccountController } from "@/src/controllers/custom/createAccountController";
import { createMessageController } from "@/src/controllers/custom/createMessageController";
import { addCurrencyController } from "@/src/controllers/custom/addCurrencyController";
import { addItemsController } from "@/src/controllers/custom/addItemsController";
import { addXpController } from "@/src/controllers/custom/addXpController";
import { importController } from "@/src/controllers/custom/importController";
import { manageQuestsController } from "@/src/controllers/custom/manageQuestsController";
import { setEvolutionProgressController } from "@/src/controllers/custom/setEvolutionProgressController";
import { setBoosterController } from "@/src/controllers/custom/setBoosterController";

import { getConfigDataController } from "@/src/controllers/custom/getConfigDataController";
import { updateConfigDataController } from "@/src/controllers/custom/updateConfigDataController";

const customRouter = express.Router();

customRouter.get("/tunables.json", tunablesController);
customRouter.get("/getItemLists", getItemListsController);
customRouter.get("/pushArchonCrystalUpgrade", pushArchonCrystalUpgradeController);
customRouter.get("/popArchonCrystalUpgrade", popArchonCrystalUpgradeController);
customRouter.get("/deleteAccount", deleteAccountController);
customRouter.get("/getName", getNameController);
customRouter.get("/getAccountInfo", getAccountInfoController);
customRouter.get("/renameAccount", renameAccountController);
customRouter.get("/ircDropped", ircDroppedController);
customRouter.get("/unlockAllIntrinsics", unlockAllIntrinsicsController);
customRouter.get("/addMissingMaxRankMods", addMissingMaxRankModsController);
customRouter.get("/webuiFileChangeDetected", webuiFileChangeDetectedController);
customRouter.get("/completeAllMissions", completeAllMissionsController);
customRouter.get("/addMissingHelminthBlueprints", addMissingHelminthBlueprintsController);

customRouter.post("/createAccount", createAccountController);
customRouter.post("/createMessage", createMessageController);
customRouter.post("/addCurrency", addCurrencyController);
customRouter.post("/addItems", addItemsController);
customRouter.post("/addXp", addXpController);
customRouter.post("/import", importController);
customRouter.post("/manageQuests", manageQuestsController);
customRouter.post("/setEvolutionProgress", setEvolutionProgressController);
customRouter.post("/setBooster", setBoosterController);

customRouter.get("/config", getConfigDataController);
customRouter.post("/config", updateConfigDataController);

export { customRouter };
