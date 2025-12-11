# Backend Details - Complete Overview

## 📋 Overview

The Gretex Music Room backend is a full-featured Express.js API server with PostgreSQL database, dual payment gateway support (Stripe + Razorpay), Zoho CRM integration, and comprehensive authentication system.

---

## 🏗️ Architecture

### Tech Stack:
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 4.22.1
- **Database:** PostgreSQL
- **ORM:** Prisma 5.15.0
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Payment Gateways:** 
  - Stripe (International)
  - Razorpay (India)
- **CRM:** Zoho CRM Integration
- **Validation:** express-validator

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Server entry point & startup
│   │
│   ├── config/
│   │   ├── prismaClient.js      # Prisma client singleton
│   │   ├── razorpay.js          # Razorpay client config
│   │   └── zoho.js              # Zoho OAuth client
│   │
│   ├── middleware/
│   │   └── auth.js              # JWT authentication & RBAC
│   │
│   ├── routes/
│   │   ├── auth.routes.js       # Auth endpoints
│   │   ├── course.routes.js     # Course endpoints
│   │   ├── payment.routes.js    # Stripe payment endpoints
│   │   ├── razorpay.routes.js   # Razorpay payment endpoints
│   │   └── zoho.routes.js       # Zoho CRM endpoints
│   │
│   ├── controllers/
│   │   ├── auth.controller.js   # Auth request handlers
│   │   ├── course.controller.js # Course request handlers
│   │   ├── payment.controller.js # Stripe payment handlers
│   │   ├── razorpay.controller.js # Razorpay payment handlers
│   │   └── zoho.controller.js   # Zoho CRM handlers
│   │
│   ├── services/
│   │   ├── auth.service.js      # Auth business logic
│   │   ├── course.service.js    # Course business logic
│   │   ├── payment.service.js   # Stripe integration
│   │   ├── razorpay.service.js  # Razorpay integration
│   │   └── zoho.service.js      # Zoho CRM integration
│   │
│   └── utils/
│       ├── jwt.js               # JWT token utilities
│       └── response.js          # Standardized response helpers
│
├── prisma/
│   └── schema.prisma            # Database schema definition
│
├── package.json                 # Dependencies & scripts
├── .env                         # Environment variables (not in git)
├── ENV_TEMPLATE.txt            # Environment template
├── README.md                    # Main documentation
├── SETUP_GUIDE.md              # Setup instructions
├── API_DOCUMENTATION.md        # API reference
├── RAZORPAY_INTEGRATION.md     # Razorpay guide
└── COMPLETE_BACKEND_SUMMARY.md # Implementation summary
```

---

## 🗄️ Database Schema (Prisma)

### Models:

#### 1. User
```prisma
model User {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  password    String   (hashed with bcrypt)
  role        String   @default("student")
  enrollments Enrollment[]
  createdAt   DateTime @default(now())
}
```

**Roles:** `student`, `teacher`, `admin`

#### 2. Course
```prisma
model Course {
  id          String   @id @default(uuid())
  title       String
  description String?
  price       Float
  duration    Int      (in minutes)
  zohoItemId  String?  (Zoho CRM integration)
  enrollments Enrollment[]
}
```

#### 3. Enrollment
```prisma
model Enrollment {
  id            String   @id @default(uuid())
  user          User     @relation(fields: [userId], references: [id])
  userId        String
  course        Course   @relation(fields: [courseId], references: [id])
  courseId      String
  status        String   @default("pending")
  zohoInvoiceId String?  (Zoho invoice reference)
  paymentId     String?  (Payment transaction ID)
  createdAt     DateTime @default(now())
}
```

**Status Values:** `pending`, `active`, `completed`, `cancelled`

---

## 📡 API Endpoints (20 Total)

### 1. Authentication (`/api/auth`)

#### POST `/api/auth/register`
- **Description:** Register new user
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }
  ```
- **Response:** User object + JWT token

#### POST `/api/auth/login`
- **Description:** Login user
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response:** User object + JWT token

#### GET `/api/auth/me`
- **Description:** Get current user profile
- **Auth Required:** Yes (Bearer token)
- **Response:** User profile object

