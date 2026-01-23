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
      "profilePicture": "https://ui-avatars.com/api/?name=John+Doe",
      "avatar": "https://ui-avatars.com/api/?name=John+Doe",
      "role": "STUDENT"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Both `profilePicture` and `avatar` fields are returned for backward compatibility. Use `profilePicture` as the primary field in new code. See [Profile Picture Migration Guide](#update-profile) for details.

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
    "profilePicture": "https://example.com/profile.jpg",
    "avatar": "https://example.com/profile.jpg",
    "role": "STUDENT",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Note:** Both `profilePicture` and `avatar` fields are returned and synchronized. Use `profilePicture` as the primary field.

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
  "profilePicture": "https://example.com/avatar.jpg"
}
```

**⚠️ Migration Note - Profile Picture Field Consolidation:**

As of December 2024, the API has consolidated profile picture handling:

- **Primary Field:** `profilePicture` - This is the authoritative field for all profile picture operations
- **Deprecated Field:** `avatar` - Maintained for backward compatibility but should not be used in new code

**For Existing Clients:**
- ✅ **Backward Compatible:** The API still accepts `avatar` parameter and will automatically sync it to `profilePicture`
- ✅ **No Breaking Changes:** Both fields are returned in API responses during the migration period
- ✅ **Automatic Sync:** When either field is updated, both fields are synchronized to the same value

**Migration Guide:**

1. **Update Upload Logic:**
   ```json
   // OLD (deprecated but still works)
   { "avatar": "https://example.com/new-avatar.jpg" }
   
   // NEW (recommended)
   { "profilePicture": "https://example.com/new-avatar.jpg" }
   ```

2. **Update Display Logic:**
   ```javascript
   // OLD (deprecated)
   const avatarUrl = user.avatar;
   
   // NEW (recommended with fallback)
   const avatarUrl = user.profilePicture || user.avatar || 'https://ui-avatars.com/api/?name=' + user.name;
   ```

3. **Timeline:**
   - **Now:** Both fields work, `profilePicture` is recommended
   - **Future:** `avatar` field may be removed in a future major version (with advance notice)

**Backward Compatibility Guarantees:**
- ✅ Existing profile pictures in either field will continue to work
- ✅ API responses include both fields during migration period
- ✅ Updates to either field sync to both fields automatically
- ✅ No data loss or service interruption

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
profilePicture: String (PRIMARY - authoritative field)
avatar: String (DEPRECATED - maintained for backward compatibility)
role: Enum (STUDENT, TEACHER, ADMIN)
isActive: Boolean
createdAt: DateTime
updatedAt: DateTime
```

**Profile Picture Fields:**
- `profilePicture`: Primary authoritative field for profile picture URLs (use this in new code)
- `avatar`: Deprecated field maintained for backward compatibility (automatically synced with profilePicture)
- Both fields are synchronized on every update to ensure consistency

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

## 🔄 Migration Guide: Profile Picture Field Consolidation

### Overview

As of December 2024, the API has consolidated profile picture handling to use a single authoritative field (`profilePicture`) while maintaining backward compatibility with the legacy `avatar` field.

### What Changed?

**Before:**
- Two separate fields: `avatar` and `profilePicture`
- Inconsistent usage across platforms
- Profile pictures could differ between web and mobile

**After:**
- Single authoritative field: `profilePicture`
- Automatic synchronization between both fields
- Consistent profile pictures across all platforms

### Migration Steps for Client Applications

#### Step 1: Update Upload/Update Logic

**Mobile Apps (React Native):**
```javascript
// ❌ OLD - Deprecated but still works
await api.put('/api/auth/me', { 
  avatar: uploadedImageUrl 
});

// ✅ NEW - Recommended
await api.put('/api/auth/me', { 
  profilePicture: uploadedImageUrl 
});
```

**Web Apps:**
```javascript
// ❌ OLD - Deprecated but still works
const response = await fetch('/api/auth/me', {
  method: 'PUT',
  body: JSON.stringify({ avatar: newAvatarUrl })
});

// ✅ NEW - Recommended
const response = await fetch('/api/auth/me', {
  method: 'PUT',
  body: JSON.stringify({ profilePicture: newAvatarUrl })
});
```

