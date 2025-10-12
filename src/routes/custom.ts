import express from "express";

import { tunablesController } from "../controllers/custom/tunablesController.ts";
import { getItemListsController } from "../controllers/custom/getItemListsController.ts";
import { pushArchonCrystalUpgradeController } from "../controllers/custom/pushArchonCrystalUpgradeController.ts";
import { popArchonCrystalUpgradeController } from "../controllers/custom/popArchonCrystalUpgradeController.ts";
import { deleteAccountController } from "../controllers/custom/deleteAccountController.ts";
import { getNameController } from "../controllers/custom/getNameController.ts";
import { getAccountInfoController } from "../controllers/custom/getAccountInfoController.ts";
import { getGuildController } from "../controllers/custom/getGuildController.ts";
import { getAllianceController } from "../controllers/custom/getAllianceController.ts";
import { renameAccountController } from "../controllers/custom/renameAccountController.ts";
import { ircDroppedController } from "../controllers/custom/ircDroppedController.ts";
import { unlockAllIntrinsicsController } from "../controllers/custom/unlockAllIntrinsicsController.ts";
import { addMissingMaxRankModsController } from "../controllers/custom/addMissingMaxRankModsController.ts";
import { webuiFileChangeDetectedController } from "../controllers/custom/webuiFileChangeDetectedController.ts";
import { completeAllMissionsController } from "../controllers/custom/completeAllMissionsController.ts";
import { addMissingHelminthBlueprintsController } from "../controllers/custom/addMissingHelminthBlueprintsController.ts";
import { unlockAllProfitTakerStagesController } from "../controllers/custom/unlockAllProfitTakerStagesController.ts";
import { unlockAllSimarisResearchEntriesController } from "../controllers/custom/unlockAllSimarisResearchEntriesController.ts";
import { unlockAllScansController } from "../controllers/custom/unlockAllScansController.ts";
import { unlockAllShipFeaturesController } from "../controllers/custom/unlockAllShipFeaturesController.ts";
import { unlockAllCapturaScenesController } from "../controllers/custom/unlockAllCapturaScenesController.ts";
import { removeCustomizationController } from "../controllers/custom/removeCustomizationController.ts";

import { abilityOverrideController } from "../controllers/custom/abilityOverrideController.ts";
import { createAccountController } from "../controllers/custom/createAccountController.ts";
import { createMessageController } from "../controllers/custom/createMessageController.ts";
import { addCurrencyController } from "../controllers/custom/addCurrencyController.ts";
import { addItemsController } from "../controllers/custom/addItemsController.ts";
import {
    addTechProjectController,
    completeTechProjectsController,
    fundTechProjectController,
    removeTechProjectController
} from "../controllers/custom/techProjectController.ts";
import { addVaultTypeCountController } from "../controllers/custom/addVaultTypeCountController.ts";
import { addXpController } from "../controllers/custom/addXpController.ts";
import { importController } from "../controllers/custom/importController.ts";
import { manageQuestsController } from "../controllers/custom/manageQuestsController.ts";
import { setEvolutionProgressController } from "../controllers/custom/setEvolutionProgressController.ts";
import { setBoosterController } from "../controllers/custom/setBoosterController.ts";
import { updateFingerprintController } from "../controllers/custom/updateFingerprintController.ts";
import { unlockLevelCapController } from "../controllers/custom/unlockLevelCapController.ts";
import { changeModularPartsController } from "../controllers/custom/changeModularPartsController.ts";
import { setInvigorationController } from "../controllers/custom/setInvigorationController.ts";
import { setAccountCheatController } from "../controllers/custom/setAccountCheatController.ts";
import { setGuildCheatController } from "../controllers/custom/setGuildCheatController.ts";

import { getConfigController, setConfigController } from "../controllers/custom/configController.ts";

const customRouter = express.Router();

customRouter.get("/tunables.json", tunablesController);
customRouter.get("/getItemLists", getItemListsController);
customRouter.get("/pushArchonCrystalUpgrade", pushArchonCrystalUpgradeController);
customRouter.get("/popArchonCrystalUpgrade", popArchonCrystalUpgradeController);
customRouter.get("/deleteAccount", deleteAccountController);
customRouter.get("/getName", getNameController);
customRouter.get("/getAccountInfo", getAccountInfoController);
customRouter.get("/getGuild", getGuildController);
customRouter.get("/getAlliance", getAllianceController);
customRouter.get("/renameAccount", renameAccountController);
customRouter.get("/ircDropped", ircDroppedController);
customRouter.get("/unlockAllIntrinsics", unlockAllIntrinsicsController);
customRouter.get("/addMissingMaxRankMods", addMissingMaxRankModsController);
customRouter.get("/webuiFileChangeDetected", webuiFileChangeDetectedController);
customRouter.get("/completeAllMissions", completeAllMissionsController);
customRouter.get("/addMissingHelminthBlueprints", addMissingHelminthBlueprintsController);
customRouter.get("/unlockAllProfitTakerStages", unlockAllProfitTakerStagesController);
customRouter.get("/unlockAllSimarisResearchEntries", unlockAllSimarisResearchEntriesController);
customRouter.get("/unlockAllScans", unlockAllScansController);
customRouter.get("/unlockAllShipFeatures", unlockAllShipFeaturesController);
customRouter.get("/unlockAllCapturaScenes", unlockAllCapturaScenesController);
customRouter.get("/removeCustomization", removeCustomizationController);

customRouter.post("/abilityOverride", abilityOverrideController);
customRouter.post("/createAccount", createAccountController);
customRouter.post("/createMessage", createMessageController);
customRouter.post("/addCurrency", addCurrencyController);
customRouter.post("/addItems", addItemsController);
customRouter.post("/addTechProject", addTechProjectController);
customRouter.post("/removeTechProject", removeTechProjectController);
customRouter.post("/addVaultTypeCount", addVaultTypeCountController);
customRouter.post("/fundTechProject", fundTechProjectController);
customRouter.post("/completeTechProject", completeTechProjectsController);
customRouter.post("/addXp", addXpController);
customRouter.post("/import", importController);
customRouter.post("/manageQuests", manageQuestsController);
customRouter.post("/setEvolutionProgress", setEvolutionProgressController);
customRouter.post("/setBooster", setBoosterController);
customRouter.post("/updateFingerprint", updateFingerprintController);
customRouter.post("/unlockLevelCap", unlockLevelCapController);
customRouter.post("/changeModularParts", changeModularPartsController);
customRouter.post("/setInvigoration", setInvigorationController);
customRouter.post("/setAccountCheat", setAccountCheatController);
customRouter.post("/setGuildCheat", setGuildCheatController);

customRouter.post("/getConfig", getConfigController);
customRouter.post("/setConfig", setConfigController);

export { customRouter };
