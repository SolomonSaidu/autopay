import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoute from "./routes/usersRoutes.js";
import scheduleRoute from "./routes/scheduleRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import fundWallet from "./routes/fundWalletRoutes.js";
import transactionRoute from "./routes/transactionRoutes.js";
import startPaymentScheduler from "./schedule/paymentScheduler.js";
import webhookRoutes from "./routes/webhookRoutes.js";
dotenv.config();

const app = express();
app.use(
  cors({
    // Specify the exact URL where your React frontend is running
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allows cookies or authorization headers to pass through
  })
);
app.use(express.json());
app.use("/api", usersRoute);
app.use("/api", scheduleRoute);
app.use("/api", fundWallet);
app.use("/api", transactionRoute);
app.use("/api", webhookRoutes);

// DONT FORGET TO UNCOMMENT THIS
startPaymentScheduler();

app.get("/api", (req, res) => {
  res.json({ msg: "Server runnig" });
});

app.use(errorHandler);
let PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
