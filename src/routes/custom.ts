import express from "express";
import { getItemListsController } from "@/src/controllers/custom/getItemListsController";
import { createAccountController } from "@/src/controllers/custom/createAccountController";
import { addItemController } from "@/src/controllers/custom/addItemController";

const customRouter = express.Router();

customRouter.get("/getItemLists", getItemListsController);

customRouter.post("/createAccount", createAccountController);
customRouter.post("/addItem", addItemController);

export { customRouter };
