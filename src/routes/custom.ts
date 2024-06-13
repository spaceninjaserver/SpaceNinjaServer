import express from "express";
import { getItemListsController } from "@/src/controllers/custom/getItemListsController";
import { createAccountController } from "@/src/controllers/custom/createAccountController";
import { addItemController } from "@/src/controllers/custom/addItemController";
import { getConfigData } from "@/src/controllers/custom/getConfigData";
import { updateConfigData } from "@/src/controllers/custom/updateConfigData";

const customRouter = express.Router();

customRouter.get("/getItemLists", getItemListsController);

customRouter.post("/createAccount", createAccountController);
customRouter.post("/addItem", addItemController);

customRouter.get("/config", getConfigData);
customRouter.post("/config", updateConfigData);

export { customRouter };