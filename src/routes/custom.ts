import { createAccountController } from "@/src/controllers/custom/createAccountController";
import express from "express";

const customRouter = express.Router();

customRouter.post("/createAccount", createAccountController);

export { customRouter };
