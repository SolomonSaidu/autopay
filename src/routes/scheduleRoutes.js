import express from "express";
import protect from "../middlewares/authmiddleware.js";
import { validatePayment } from "../middlewares/validationMiddleware.js";
import {
  createSchedule,
  getSchedule,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "../controllers/scheduleController.js";

const route = express.Router();

// add the validation middleware you removed
route.post("/schedule", protect, createSchedule);

route.get("/schedule", protect, getSchedule);

route.get("/schedule/:id", protect, getScheduleById);

route.put("/schedule/:id", protect, validatePayment, updateSchedule);

route.delete("/schedule/:id", protect, deleteSchedule);

//Get upcoming payments
route.get("/payments/upcoming", async (req, res) => {
  try {
  } catch (error) {}
});

export default route;
