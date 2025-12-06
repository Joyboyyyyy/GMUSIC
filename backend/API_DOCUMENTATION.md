# 📡 Gretex Music Room API Documentation

Complete API reference for the Gretex Music Room backend.

---

## 🌐 Base URL

```
Development: http://localhost:3000/api
Production: https://api.gretexmusicroom.com/api
```

---

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📋 API Endpoints

### 1. Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "student@example.com",
      "name": "John Doe",
      "avatar": "https://ui-avatars.com/api/?name=John+Doe",
      "role": "STUDENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "student@example.com",
    "name": "John Doe",
    "avatar": "...",
    "role": "STUDENT",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### Update Profile
```http
PUT /api/auth/me
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

### 2. Courses (`/api/courses`)

#### Get All Courses
```http
GET /api/courses
```

**Query Parameters:**
- `category` (optional): Filter by category (Guitar, Piano, Drums, etc.)
- `level` (optional): Filter by level (Beginner, Intermediate, Advanced)
- `search` (optional): Search in title and description

**Example:**
```
GET /api/courses?category=Guitar&level=Beginner
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "course_123",
      "title": "Complete Guitar Mastery",
      "description": "Learn guitar from scratch...",
      "price": 1999,
      "thumbnailUrl": "...",
      "category": "Guitar",
      "level": "Beginner",
      "teacherName": "John Martinez",
      "teacherAvatar": "...",
      "rating": 4.8,
      "studentsCount": 5200,
      "tracksCount": 45,
      "duration": 720,
      "tracks": [...]
    }
  ]
}
```

---

#### Get Course by ID
```http
GET /api/courses/:courseId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "course_123",
    "title": "Complete Guitar Mastery",
    "tracks": [
      {
        "id": "track_1",
        "title": "Welcome & Course Overview",
        "duration": 8,
        "isPreview": true,
        "contentUrl": "...",
        "order": 0
      }
    ]
  }
}
```

---

#### Get User's Enrolled Courses
```http
GET /api/courses/user/my-courses
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "course_123",
      "title": "Complete Guitar Mastery",
      "progress": 35.5,
      "enrolledAt": "2024-01-15T10:00:00.000Z",
      ...
    }
  ]
}
```

---

#### Create Course (Admin/Teacher only)
```http
POST /api/courses
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Piano Fundamentals",
  "description": "Master piano basics...",
  "price": 2499,
  "thumbnailUrl": "https://...",
  "category": "Piano",
  "level": "Beginner",
  "teacherId": "teacher_456",
  "teacherName": "Sarah Johnson",
  "teacherAvatar": "https://..."
}
```

---

#### Add Track to Course
```http
POST /api/courses/:courseId/tracks
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Introduction to Piano Keys",
  "type": "video",
  "duration": 15,
  "contentUrl": "https://...",
  "isPreview": false,
  "description": "Learn the keyboard layout",
  "order": 1
}
```

---

### 3. Payments (`/api/payments`)

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "course_123",
  "amount": 1999
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment intent created",
  "data": {
    "clientSecret": "pi_3AbCdE..._secret_XyZ",
    "purchaseId": "purchase_789"
  }
}
```

**Usage:**
Use `clientSecret` with Stripe SDK in mobile app to complete payment.

---

#### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "purchaseId": "purchase_789",
  "paymentId": "pi_3AbCdE..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "data": {
    "id": "purchase_789",
    "userId": "user_123",
    "courseId": "course_123",
    "amount": 1999,
    "status": "COMPLETED"
  }
}
```

**Side Effects:**
- ✅ Creates enrollment record
- ✅ Grants access to course
- ✅ Updates Zoho CRM
- ✅ Increments student count

---

#### Get User's Purchases
```http
GET /api/payments/my-purchases
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "purchase_789",
      "amount": 1999,
      "status": "COMPLETED",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "course": { ... }
    }
  ]
}
```

---

#### Refund Purchase (Admin only)
```http
POST /api/payments/:purchaseId/refund
Authorization: Bearer <token>
```

---

### 4. Zoho CRM (`/api/zoho`)

#### Sync User Data to Zoho
```http
POST /api/zoho/sync
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Data synced to Zoho successfully",
  "data": {
    "leadId": "zoho_lead_123",
    "status": "success"
  }
}
```

---

#### Create Lead
```http
POST /api/zoho/leads
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "courseId": "course_123"
}
```

---

## 🔒 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📊 Database Schema Reference

### User Table
```
id: String (cuid)
email: String (unique)
password: String (hashed)
name: String
avatar: String
role: Enum (STUDENT, TEACHER, ADMIN)
isActive: Boolean
createdAt: DateTime
updatedAt: DateTime
```

### Course Table
```
id: String
title: String
description: Text
price: Float
thumbnailUrl: String
category: String
level: String
teacherId: String
teacherName: String
rating: Float
studentsCount: Int
tracksCount: Int
duration: Int
isActive: Boolean
```

### Purchase Table
```
id: String
userId: String
courseId: String
amount: Float
currency: String
paymentMethod: String
paymentId: String
status: Enum (PENDING, COMPLETED, FAILED, REFUNDED)
zohoLeadId: String
createdAt: DateTime
```

---

## 🔧 Postman Collection

### Import These Requests:

1. **Register**: POST `/api/auth/register`
2. **Login**: POST `/api/auth/login`
3. **Get Profile**: GET `/api/auth/me`
4. **Get Courses**: GET `/api/courses`
5. **Create Payment**: POST `/api/payments/create-intent`
6. **Confirm Payment**: POST `/api/payments/confirm`

**Variables:**
- `base_url`: http://localhost:3000/api
- `token`: (set after login)

---

## 🎯 Best Practices

### Always Include:
- Content-Type: application/json
- Authorization header for protected routes
- Proper error handling in client

### Rate Limiting (TODO):
Consider adding rate limiting:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

*API Documentation v1.0.0*  
*Last Updated: December 2024*

