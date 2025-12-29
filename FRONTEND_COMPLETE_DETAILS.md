# Frontend Complete Details - Gretex Music Room

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Environment Configuration](#environment-configuration)
5. [API Configuration](#api-configuration)
6. [Authentication System](#authentication-system)
7. [State Management](#state-management)
8. [Navigation Structure](#navigation-structure)
9. [API Endpoints](#api-endpoints)
10. [Key Features](#key-features)
11. [Setup Instructions](#setup-instructions)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Gretex Music Room** is a React Native mobile application built with Expo for learning music. The app provides:
- User authentication (Email/Password, Google, Apple)
- Course browsing and enrollment
- Music track playback
- Shopping cart and checkout
- Payment integration (Razorpay)
- User profiles and dashboards
- Chat functionality
- Library management

---@123


## 🛠 Technology Stack

### Core Framework
- **React Native**: 0.81.5
- **Expo**: ~54.0.27
- **TypeScript**: 5.3.0

### Key Libraries
- **Navigation**: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- **State Management**: `zustand` (4.4.7)
- **HTTP Client**: `axios` (1.13.2)
- **Storage**: `@react-native-async-storage/async-storage`, `expo-secure-store`
- **Authentication**: 
  - `expo-auth-session` (Google OAuth)
  - `expo-apple-authentication` (Apple Sign-In, iOS only)
- **UI Components**: 
  - `expo-linear-gradient`
  - `@expo/vector-icons`
  - `react-native-safe-area-context`
- **Media**: `expo-av` (audio playback), `expo-image-picker`
- **Payment**: `react-native-razorpay`
- **Database**: `@supabase/supabase-js` (for frontend Supabase client, if needed)

---

## 📁 Project Structure

```
Gretex music Room/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ActivityChart.tsx
│   │   ├── CartIcon.tsx
│   │   ├── LoginRequired.tsx
│   │   ├── PackCard.tsx
│   │   ├── ProtectedScreen.tsx
│   │   └── TestimonialCard.tsx
│   ├── config/                 # Configuration files
│   │   ├── api.ts          # API base URL configuration
│   │   └── googleAuth.ts   # Google OAuth config
│   ├── data/               # Mock data and static content
│   │   ├── mockData.ts
│   │   └── practiceTips.ts
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation setup
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── navigationRef.ts
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── ResetPasswordScreen.tsx
│   │   │   └── VerifyEmailScreen.tsx
│   │   ├── BrowseScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── CheckoutScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── EditProfileScreen.tsx
│   │   ├── EmailVerifyScreen.tsx
│   │   ├── EmailVerifiedScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LibraryScreen.tsx
│   │   ├── PackDetailScreen.tsx
│   │   ├── PaymentSuccessScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── TrackPlayerScreen.tsx
│   │   ├── chat/
│   │   │   └── ChatScreen.tsx
│   │   └── settings/
│   │       └── NotificationSettingsScreen.tsx
│   ├── store/              # Zustand state stores
│   │   ├── authStore.ts    # Authentication state
│   │   ├── cartStore.ts    # Shopping cart state
│   │   ├── libraryStore.ts # User library state
│   │   ├── notificationStore.ts
│   │   ├── purchasedCoursesStore.ts
│   │   └── tipsStore.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts
│   │   └── react-native-razorpay.d.ts
│   └── utils/              # Utility functions
│       ├── api.ts          # Axios instance and helpers
│       └── storage.ts      # Storage utilities
├── app/                    # Expo Router pages (if using file-based routing)
├── assets/                 # Images, fonts, etc.
├── android/               # Android native code
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript configuration
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL (REQUIRED)
EXPO_PUBLIC_API_URL=http://localhost:3000
# OR for production:
# EXPO_PUBLIC_API_URL=https://your-backend-domain.com

# Google OAuth (REQUIRED for Google Sign-In)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Optional: Fallback backend URL (if EXPO_PUBLIC_API_URL not set)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
EXPO_PUBLIC_BASE_URL=http://localhost:3000
```

### Environment Variable Priority

1. **`EXPO_PUBLIC_API_URL`** (Primary) - Used by `src/config/api.ts`
2. **`EXPO_PUBLIC_BACKEND_URL`** (Fallback) - Used by some stores
3. **`EXPO_PUBLIC_BASE_URL`** (Legacy fallback)

### Important Notes

- All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- Restart Expo dev server after changing `.env` file
- Clear cache if variables don't update: `npx expo start --clear`

---

## 🔌 API Configuration

### API Base URL Setup

**File**: `src/config/api.ts`

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_BASE_URL = API_URL.replace(/\/+$/, '');
```

This file:
- Reads `EXPO_PUBLIC_API_URL` from environment
- Removes trailing slashes
- Throws error if missing
- Logs API URL at startup

### Axios Instance

**File**: `src/utils/api.ts`

```typescript
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Features**:
- Automatic base URL prepending
- Request/response interceptors for debugging
- Network error handling with helpful messages
- Auth token management via `setAuthToken(token)`

### Usage Example

```typescript
import api from '../utils/api';

// GET request
const response = await api.get('/api/courses');

// POST request
const response = await api.post('/api/auth/login', { email, password });

// With auth token (set globally)
import { setAuthToken } from '../utils/api';
setAuthToken('your-jwt-token');
const response = await api.get('/api/auth/me');
```

---

## 🔐 Authentication System

### Authentication Flow

1. **Signup**:
   - User enters name, email, password
   - Frontend validates password (uppercase, lowercase, number, special char, min 6 chars)
   - POST `/api/auth/register` → Backend sends verification email
   - Status set to `pending_verification`
   - Navigate to `VerifyEmail` screen

2. **Email Verification**:
   - User receives email with verification link
   - Deep link: `gretexmusicroom://verify-email?token=xxx`
   - Frontend navigates to `EmailVerify` screen
   - POST `/api/auth/verify-email` with token
   - On success: Status → `authenticated`, navigate to Home

3. **Login**:
   - User enters email and password
   - POST `/api/auth/login` → Returns `{ user, token }`
   - Token stored in SecureStore
   - Status set to `authenticated`
   - Navigate to Home or redirect path

4. **Google Sign-In**:
   - Uses `expo-auth-session` with `useProxy: true`
   - Gets Google ID token
   - POST `/api/auth/google` with `idToken`
   - Backend verifies token, returns `{ user, token }`
   - Same flow as regular login

5. **Apple Sign-In** (iOS only):
   - Uses `expo-apple-authentication`
   - Gets Apple credential
   - Currently handled client-side (may need backend integration)

6. **Forgot Password**:
   - POST `/api/auth/forgot-password` with email
   - Backend sends reset link
   - Deep link: `gretexmusicroom://reset-password?token=xxx`
   - Navigate to `ResetPassword` screen
   - POST `/api/auth/reset-password` with token and new password

### Auth Store (`src/store/authStore.ts`)

**State**:
```typescript
{
  user: User | null;
  token: string | null;
  status: 'unauthenticated' | 'pending_verification' | 'authenticated';
  loading: boolean;
  initialized: boolean;
  redirectPath: RedirectPath | null;
  isLoggingOut: boolean;
}
```

**Key Methods**:
- `login(user, token)`: Store user and token, set authenticated
- `loginWithCredentials(email, password)`: API call + login
- `signup(name, email, password)`: API call, set pending_verification
- `logout()`: Clear token, set unauthenticated
- `fetchMe()`: Get current user from `/api/auth/me`
- `init()`: Check stored token on app start
- `setAuthToken(token)`: Set token in axios headers only

**Token Storage**:
- Stored in `SecureStore` (key: `auth_token`)
- Automatically added to axios headers via `setAuthToken()`
- Cleared on logout or token invalidation

### Protected Routes

**File**: `src/components/ProtectedScreen.tsx`

Wraps screens that require authentication:
- Checks `status === 'authenticated'`
- Redirects to Login if not authenticated
- Stores redirect path for post-login navigation

**Usage**:
```typescript
<ProtectedScreen>
  <YourProtectedComponent />
</ProtectedScreen>
```

---

## 📦 State Management

### Zustand Stores

#### 1. Auth Store (`src/store/authStore.ts`)
- User authentication state
- Token management
- Login/logout/signup flows

#### 2. Cart Store (`src/store/cartStore.ts`)
- Shopping cart items
- Add/remove/update cart
- Calculate totals

#### 3. Library Store (`src/store/libraryStore.ts`)
- User's purchased courses/tracks
- Library management

#### 4. Course Store (`src/store/courseStore.ts`)
- Available courses
- Course enrollment
- Course CRUD (for admins)

#### 5. Notification Store (`src/store/notificationStore.ts`)
- Push notifications
- Notification preferences

#### 6. Purchased Courses Store (`src/store/purchasedCoursesStore.ts`)
- User's enrolled courses
- Course progress tracking

#### 7. Tips Store (`src/store/tipsStore.ts`)
- Practice tips
- Daily tips

### Store Usage Example

```typescript
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  const { user, token, status, login, logout } = useAuthStore();
  
  // Access state
  const isAuthenticated = status === 'authenticated';
  
  // Call actions
  await login(user, token);
}
```

---

## 🧭 Navigation Structure

### Navigation Hierarchy

```
RootNavigator (Stack)
├── Main (MainNavigator - Bottom Tabs)
│   ├── Home (HomeScreen)
│   ├── Browse (BrowseScreen)
│   ├── Library (LibraryScreen) [Protected]
│   ├── Profile (ProfileScreen) [Protected]
│   └── Dashboard (DashboardScreen) [Protected]
├── Auth (AuthNavigator - Stack)
│   ├── Login (LoginScreen)
│   ├── Signup (SignupScreen)
│   ├── ForgotPassword (ForgotPasswordScreen)
│   ├── ResetPassword (ResetPasswordScreen)
│   └── VerifyEmail (VerifyEmailScreen)
├── PackDetail (PackDetailScreen)
├── TrackPlayer (TrackPlayerScreen)
├── Checkout (CheckoutScreen) [Protected]
├── Cart (CartScreen)
├── EditProfile (EditProfileScreen) [Protected]
├── NotificationSettings (NotificationSettingsScreen) [Protected]
├── Chat (ChatScreen) [Protected]
├── PaymentSuccess (PaymentSuccessScreen)
├── EmailVerify (EmailVerifyScreen)
└── EmailVerified (EmailVerifiedScreen)
```

### Navigation Types

**File**: `src/navigation/types.ts`

```typescript
export type RootStackParamList = {
  Main: undefined;
  Auth: { screen: keyof AuthStackParamList; params?: any };
  PackDetail: { packId: string };
  TrackPlayer: { trackId: string };
  Checkout: undefined;
  Cart: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  Chat: { userId?: string };
  PaymentSuccess: { orderId: string };
  EmailVerify: { token: string };
  EmailVerified: { error?: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};
```

### Deep Linking

**Supported Deep Links**:
- `gretexmusicroom://verify-email?token=xxx` → EmailVerify screen
- `gretexmusicroom://reset-password?token=xxx` → ResetPassword screen
- `gretexmusicroom://email-verified?error=xxx` → EmailVerified screen

**Handler**: `src/navigation/RootNavigator.tsx`

---

## 🌐 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User signup | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/google` | Google OAuth login | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| GET | `/api/auth/reset-password/:token` | Get reset password page | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| POST | `/api/auth/verify-email` | Verify email with token | No |
| GET | `/api/auth/check-verification` | Check verification status | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/me` | Update user profile | Yes |

### Course Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/courses` | Get all courses | No |
| GET | `/api/courses/:id` | Get course details | No |
| POST | `/api/courses` | Create course (admin) | Yes |
| PUT | `/api/courses/:id` | Update course (admin) | Yes |
| DELETE | `/api/courses/:id` | Delete course (admin) | Yes |
| GET | `/api/my-courses` | Get user's enrolled courses | Yes |

### Enrollment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/enrollments` | Get user enrollments | Yes |
| POST | `/api/enrollments` | Enroll in course | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/create-order` | Create Razorpay order | Yes |
| POST | `/api/payments/verify` | Verify payment | Yes |

### Store Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/store` | Get store items | No |
| GET | `/api/store/:id` | Get item details | No |

### Response Format

**Success Response**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message",
  "detail": "Detailed error description"
}
```

### Authentication Headers

Protected endpoints require JWT token:
```
Authorization: Bearer <jwt-token>
```

---

## ✨ Key Features

### 1. User Authentication
- Email/Password signup and login
- Email verification flow
- Password reset via email
- Google OAuth integration
- Apple Sign-In (iOS only)
- Secure token storage

### 2. Course Management
- Browse available courses
- Course details and enrollment
- User dashboard with enrolled courses
- Course progress tracking

### 3. Shopping & Payments
- Shopping cart functionality
- Razorpay payment integration
- Payment success/failure handling
- Order management

### 4. Media Playback
- Audio track playback
- Playlist management
- Progress tracking

### 5. User Profile
- Profile viewing and editing
- Avatar upload
- Notification settings
- Account management

### 6. Chat System
- Real-time chat (if implemented)
- User messaging

### 7. Library
- Purchased courses/tracks
- Library organization
- Offline access (if implemented)

---

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js**: v18+ recommended
2. **npm** or **yarn**
3. **Expo CLI**: `npm install -g expo-cli`
4. **Expo Go app** (for testing on device) OR **Expo Dev Client** (for custom native code)

### Installation Steps

1. **Clone/Navigate to project**:
   ```bash
   cd "Gretex music Room"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file**:
   ```bash
   # Copy example if exists, or create new
   touch .env
   ```
   
   Add required variables:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

4. **Start Expo dev server**:
   ```bash
   npm start
   # OR
   npx expo start
   ```

5. **Run on device/emulator**:
   - **iOS**: Press `i` in terminal or scan QR with Expo Go
   - **Android**: Press `a` in terminal or scan QR with Expo Go
   - **Web**: Press `w` in terminal

### Development Build (Custom Native Code)

If you need custom native modules (Razorpay, etc.):

1. **Install Expo Dev Client**:
   ```bash
   npx expo install expo-dev-client
   ```

2. **Build development client**:
   ```bash
   # iOS
   npx expo run:ios
   
   # Android
   npx expo run:android
   ```

3. **Start dev server**:
   ```bash
   npx expo start --dev-client
   ```

### Production Build

1. **Configure EAS** (Expo Application Services):
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. **Build for production**:
   ```bash
   # Android
   eas build --platform android
   
   # iOS
   eas build --platform ios
   ```

3. **Submit to stores**:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **API Connection Errors**

**Error**: `Network Error` or `Cannot connect to server`

**Solutions**:
- Verify backend server is running
- Check `EXPO_PUBLIC_API_URL` in `.env` matches backend URL
- For local development, use your computer's IP: `http://192.168.1.x:3000`
- Restart Expo dev server after changing `.env`
- Clear cache: `npx expo start --clear`

#### 2. **Environment Variables Not Loading**

**Error**: `EXPO_PUBLIC_API_URL is missing`

**Solutions**:
- Ensure `.env` file exists in root directory
- Variables must start with `EXPO_PUBLIC_`
- Restart Expo dev server
- Clear cache: `npx expo start --clear`
- Check file is not in `.gitignore` (if needed)

#### 3. **Google Sign-In Errors**

**Error**: `Custom scheme URIs not allowed` or OAuth errors

**Solutions**:
- Ensure using **Web Client ID** (not iOS/Android client ID)
- Verify `useProxy: true` in Google auth config
- Check Google OAuth credentials in Google Cloud Console
- Ensure redirect URI is configured correctly

#### 4. **Token Not Persisting**

**Error**: User logged out after app restart

**Solutions**:
- Check `SecureStore` permissions
- Verify token is stored in `authStore.login()`
- Check `init()` method is called on app start
- Verify token validation in `fetchMe()`

#### 5. **Navigation Errors**

**Error**: `Cannot read property 'navigate' of undefined`

**Solutions**:
- Ensure navigation is initialized before use
- Use `useNavigation()` hook inside navigator context
- Check navigation types match screen names
- Verify screen is registered in navigator

#### 6. **Build Errors**

**Error**: Native module not found or build fails

**Solutions**:
- Run `npx expo prebuild` to generate native code
- Clear build cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- For custom native code, use Expo Dev Client

### Debugging Tips

1. **Enable Debug Logging**:
   - Check console for `[API]`, `[AuthStore]` logs
   - Use React Native Debugger
   - Enable network inspection in DevTools

2. **Check Network Requests**:
   - Use axios interceptors (already configured)
   - Check backend logs
   - Verify CORS settings on backend

3. **State Debugging**:
   - Use Zustand DevTools (if configured)
   - Log state changes in stores
   - Check `initialized` flag in auth store

4. **Navigation Debugging**:
   - Use React Navigation DevTools
   - Log navigation actions
   - Check deep link handlers

---

## 📝 Additional Notes

### Backend Integration

The frontend expects the backend to:
- Return JWT tokens for authentication
- Use standard response format: `{ success, message, data }`
- Support CORS for local development
- Handle email verification and password reset
- Provide Razorpay payment endpoints

### Database Abstraction

The backend uses a database abstraction layer that supports:
- **Local Development**: Supabase JS client (via HTTPS)
- **Production**: Prisma ORM (direct PostgreSQL)

The frontend doesn't need to know which backend database is used.

### Security Considerations

- Never commit `.env` file to git
- Use HTTPS in production
- Validate all user inputs
- Store tokens securely (SecureStore)
- Implement token refresh if needed
- Handle token expiration gracefully

### Performance Optimization

- Use React.memo for expensive components
- Implement lazy loading for screens
- Cache API responses when appropriate
- Optimize images and assets
- Use FlatList for long lists

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review backend API documentation
3. Check Expo documentation: https://docs.expo.dev
4. Review React Navigation docs: https://reactnavigation.org

---

**Last Updated**: 2024
**Version**: 1.0.0

