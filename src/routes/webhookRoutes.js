import express from "express";
import crypto from "crypto";
import pool from "../config.js/db.js";
import { paystackWebhook } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/paystack", paystackWebhook);

export default router;
