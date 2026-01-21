import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  failRazorpayPayment,
} from "../services/razorpay.service.js";
import { getRazorpay } from "../config/razorpay.js";

export const createOrder = async (req, res) => {
  console.log("➡️ Razorpay create-order route hit");
  
  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({
      success: false,
      message: "Payments are temporarily unavailable",
    });
  }

  try {
    const { userId, courseId, isJammingRoom, jammingRoomData } = req.body;
    
    // Validate input
    if (!userId || !courseId) {
      return res.status(400).json({ 
        error: "Missing required fields: userId and courseId are required",
        received: { userId, courseId }
      });
    }

    console.log(`[Razorpay Controller] Creating order for userId: ${userId}, courseId: ${courseId}, isJammingRoom: ${isJammingRoom}`);
    const result = await createRazorpayOrder({ userId, courseId, isJammingRoom, jammingRoomData });
    
    // Check if result contains an error (from fallback logic)
    if (result.error) {
      return res.status(404).json(result);
    }

    // Validate response format
    if (!result.key || !result.order || !result.enrollmentId) {
      console.error("[Razorpay Controller] Invalid response format:", result);
      return res.status(500).json({ 
        error: "Invalid response from Razorpay service",
        details: "Response missing required fields: key, order, or enrollmentId"
      });
    }
    
    console.log(`[Razorpay Controller] Order created successfully - Order ID: ${result.order.id}, Enrollment ID: ${result.enrollmentId}`);
    res.json(result);
  } catch (err) {
    console.error("[Razorpay Controller] Create order error:", err);
    res.status(400).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

export const verifyPayment = async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({
      success: false,
      message: "Payments are temporarily unavailable",
    });
  }

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, enrollmentId } = req.body;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        error: "Missing required fields: razorpay_payment_id, razorpay_order_id, and razorpay_signature are required",
        success: false
      });
    }

    console.log(`[Razorpay Controller] Verifying payment - Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);
    const result = await verifyRazorpayPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enrollmentId,
    });

    // Ensure response includes success flag
    if (result.success === true) {
      res.json({ success: true, ...result });
    } else {
      res.json({ success: false, ...result });
    }
  } catch (err) {
    console.error("[Razorpay Controller] Verification error:", err);
    res.status(400).json({ 
      error: err.message,
      success: false 
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({
      success: false,
      message: "Payments are temporarily unavailable",
    });
  }

  try {
    await handleRazorpayWebhook(req);
    res.status(200).send("OK");
  } catch (err) {
    res.status(400).send("Webhook error");
  }
};

export const markPaymentFailed = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID is required",
      });
    }

    console.log(`[Razorpay Controller] Marking payment as failed - paymentId: ${paymentId}`);
    const result = await failRazorpayPayment({ paymentId, reason });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[Razorpay Controller] Mark payment failed error:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};
