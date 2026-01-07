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
  // These are mock data IDs - return a helpful error message
  if (/^\d+$/.test(courseId)) {
    console.error(`[Razorpay Service] Numeric courseId rejected: ${courseId} - This appears to be mock data`);
    throw new Error(`This is a demo course (ID: ${courseId}). Real payment requires a course from the database. Please use the test mode in the app.`);
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
  
  // Use pricePerSlot as the price field (database schema uses pricePerSlot, not price)
  const coursePrice = course.pricePerSlot || course.price;
  console.log(`[Razorpay Service] Course found: ${course.id}, name: ${course.name}, pricePerSlot: ${course.pricePerSlot}`);
  
  // Validate course price from database (NEVER trust frontend price)
  if (!coursePrice || typeof coursePrice !== 'number' || coursePrice <= 0) {
    console.error(`[Razorpay Service] Invalid course price in database: ${coursePrice} for courseId: ${courseId}`);
    throw new Error(`Invalid course price: ${coursePrice}. Price must be a positive number.`);
  }

  // ===== COMPUTE AMOUNT FROM DATABASE ONLY =====
  // Amount in paise (1 INR = 100 paise)
  const amount = Math.round(coursePrice * 100);
  console.log(`[Razorpay Service] Computed amount: ${amount} paise (₹${coursePrice})`);

  if (amount < 100) {
    throw new Error(`Amount too small: ₹${coursePrice}. Minimum is ₹1.`);
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
        courseTitle: course.name,
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

  // ===== CREATE PAYMENT RECORD =====
  console.log(`[Razorpay Service] Creating payment record...`);
  const payment = await db.payment.create({
    data: { 
      studentId: user.id, 
      amount: coursePrice,
      currency: 'INR',
      status: 'PENDING',
      gatewayOrderId: order.id,
      slotIds: [], // Will be populated when slots are booked
    },
  });
  console.log(`[Razorpay Service] Payment created: ${payment.id}`);

  // ===== RETURN RESPONSE =====
  const response = {
    key: process.env.RAZORPAY_KEY_ID,
    order,
    enrollmentId: payment.id, // Using payment ID as enrollment ID for backward compatibility
    paymentId: payment.id,
    course: {
      id: course.id,
      title: course.name,
      price: coursePrice,
    }
  };

  console.log(`[Razorpay Service] Order creation successful - orderId: ${order.id}, paymentId: ${payment.id}`);
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

  // Find payment by enrollmentId (which is actually paymentId) if provided
  let payment;
  
  if (enrollmentId) {
    // Update payment directly if enrollmentId (paymentId) is provided
    payment = await db.payment.update({
      where: { id: enrollmentId },
      data: { 
        status: 'COMPLETED', 
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature,
        completedAt: new Date(),
      },
    });
    console.log(`[Razorpay Service] Payment updated: ${payment.id}`);
  } else {
    // Try to find payment by gatewayOrderId
    payment = await db.payment.findFirst({
      where: { gatewayOrderId: razorpay_order_id },
    });
    
    if (payment) {
      payment = await db.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'COMPLETED', 
          gatewayPaymentId: razorpay_payment_id,
          gatewaySignature: razorpay_signature,
          completedAt: new Date(),
        },
      });
      console.log(`[Razorpay Service] Payment found and updated: ${payment.id}`);
    } else {
      throw new Error("Payment record not found for this order");
    }
  }

  // Assign building to user if they don't have one yet
  // Get the course from the Razorpay order notes
  try {
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const courseId = order.notes?.courseId;
    const userId = order.notes?.userId || payment.studentId;
    
    if (courseId && userId) {
      // Get course to find its building
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { buildingId: true },
      });
      
      if (course?.buildingId) {
        // Check if user already has a building
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { buildingId: true },
        });
        
        // If user doesn't have a building, assign the course's building
        if (!user?.buildingId) {
          await db.user.update({
            where: { id: userId },
            data: { 
              buildingId: course.buildingId,
              approvalStatus: 'ACTIVE', // Auto-approve since they purchased a course
            },
          });
          console.log(`[Razorpay Service] Assigned building ${course.buildingId} to user ${userId}`);
        }
      }
    }
  } catch (buildingError) {
    // Don't fail the payment verification if building assignment fails
    console.error(`[Razorpay Service] Error assigning building to user:`, buildingError);
  }

  return { success: true, payment, enrollment: payment };
};

export const failRazorpayPayment = async ({ paymentId, reason }) => {
  console.log(`[Razorpay Service] Marking payment as failed - paymentId: ${paymentId}, reason: ${reason}`);
  
  if (!paymentId) {
    throw new Error('Payment ID is required');
  }

  const payment = await db.payment.update({
    where: { id: paymentId },
    data: { 
      status: 'FAILED',
      failedAt: new Date(),
      failureReason: reason || 'User cancelled payment',
    },
  });

  console.log(`[Razorpay Service] Payment marked as failed: ${payment.id}`);
  return { success: true, payment };
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
    const paymentEntity = event.payload.payment.entity;
    await db.payment.updateMany({
      where: { gatewayOrderId: paymentEntity.order_id, status: 'PENDING' },
      data: { 
        status: 'COMPLETED', 
        gatewayPaymentId: paymentEntity.id,
        completedAt: new Date(),
      },
    });
  }
};
