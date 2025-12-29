import express from "express";
import authRoutes from "./auth.routes.js";

const router = express.Router();

// HEALTH CHECK ENDPOINT
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Gretex Music Room API is running",
    timestamp: new Date(),
  });
});

// AUTH ROUTES
router.use("/auth", authRoutes);

export default router;

