# Frontend Details - Gretex Music Room

## 📁 Project Structure

```
Gretex music Room/
├── App.tsx                    # Main entry point
├── app.config.js             # Expo configuration
├── package.json              # Dependencies
└── src/
    ├── components/           # Reusable UI components
    ├── config/              # Configuration files
    ├── data/                # Mock data and static content
    ├── hooks/               # Custom React hooks
    ├── navigation/          # Navigation setup
    ├── screens/             # Screen components
    ├── store/               # Zustand state management
    ├── types/               # TypeScript type definitions
    └── utils/               # Utility functions
``` 

---

## 🎯 Technology Stack

### Core Framework
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Expo**: ~54.0.27
- **TypeScript**: ^5.3.0

### Navigation
- **@react-navigation/native**: ^6.1.9
- **@react-navigation/native-stack**: ^6.9.17
- **@react-navigation/bottom-tabs**: ^6.5.11

### State Management
- **Zustand**: ^4.4.7 (with persistence middleware)

### Authentication
- **expo-auth-session**: ~7.0.10 (Google OAuth)
- **expo-apple-authentication**: ~8.0.8 (Apple Sign In)
- **expo-secure-store**: ~15.0.8 (Token storage)

### UI & Styling
- **expo-linear-gradient**: ~15.0.8
- **@expo/vector-icons**: ^15.0.3
- **expo-image**: ~3.0.11

### Media & Features
- **expo-av**: ~16.0.8 (Audio/Video playback)
- **expo-haptics**: ~15.0.8
- **expo-image-picker**: ~17.0.9

### API & Networking
- **axios**: ^1.13.2

### Payment
- **react-native-razorpay**: ^2.3.1

### Storage
- **@react-native-async-storage/async-storage**: ^2.2.0

---

## 🗂️ File Structure Details

### 📱 Screens (29 TSX files)

#### Authentication Screens (`src/screens/auth/`)
1. **LoginScreen.tsx** (449 lines)
   - Email/password login
   - Google OAuth integration
   - Apple Sign In (iOS)
   - Inline forgot password form
   - Purple gradient theme

2. **SignupScreen.tsx** (331 lines)
   - User registration
   - Password validation with rules
   - Email verification flow

3. **ForgotPasswordScreen.tsx** (1 line - placeholder)
   - Email input for password reset
   - API: `POST /api/auth/forgot-password`

4. **ResetPasswordScreen.tsx** (90 lines)
   - Password reset with token
   - Deep link support: `gretexmusicroom://reset-password?token=...`
   - API: `POST /api/auth/reset-password`

5. **VerifyEmailScreen.tsx**
   - Email verification UI
   - Token-based verification

#### Main Screens
6. **HomeScreen.tsx**
   - Featured lessons
   - Trending packs
   - Category browsing
   - Search functionality
   - Testimonials

7. **BrowseScreen.tsx**
   - Browse all music packs
   - Filter by category
   - Search functionality

8. **DashboardScreen.tsx**
   - User dashboard
   - Learning progress
   - Quick access to courses

9. **LibraryScreen.tsx**
   - Purchased courses
   - Learning progress
   - Recently viewed

10. **ProfileScreen.tsx**
    - User profile
    - Settings access
    - Logout functionality

#### Feature Screens
11. **PackDetailScreen.tsx**
    - Music pack details
    - Track listing
    - Purchase options
    - Teacher information

12. **TrackPlayerScreen.tsx**
    - Audio/Video player
    - Progress tracking
    - Playlist navigation

13. **CartScreen.tsx** (305 lines)
    - Shopping cart
    - Item management
    - Checkout navigation

14. **CheckoutScreen.tsx**
    - Payment processing
    - Razorpay integration
    - Order summary

15. **PaymentSuccessScreen.tsx**
    - Payment confirmation
    - Order details

16. **PaymentTestScreen.tsx**
    - Payment testing interface

17. **EditProfileScreen.tsx**
    - Profile editing
    - Avatar upload
    - Bio updates

18. **EmailVerifyScreen.tsx**
    - Email verification handling
    - Deep link support

19. **EmailVerifiedScreen.tsx**
    - Success confirmation

#### Chat & Settings
20. **ChatScreen.tsx** (`src/screens/chat/`)
    - Mentor chat interface
    - Pack-specific conversations

21. **NotificationSettingsScreen.tsx** (`src/screens/settings/`)
    - Notification preferences
    - Push notification settings

---

### 🧩 Components (5 TSX files)

1. **PackCard.tsx**
   - Music pack card component
   - Displays thumbnail, title, teacher, price
   - Used in HomeScreen and BrowseScreen

2. **TestimonialCard.tsx**
   - User testimonial display
   - Rating and review display

3. **CartIcon.tsx**
   - Shopping cart icon in header
   - Shows item count badge
   - Navigates to CartScreen

4. **LoginRequired.tsx**
   - Protected route wrapper
   - Redirects to login if not authenticated

5. **ProtectedScreen.tsx**
   - Screen protection wrapper
   - Authentication check

---

