import crypto from "crypto";
import db from "../lib/db.js";
import { getRazorpay } from "../config/razorpay.js";

// Helper function to create jamming room orders
const createJammingRoomOrder = async ({ userId, jammingRoomData }) => {
  console.log(`[Razorpay Service] Creating jamming room order for userId: ${userId}`);
  
  const razorpay = getRazorpay();
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }

  // Fetch user from database
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`[Razorpay Service] User not found in database: ${userId}`);
    throw new Error(`User not found. userId: ${userId}`);
  }
  console.log(`[Razorpay Service] User found: ${user.id}, email: ${user.email}`);
  
  // SECURITY FIX: Fetch price from database, not from frontend
  // Get the building's jamming room pricing configuration
  let roomPrice = 500; // Default fallback price
  const roomTitle = jammingRoomData?.title || 'Jamming Room Booking';
  
  if (jammingRoomData?.buildingId) {
    try {
      // Fetch building to get pricing configuration
      const building = await db.building.findUnique({
        where: { id: jammingRoomData.buildingId },
        select: { id: true, name: true },
      });
      
      if (building) {
        // TODO: Add a jammingRoomPricePerHour field to Building model
        // For now, use environment variable or default
        roomPrice = parseInt(process.env.JAMMING_ROOM_PRICE_PER_HOUR) || 500;
        console.log(`[Razorpay Service] Using configured jamming room price: ₹${roomPrice} for building: ${building.name}`);
      }
    } catch (dbError) {
      console.error(`[Razorpay Service] Error fetching building pricing:`, dbError);
      // Fall back to default price
    }
  } else {
    // Use environment variable or default if no building specified
    roomPrice = parseInt(process.env.JAMMING_ROOM_PRICE_PER_HOUR) || 500;
  }
  
  // SECURITY: Validate that frontend price matches backend price (if provided)
  if (jammingRoomData?.price && Math.abs(jammingRoomData.price - roomPrice) > 0.01) {
    console.warn(`[Razorpay Service] Price mismatch detected! Frontend: ₹${jammingRoomData.price}, Backend: ₹${roomPrice}`);
    console.warn(`[Razorpay Service] Using backend price: ₹${roomPrice} (ignoring frontend price)`);
  }
  
  console.log(`[Razorpay Service] Jamming room price: ₹${roomPrice}, title: ${roomTitle}`);
  
  // Validate price
  if (!roomPrice || typeof roomPrice !== 'number' || roomPrice <= 0) {
    console.error(`[Razorpay Service] Invalid jamming room price: ${roomPrice}`);
    throw new Error(`Invalid jamming room price: ${roomPrice}. Price must be a positive number.`);
  }

  // Amount in paise (1 INR = 100 paise)
  const amount = Math.round(roomPrice * 100);
  console.log(`[Razorpay Service] Computed amount: ${amount} paise (₹${roomPrice})`);

  if (amount < 100) {
    throw new Error(`Amount too small: ₹${roomPrice}. Minimum is ₹1.`);
  }

  // Create Razorpay order
  const receiptId = `rcpt_jamming_${Date.now()}`;
  console.log(`[Razorpay Service] Creating Razorpay order - amount: ${amount}, currency: INR, receipt: ${receiptId}`);
  
  let order;
  try {
    order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: receiptId,
      notes: { 
        userId: user.id, 
        type: 'jamming_room',
        roomTitle: roomTitle,
        userEmail: user.email,
        buildingId: jammingRoomData?.buildingId || '',
        date: jammingRoomData?.date || '',
        time: jammingRoomData?.time || '',
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

  // Create payment record
  console.log(`[Razorpay Service] Creating payment record for jamming room...`);
  const payment = await db.payment.create({
    data: { 
      studentId: user.id, 
      amount: roomPrice,
      currency: 'INR',
      status: 'PENDING',
      gatewayOrderId: order.id,
      slotIds: [], // Will be populated when slots are booked
    },
  });
  console.log(`[Razorpay Service] Payment created: ${payment.id}`);

  // Return response
  const response = {
    key: process.env.RAZORPAY_KEY_ID,
    order,
    enrollmentId: payment.id,
    paymentId: payment.id,
    course: {
      id: `jamming_room_${Date.now()}`,
      title: roomTitle,
      price: roomPrice,
    }
  };

  console.log(`[Razorpay Service] Jamming room order creation successful - orderId: ${order.id}, paymentId: ${payment.id}`);
  return response;
};

export const createRazorpayOrder = async ({ userId, courseId, isJammingRoom, jammingRoomData }) => {
  console.log(`[Razorpay Service] Creating order for userId: ${userId}, courseId: ${courseId}, isJammingRoom: ${isJammingRoom}`);
  
  // ===== INPUT VALIDATION =====
  // Validate courseId - must be a non-empty string (UUID format or jamming room ID)
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
  
  // Check if this is a jamming room booking (courseId starts with "slot-")
  if (courseId.startsWith('slot-') || isJammingRoom) {
    console.log(`[Razorpay Service] Detected jamming room booking`);
    return await createJammingRoomOrder({ userId, jammingRoomData: jammingRoomData || { price: 500, title: 'Jamming Room Booking' } });
  }
  
  const razorpay = getRazorpay();
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }

  // ===== DATABASE LOOKUP - SINGLE SOURCE OF TRUTH =====
  // SECURITY: Price validation happens here - NEVER trust client-provided prices
  // The database is the single source of truth for all pricing
  // This prevents price manipulation attacks where users could:
  // 1. Modify cart prices stored in CartItem table
  // 2. Send manipulated prices from frontend
  // 3. Exploit race conditions with price changes
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
