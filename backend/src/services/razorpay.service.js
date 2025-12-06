import crypto from "crypto";
import prisma from "../config/prismaClient.js";
import { razorpay } from "../config/razorpay.js";

export const createRazorpayOrder = async ({ userId, courseId }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!user || !course) throw new Error("Invalid userId or courseId");

  const amount = Math.round(course.price * 100);

  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `course_${course.id}_user_${user.id}_${Date.now()}`,
    notes: { userId: user.id, courseId: course.id },
  });

  const enrollment = await prisma.enrollment.create({
    data: { userId: user.id, courseId: course.id, status: "pending" },
  });

  return {
    key: process.env.RAZORPAY_KEY_ID,
    order,
    enrollmentId: enrollment.id,
  };
};

export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  enrollmentId,
}) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generatedSignature !== razorpay_signature)
    throw new Error("Invalid signature");

  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "paid", paymentId: razorpay_payment_id },
  });

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