#### Step 2: Update Display Logic

**Mobile Apps (React Native):**
```javascript
// ❌ OLD - Only checks one field
const avatarUrl = user.avatar;

// ⚠️ TRANSITIONAL - Works but verbose
const avatarUrl = user.profilePicture || user.avatar;

// ✅ NEW - Recommended with fallback
const avatarUrl = user.profilePicture || user.avatar || `https://ui-avatars.com/api/?name=${user.name}`;
```

**Web Apps:**
```javascript
// ❌ OLD - Only checks one field
<img src={user.avatar} alt="Profile" />

// ✅ NEW - Recommended with fallback
<img 
  src={user.profilePicture || user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
  alt="Profile" 
/>
```

#### Step 3: Update Type Definitions (TypeScript)

```typescript
// ❌ OLD - Only one field
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
}

// ✅ NEW - Both fields during migration
interface User {
  id: string;
  email: string;
  name: string;
  profilePicture: string;  // Primary field
  avatar: string;          // Deprecated, for backward compatibility
  role: string;
}
```

### Backward Compatibility Guarantees

✅ **No Breaking Changes:**
- API still accepts `avatar` parameter in update requests
- API responses include both `profilePicture` and `avatar` fields
- Existing profile pictures in either field continue to work

✅ **Automatic Synchronization:**
- When `profilePicture` is updated, `avatar` is automatically synced
- When `avatar` is updated, `profilePicture` is automatically synced
- Both fields always contain the same value after any update

✅ **Data Preservation:**
- All existing profile pictures are preserved
- No data migration required
- No service interruption

### Testing Your Migration

**Test Checklist:**
1. ✅ Upload a new profile picture using `profilePicture` parameter
2. ✅ Verify the image displays correctly on all platforms
3. ✅ Check that both `profilePicture` and `avatar` fields are returned in API responses
4. ✅ Verify both fields contain the same URL
5. ✅ Test with users who have existing profile pictures
6. ✅ Test with new users (should get default avatar in both fields)

**Example Test:**
```javascript
// 1. Update profile picture
const updateResponse = await api.put('/api/auth/me', {
  profilePicture: 'https://example.com/new-avatar.jpg'
});

// 2. Verify response includes both fields
console.assert(updateResponse.data.profilePicture === 'https://example.com/new-avatar.jpg');
console.assert(updateResponse.data.avatar === 'https://example.com/new-avatar.jpg');

// 3. Fetch profile and verify consistency
const profileResponse = await api.get('/api/auth/me');
console.assert(profileResponse.data.profilePicture === profileResponse.data.avatar);
```

### Timeline & Deprecation Notice

**Current Status (December 2024):**
- ✅ Both fields fully supported
- ✅ `profilePicture` is the recommended primary field
- ⚠️ `avatar` is deprecated but maintained for backward compatibility

**Future Plans:**
- **Q1 2025:** Continue supporting both fields
- **Q2 2025:** Add deprecation warnings in API responses when `avatar` parameter is used
- **Q3 2025+:** Potential removal of `avatar` field (with 6+ months advance notice)

**Recommendation:** Migrate to `profilePicture` as soon as possible to future-proof your application.

### Frequently Asked Questions

**Q: Do I need to migrate immediately?**
A: No, both fields work. However, migrating to `profilePicture` is recommended for future compatibility.

**Q: What happens if I send both `avatar` and `profilePicture` in an update?**
A: The `profilePicture` value takes priority, and both fields will be set to that value.

**Q: Will my existing profile pictures break?**
A: No, all existing profile pictures continue to work regardless of which field they're stored in.

**Q: Can I still use `avatar` in my queries?**
A: Yes, but it's deprecated. Use `profilePicture` as the primary field for display.

**Q: What if I have different values in `avatar` and `profilePicture`?**
A: The API prioritizes `profilePicture` as the authoritative source. On the next update, both fields will be synchronized.

### Support

If you encounter issues during migration:
1. Check that you're using the latest API version
2. Verify both fields are present in API responses
3. Test with the example code provided above
4. Contact the development team if issues persist

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

