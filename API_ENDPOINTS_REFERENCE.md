# API Endpoints Quick Reference

## 🔐 Authentication Endpoints

### POST `/api/auth/register`
**Description**: Register a new user  
**Auth**: Not required  
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Verification email sent",
  "data": {
    "email": "john@example.com"
  }
}
```

### POST `/api/auth/login`
**Description**: Login with email and password  
**Auth**: Not required  
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": true
    },
    "token": "jwt-token-here"
  }
}
```

### POST `/api/auth/google`
**Description**: Login with Google OAuth  
**Auth**: Not required  
**Request Body**:
```json
{
  "idToken": "google-id-token"
}
```
**Response**: Same as `/api/auth/login`

### POST `/api/auth/forgot-password`
**Description**: Request password reset email  
**Auth**: Not required  
**Request Body**:
```json
{
  "email": "john@example.com"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST `/api/auth/reset-password`
**Description**: Reset password with token  
**Auth**: Not required  
**Request Body**:
```json
{
  "token": "reset-token",
  "password": "NewSecurePass123!"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### POST `/api/auth/verify-email`
**Description**: Verify email with token  
**Auth**: Not required  
**Request Body**:
```json
{
  "token": "verification-token"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

### GET `/api/auth/me`
**Description**: Get current user profile  
**Auth**: Required (Bearer token)  
**Headers**:
```
Authorization: Bearer <jwt-token>
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "https://...",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT `/api/auth/me`
**Description**: Update user profile  
**Auth**: Required (Bearer token)  
**Request Body**:
```json
{
  "name": "John Updated",
  "avatar": "https://..."
}
```
**Response**:
```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "user": { ... }
  }
}
```

---

## 📚 Course Endpoints

### GET `/api/courses`
**Description**: Get all available courses  
**Auth**: Not required  
**Response**:
```json
[
  {
    "id": "course-id",
    "title": "Guitar Basics",
    "description": "Learn guitar fundamentals",
    "price": 2999,
    "duration": 30,
    "zohoItemId": "item-id"
  }
]
```

### GET `/api/courses/:id`
**Description**: Get course details  
**Auth**: Not required  
**Response**:
```json
{
  "id": "course-id",
  "title": "Guitar Basics",
  "description": "Learn guitar fundamentals",
  "price": 2999,
  "duration": 30,
  "zohoItemId": "item-id"
}
```

### GET `/api/my-courses`
**Description**: Get user's enrolled courses  
**Auth**: Required (Bearer token)  
**Response**:
```json
[
  {
    "id": "enrollment-id",
    "courseId": "course-id",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z",
    "course": {
      "id": "course-id",
      "title": "Guitar Basics",
      "price": 2999
    }
  }
]
```

---

## 🎓 Enrollment Endpoints

### GET `/api/enrollments`
**Description**: Get user's enrollments  
**Auth**: Required (Bearer token)  
**Response**:
```json
[
  {
    "id": "enrollment-id",
    "userId": "user-id",
    "courseId": "course-id",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### POST `/api/enrollments`
**Description**: Enroll in a course  
**Auth**: Required (Bearer token)  
**Request Body**:
```json
{
  "courseId": "course-id"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Enrolled successfully",
  "data": {
    "id": "enrollment-id",
    "userId": "user-id",
    "courseId": "course-id",
    "status": "pending"
  }
}
```

---

## 💳 Payment Endpoints

### POST `/api/payments/create-order`
**Description**: Create Razorpay order  
**Auth**: Required (Bearer token)  
**Request Body**:
```json
{
  "amount": 2999,
  "currency": "INR",
  "courseId": "course-id"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "razorpay-order-id",
    "amount": 2999,
    "currency": "INR"
  }
}
```

### POST `/api/payments/verify`
**Description**: Verify Razorpay payment  
**Auth**: Required (Bearer token)  
**Request Body**:
```json
{
  "orderId": "razorpay-order-id",
  "paymentId": "razorpay-payment-id",
  "signature": "razorpay-signature",
  "courseId": "course-id"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Payment verified",
  "data": {
    "enrollment": { ... }
  }
}
```

---

## 🛒 Store Endpoints

### GET `/api/store`
**Description**: Get all store items  
**Auth**: Not required  
**Response**:
```json
[
  {
    "_id": "item-id",
    "name": "Guitar Strings",
    "description": "Premium guitar strings",
    "category": "material",
    "price": 499,
    "stock_quantity": 50,
    "is_available": true
  }
]
```

### GET `/api/store/:id`
**Description**: Get store item details  
**Auth**: Not required  
**Response**:
```json
{
  "_id": "item-id",
  "name": "Guitar Strings",
  "description": "Premium guitar strings",
  "category": "material",
  "price": 499,
  "stock_quantity": 50,
  "is_available": true
}
```

---

## 🔍 Health Check

### GET `/health`
**Description**: Check backend health  
**Auth**: Not required  
**Response**:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 📝 Error Response Format

All endpoints may return errors in this format:

```json
{
  "success": false,
  "message": "Error message",
  "detail": "Detailed error description"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## 🔑 Authentication Headers

For protected endpoints, include JWT token in headers:

```
Authorization: Bearer <jwt-token>
```

**Example**:
```javascript
const response = await axios.get('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🌐 Base URL Configuration

The base URL is configured via environment variable:
- **Development**: `http://localhost:3000` or `http://192.168.1.x:3000`
- **Production**: `https://your-backend-domain.com`

Set in `.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

**Last Updated**: 2024

