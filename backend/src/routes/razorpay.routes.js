import express from "express";
import {
  createOrder,
  verifyPayment,
  razorpayWebhook,
  markPaymentFailed,
} from "../controllers/razorpay.controller.js";

const router = express.Router();

router.post("/order", createOrder);
router.post("/verify", verifyPayment);
router.post("/webhook", razorpayWebhook);
router.post("/fail", markPaymentFailed);

export default router;