### 🧭 Navigation (`src/navigation/`)

#### RootNavigator.tsx (165 lines)
- **Type**: Native Stack Navigator
- **Initial Route**: `Auth`
- **Screens**:
  - `Main` → MainNavigator (Tab Navigator)
  - `Auth` → AuthNavigator (Stack Navigator)
  - `PackDetail` → Pack detail screen
  - `TrackPlayer` → Audio/Video player
  - `Checkout` → Checkout screen
  - `Cart` → Shopping cart
  - `EditProfile` → Profile editing
  - `NotificationSettings` → Settings
  - `Chat` → Chat interface
  - `PaymentSuccess` → Payment confirmation
  - `EmailVerify` → Email verification
  - `EmailVerified` → Verification success

**Deep Linking**:
- Handles `email-verified` deep links
- Handles token-based email verification
- Scheme: `gretexmusicroom://`

#### AuthNavigator.tsx (42 lines)
- **Type**: Native Stack Navigator
- **Screens**:
  - `Login` → LoginScreen
  - `Signup` → SignupScreen
  - `EmailVerify` → EmailVerifyScreen
  - `VerifyEmail` → VerifyEmailScreen
  - `ForgotPassword` → ForgotPasswordScreen
  - `ResetPassword` → ResetPasswordScreen

#### MainNavigator.tsx (94 lines)
- **Type**: Bottom Tab Navigator
- **Tabs**:
  - `Home` → HomeScreen (🏠 icon)
  - `Dashboard` → DashboardScreen (📊 icon)
  - `Browse` → BrowseScreen (📋 icon)
  - `Library` → LibraryScreen (📚 icon)
  - `Profile` → ProfileScreen (👤 icon)
