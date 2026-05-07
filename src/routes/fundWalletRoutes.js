import express from "express";
import protect from "../middlewares/authmiddleware.js";
import { validateAmount } from "../middlewares/validationMiddleware.js";
import { fundWallet } from "../controllers/fundWalletController.js";

const route = express.Router();

route.post("/top-up", protect, validateAmount, fundWallet);

export default route;
