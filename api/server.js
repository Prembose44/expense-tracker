import { setServers } from "dns";
setServers(["8.8.8.8", "8.8.4.4"]); // Fix: ISP/router DNS blocks SRV lookups needed by mongodb+srv://

import express       from "express";
import mongoose      from "mongoose";
import cors          from "cors";
import dotenv        from "dotenv";
import expenseRoutes from "./routes/expenses.js";

dotenv.config();

const app = express();

// ── Middleware ──
app.use(cors());           // allow React (localhost:5173) to call this API
app.use(express.json());   // parse JSON request bodies

// ── Connect to MongoDB Atlas ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Atlas connected — database: expensevault"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ── Routes ──
app.use("/api/expenses", expenseRoutes);

// ── Health check ──
app.get("/", (req, res) => {
  res.json({
    status:   "running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    message:  "ExpenseVault MongoDB API is live",
  });
});

// ── Start server ──
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
