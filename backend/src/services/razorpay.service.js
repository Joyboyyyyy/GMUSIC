import crypto from "crypto";
import db from "../lib/db.js";
import { getRazorpay } from "../config/razorpay.js";

export const createRazorpayOrder = async ({ userId, courseId }) => {
  console.log(`[Razorpay Service] Creating order for userId: ${userId}, courseId: ${courseId}`);
  
  // ===== INPUT VALIDATION =====
  // Validate courseId - must be a non-empty string (UUID format)
  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    console.error(`[Razorpay Service] Invalid courseId: ${courseId} (type: ${typeof courseId})`);
    throw new Error(`Invalid courseId. Received: ${courseId}. Expected a valid UUID string.`);
  }
  
  // Validate userId - must be a non-empty string (UUID format)
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    console.error(`[Razorpay Service] Invalid userId: ${userId} (type: ${typeof userId})`);
    throw new Error(`Invalid userId. Received: ${userId}. Expected a valid UUID string.`);
  }
  
  // Check for obviously invalid IDs (numeric strings like "1", "2", etc.)
  if (/^\d+$/.test(courseId)) {
    console.error(`[Razorpay Service] Numeric courseId rejected: ${courseId}`);
    throw new Error(`Invalid courseId format. Received numeric ID: ${courseId}. Expected UUID format.`);
  }
  
  const razorpay = getRazorpay();
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }

  // ===== DATABASE LOOKUP - SINGLE SOURCE OF TRUTH =====
  console.log(`[Razorpay Service] Fetching user and course from database...`);
  
  // Fetch user from database
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`[Razorpay Service] User not found in database: ${userId}`);
    throw new Error(`User not found. userId: ${userId}`);
  }
  console.log(`[Razorpay Service] User found: ${user.id}, email: ${user.email}`);
  
  // Fetch course from database - THIS IS THE SINGLE SOURCE OF TRUTH FOR PRICE
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    console.error(`[Razorpay Service] Course not found in database: ${courseId}`);
    throw new Error(`Course not found. courseId: ${courseId}. Please ensure the course exists in the database.`);
  }
  console.log(`[Razorpay Service] Course found: ${course.id}, title: ${course.title}, price: ${course.price}`);
  
  // Validate course price from database (NEVER trust frontend price)
  if (!course.price || typeof course.price !== 'number' || course.price <= 0) {
    console.error(`[Razorpay Service] Invalid course price in database: ${course.price} for courseId: ${courseId}`);
    throw new Error(`Invalid course price: ${course.price}. Price must be a positive number.`);
  }

  // ===== COMPUTE AMOUNT FROM DATABASE ONLY =====
  // Amount in paise (1 INR = 100 paise)
  const amount = Math.round(course.price * 100);
  console.log(`[Razorpay Service] Computed amount: ${amount} paise (₹${course.price})`);

  if (amount < 100) {
    throw new Error(`Amount too small: ₹${course.price}. Minimum is ₹1.`);
  }

  // ===== CREATE RAZORPAY ORDER =====
  const receiptId = `rcpt_${Date.now()}`;
  console.log(`[Razorpay Service] Creating Razorpay order - amount: ${amount}, currency: INR, receipt: ${receiptId}`);
  
  let order;
  try {
    order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: receiptId,
      notes: { 
        userId: user.id, 
        courseId: course.id,
        courseTitle: course.title,
        userEmail: user.email
      },
    });
    console.log(`[Razorpay Service] Razorpay order created: ${order.id}`);
  } catch (razorpayError) {
    console.error(`[Razorpay Service] Razorpay API error:`, razorpayError);
    if (razorpayError.error) {
      console.error(`[Razorpay Service] Razorpay error details:`, JSON.stringify(razorpayError.error, null, 2));
    }
    throw new Error(razorpayError.error?.description || razorpayError.message || "Failed to create Razorpay order");
  }

  // ===== CREATE ENROLLMENT RECORD =====
  console.log(`[Razorpay Service] Creating enrollment record...`);
  const enrollment = await db.enrollment.create({
    data: { 
      userId: user.id, 
      courseId: course.id, 
      status: "pending" 
    },
  });
  console.log(`[Razorpay Service] Enrollment created: ${enrollment.id}`);

  // ===== RETURN RESPONSE =====
  const response = {
    key: process.env.RAZORPAY_KEY_ID,
    order,
    enrollmentId: enrollment.id,
    course: {
      id: course.id,
      title: course.title,
      price: course.price,
    }
  };

  console.log(`[Razorpay Service] Order creation successful - orderId: ${order.id}, enrollmentId: ${enrollment.id}`);
  return response;
};

export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  enrollmentId,
}) => {
  console.log(`[Razorpay Service] Verifying payment - Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

  const razorpay = getRazorpay();
  if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }

  // Verify signature using HMAC SHA256
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    console.error(`[Razorpay Service] Signature mismatch. Expected: ${generatedSignature}, Received: ${razorpay_signature}`);
    throw new Error("Invalid signature");
  }

  console.log(`[Razorpay Service] Signature verified successfully. Updating enrollment...`);

  // Find enrollment by enrollmentId if provided, otherwise find by order_id from Razorpay
  let enrollment;
  
  if (enrollmentId) {
    // Update enrollment directly if enrollmentId is provided
    enrollment = await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "paid", paymentId: razorpay_payment_id },
    });
    console.log(`[Razorpay Service] Enrollment updated: ${enrollment.id}`);
  } else {
    // Try to find enrollment by looking up the Razorpay order
    // This requires fetching order details from Razorpay to get userId/courseId from notes
    // For now, if enrollmentId is missing, we'll need to return an error
    throw new Error("enrollmentId is required to update enrollment status");
  }

  return { success: true, enrollment };
};

export const handleRazorpayWebhook = async (req) => {
  const razorpay = getRazorpay();
  if (!razorpay || !process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET in .env");
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  const signature = req.headers["x-razorpay-signature"];
  if (expected !== signature) throw new Error("Invalid webhook signature");

  const event = JSON.parse(req.rawBody.toString());

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    await db.enrollment.updateMany({
      where: { paymentId: null, status: "pending" },
      data: { status: "paid", paymentId: payment.id },
    });
  }
};
