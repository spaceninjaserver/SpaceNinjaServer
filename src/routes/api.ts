import getFriendsController from "@/src/controllers/api/getFriendsController";
import inventoryController from "@/src/controllers/api/inventoryController";
import purchaseController from "@/src/controllers/api/purchaseController";
import express from "express";
import { checkDailyMissionBonusController } from "../controllers/api/checkDailyMissionBonusController";
import { dronesController } from "../controllers/api/dronesController";
import { findSessionsController } from "../controllers/api/findSessionsController";
import { getAllianceController } from "../controllers/api/getAllianceController";
import { getIgnoredUsersController } from "../controllers/api/getIgnoredUsersController";
import { getNewRewardSeedController } from "../controllers/api/getNewRewardSeedController";
import { getShipController } from "../controllers/api/getShipController";
import { hostSessionController } from "../controllers/api/hostSessionController";
import { inboxController } from "../controllers/api/inboxController";
import { loginController } from "../controllers/api/loginController";
import { loginRewardsController } from "../controllers/api/loginRewardsController";
import { marketRecommendationsController } from "../controllers/api/marketRecommendationsController";
import { setActiveQuestController } from "../controllers/api/setActiveQuestController";
import { surveysController } from "../controllers/api/surveysController";
import { updateChallengeProgressController } from "../controllers/api/updateChallengeProgressController";
import { viewController } from "../controllers/api/viewController";
import { updateSessionPostController } from "../controllers/api/updateSessionController";
import { updateSessionGetController } from "../controllers/api/updateSessionController";
import { getCreditsController } from "../controllers/api/getCreditsController";
import { hubInstancesController } from "../controllers/api/hubInstancesController";
import { hubController } from "../controllers/api/hubController";
import { modularWeaponSaleController } from "../controllers/api/modularWeaponSaleController";
import { deleteSessionController } from "../controllers/api/deleteSessionController";
import { logoutController } from "../controllers/api/logoutController";
import { missionInventoryUpdateController } from "../controllers/api/missionInventoryUpdateController";
import { genericUpdateController } from "../controllers/api/genericUpdateController";


const apiRouter = express.Router();

// get
apiRouter.get("/inventory.php", inventoryController);
apiRouter.get("/getFriends.php", getFriendsController);
apiRouter.get("/marketRecommendations.php", marketRecommendationsController);
apiRouter.get("/marketSearchRecommendations.php", marketRecommendationsController);
apiRouter.get("/surveys.php", surveysController);
apiRouter.get("/loginRewards.php", loginRewardsController);
apiRouter.get("/checkDailyMissionBonus.php", checkDailyMissionBonusController);
apiRouter.get("/inbox.php", inboxController);
apiRouter.get("/getShip.php", getShipController);
apiRouter.get("/view.php", viewController);
apiRouter.get("/drones.php", dronesController); 
apiRouter.get("/getIgnoredUsers.php", getIgnoredUsersController);
apiRouter.get("/getNewRewardSeed.php", getNewRewardSeedController);
apiRouter.get("/setActiveQuest.php", setActiveQuestController);
apiRouter.get("/updateSession.php", updateSessionGetController);
apiRouter.get("/credits.php", getCreditsController);
apiRouter.get("/hubInstances", hubInstancesController);
apiRouter.get("/hub", hubController);
apiRouter.get("/modularWeaponSale.php", modularWeaponSaleController);
apiRouter.get("/deleteSession.php", deleteSessionController); 
apiRouter.get("/logout.php", logoutController);

// post
apiRouter.post("/findSessions.php", findSessionsController);
apiRouter.post("/purchase.php", purchaseController);
apiRouter.post("/login.php", loginController);
apiRouter.post("/getAlliance.php", getAllianceController);
apiRouter.post("/updateChallengeProgress.php", updateChallengeProgressController);
apiRouter.post("/hostSession.php", hostSessionController);
apiRouter.post("/updateSession.php", updateSessionPostController); 
apiRouter.post("/missionInventoryUpdate.php", missionInventoryUpdateController); 
apiRouter.post("/genericUpdate.php", genericUpdateController); 

export { apiRouter };
