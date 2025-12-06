import express from "express";
import {
  createOrder,
  verifyPayment,
  razorpayWebhook,
} from "../controllers/razorpay.controller.js";

const router = express.Router();

router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", razorpayWebhook);

export default router;
