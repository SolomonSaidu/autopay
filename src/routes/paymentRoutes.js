import express from "express";
import protect from "../middlewares/authmiddleware.js";
import { validatePayment } from "../middlewares/validationMiddleware.js";
import {
  createSchedule,
  getSchedule,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controllers/paymentController.js";

const route = express.Router();

route.post("/payments", protect, validatePayment, createSchedule);

route.get("/payments", protect, getSchedule);

route.get("/payments/:id", protect, getScheduleById);

route.put("/payments/:id", protect, validatePayment, updateSchedule);

route.delete("/payments/:id", protect, deleteSchedule);

//Get upcoming payments
route.get("/payments/upcoming", async (req, res) => {
  try {
  } catch (error) {}
});

//Get past payment (History)
route.get("/payments/history", async (req, res) => {
  try {
  } catch (error) {}
});

export default route;