#### PUT `/api/auth/me`
- **Description:** Update user profile
- **Auth Required:** Yes
- **Request Body:** Partial user updates
- **Response:** Updated user object

---

### 2. Courses (`/api/courses`)

#### GET `/api/courses`
- **Description:** Get all courses with filters
- **Auth Required:** No
- **Query Parameters:**
  - `category` (optional): Filter by category
  - `level` (optional): Filter by level
  - `search` (optional): Search in title/description
- **Response:** Array of course objects

#### GET `/api/courses/:courseId`
- **Description:** Get course by ID with tracks
- **Auth Required:** No
- **Response:** Course object with tracks array

#### GET `/api/courses/user/my-courses`
- **Description:** Get user's enrolled courses
- **Auth Required:** Yes
- **Response:** Array of enrolled courses with progress

#### POST `/api/courses`
- **Description:** Create new course
- **Auth Required:** Yes (Admin/Teacher role)
- **Request Body:** Course details
- **Response:** Created course object

#### PUT `/api/courses/:courseId`
- **Description:** Update course
- **Auth Required:** Yes (Admin/Teacher)
- **Response:** Updated course object

#### DELETE `/api/courses/:courseId`
- **Description:** Delete course (soft delete)
- **Auth Required:** Yes (Admin only)
- **Response:** Success message

#### POST `/api/courses/:courseId/tracks`
- **Description:** Add track/lesson to course
- **Auth Required:** Yes (Admin/Teacher)
- **Request Body:** Track details
- **Response:** Created track object

---

### 3. Payments - Stripe (`/api/payments`)

#### POST `/api/payments/create-intent`
- **Description:** Create Stripe payment intent
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "courseId": "course_123",
    "amount": 1999
  }
  ```
- **Response:** `clientSecret` for Stripe SDK

#### POST `/api/payments/confirm`
- **Description:** Confirm Stripe payment
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "purchaseId": "purchase_789",
    "paymentId": "pi_3AbCdE..."
  }
  ```
- **Side Effects:** Creates enrollment, updates Zoho

#### GET `/api/payments/my-purchases`
- **Description:** Get user's purchase history
- **Auth Required:** Yes
- **Response:** Array of purchase objects

#### POST `/api/payments/:purchaseId/refund`
- **Description:** Refund purchase
- **Auth Required:** Yes (Admin only)
- **Response:** Refund confirmation

---

### 4. Payments - Razorpay (`/api/payments/razorpay`)

#### POST `/api/payments/razorpay/order`
- **Description:** Create Razorpay order
- **Auth Required:** No (but userId required in body)
- **Request Body:**
  ```json
  {
    "userId": "user_123",
    "courseId": "course_123"
  }
  ```
- **Response:**
  ```json
  {
    "key": "rzp_test_...",
    "order": {
      "id": "order_...",
      "amount": 199900,
      "currency": "INR"
    },
    "enrollmentId": "enrollment_123"
  }
  ```

#### POST `/api/payments/razorpay/verify`
- **Description:** Verify Razorpay payment signature
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "razorpay_payment_id": "pay_...",
    "razorpay_order_id": "order_...",
    "razorpay_signature": "signature_...",
    "enrollmentId": "enrollment_123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Payment verified and enrollment created"
  }
  ```
- **Side Effects:** Creates enrollment, updates Zoho CRM

#### POST `/api/payments/razorpay/webhook`
- **Description:** Handle Razorpay webhooks
- **Auth Required:** No (uses webhook secret)
- **Content-Type:** `application/json` or raw body
- **Response:** `200 OK`

---

### 5. Zoho CRM (`/api/zoho`)

#### POST `/api/zoho/sync`
- **Description:** Sync user data to Zoho CRM
- **Auth Required:** Yes
- **Response:** Zoho lead/contact ID

#### POST `/api/zoho/leads`
- **Description:** Create lead in Zoho
- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "courseId": "course_123"
  }
  ```
- **Response:** Zoho lead ID

---

## 🔐 Authentication & Security

