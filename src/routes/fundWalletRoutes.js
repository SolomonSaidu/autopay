import express from "express";
import protect from "../middlewares/authmiddleware.js";
// import { validateAmount } from "../middlewares/validationMiddleware.js";
import {
  initializePayment,
  verifyAccountNumber,
} from "../controllers/fundWalletController.js";

const router = express.Router();
// ADD THE STUFF YOU REMOVED
router.post("/init-topup", protect, initializePayment);

router.post("/verify-account", protect, verifyAccountNumber);

export default router;
