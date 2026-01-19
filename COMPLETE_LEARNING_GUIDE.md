# Complete Learning Guide - Gretex Music Room App

## Table of Contents
1. [Frontend Stack](#frontend-stack)
2. [Backend Stack](#backend-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Key Libraries & Why](#key-libraries--why)
5. [Data Flow](#data-flow)
6. [Authentication Flow](#authentication-flow)
7. [State Management](#state-management)
8. [API Communication](#api-communication)
9. [UI/UX Patterns](#uiux-patterns)
10. [Database Design](#database-design)

---

## Frontend Stack

### React Native + Expo
**What**: Cross-platform mobile framework
**Why**: 
- Write once, run on iOS and Android
- Faster development than native
- Hot reload for quick testing
- Large community and ecosystem

### TypeScript
**What**: Typed superset of JavaScript
**Why**:
- Catch errors at compile time, not runtime
- Better IDE autocomplete and refactoring
- Self-documenting code
- Prevents bugs like undefined properties

### Zustand
**What**: Lightweight state management library
**Why**:
- Simpler than Redux (less boilerplate)
- Minimal API surface
- Works great for medium-sized apps
- Easy to debug and test

---

## Backend Stack

### Node.js + Express
**What**: JavaScript runtime + web framework
**Why**:
- Same language as frontend (JavaScript/TypeScript)
- Non-blocking I/O (handles many requests efficiently)
- Large npm ecosystem
- Easy to learn and deploy

### Prisma ORM
**What**: Database abstraction layer
**Why**:
- Type-safe database queries
- Auto-generated migrations
- Works with PostgreSQL, MySQL, SQLite
- Prevents SQL injection attacks
- Easy to understand schema

### PostgreSQL
**What**: Relational database
**Why**:
- ACID compliance (data integrity)
- Powerful query language (SQL)
- Handles complex relationships
- Scalable and reliable
- Free and open-source

### JWT (JSON Web Tokens)
**What**: Stateless authentication mechanism
**Why**:
- No server-side session storage needed
- Scalable across multiple servers
- Can be used for mobile apps
- Self-contained (includes user info)

---

## Architecture Patterns

### MVC (Model-View-Controller)
```
Model: Database schema (Prisma)
View: React Native screens
Controller: Express route handlers
```

### Service Layer Pattern
```
Routes → Controllers → Services → Database
```
**Why**: Separation of concerns, easier testing, reusable logic

### Repository Pattern
```
Services use repositories to access data
Repositories abstract database queries
```
**Why**: Easier to switch databases, testable, DRY code

---

## Key Libraries & Why

### Frontend Libraries

#### React Navigation
**What**: Navigation library for React Native
**Why**:
- Handles screen transitions
- Manages navigation state
- Deep linking support
- Tab and stack navigation

#### Axios
**What**: HTTP client
**Why**:
- Simpler than fetch API
- Request/response interceptors
- Automatic JSON transformation
- Request cancellation

#### AsyncStorage
**What**: Local storage for React Native
**Why**:
- Persist data locally
- Survives app restarts
- Async API (non-blocking)
- Works on both iOS and Android

#### Zustand Persist Middleware
**What**: Persists store state to AsyncStorage
**Why**:
- Remembers user preferences
- Keeps user logged in
- Saves cart items
- Survives app crashes

#### Expo Image Picker
**What**: Native image selection
**Why**:
- Access device camera/gallery
- Works on both platforms
- Handles permissions
- Returns image URI

#### Razorpay
**What**: Payment gateway
**Why**:
- Secure payment processing
- Multiple payment methods
- PCI compliant
- Easy integration

#### Supabase
**What**: Backend-as-a-Service
**Why**:
- File storage (avatars, documents)
- Real-time database (optional)
- Authentication (optional)
- Reduces backend work

---

### Backend Libraries

#### bcryptjs
**What**: Password hashing
**Why**:
- One-way encryption
- Salting prevents rainbow tables
- Industry standard
- Slow by design (prevents brute force)

#### jsonwebtoken
**What**: JWT creation and verification
**Why**:
- Stateless authentication
- Secure token signing
- Expiration support
- Refresh token mechanism

#### Nodemailer
**What**: Email sending
**Why**:
- Send verification emails
- Password reset emails
- Order confirmations
- Notifications

#### Multer
**What**: File upload middleware
**Why**:
- Handle multipart form data
- File validation
- Size limits
- Prevents abuse

#### CORS
**What**: Cross-Origin Resource Sharing
**Why**:
- Allow frontend to call backend
- Security headers
- Prevent unauthorized requests
- Configurable origins

#### Dotenv
**What**: Environment variables
**Why**:
- Keep secrets out of code
- Different configs per environment
- Easy deployment
- Security best practice

---

## Data Flow

### User Registration Flow
```
1. User enters email/password on SignupScreen
2. Frontend validates input
3. POST /api/auth/signup with credentials
4. Backend hashes password with bcryptjs
5. Creates user in database
6. Sends verification email
7. Returns JWT token
8. Frontend stores token in AsyncStorage
9. Zustand auth store updated
10. Navigate to email verification screen
```

### Course Purchase Flow
```
1. User views course on PackDetailScreen
2. Clicks "Purchase" button
3. Added to cart (cartStore)
4. User navigates to CheckoutScreen
5. Clicks "Pay Now"
6. Frontend calls POST /api/payments/create-order
7. Backend creates Razorpay order
8. Returns order ID to frontend
9. Razorpay modal opens
10. User completes payment
11. Razorpay returns payment ID
12. Frontend calls POST /api/payments/verify
13. Backend verifies signature
14. Creates payment record
15. Marks course as purchased
16. Frontend updates purchasedCoursesStore
17. Navigate to PaymentSuccessScreen
```

### Booking Flow
```
1. User selects building on SelectBuildingScreen
2. Selects time slot on SelectSlotScreen
3. Adds to cart (bookingApi.addToCart)
4. Reviews cart on CartScreen
5. Proceeds to checkout
6. Payment process (same as above)
7. After payment, booking created
8. User receives confirmation
9. Booking appears in dashboard
```

---

## Authentication Flow

### Login Process
```
1. User enters email/password
2. Frontend validates format
3. POST /api/auth/login
4. Backend finds user by email
5. Compares password with bcrypt
6. If match: generates JWT token
7. Returns token + user data
8. Frontend stores token in AsyncStorage
9. Sets Authorization header in axios
10. Zustand auth store updated
11. User logged in
```

### Token Refresh
```
1. Access token expires (15 min)
2. API call fails with 401
3. Axios interceptor catches error
4. Calls POST /api/auth/refresh-token
5. Backend validates refresh token
6. Issues new access token
7. Axios retries original request
8. User doesn't notice interruption
```

### Logout
```
1. User clicks logout
2. Frontend clears AsyncStorage
3. Clears axios Authorization header
4. Clears Zustand auth store
5. Clears cart, purchases, etc.
6. Navigate to LoginScreen
```

---

## State Management

### Zustand Store Pattern
```typescript
// Create store
export const useAuthStore = create<AuthState>((set, get) => ({
  // State
  user: null,
  token: null,
  
  // Actions
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    set({ user: response.user, token: response.token });
  },
  
  logout: () => {
    set({ user: null, token: null });
  }
}));

// Use in component
const { user, login } = useAuthStore();
```

**Why Zustand**:
- Minimal boilerplate vs Redux
- No providers needed (optional)
- Direct state access
- Easy to test

### Store Types

#### Auth Store
- Manages user login/logout
- Stores JWT token
- Handles password reset
- Manages redirect after login

#### Course Store
- Caches all courses
- Handles filtering/searching
- Manages loading states
- Refresh functionality

#### Cart Store
- Temporary shopping cart
- Add/remove items
- Calculate totals
- Clear on checkout

#### Purchased Courses Store
- Tracks bought courses
- Syncs with backend
- Prevents duplicate purchases
- Persists to AsyncStorage

#### Theme Store
- Light/dark mode toggle
- System theme detection
- Persists preference
- Used by all screens

---

## API Communication

### Axios Setup
```typescript
// Create instance with base URL
const api = axios.create({
  baseURL: 'http://192.168.2.131:3002',
  timeout: 10000,
});

// Add interceptors
api.interceptors.request.use((config) => {
  // Add auth token to every request
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - refresh token
    // Handle 403 - permission denied
    // Handle 500 - server error
  }
);
```

**Why Interceptors**:
- Centralized auth handling
- Automatic error handling
- Consistent request/response format
- Logging and debugging

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

**Why**:
- Consistent error handling
- Type safety with TypeScript
- Easy to check success/failure
- Includes error messages

---

## UI/UX Patterns

### Design System
```typescript
// Spacing (8dp base unit)
SPACING = {
  xxs: 4,    // 0.5x
  xs: 8,     // 1x
  sm: 12,    // 1.5x
  md: 16,    // 2x
  lg: 24,    // 3x
  xl: 32,    // 4x
}

// Typography (fixed pixels)
TYPOGRAPHY = {
  xs: 10,    // Caption small
  sm: 12,    // Caption
  md: 16,    // Body
  lg: 18,    // Body large
  xl: 20,    // Heading 4
  '2xl': 24, // Heading 3
}

// Component sizes
COMPONENT_SIZES = {
  button: { sm: 36, md: 44, lg: 52 },
  icon: { xs: 16, sm: 20, md: 24, lg: 32 },
  avatar: { xs: 24, sm: 32, md: 40, lg: 56 },
}
```

**Why Design System**:
- Consistency across app
- Faster development
- Easy to maintain
- Professional appearance

### Component Hierarchy
```
App.tsx
├── RootNavigator
│   ├── AuthStack (LoginScreen, SignupScreen)
│   └── MainStack
│       ├── MainNavigator (Tab navigation)
│       │   ├── HomeScreen
│       │   ├── BrowseScreen
│       │   ├── DashboardScreen
│       │   └── ProfileScreen
│       └── StackNavigator (Modal screens)
│           ├── PackDetailScreen
│           ├── CheckoutScreen
│           └── PaymentSuccessScreen
```

### Screen Patterns

#### List Screen
```
Header
├── Search/Filter
├── Loading spinner
├── List of items
│   └── Each item is touchable
└── Empty state
```

#### Detail Screen
```
Header (back button)
├── Hero image
├── Title & description
├── Key information
├── Action buttons
└── Related items
```

#### Form Screen
```
Header
├── Form fields
│   ├── Input validation
│   └── Error messages
├── Submit button
└── Loading state
```

---

## Database Design

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  bio TEXT,
  avatar_url VARCHAR,
  building_id UUID FOREIGN KEY,
  approval_status ENUM (PENDING, ACTIVE, REJECTED),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Why**:
- UUID for distributed systems
- Email unique for login
- Password hashed for security
- Building link for access control
- Timestamps for auditing

### Course Table
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL,
  teacher_id UUID FOREIGN KEY,
  building_id UUID FOREIGN KEY,
  instrument ENUM (GUITAR, PIANO, DRUMS, VOCALS),
  level ENUM (BEGINNER, INTERMEDIATE, ADVANCED),
  duration_minutes INT,
  created_at TIMESTAMP
);
```

### Payment Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  course_id UUID FOREIGN KEY,
  amount DECIMAL,
  razorpay_order_id VARCHAR,
  razorpay_payment_id VARCHAR,
  status ENUM (PENDING, SUCCESS, FAILED),
  created_at TIMESTAMP
);
```

**Why Relationships**:
- Foreign keys maintain data integrity
- Prevent orphaned records
- Enable joins for queries
- Enforce referential integrity

---

## Key Concepts Explained

### JWT Token Structure
```
Header.Payload.Signature

Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "userId": "123", "email": "user@example.com", "exp": 1234567890 }
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

**Why**:
- Header tells how it's signed
- Payload contains user info
- Signature proves it wasn't tampered
- Expiration prevents indefinite access

### Hashing vs Encryption
```
Hashing (passwords):
- One-way (can't reverse)
- Same input = same output
- Used for passwords

Encryption (data):
- Two-way (can decrypt)
- Requires key
- Used for sensitive data
```

### CORS (Cross-Origin Resource Sharing)
```
Browser blocks requests to different domain
Frontend: http://localhost:3000
Backend: http://localhost:3002

Backend must allow:
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Deep Linking
```
URL: gretexmusicroom://course/123
App intercepts this URL
Navigates to CourseDetailScreen with courseId=123
```

**Why**:
- Share course links
- Email verification links
- Password reset links
- Social media sharing

---

## Performance Optimizations

### Debouncing
```typescript
// Without debouncing: fires on every keystroke
<TextInput onChangeText={(text) => searchCourses(text)} />

// With debouncing: fires after user stops typing
const debouncedSearch = debounce(searchCourses, 500);
<TextInput onChangeText={debouncedSearch} />
```

**Why**: Reduces API calls, saves bandwidth, better UX

### Memoization
```typescript
// Without: component re-renders on every parent update
const CourseCard = ({ course }) => <View>...</View>;

// With: only re-renders if course prop changes
const CourseCard = React.memo(({ course }) => <View>...</View>);
```

**Why**: Prevents unnecessary renders, faster app

### Lazy Loading
```typescript
// Load images only when visible
<Image source={{ uri: course.thumbnail }} />

// Load more items when scrolling to bottom
onEndReached={() => loadMoreCourses()}
```

**Why**: Faster initial load, saves memory

---

## Security Best Practices

### Password Security
```
1. Hash with bcryptjs (not plain text)
2. Salt prevents rainbow tables
3. Slow algorithm prevents brute force
4. Never log passwords
```

### Token Security
```
1. Store in AsyncStorage (not localStorage)
2. Send in Authorization header
3. Use HTTPS only
4. Set expiration time
5. Refresh token mechanism
```

### API Security
```
1. Validate all inputs
2. Sanitize data
3. Use CORS properly
4. Rate limiting
5. SQL injection prevention (Prisma)
```

---

## Testing Strategy

### Unit Tests
```typescript
// Test individual functions
test('debounce delays function call', () => {
  const fn = jest.fn();
  const debounced = debounce(fn, 100);
  debounced();
  expect(fn).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);
  expect(fn).toHaveBeenCalled();
});
```

### Integration Tests
```typescript
// Test API calls
test('login returns token', async () => {
  const response = await api.post('/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  });
  expect(response.data.token).toBeDefined();
});
```

### E2E Tests
```typescript
// Test full user flows
test('user can purchase course', async () => {
  // Login
  // Browse courses
  // Add to cart
  // Checkout
  // Verify payment
});
```

---

## Deployment

### Frontend (Expo)
```
1. Build APK: eas build --platform android
2. Build IPA: eas build --platform ios
3. Submit to stores
4. Or use Expo Go for testing
```

### Backend (Railway/Heroku)
```
1. Push to Git
2. Connect to Railway
3. Set environment variables
4. Deploy automatically
5. Database migrations run
```

---

## Common Patterns Used

### Error Handling
```typescript
try {
  const response = await api.get('/courses');
  setCourses(response.data);
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
  } else if (error.response?.status === 500) {
    // Server error
  } else {
    // Network error
  }
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    // fetch
  } finally {
    setLoading(false);
  }
};

return loading ? <Spinner /> : <Content />;
```

### Conditional Rendering
```typescript
// Show different UI based on state
{user?.approvalStatus === 'ACTIVE' ? (
  <BuildingCourses />
) : user?.approvalStatus === 'PENDING_VERIFICATION' ? (
  <PendingBanner />
) : (
  <SelectBuildingPrompt />
)}
```

---

## Summary

This app uses:
- **Frontend**: React Native + TypeScript + Zustand
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Auth**: JWT + bcryptjs
- **Payments**: Razorpay
- **Storage**: Supabase (files) + PostgreSQL (data)
- **Architecture**: MVC + Service Layer
- **Patterns**: Zustand stores, Axios interceptors, Design system

All these technologies work together to create a scalable, secure, and user-friendly music learning platform.