### JWT Authentication:
- **Token Format:** `Bearer <token>`
- **Header:** `Authorization: Bearer <token>`
- **Expiration:** Configurable (default: 7 days)
- **Secret:** Stored in `JWT_SECRET` env variable

### Password Security:
- **Hashing:** bcryptjs with 10 salt rounds
- **Storage:** Hashed passwords only (never plain text)

### Middleware:
- **`authenticate`:** Verifies JWT token, attaches user to request
- **`requireRole(...roles)`:** Role-based access control

### Protected Routes:
- Most routes require authentication
- Admin/Teacher routes require specific roles
- Public routes: Register, Login, Get Courses

---

## 💳 Payment Integration

### Stripe (International):
- **SDK:** `stripe` v14.10.0
- **Method:** Payment Intents API
- **Currencies:** USD, EUR, GBP, etc.
- **Flow:**
  1. Create payment intent → Get `clientSecret`
  2. Client completes payment with Stripe SDK
  3. Confirm payment on backend
  4. Create enrollment

### Razorpay (India):
- **SDK:** `razorpay` v2.9.2
- **Method:** Orders API + Signature Verification
- **Currency:** INR (Indian Rupees)
- **Flow:**
  1. Create order → Get `order.id` and `key`
  2. Client opens Razorpay checkout
  3. Verify payment signature on backend
  4. Create enrollment

### Payment Verification:
- **Stripe:** Uses payment intent status
- **Razorpay:** HMAC SHA256 signature verification
- **Webhooks:** Both gateways support webhook events

---

## 🔌 Zoho CRM Integration

### Features:
- **Auto-create leads** on course interest
- **Update leads** on purchase
- **Convert leads** to contacts on enrollment
- **Sync enrollment data** to Zoho
- **Track revenue** and course metrics

### Configuration:
- **OAuth 2.0** authentication
- **Refresh token** for long-term access
- **API Version:** Zoho CRM API v2

### Zoho Fields Mapped:
- Lead Source: "Mobile App"
- Course Interest
- Purchase Amount
- Payment Status
- Total Courses Enrolled

---

## 🛠️ Server Configuration

### Express App Setup:
```javascript
// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special handling for Razorpay webhook (raw body)
app.use("/api/payments/razorpay/webhook", 
  bodyParser.raw({ type: "*/*" })
);
```

### Server Startup:
- **Port:** `3000` (configurable via `PORT` env)
- **Host:** `0.0.0.0` (listens on all interfaces)
- **Database:** Tests connection on startup
- **Graceful Shutdown:** Handles SIGTERM/SIGINT

### Health Check:
- **Endpoint:** `GET /health`
- **Response:**
  ```json
  {
    "status": "OK",
    "message": "Gretex Music Room API is running",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
  ```

---

## 📦 Dependencies

### Production:
```json
{
  "@prisma/adapter-pg": "^7.1.0",
  "@prisma/client": "^5.15.0",
  "axios": "^1.13.2",
  "bcrypt": "^6.0.0",
  "bcryptjs": "^2.4.3",
  "body-parser": "^2.2.1",
  "cors": "^2.8.5",
  "dotenv": "^16.6.1",
  "express": "^4.22.1",
  "express-validator": "^7.0.1",
  "jsonwebtoken": "^9.0.3",
  "node-fetch": "^3.3.2",
  "pg": "^8.16.3",
  "prisma": "^5.15.0",
  "razorpay": "^2.9.2",
  "stripe": "^14.10.0"
}
```

### Development:
```json
{
  "nodemon": "^3.1.11"
}
```

---

## ⚙️ Environment Variables

### Required:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gretex_music_room"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
```

### Payment Gateways:
```env
# Stripe (International)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Zoho CRM:
```env
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token
ZOHO_ORG_ID=your_zoho_org_id
```

### Optional:
```env
# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8081

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

---

## 🚀 Scripts

```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

### Usage:
- **`npm start`** - Production server
- **`npm run dev`** - Development with auto-reload
- **`npm run prisma:generate`** - Generate Prisma client
- **`npm run prisma:migrate`** - Run database migrations
- **`npm run prisma:studio`** - Open Prisma Studio (DB GUI)

