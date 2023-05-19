import express from "express";
import { createAccountController } from "../controllers/custom/createAccountController";

const customRouter = express.Router();

customRouter.post("/createAccount", createAccountController);

export { customRouter };
