# Razorpay Payment Flow - Complete Documentation

## 📋 **Overview**

This document provides a complete overview of the Razorpay payment integration flow from frontend to backend, including all files, endpoints, and processes.

---

## 🏗️ **Architecture**

```
Frontend (React Native) → Backend (Express.js) → Razorpay API → Database (PostgreSQL)
```

---

## 📁 **File Structure**

### **Backend Files**

1. **`backend/src/config/razorpay.js`**
   - Razorpay SDK initialization
   - Configuration with API keys
   - Helper function to get Razorpay instance

2. **`backend/src/routes/razorpay.routes.js`**
   - Route definitions for Razorpay endpoints
   - Mounted at `/api/payments/razorpay`

3. **`backend/src/controllers/razorpay.controller.js`**
   - Request handlers for Razorpay operations
   - Input validation
   - Response formatting

4. **`backend/src/services/razorpay.service.js`**
   - Business logic for payment processing
   - Order creation
   - Payment verification
   - Webhook handling

### **Frontend Files**

1. **`src/screens/CheckoutScreen.tsx`**
   - Payment UI
   - Razorpay checkout integration
   - Payment flow orchestration

2. **`src/config/api.ts`**
   - API URL configuration
   - Helper functions for API calls

---

## 🔄 **Complete Payment Flow**

### **Step 1: User Initiates Payment**

**Location:** `src/screens/CheckoutScreen.tsx`

**User Action:**
- User clicks "Complete Payment" button
- Screen shows loading indicator

**Code:**
```typescript
const handlePayment = async () => {
  setProcessing(true);
  // ... payment flow
};
```

---

### **Step 2: Create Razorpay Order (Backend)**

**Frontend Request:**
```typescript
POST /api/payments/razorpay/order
Headers: { 'Content-Type': 'application/json' }
Body: {
  userId: "user-uuid",
  courseId: "course-uuid"
}
```

**Backend Route:** `backend/src/routes/razorpay.routes.js`
```javascript
router.post("/order", createOrder);
```

**Backend Controller:** `backend/src/controllers/razorpay.controller.js`
```javascript
export const createOrder = async (req, res) => {
  const { userId, courseId } = req.body;
  
  // Validate input
  if (!userId || !courseId) {
    return res.status(400).json({ 
      error: "Missing required fields: userId and courseId are required"
    });
  }
  
  const result = await createRazorpayOrder({ userId, courseId });
  res.json(result);
};
```

**Backend Service:** `backend/src/services/razorpay.service.js`

**Process:**
1. **Validate Razorpay Configuration**
   ```javascript
   const razorpay = getRazorpay();
   if (!razorpay) {
     throw new Error("Razorpay is not configured");
   }
   ```

2. **Fetch User and Course from Database**
   ```javascript
   let user = await prisma.user.findUnique({ where: { id: userId } });
   let course = await prisma.course.findUnique({ where: { id: courseId } });
   ```

3. **Validate Course Exists and Has Price**
   ```javascript
   if (!course) {
     throw new Error(`Course not found: ${courseId}`);
   }
   if (!course.price || course.price <= 0) {
     throw new Error(`Invalid course price: ${course.price}`);
   }
   ```

4. **Create Razorpay Order**
   ```javascript
   const amount = Math.round(course.price * 100); // Convert to paise
   const receiptId = `order_${Date.now()}`;
   
   const order = await razorpay.orders.create({
     amount,
     currency: "INR",
     receipt: receiptId,
     notes: { userId: user.id, courseId: course.id },
   });
   ```

5. **Create Enrollment Record**
   ```javascript
   const enrollment = await prisma.enrollment.create({
     data: { 
       userId: user.id, 
       courseId: course.id, 
       status: "pending" 
     },
   });
   ```

6. **Return Response**
   ```javascript
   return {
     key: process.env.RAZORPAY_KEY_ID,
     order, // Razorpay order object
     enrollmentId: enrollment.id,
   };
   ```

**Response Format:**
```json
{
  "key": "rzp_test_xxxxx",
  "order": {
    "id": "order_xxxxx",
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_1234567890",
    "status": "created"
  },
  "enrollmentId": "enrollment-uuid"
}
```

---

### **Step 3: Open Razorpay Checkout (Frontend)**