---

## 🔄 Request/Response Flow

### Typical Request Flow:
```
1. Client Request
   ↓
2. Express Middleware (CORS, Body Parser)
   ↓
3. Route Handler
   ↓
4. Authentication Middleware (if protected)
   ↓
5. Controller
   ↓
6. Service (Business Logic)
   ↓
7. Prisma (Database)
   ↓
8. Response Helper
   ↓
9. Client Response
```

### Error Handling:
- **Global Error Handler:** Catches all unhandled errors
- **Standardized Responses:** Success/Error format
- **Status Codes:** Proper HTTP status codes
- **Error Messages:** User-friendly messages

---

## 📊 Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (development only)"
}
```

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Role-Based Access Control** - Admin/Teacher/Student
- ✅ **CORS Configuration** - Controlled origins
- ✅ **Input Validation** - express-validator
- ✅ **SQL Injection Prevention** - Prisma ORM
- ✅ **Payment Signature Verification** - HMAC for Razorpay
- ✅ **Webhook Verification** - Signature validation
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **Error Handling** - No sensitive data leakage

---

## 🧪 Testing

### Database Testing:
```bash
npm run prisma:studio
# Opens GUI to view/edit database
```

### API Testing:
- Use Postman/Insomnia
- Import endpoints from `API_DOCUMENTATION.md`
- Test with sample data

### Health Check:
```bash
curl http://localhost:3000/health
```

---

## 📚 Documentation Files

1. **README.md** - Main overview and quick start
2. **SETUP_GUIDE.md** - Detailed setup instructions
3. **API_DOCUMENTATION.md** - Complete API reference
4. **RAZORPAY_INTEGRATION.md** - Razorpay payment guide
5. **COMPLETE_BACKEND_SUMMARY.md** - Implementation summary
6. **ENV_TEMPLATE.txt** - Environment variables template

---

## 🎯 Key Features

### For Students:
- ✅ User registration and login
- ✅ Browse courses with filters
- ✅ Purchase courses (Stripe or Razorpay)
- ✅ Access enrolled courses
- ✅ Track learning progress
- ✅ View purchase history
- ✅ Profile management

### For Teachers:
- ✅ Create courses
- ✅ Add tracks/lessons
- ✅ Update course content
- ✅ View student enrollments

### For Admins:
- ✅ Full course management
- ✅ User management
- ✅ Process refunds
- ✅ View all transactions
- ✅ Zoho CRM sync
- ✅ Delete courses

### For Business:
- ✅ International payments (Stripe)
- ✅ Indian payments (Razorpay)
- ✅ CRM integration (Zoho)
- ✅ Lead tracking
- ✅ Revenue reporting
- ✅ Student analytics

---

## 🚀 Quick Start

```bash
# 1. Navigate to backend
cd "Gretex music Room/backend"

# 2. Install dependencies
npm install

# 3. Configure environment
cp ENV_TEMPLATE.txt .env
# Edit .env with your credentials

# 4. Set up database
npm run prisma:generate
npm run prisma:migrate

# 5. Start server
npm run dev

# Server runs on: http://localhost:3000
```

---

## 📍 File Locations

```
Gretex music Room/backend/
├── src/
│   ├── app.js (82 lines)
│   ├── server.js (51 lines)
│   ├── config/ (3 files)
│   ├── middleware/ (1 file)
│   ├── routes/ (5 files)
│   ├── controllers/ (5 files)
│   ├── services/ (5 files)
│   └── utils/ (2 files)
├── prisma/
│   └── schema.prisma
└── Documentation files (7 files)
```

---

## ✅ Status

```
✅ Express server configured
✅ Prisma ORM integrated
✅ JWT authentication implemented
✅ CRUD operations for courses
✅ Dual payment processing (Stripe + Razorpay)
✅ Zoho CRM integration
✅ Role-based access control
✅ Error handling
✅ Webhook support
✅ Production-ready
✅ Complete documentation
```

---

**Last Updated:** Based on current codebase  
**Version:** 1.0.0  
**Status:** Production Ready

