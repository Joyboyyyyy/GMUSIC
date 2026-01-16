/**
 * Debug script to check purchased courses data
 * Run with: node debug-purchased-courses.js <userId>
 */

import db from './src/lib/db.js';
import { getRazorpay } from './src/config/razorpay.js';

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a userId as argument');
  console.error('Usage: node debug-purchased-courses.js <userId>');
  process.exit(1);
}

console.log('\n========================================');
console.log('🔍 DEBUGGING PURCHASED COURSES');
console.log('========================================\n');
console.log(`User ID: ${userId}`);
console.log(`Timestamp: ${new Date().toISOString()}\n`);

async function debug() {
  try {
    // 1. Check if user exists
    console.log('1️⃣  Checking if user exists...');
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, buildingId: true },
    });
    
    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Building ID: ${user.buildingId || 'None'}\n`);

    // 2. Check SlotEnrollments
    console.log('2️⃣  Checking SlotEnrollments...');
    const enrollments = await db.slotEnrollment.findMany({
      where: { studentId: userId },
      include: {
        slot: {
          include: {
            course: {
              select: { id: true, name: true, pricePerSlot: true },
            },
          },
        },
      },
    });
    
    console.log(`   Found ${enrollments.length} enrollments:`);
    if (enrollments.length > 0) {
      enrollments.forEach((e, i) => {
        console.log(`   ${i + 1}. Status: ${e.status}, Course: ${e.slot?.course?.name || 'N/A'} (${e.slot?.course?.id || 'N/A'})`);
      });
    } else {
      console.log('   ⚠️  No enrollments found');
    }
    console.log('');

    // 3. Check Payments
    console.log('3️⃣  Checking Payments...');
    const payments = await db.payment.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(`   Found ${payments.length} payments:`);
    if (payments.length > 0) {
      for (let i = 0; i < payments.length; i++) {
        const p = payments[i];
        console.log(`\n   Payment ${i + 1}:`);
        console.log(`   - ID: ${p.id}`);
        console.log(`   - Status: ${p.status}`);
        console.log(`   - Amount: ₹${p.amount}`);
        console.log(`   - Gateway Order ID: ${p.gatewayOrderId || 'None'}`);
        console.log(`   - Gateway Payment ID: ${p.gatewayPaymentId || 'None'}`);
        console.log(`   - Created: ${p.createdAt}`);
        console.log(`   - Completed: ${p.completedAt || 'Not completed'}`);
        
        // Try to fetch Razorpay order details
        if (p.gatewayOrderId && p.status === 'COMPLETED') {
          try {
            const razorpay = getRazorpay();
            if (razorpay) {
              console.log(`   - Fetching Razorpay order...`);
              const order = await razorpay.orders.fetch(p.gatewayOrderId);
              console.log(`   - Order Notes:`, JSON.stringify(order.notes, null, 2));
              
              const courseId = order.notes?.courseId;
              if (courseId) {
                console.log(`   - Course ID from notes: ${courseId}`);
                
                // Check if course exists
                const course = await db.course.findUnique({
                  where: { id: courseId },
                  select: { id: true, name: true, pricePerSlot: true, isActive: true },
                });
                
                if (course) {
                  console.log(`   - ✅ Course found: ${course.name} (Active: ${course.isActive})`);
                } else {
                  console.log(`   - ❌ Course NOT found in database!`);
                }
              } else {
                console.log(`   - ⚠️  No courseId in order notes`);
              }
            } else {
              console.log(`   - ⚠️  Razorpay not configured`);
            }
          } catch (err) {
            console.log(`   - ❌ Error fetching order: ${err.message}`);
          }
        }
      }
    } else {
      console.log('   ⚠️  No payments found');
    }
    console.log('');

    // 4. Summary
    console.log('========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    
    const completedPayments = payments.filter(p => p.status === 'COMPLETED');
    const confirmedEnrollments = enrollments.filter(e => e.status === 'CONFIRMED');
    
    console.log(`Total Payments: ${payments.length}`);
    console.log(`Completed Payments: ${completedPayments.length}`);
    console.log(`Total Enrollments: ${enrollments.length}`);
    console.log(`Confirmed Enrollments: ${confirmedEnrollments.length}`);
    console.log('');
    
    if (completedPayments.length === 0 && confirmedEnrollments.length === 0) {
      console.log('⚠️  No purchased courses found!');
      console.log('   This user has not completed any purchases.');
    } else {
      console.log('✅ User has purchased courses');
      console.log('   Expected courses to show in app:', completedPayments.length + confirmedEnrollments.length);
    }
    
    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await db.$disconnect();
  }
}

debug();
