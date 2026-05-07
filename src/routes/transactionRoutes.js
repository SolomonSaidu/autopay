import express from "express";
import protect from "../middlewares/authmiddleware.js";
import {
  getHistory,
  getHistoryById,
} from "../controllers/transactionController.js";

const route = express.Router();

route.get("/transaction/history", protect, getHistory);

route.get("/transaction/history/:id", protect, getHistoryById);

export default route;
