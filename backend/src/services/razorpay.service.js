import crypto from "crypto";
import prisma from "../config/prismaClient.js";
import { razorpay } from "../config/razorpay.js";

export const createRazorpayOrder = async ({ userId, courseId }) => {
  console.log(`[Razorpay Service] Starting order creation for userId: ${userId}, courseId: ${courseId}`);
  
  // Check if Razorpay is configured
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }

  console.log(`[Razorpay Service] Fetching user and course from database...`);
  let user = await prisma.user.findUnique({ where: { id: userId } });
  let course = await prisma.course.findUnique({ where: { id: courseId } });

  // Test mode fallback - create test user if not found (for testing only)
  if (!user) {
    console.warn(`[Razorpay Service] User not found: ${userId}. Using test fallback.`);
    
    // Check if we're in development/test mode
    if (process.env.NODE_ENV !== 'production') {
      // Try to create or find a test user
      const testEmail = `test_${Date.now()}@example.com`;
      try {
        user = await prisma.user.upsert({
          where: { email: testEmail },
          update: {},
          create: {
            id: userId || `test-user-${Date.now()}`,
            name: 'Test User',
            email: testEmail,
            password: 'test_password_hash',
            role: 'student',
          },
        });
        console.log(`[Razorpay Service] Created test user: ${user.id}`);
      } catch (error) {
        console.error(`[Razorpay Service] Failed to create test user:`, error);
        return {
          error: `User not found: ${userId}. Please ensure the user exists in the database.`,
          suggestion: "Create a user first or use a valid userId (UUID format)."
        };
      }
    } else {
      return {
        error: `User not found: ${userId}`,
        suggestion: "Please provide a valid userId (UUID format)."
      };
    }
  }
  
  // Test mode fallback - create test course if not found (for testing only)
  if (!course) {
    console.warn(`[Razorpay Service] Course not found: ${courseId}. Using test fallback.`);
    
    // Check if we're in development/test mode
    if (process.env.NODE_ENV !== 'production') {
      // Create a test course
      try {
        course = await prisma.course.create({
          data: {
            id: courseId || `test-course-${Date.now()}`,
            title: 'Test Course',
            description: 'Test course for Razorpay payment',
            price: 500.00, // ₹500 in rupees
            duration: 60, // 60 minutes
          },
        });
        console.log(`[Razorpay Service] Created test course: ${course.id} with price: ${course.price}`);
      } catch (error) {
        console.error(`[Razorpay Service] Failed to create test course:`, error);
        return {
          error: `Course not found: ${courseId}. Please ensure the course exists in the database.`,
          suggestion: "Create a course first or use a valid courseId (UUID format)."
        };
      }
    } else {
      return {
        error: `Course not found: ${courseId}`,
        suggestion: "Please provide a valid courseId (UUID format)."
      };
    }
  }

  console.log(`[Razorpay Service] User and course found. Creating Razorpay order...`);
  const amount = Math.round(course.price * 100);

  if (!amount || amount <= 0) {
    throw new Error(`Invalid course price: ${course.price}`);
  }

  // FIXED RECEIPT (ALWAYS < 40 characters)
  const receiptId = `order_${Date.now()}`;  

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: receiptId,  // <-- FIXED
    notes: { userId: user.id, courseId: course.id },
  });

  console.log(`[Razorpay Service] Razorpay order created: ${order.id}. Creating enrollment...`);

  const enrollment = await prisma.enrollment.create({
    data: { userId: user.id, courseId: course.id, status: "pending" },
  });

  console.log(`[Razorpay Service] Enrollment created: ${enrollment.id}`);

  // Ensure response format matches frontend expectations
  const response = {
    key: process.env.RAZORPAY_KEY_ID,
    order,
    enrollmentId: enrollment.id,
  };

  console.log(`[Razorpay Service] Returning response with key, order.id: ${order.id}, enrollmentId: ${enrollment.id}`);
  return response;
};

export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  enrollmentId,
}) => {
  console.log(`[Razorpay Service] Verifying payment - Order ID: ${razorpay_order_id}, Payment ID: ${razorpay_payment_id}`);

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
    enrollment = await prisma.enrollment.update({
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
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  const signature = req.headers["x-razorpay-signature"];
  if (expected !== signature) throw new Error("Invalid webhook signature");

  const event = JSON.parse(req.rawBody.toString());

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    await prisma.enrollment.updateMany({
      where: { paymentId: null, status: "pending" },
      data: { status: "paid", paymentId: payment.id },
    });
  }
};
