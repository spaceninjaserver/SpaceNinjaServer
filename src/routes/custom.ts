import express from "express";
import { getItemListsController } from "@/src/controllers/custom/getItemListsController";
import { createAccountController } from "@/src/controllers/custom/createAccountController";
import { addItemController } from "@/src/controllers/custom/addItemController";
import { getConfigDataController } from "@/src/controllers/custom/getConfigDataController";
import { updateConfigDataController } from "@/src/controllers/custom/updateConfigDataController";

const customRouter = express.Router();

customRouter.get("/getItemLists", getItemListsController);

customRouter.post("/createAccount", createAccountController);
customRouter.post("/addItem", addItemController);

customRouter.get("/config", getConfigDataController);
customRouter.post("/config", updateConfigDataController);

export { customRouter };
