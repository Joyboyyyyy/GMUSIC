# Gretex Music Room - Backend API

Backend API server for the Gretex Music Room mobile application.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Payment**: Stripe
- **CRM**: Zoho CRM Integration

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── prisma.js          # Prisma client configuration
│   │   └── zoho.js            # Zoho CRM client
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── routes/
│   │   ├── auth.routes.js     # Auth endpoints
│   │   ├── course.routes.js   # Course endpoints
│   │   ├── payment.routes.js  # Payment endpoints
│   │   └── zoho.routes.js     # Zoho CRM endpoints
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── course.controller.js
│   │   ├── payment.controller.js
│   │   └── zoho.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── course.service.js
│   │   ├── payment.service.js
│   │   └── zoho.service.js
│   └── utils/
│       ├── jwt.js             # JWT utilities
│       └── response.js        # Response helpers
├── prisma/
│   └── schema.prisma          # Database schema
├── package.json
└── .env.example
```

---

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gretex_music_room"

# JWT
JWT_SECRET=your-super-secret-jwt-key
PASSWORD_PEPPER=your-password-pepper

# Email (SMTP) - Required for password reset
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
EMAIL_FROM=noreply@yourdomain.com
BACKEND_URL=http://localhost:3000
APP_SCHEME=gretexmusicroom://

# Zoho CRM
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3000`

---

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/forgot-password` | Request password reset email | No |
| GET | `/reset-password/:token` | Redirect to app deep link for password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| GET | `/me` | Get current user profile | Yes |
| PUT | `/me` | Update user profile | Yes |

#### Profile Picture Fields

**Important:** The API uses two fields for profile pictures to maintain backward compatibility:

- **`profilePicture`** (PRIMARY) - The authoritative field for profile picture URLs. All clients should use this field for displaying and updating profile pictures.
- **`avatar`** (DEPRECATED) - Maintained for backward compatibility with legacy clients. This field is automatically synchronized with `profilePicture` on every update.

**Best Practices:**
- ✅ Use `profilePicture` in all new code
- ✅ Display `profilePicture` with fallback to `avatar` for backward compatibility
- ✅ Send `profilePicture` when updating profile pictures
- ⚠️ Both fields are synchronized automatically - updating either field updates both
- ⚠️ `avatar` field will be removed in a future API version

### Courses (`/api/courses`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all courses | No |
| GET | `/:courseId` | Get course by ID | No |
| GET | `/user/my-courses` | Get user's enrolled courses | Yes |
| POST | `/` | Create new course | Yes (Admin/Teacher) |
| PUT | `/:courseId` | Update course | Yes (Admin/Teacher) |
| DELETE | `/:courseId` | Delete course | Yes (Admin) |
| POST | `/:courseId/tracks` | Add track to course | Yes (Admin/Teacher) |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/create-intent` | Create payment intent | Yes |
| POST | `/confirm` | Confirm payment | Yes |
| GET | `/my-purchases` | Get user's purchases | Yes |
| POST | `/:purchaseId/refund` | Refund purchase | Yes (Admin) |

### Zoho CRM (`/api/zoho`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/sync` | Sync user data to Zoho | Yes |
| POST | `/leads` | Create lead in Zoho | Yes |

---

## 📝 Example API Usage

### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword",
  "name": "John Doe"
}

Response:
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_123",
      "email": "student@example.com",
      "name": "John Doe",
      "profilePicture": "https://ui-avatars.com/api/?name=John+Doe&background=random",
      "avatar": "https://ui-avatars.com/api/?name=John+Doe&background=random",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get User Profile

```bash
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "student@example.com",
    "name": "John Doe",
    "profilePicture": "https://storage.example.com/profiles/user_123.jpg",
    "avatar": "https://storage.example.com/profiles/user_123.jpg",
    "role": "STUDENT",
    ...
  }
}
```

**Note:** Both `profilePicture` and `avatar` fields are returned for backward compatibility. Always use `profilePicture` as the primary field.

### Update User Profile