**Location:** `src/screens/CheckoutScreen.tsx`

**Process:**
1. **Extract Order Data**
   ```typescript
   const { key, order, enrollmentId } = orderData;
   ```

2. **Prepare Razorpay Options**
   ```typescript
   const options = {
     description: checkoutItems[0].title,
     image: checkoutItems[0].thumbnailUrl,
     currency: 'INR',
     key: key, // From backend
     amount: order.amount, // In paise
     name: 'Gretex Music Room',
     order_id: order.id, // From backend
     prefill: {
       email: user.email || '',
       contact: '',
       name: user.name || '',
     },
     theme: { color: '#7c3aed' },
   };
   ```

3. **Open Razorpay Checkout**
   ```typescript
   const razorpayData = await RazorpayCheckout.open(options);
   ```

**Razorpay Response:**
```typescript
{
  razorpay_payment_id: "pay_xxxxx",
  razorpay_order_id: "order_xxxxx",
  razorpay_signature: "signature_xxxxx"
}
```

---

### **Step 4: Verify Payment (Backend)**

**Frontend Request:**
```typescript
POST /api/payments/razorpay/verify
Headers: { 'Content-Type': 'application/json' }
Body: {
  razorpay_payment_id: "pay_xxxxx",
  razorpay_order_id: "order_xxxxx",
  razorpay_signature: "signature_xxxxx",
  enrollmentId: "enrollment-uuid"
}
```

**Backend Route:** `backend/src/routes/razorpay.routes.js`
```javascript
router.post("/verify", verifyPayment);
```

**Backend Controller:** `backend/src/controllers/razorpay.controller.js`
```javascript
export const verifyPayment = async (req, res) => {
  const { 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_signature, 
    enrollmentId 
  } = req.body;
  
  // Validate required fields
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      error: "Missing required fields",
      success: false
    });
  }
  
  const result = await verifyRazorpayPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    enrollmentId,
  });
  
  res.json({ success: true, ...result });
};
```

**Backend Service:** `backend/src/services/razorpay.service.js`

**Process:**
1. **Verify Signature (HMAC SHA256)**
   ```javascript
   const generatedSignature = crypto
     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
     .update(razorpay_order_id + "|" + razorpay_payment_id)
     .digest("hex");
   
   if (generatedSignature !== razorpay_signature) {
     throw new Error("Invalid signature");
   }
   ```

2. **Update Enrollment Status**
   ```javascript
   const enrollment = await prisma.enrollment.update({
     where: { id: enrollmentId },
     data: { 
       status: "paid", 
       paymentId: razorpay_payment_id 
     },
   });
   ```

3. **Return Success**
   ```javascript
   return { success: true, enrollment };
   ```

**Response Format:**
```json
{
  "success": true,
  "enrollment": {
    "id": "enrollment-uuid",
    "userId": "user-uuid",
    "courseId": "course-uuid",
    "status": "paid",
    "paymentId": "pay_xxxxx"
  }
}
```

---

### **Step 5: Handle Success (Frontend)**

**Location:** `src/screens/CheckoutScreen.tsx`

**Process:**
1. **Check Verification Result**
   ```typescript
   if (verifyData.success === true) {
     // Payment successful
   }
   ```

2. **Update Local State**
   ```typescript
   const purchasedPackIds = checkoutItems.map((item) => item.packId).filter(Boolean);
   addPurchasedCourses(purchasedPackIds);
   clearCart();
   ```

3. **Navigate to Success Screen**
   ```typescript
   navigation.navigate('PaymentSuccess', { packId: purchasedPackIds[0] });
   ```

---

## 🔐 **Security Features**

### **1. Signature Verification**

**Purpose:** Prevent payment tampering

**Method:** HMAC SHA256
```javascript
const generatedSignature = crypto
  .createHmac("sha256", RAZORPAY_KEY_SECRET)
  .update(order_id + "|" + payment_id)
  .digest("hex");
```

**Verification:**
- Backend generates signature using secret key
- Compares with signature from Razorpay
- Rejects if signatures don't match

### **2. Webhook Support**

**Endpoint:** `POST /api/payments/razorpay/webhook`

**Purpose:** Handle asynchronous payment events

**Process:**
1. Razorpay sends webhook event
2. Backend verifies webhook signature
3. Updates enrollment if payment captured

