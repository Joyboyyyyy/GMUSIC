import db from '../lib/db.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

class PaymentService {
  async createPaymentIntent(userId, courseId, amount) {
    // Get course details
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Check if already purchased
    const existingPurchase = await db.purchase.findFirst({
      where: {
        userId,
        courseId,
        status: 'COMPLETED',
      },
    });

    if (existingPurchase) {
      throw new Error('Course already purchased');
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'inr',
      metadata: {
        userId,
        courseId,
        courseName: course.title,
      },
    });

    // Create purchase record
    const purchase = await db.purchase.create({
      data: {
        userId,
        courseId,
        amount,
        currency: 'INR',
        paymentMethod: 'card',
        paymentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase.id,
    };
  }

  async confirmPayment(purchaseId, paymentData) {
    const purchase = await db.purchase.findUnique({
      where: { id: purchaseId },
      include: { course: true },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    // Update purchase status
    const updatedPurchase = await db.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'COMPLETED',
        paymentId: paymentData.paymentId || purchase.paymentId,
      },
    });

    // Create enrollment
    await db.enrollment.create({
      data: {
        userId: purchase.userId,
        courseId: purchase.courseId,
        progress: 0,
      },
    });

    // Update course students count
    await db.course.update({
      where: { id: purchase.courseId },
      data: {
        studentsCount: { increment: 1 },
      },
    });

    return updatedPurchase;
  }

  async getUserPurchases(userId) {
    const purchases = await db.purchase.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return purchases;
  }

  async refundPurchase(purchaseId) {
    const purchase = await db.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.status !== 'COMPLETED') {
      throw new Error('Can only refund completed purchases');
    }

    // Process Stripe refund
    if (purchase.paymentId) {
      await stripe.refunds.create({
        payment_intent: purchase.paymentId,
      });
    }

    // Update purchase status
    await db.purchase.update({
      where: { id: purchaseId },
      data: { status: 'REFUNDED' },
    });

    // Remove enrollment
    await db.enrollment.deleteMany({
      where: {
        userId: purchase.userId,
        courseId: purchase.courseId,
      },
    });

    return { message: 'Refund processed successfully' };
  }
}

export default new PaymentService();