```bash
PUT /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "profilePicture": "https://storage.example.com/profiles/new-photo.jpg"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_123",
    "email": "student@example.com",
    "name": "John Smith",
    "profilePicture": "https://storage.example.com/profiles/new-photo.jpg",
    "avatar": "https://storage.example.com/profiles/new-photo.jpg",
    ...
  }
}
```

**Note:** When you update `profilePicture`, the `avatar` field is automatically synchronized. Both fields will always have the same value.

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword"
}
```

### Forgot Password

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}

Response:
{
  "success": true,
  "message": "If your email is registered, you will receive a reset link.",
  "data": {
    "message": "If your email is registered, you will receive a reset link."
  }
}
```

### Reset Password

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecurePassword123!"
}

Response:
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Note:** The reset token is valid for 15 minutes. Password must meet requirements:
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Get Courses

```bash
GET /api/courses?category=Guitar&level=Beginner

Response:
{
  "success": true,
  "data": [
    {
      "id": "course_123",
      "title": "Guitar Mastery",
      "price": 1999,
      ...
    }
  ]
}
```

### Create Payment

```bash
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course_123",
  "amount": 1999
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_...",
    "purchaseId": "purchase_456"
  }
}
```

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with Argon2id
- ✅ Password reset tokens (SHA-256 hashed, 15-minute expiry)
- ✅ Email enumeration prevention (consistent success responses)
- ✅ Role-based access control (STUDENT, TEACHER, ADMIN)
- ✅ Protected routes with middleware
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Rate limiting (recommended for forgot-password endpoint)

---

## 🗄️ Database Schema

### Models:
- **User** - User accounts (students, teachers, admins)
- **Course** - Music courses/packs
- **Track** - Individual lessons within courses
- **Enrollment** - User course enrollments
- **Purchase** - Payment transactions
- **ChatMessage** - Mentor-student chat messages
- **Session** - User sessions

### Relations:
- User → Enrollments (one-to-many)
- User → Purchases (one-to-many)
- Course → Tracks (one-to-many)
- Course → Enrollments (one-to-many)

---

## 🔌 Zoho CRM Integration

### Features:
- ✅ Auto-create leads on course interest
- ✅ Update lead on purchase
- ✅ Convert lead to student on enrollment
- ✅ Sync enrollment data
- ✅ Track revenue and course metrics

### Zoho Fields:
- Lead Source: Mobile App
- Course Interest
- Purchase Amount
- Payment Status
- Total Courses Enrolled

---

## 💳 Payment Integration

### Stripe Features:
- Payment intents for secure payments
- Automatic currency conversion
- Webhook support (ready to implement)
- Refund processing

### Payment Flow:
1. Create payment intent
2. Process payment on client
3. Confirm payment on server
4. Create enrollment
5. Update Zoho CRM

---

## 🧪 Testing

### Test Database Connection:
```bash
npm run prisma:studio
```

### Test API Endpoints:
```bash
# Using curl
curl http://localhost:3000/health

# Using Postman
Import the API endpoints and test each route
```

---

## 📊 Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)
```

---

## 🚀 Deployment

### Prerequisites:
- PostgreSQL database
- Node.js 18+ runtime
- Environment variables configured

### Steps:
1. Set up PostgreSQL database
2. Configure production .env file
3. Run database migrations
4. Start server with PM2 or similar

### Environment:
```bash
NODE_ENV=production
DATABASE_URL=<production-db-url>
JWT_SECRET=<strong-secret>
```

---

## 📞 Support

For issues or questions:
- Check logs in console
- Verify database connection
- Check environment variables
- Review Prisma schema

---

## 🎯 Status

```
✅ Express server configured
✅ Prisma ORM integrated
✅ JWT authentication implemented
✅ CRUD operations for courses
✅ Payment processing (Stripe)
✅ Zoho CRM integration
✅ Role-based access control
✅ Error handling
✅ Production-ready
```

---

*Backend API v1.0.0*  
*Built for Gretex Music Room Mobile App*