**Code:**
```javascript
export const handleRazorpayWebhook = async (req) => {
  // Verify webhook signature
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");
  
  const signature = req.headers["x-razorpay-signature"];
  if (expected !== signature) {
    throw new Error("Invalid webhook signature");
  }
  
  // Handle payment.captured event
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    await prisma.enrollment.updateMany({
      where: { paymentId: null, status: "pending" },
      data: { status: "paid", paymentId: payment.id },
    });
  }
};
```

---

## 📊 **Database Schema**

### **Enrollment Model**

```prisma
model Enrollment {
  id            String   @id @default(uuid())
  userId        String
  courseId      String
  status        String   @default("pending")
  paymentId     String?  // Razorpay payment ID
  zohoInvoiceId String?
  createdAt     DateTime @default(now())
  course        Course   @relation(fields: [courseId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
}
```

**Status Values:**
- `pending` - Order created, payment not completed
- `paid` - Payment verified and completed

---

## 🔧 **Configuration**

### **Backend Environment Variables**

**File:** `backend/.env`

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### **Frontend API Configuration**

**File:** `src/config/api.ts`

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.XXX:3000' // Development (use your IP)
  : 'https://your-api-domain.com'; // Production
```

---

## 🛣️ **API Endpoints**

### **1. Create Order**

**Endpoint:** `POST /api/payments/razorpay/order`

**Request:**
```json
{
  "userId": "user-uuid",
  "courseId": "course-uuid"
}
```

**Response:**
```json
{
  "key": "rzp_test_xxxxx",
  "order": {
    "id": "order_xxxxx",
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_1234567890",
    "status": "created"
  },
  "enrollmentId": "enrollment-uuid"
}
```

### **2. Verify Payment**

**Endpoint:** `POST /api/payments/razorpay/verify`

**Request:**
```json
{
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_order_id": "order_xxxxx",
  "razorpay_signature": "signature_xxxxx",
  "enrollmentId": "enrollment-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "enrollment": {
    "id": "enrollment-uuid",
    "status": "paid",
    "paymentId": "pay_xxxxx"
  }
}
```

### **3. Webhook**

**Endpoint:** `POST /api/payments/razorpay/webhook`

**Headers:**
```
x-razorpay-signature: signature_xxxxx
```

**Body:** Razorpay webhook event JSON

**Response:** `200 OK`

---

## 🧪 **Testing**

### **Test Cards (Razorpay Test Mode)**

**Success Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Failure Card:**
- Card Number: `5104 0600 0000 0008`
- CVV: Any 3 digits
- Expiry: Any future date

**UPI Test:**
- UPI ID: `success@razorpay`

### **Test Flow**

1. Navigate to checkout screen
2. Click "Complete Payment"
3. Razorpay checkout opens
4. Use test card credentials
5. Complete payment
6. Verify enrollment status updated in database

---

## ⚠️ **Error Handling**

### **Frontend Errors**

1. **Order Creation Failed**
   ```typescript
   if (!orderResponse.ok) {
     const errorData = await orderResponse.json();
     throw new Error(errorData.error || 'Failed to create order');
   }
   ```

2. **Payment Verification Failed**
   ```typescript
   if (!verifyResponse.ok || !verifyData.success) {
     throw new Error('Payment verification failed');
   }
   ```

3. **User Cancellation**
   ```typescript
   if (error.code === 'BAD_REQUEST_ERROR' || error.description === 'userCancelled') {
     Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
     return;
   }
   ```

### **Backend Errors**

1. **Razorpay Not Configured**
   ```javascript
   if (!razorpay) {
     return res.status(503).json({
       success: false,
       message: "Payments are temporarily unavailable",
     });
   }
   ```

2. **Missing Required Fields**
   ```javascript
   if (!userId || !courseId) {
     return res.status(400).json({ 
       error: "Missing required fields: userId and courseId are required"
     });
   }
   ```

3. **Invalid Signature**
   ```javascript
   if (generatedSignature !== razorpay_signature) {
     throw new Error("Invalid signature");
   }
   ```

---

## 📝 **Flow Diagram**

```
┌─────────────────┐
│  User clicks    │
│  "Pay Now"      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/payments/razorpay │
│ /order                      │
│ { userId, courseId }        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend:                    │
│ 1. Fetch user & course      │
│ 2. Create Razorpay order    │
│ 3. Create enrollment        │
│ 4. Return {key, order,      │
│    enrollmentId}            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Frontend:                    │
│ Open Razorpay Checkout      │
│ with order details          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User completes payment      │
│ on Razorpay gateway         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/payments/razorpay │
│ /verify                     │
│ { payment_id, order_id,     │
│   signature, enrollmentId } │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend:                    │
│ 1. Verify signature         │
│ 2. Update enrollment        │
│    status = "paid"          │
│ 3. Return success           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Frontend:                    │
│ 1. Update local state        │
│ 2. Clear cart               │
│ 3. Navigate to success      │
└─────────────────────────────┘
```

---

## 🔍 **Key Code Sections**

### **Backend: Order Creation**

**File:** `backend/src/services/razorpay.service.js`

```javascript
export const createRazorpayOrder = async ({ userId, courseId }) => {
  // 1. Validate Razorpay config
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error("Razorpay not configured");
  
  // 2. Fetch user and course
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  
  // 3. Validate course
  if (!course || !course.price || course.price <= 0) {
    throw new Error("Invalid course");
  }
  
  // 4. Create Razorpay order
  const amount = Math.round(course.price * 100);
  const order = await razorpay.orders.create({
    amount,
    currency: "INR",
    receipt: `order_${Date.now()}`,
    notes: { userId: user.id, courseId: course.id },
  });
  
  // 5. Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: { userId: user.id, courseId: course.id, status: "pending" },
  });
  
  // 6. Return response
  return {
    key: process.env.RAZORPAY_KEY_ID,
    order,
    enrollmentId: enrollment.id,
  };
};
```

### **Backend: Payment Verification**

**File:** `backend/src/services/razorpay.service.js`

```javascript
export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  enrollmentId,
}) => {
  // 1. Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");
  
  if (generatedSignature !== razorpay_signature) {
    throw new Error("Invalid signature");
  }
  
  // 2. Update enrollment
  const enrollment = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "paid", paymentId: razorpay_payment_id },
  });
  
  return { success: true, enrollment };
};
```

### **Frontend: Payment Flow**

**File:** `src/screens/CheckoutScreen.tsx`

```typescript
const handlePayment = async () => {
  // 1. Create order
  const orderResponse = await fetch(getApiUrl('api/payments/razorpay/order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, courseId }),
  });
  const { key, order, enrollmentId } = await orderResponse.json();
  
  // 2. Open Razorpay checkout
  const razorpayData = await RazorpayCheckout.open({
    key,
    amount: order.amount,
    order_id: order.id,
    // ... other options
  });
  
  // 3. Verify payment
  const verifyResponse = await fetch(getApiUrl('api/payments/razorpay/verify'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_payment_id: razorpayData.razorpay_payment_id,
      razorpay_order_id: razorpayData.razorpay_order_id,
      razorpay_signature: razorpayData.razorpay_signature,
      enrollmentId,
    }),
  });
  
  // 4. Handle success
  if (verifyData.success) {
    addPurchasedCourses(packIds);
    clearCart();
    navigation.navigate('PaymentSuccess');
  }
};
```

---

## 📚 **Summary**

### **Files Involved**

**Backend:**
- `backend/src/config/razorpay.js` - Razorpay SDK config
- `backend/src/routes/razorpay.routes.js` - Route definitions
- `backend/src/controllers/razorpay.controller.js` - Request handlers
- `backend/src/services/razorpay.service.js` - Business logic

**Frontend:**
- `src/screens/CheckoutScreen.tsx` - Payment UI and flow
- `src/config/api.ts` - API configuration

### **Key Endpoints**

- `POST /api/payments/razorpay/order` - Create order
- `POST /api/payments/razorpay/verify` - Verify payment
- `POST /api/payments/razorpay/webhook` - Webhook handler

### **Security**

- ✅ Signature verification (HMAC SHA256)
- ✅ Webhook signature validation
- ✅ Input validation
- ✅ Error handling

### **Database**

- ✅ Enrollment records created
- ✅ Status tracking (pending → paid)
- ✅ Payment ID storage

---

**This completes the Razorpay payment flow documentation!** 🎉