- **Features**:
  - Cart icon in header (except Dashboard)
  - Purple theme (#7c3aed)
  - Custom tab bar styling

#### types.ts
- **RootStackParamList**: Root navigator params
- **AuthStackParamList**: Auth navigator params
- **MainTabParamList**: Tab navigator params

---

### 🗄️ State Management (`src/store/`)

#### authStore.ts (362 lines)
**Zustand Store** with SecureStore persistence

**State**:
- `user`: User | null
- `token`: string | null
- `isAuthenticated`: boolean
- `loading`: boolean
- `initialized`: boolean
- `redirectPath`: RedirectPath | null
- `isLoggingOut`: boolean

**Methods**:
- `login(user, token)`: Store user and token
- `loginWithCredentials(email, password)`: API login
- `signup(name, email, password)`: User registration
- `logout()`: Clear auth state
- `fetchMe()`: Get current user
- `updateUser(updates)`: Update user profile
- `loginWithGoogle(googleUser)`: Google OAuth
- `loginWithApple(appleUser)`: Apple Sign In
- `setRedirectPath(path)`: Store redirect after login
- `clearRedirectPath()`: Clear redirect
- `init()`: Initialize auth state from SecureStore
- `setAuthToken(token)`: Set axios auth token
- `setIsLoggingOut(value)`: Logout state flag

**Storage**:
- Token: `expo-secure-store` (TOKEN_KEY)
- Pending email: `expo-secure-store` (PENDING_EMAIL_KEY)

#### cartStore.ts (59 lines)
**Zustand Store** with AsyncStorage persistence

**State**:
- `items`: CartItem[]

**Methods**:
- `addToCart(item)`: Add item (prevents duplicates)
- `removeFromCart(id)`: Remove item
- `clearCart()`: Empty cart
- `getTotalPrice()`: Calculate total

**Storage**: AsyncStorage (`cart-storage`)

#### libraryStore.ts
- User's purchased courses
- Learning progress tracking

#### purchasedCoursesStore.ts
- Purchased courses management
- Course access control

#### notificationStore.ts
- Notification preferences
- Push notification state

#### tipsStore.ts
- Practice tips management
- Tips display logic

---

### 🔧 Utilities (`src/utils/`)

#### api.ts (40 lines)
- **Base URL**: `http://192.168.100.40:3000`
- **Axios Instance**: Configured with JSON headers
- **Functions**:
  - `setAuthToken(token)`: Set Bearer token
  - `apiGet(path)`: GET request helper
  - `apiPost(path, body)`: POST request helper
  - `setToken(token)`: Legacy compatibility

#### auth.ts
- Authentication utilities
- Token management helpers

#### haptics.ts
- Haptic feedback utilities
- Uses `expo-haptics`

#### notifications.ts
- Push notification handling
- Notification permissions

---

### 📊 Types (`src/types/`)

#### index.ts (71 lines)
**Interfaces**:
- `User`: id, name, email, avatar?, bio?
- `Teacher`: id, name, bio, avatarUrl, rating, students
- `Track`: id, packId, title, type, duration, contentUrl, isPreview, description?
- `MusicPack`: id, title, description, teacher, price, thumbnailUrl, category, rating, studentsCount, tracksCount, duration, level, createdAt, isPurchased?
- `Category`: Guitar | Piano | Drums | Vocal Training | Music Production | DJ & Mixing | Songwriting
- `Order`: id, userId, packId, amount, status, createdAt
- `UserProgress`: packId, trackId, progress, lastWatched

#### react-native-razorpay.d.ts
- TypeScript definitions for Razorpay

---

### 📦 Data (`src/data/`)

#### mockData.ts
- Mock music packs
- Mock teachers
- Mock testimonials
- Sample data for development

#### practiceTips.ts
- Practice tips content
- Learning tips data

---

### ⚙️ Configuration

#### app.config.js
- **App Name**: "Gretex Music Room"
- **Package**: `com.rogerr6969.gretexmusicroom`
- **Scheme**: `gretexmusicroom`
- **Backend URL**: `http://192.168.100.40:3000`
- **EAS Project ID**: `1fbc2dfb-9dbd-4f70-9059-0115a156ff04`

#### App.tsx (65 lines)
- **NavigationContainer**: Root navigation wrapper
- **Deep Linking**: Configured for email verification and password reset
- **Auth Initialization**: Loads token from SecureStore on app start
- **Loading State**: Shows spinner during initialization

---

## 🎨 Design System

### Colors
- **Primary Purple**: `#5b21b6`, `#7c3aed`, `#a78bfa`
- **Text**: `#1f2937` (dark), `#fff` (light)
- **Background**: `#fff` (light), gradient (purple)
- **Accent**: `#d8b4fe` (light purple)
- **Success**: `#10b981` (green)

### Typography
- **Title**: 28px, bold
- **Subtitle**: 16px
- **Body**: 14-16px
- **Button**: 16px, bold

### Components
- **Buttons**: Rounded (12px), padding 18px
- **Inputs**: Rounded (12px), padding 16px, white background
- **Cards**: Rounded (16px), shadow
- **Tab Bar**: Height 60px, purple active color

---

## 🔐 Authentication Flow

1. **Login**:
   - Email/password → `POST /api/auth/login`
   - Google OAuth → `expo-auth-session`
   - Apple Sign In → `expo-apple-authentication`
   - Token stored in SecureStore
   - User state updated in authStore

2. **Signup**:
   - Registration → `POST /api/auth/register`
   - Email verification required
   - Token stored (but user not authenticated until verified)

3. **Email Verification**:
   - Deep link: `gretexmusicroom://email-verified`
   - Token-based: `gretexmusicroom://?token=...`
   - Updates user verification status

4. **Password Reset**:
   - Forgot password → `POST /api/auth/forgot-password`
   - Reset link → `gretexmusicroom://reset-password?token=...`
   - Reset password → `POST /api/auth/reset-password`

---

## 🔗 Deep Linking

### Schemes
- **App Scheme**: `gretexmusicroom://`

### Routes
- `gretexmusicroom://email-verified` → EmailVerifiedScreen
- `gretexmusicroom://reset-password?token=...` → ResetPasswordScreen
- `gretexmusicroom://?token=...` → EmailVerifyScreen

### Configuration
- Defined in `App.tsx` linking config
- Handled in `RootNavigator.tsx` with Linking API

---

## 📱 Screen Flow

### Public Flow
1. App Start → AuthNavigator (Login)
2. Login → MainNavigator (Home)
3. Browse → PackDetail → Checkout → PaymentSuccess

### Protected Flow
1. Library/Profile/Dashboard → Login (if not authenticated)
2. After Login → Redirect to original screen
3. Checkout/Chat → Login (if not authenticated)

### Authentication Flow
1. Login/Signup → Email Verification → MainNavigator
2. Forgot Password → Email → Reset Password → Login

---

## 🛠️ Key Features

### ✅ Implemented
- ✅ User authentication (Email, Google, Apple)
- ✅ Email verification with deep linking
- ✅ Password reset flow
- ✅ Shopping cart with persistence
- ✅ Music pack browsing
- ✅ Track player (audio/video)
- ✅ Payment integration (Razorpay)
- ✅ Profile management
- ✅ Protected routes
- ✅ Deep linking
- ✅ State persistence (Zustand + SecureStore/AsyncStorage)

### 🔄 Navigation Patterns
- **Stack Navigation**: Auth screens, detail screens
- **Tab Navigation**: Main app screens
- **Nested Navigation**: Root → Main/Auth → Tabs/Stacks
- **Deep Linking**: Email verification, password reset

---

## 📝 Notes

1. **Backend URL**: Currently hardcoded to `http://192.168.100.40:3000`
2. **Token Storage**: Uses `expo-secure-store` for secure token storage
3. **Cart Persistence**: Uses AsyncStorage for cart items
4. **Theme**: Purple gradient theme throughout
5. **Platform**: iOS and Android support
6. **TypeScript**: Fully typed with strict type checking

---

## 🚀 Running the App

```bash
# Install dependencies
npm install

# Start Expo
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

---

## 📄 File Count Summary

- **TSX Files**: 29 screens + 5 components = 34 files
- **TS Files**: 16 utility/type files
- **Total Frontend Files**: ~50+ files

---

*Last Updated: Based on current codebase structure*

