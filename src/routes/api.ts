import {
    checkDailyMissionBonusController,
    deleteSessionController,
    dronesController,
    findSessionsController,
    genericUpdateController,
    getAllianceController,
    getCreditsController,
    getFriendsController,
    getIgnoredUsersController,
    getNewRewardSeedController,
    getShipController,
    hostSessionController,
    hubController,
    hubInstancesController,
    inboxController,
    inventoryController,
    loginController,
    loginRewardsController,
    logoutController,
    marketRecommendationsController,
    missionInventoryUpdateController,
    modularWeaponSaleController,
    purchaseController,
    rerollRandomModController,
    setActiveQuestController,
    surveysController,
    updateChallengeProgressController,
    updateSessionGetController,
    updateSessionPostController,
    viewController
} from "@/src/controllers/api";
import express from "express";

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
apiRouter.post("/rerollRandomMod.php", rerollRandomModController);
export { apiRouter };
