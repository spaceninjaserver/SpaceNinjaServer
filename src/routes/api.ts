/* eslint-disable @typescript-eslint/no-unsafe-argument */
import express from "express";

import purchaseController from "@/src/controllers/api/purchaseController";
import getFriendsController from "@/src/controllers/api/getFriendsController";
import inventoryController from "@/src/controllers/api/inventoryController";
import { marketRecommendationsController } from "../controllers/api/marketRecommendationsController";
import { loginController } from "../controllers/api/loginController";
import { surveysController } from "../controllers/api/surveysController";
import { getIgnoredUsersController } from "../controllers/api/getIgnoredUsersController";
import { dronesController } from "../controllers/api/dronesController";
import { updateChallengeProgressController } from "../controllers/api/updateChallengeProgressController";
import { findSessionsController } from "../controllers/api/findSessionsController";
import { viewController } from "../controllers/api/viewController";
import { getAllianceController } from "../controllers/api/getAllianceController";
import { loginRewardsController } from "../controllers/api/loginRewardsController";
import { checkDailyMissionBonusController } from "../controllers/api/checkDailyMissionBonusController";
import { getShipController } from "../controllers/api/getShipController";
import { inboxController } from "../controllers/api/inboxController";
import { hostSessionController } from "../controllers/api/hostSessionController";
import { getNewRewardSeedController } from "../controllers/api/getNewRewardSeedController";
import { setActiveQuestController } from "../controllers/api/setActiveQuestController";

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

// post
apiRouter.post("/findSessions.php", findSessionsController);
apiRouter.post("/purchase.php", purchaseController);
apiRouter.post("/login.php", loginController);
apiRouter.post("/getAlliance.php", getAllianceController);
apiRouter.post("/updateChallengeProgress.php", updateChallengeProgressController);
apiRouter.post("/hostSession.php", hostSessionController);

export { apiRouter };
