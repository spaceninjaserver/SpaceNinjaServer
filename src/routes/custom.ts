import { addItemController } from "@/src/controllers/custom/addItemController";
import { createAccountController } from "@/src/controllers/custom/createAccountController";
import express from "express";

const customRouter = express.Router();

customRouter.post("/createAccount", createAccountController);
customRouter.post("/addItem", addItemController);

export { customRouter };
