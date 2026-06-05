// Load environment variables from .env file
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// Import route handlers
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js";
import itemRoutes from "./routes/items.js";

const app = express();

// Allow requests from the React dev server
app.use(cors({ origin: "http://localhost:5173" }));

// Parse JSON request bodies so we can use req.body
app.use(express.json());

// Mount routes — all auth routes start with /api/auth, etc.
app.use("/api/auth", authRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/inventories", itemRoutes); // items are nested under inventories

// Connect to MongoDB, then start the server
mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Connected to MongoDB");
  app.listen(8000, () => console.log("Server running on http://localhost:8000"));
}).catch(err => {
  console.error("MongoDB connection failed:", err.message);
});
