import express from "express";
import authRoutes from "./auth.routes.js";
import courseRoutes from "./course.routes.js";
import paymentRoutes from "./payment.routes.js";
import buildingRoutes from "./building.routes.js";
import slotRoutes from "./slot.routes.js";
import bookingRoutes from "./booking.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";
import musicRoomRoutes from "./musicRoom.routes.js";

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

// COURSE ROUTES
router.use("/courses", courseRoutes);

// PAYMENT ROUTES
router.use("/payments", paymentRoutes);

// BUILDING ROUTES
router.use("/buildings", buildingRoutes);

// SLOT ROUTES
router.use("/slots", slotRoutes);

// BOOKING ROUTES
router.use("/bookings", bookingRoutes);

// NOTIFICATION ROUTES
router.use("/notifications", notificationRoutes);

// ADMIN ROUTES
router.use("/admin", adminRoutes);

// MUSIC ROOM ROUTES (Jamming Rooms)
router.use("/music-rooms", musicRoomRoutes);

export default router;

