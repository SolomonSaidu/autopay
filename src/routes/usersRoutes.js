import express from "express";
import protect from "../middlewares/authmiddleware.js";
import { register, login, profile } from "../controllers/usersController.js";
import { registerSchema, loginSchema } from "../validator/userValidator.js";
import { validateUsers } from "../middlewares/validationMiddleware.js";

const route = express.Router();

route.post("/users/register", validateUsers(registerSchema), register);

route.post("/users/login", validateUsers(loginSchema), login);

route.get("/users/me", protect, profile);

route.put("/users", async (req, res) => {
  try {
  } catch (error) {}
});

route.delete("/users", async (req, res) => {
  try {
  } catch (error) {}
});

route.post("/user/logout", async (req, res) => {
  try {
  } catch (error) {}
});
export default route;
