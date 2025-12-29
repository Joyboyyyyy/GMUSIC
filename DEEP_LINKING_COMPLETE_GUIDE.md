# Deep Linking Complete Guide - Email, Login, Signup & Password Reset

## 📱 Deep Link Configuration

### App Scheme
- **Scheme Name**: `gretexmusicroom`
- **Format**: `gretexmusicroom://<route>?param=value`
- **Configuration**: `app.json` and `App.tsx`

### app.json Configuration
```json
{
  "expo": {
    "scheme": "gretexmusicroom",
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["gretexmusicroom"]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "gretexmusicroom"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### App.tsx Linking Configuration
```typescript
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'gretexmusicroom://',
    ...(Platform.OS === 'web' ? ['https://', 'http://'] : []),
  ],
  config: {
    screens: {
      EmailVerify: {
        path: 'verify-email',
        parse: {
          token: (token: string) => token,
        },
      },
      EmailVerified: 'email-verified',
      Auth: {
        screens: {
          ResetPassword: {
            path: 'reset-password',
            parse: {
              token: (token: string) => token,
            },
          },
        },
      },
    },
  },
};
```

---

## 🔗 Deep Link Routes & Formats

### 1. Email Verification

#### Deep Link Format
```
gretexmusicroom://verify-email?token=<VERIFICATION_TOKEN>
```

#### Flow
1. **User signs up** → Backend sends verification email
2. **Email contains deep link** → `gretexmusicroom://verify-email?token=xxx`
3. **User clicks link** → Expo app opens automatically
4. **App navigates** → `EmailVerify` screen with token
5. **Screen calls API** → `POST /api/auth/verify-email` with token
6. **On success** → Redirects to Login screen

#### Backend Email Service
**File**: `backend/src/utils/email.js`

```javascript
// Constructs deep link for verification email
let appScheme = getEnvVar('APP_SCHEME', 'gretexmusicroom').trim();
appScheme = appScheme.split('://')[0].replace(/\/+$/, '').trim();
const verifyLink = `${appScheme}://verify-email?token=${encodeURIComponent(token)}`;
```

**Email HTML**:
```html
<a href="gretexmusicroom://verify-email?token=xxx">Verify Email</a>
```

#### Frontend Handler
**File**: `src/navigation/RootNavigator.tsx`

```typescript
// Handle verify-email deep link
if (url.includes('verify-email') && parsed?.queryParams?.token) {
  const token = parsed.queryParams.token as string;
  navigation.navigate('EmailVerify', { token });
}
```

**Screen**: `src/screens/EmailVerifyScreen.tsx`
- Receives token from route params
- Calls `POST /api/auth/verify-email` with token
- Redirects to Login on success
- Shows error alert on failure

---

### 2. Password Reset / Forgot Password

#### Deep Link Format
```
gretexmusicroom://reset-password?token=<RESET_TOKEN>
```

#### Flow
1. **User requests password reset** → `POST /api/auth/forgot-password`
2. **Backend sends reset email** → Contains deep link with token
3. **User clicks link** → Expo app opens automatically
4. **App navigates** → `ResetPassword` screen (Auth stack) with token
5. **User enters new password** → Submits form
6. **API call** → `POST /api/auth/reset-password` with token and new password
7. **On success** → Redirects to Login screen

#### Backend Email Service
**File**: `backend/src/utils/email.js` (if using deep links)

Currently password reset uses HTTP links, but can be updated to use deep links like:
```javascript
const resetLink = `${appScheme}://reset-password?token=${encodeURIComponent(token)}`;
```

#### Frontend Handler
**File**: `src/navigation/RootNavigator.tsx`

```typescript
// Handle reset-password deep link
if (url.includes('reset-password') && parsed?.queryParams?.token) {
  const token = parsed.queryParams.token as string;
  navigation.navigate('Auth', { 
    screen: 'ResetPassword',
    params: { token }
  });
}
```

**Screen**: `src/screens/auth/ResetPasswordScreen.tsx`
- Receives token from route params
- User enters new password
- Calls `POST /api/auth/reset-password`
- Redirects to Login on success

---

### 3. Signup Flow

#### Deep Link Usage
Signup **does NOT use deep links** - it's a standard in-app flow:

1. **User opens app** → Navigates to Signup screen
2. **Fills form** → Name, email, password
3. **Submits** → `POST /api/auth/register`
4. **Backend creates user** → Sends verification email
5. **Email contains deep link** → `gretexmusicroom://verify-email?token=xxx`
6. **User clicks email link** → Follows email verification flow above

#### Navigation
```typescript
// After signup
navigation.navigate('VerifyEmail', { email: result.email });
// User then clicks email link → EmailVerify screen with token
```

---

### 4. Login Flow

#### Deep Link Usage
Login **does NOT use deep links** - it's a standard in-app flow:

1. **User opens app** → Navigates to Login screen
2. **Enters credentials** → Email and password
3. **Submits** → `POST /api/auth/login`
4. **On success** → User authenticated, navigates to Main screens

#### Redirect After Email Verification
After email verification succeeds:
```typescript
// EmailVerifyScreen.tsx
navigation.navigate('Auth' as never, { screen: 'Login' } as never);
```

---

## 🔄 Complete Flow Diagrams

### Email Verification Flow
```
Signup → Backend → Email Sent
  ↓
Email: gretexmusicroom://verify-email?token=xxx
  ↓
User clicks link → App opens
  ↓
RootNavigator handles deep link
  ↓
Navigate to EmailVerify screen with token
  ↓
POST /api/auth/verify-email { token }
  ↓
Success → Navigate to Login screen
```

### Password Reset Flow
```
Forgot Password → Backend → Email Sent
  ↓
Email: gretexmusicroom://reset-password?token=xxx
  ↓
User clicks link → App opens
  ↓
RootNavigator handles deep link
  ↓
Navigate to Auth → ResetPassword screen with token
  ↓
User enters new password
  ↓
POST /api/auth/reset-password { token, password }
  ↓
Success → Navigate to Login screen
```

---

## 📧 Backend Email Link Generation

### Email Verification Link
**File**: `backend/src/utils/email.js`

```javascript
export async function sendVerificationEmail(to, token, name) {
  // Clean scheme to avoid double ://
  let appScheme = getEnvVar('APP_SCHEME', 'gretexmusicroom').trim();
  appScheme = appScheme.split('://')[0].replace(/\/+$/, '').trim();
  
  // Generate deep link
  const verifyLink = `${appScheme}://verify-email?token=${encodeURIComponent(token)}`;
  
  // Email HTML contains clickable link
  const html = `
    <a href="${verifyLink}">Verify Email</a>
  `;
}
```

### Password Reset Link (HTTP currently, can be updated to deep link)
**File**: `backend/src/utils/email.js`

Currently uses HTTP, but can be changed to:
```javascript
export async function sendPasswordResetEmail(email, token) {
  let appScheme = getEnvVar('APP_SCHEME', 'gretexmusicroom').trim();
  appScheme = appScheme.split('://')[0].replace(/\/+$/, '').trim();
  
  const resetLink = `${appScheme}://reset-password?token=${encodeURIComponent(token)}`;
  
  // Email HTML
  const html = `
    <a href="${resetLink}">Reset Password</a>
  `;
}
```

---

## 🎯 Frontend Deep Link Handling

### RootNavigator Deep Link Handler
**File**: `src/navigation/RootNavigator.tsx`

```typescript
const handleDeepLink = (url: string) => {
  const parsed = Linking.parse(url);
  
  // Email verification
  if (url.includes('verify-email') && parsed?.queryParams?.token) {
    const token = parsed.queryParams.token as string;
    navigation.navigate('EmailVerify', { token });
    return;
  }
  
  // Password reset
  if (url.includes('reset-password') && parsed?.queryParams?.token) {
    const token = parsed.queryParams.token as string;
    navigation.navigate('Auth', { 
      screen: 'ResetPassword',
      params: { token }
    });
    return;
  }
  
  // Email verified (success/error)
  if (url.includes('email-verified')) {
    const error = parsed?.queryParams?.error as string | undefined;
    navigation.navigate('EmailVerified', error ? { error } : undefined);
    return;
  }
};

// Listen for deep links
useEffect(() => {
  const sub = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });
  
  // Handle initial URL (when app opens from deep link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink(url);
    }
  });
  
  return () => sub.remove();
}, [navigation]);
```

---

## 🛣️ Navigation Routes

### Root Stack Routes
```typescript
type RootStackParamList = {
  EmailVerify: { token?: string };      // Email verification
  EmailVerified: { error?: string };    // Verification result
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // ... other routes
};
```

### Auth Stack Routes
```typescript
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ResetPassword: { token: string };     // Password reset
  VerifyEmail: { email: string };       // After signup (waiting for email)
  ForgotPassword: undefined;
};
```

---

## 🔐 Backend API Endpoints

### Email Verification
```
POST /api/auth/verify-email
Body: { token: string }
Response: { success: true, message: "Email verified successfully" }
```

### Password Reset
```
POST /api/auth/reset-password
Body: { token: string, password: string }
Response: { success: true, message: "Password reset successfully" }
```

### Forgot Password (Request Reset)
```
POST /api/auth/forgot-password
Body: { email: string }
Response: { success: true, message: "Password reset email sent" }
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
# App scheme for deep links (without ://)
APP_SCHEME=gretexmusicroom

# Or if you prefer (will be cleaned automatically):
# APP_SCHEME=gretexmusicroom://
```

### Frontend (app.json)
```json
{
  "expo": {
    "scheme": "gretexmusicroom"
  }
}
```

---

## 📋 Deep Link Summary Table

| Feature | Deep Link Format | Screen | API Endpoint |
|---------|-----------------|--------|--------------|
| **Email Verification** | `gretexmusicroom://verify-email?token=xxx` | `EmailVerify` | `POST /api/auth/verify-email` |
| **Password Reset** | `gretexmusicroom://reset-password?token=xxx` | `Auth → ResetPassword` | `POST /api/auth/reset-password` |
| **Email Verified** | `gretexmusicroom://email-verified?error=xxx` | `EmailVerified` | - |
| **Signup** | ❌ No deep link (in-app flow) | `Auth → Signup` | `POST /api/auth/register` |
| **Login** | ❌ No deep link (in-app flow) | `Auth → Login` | `POST /api/auth/login` |

---

## ✅ Testing Deep Links

### Test Email Verification
```bash
# Open deep link directly (iOS Simulator)
xcrun simctl openurl booted "gretexmusicroom://verify-email?token=test-token-123"

# Open deep link directly (Android Emulator)
adb shell am start -W -a android.intent.action.VIEW -d "gretexmusicroom://verify-email?token=test-token-123"
```

### Test Password Reset
```bash
# iOS
xcrun simctl openurl booted "gretexmusicroom://reset-password?token=test-token-123"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "gretexmusicroom://reset-password?token=test-token-123"
```

---

## 🔍 Key Files Reference

### Backend
- `backend/src/utils/email.js` - Email link generation
- `backend/src/controllers/redirect.controller.js` - HTTP redirect endpoints
- `backend/src/controllers/verify.controller.js` - Email verification API
- `backend/src/routes/auth.routes.js` - Auth routes

### Frontend
- `app.json` - Expo scheme configuration
- `App.tsx` - NavigationContainer linking config
- `src/navigation/RootNavigator.tsx` - Deep link handler
- `src/navigation/types.ts` - Route type definitions
- `src/screens/EmailVerifyScreen.tsx` - Email verification screen
- `src/screens/auth/ResetPasswordScreen.tsx` - Password reset screen
- `src/screens/auth/LoginScreen.tsx` - Login screen
- `src/screens/auth/SignupScreen.tsx` - Signup screen

---

## 🚀 Current Status

✅ **Email Verification** - Fully implemented with deep links
✅ **Password Reset** - Deep link handler ready (email can be updated)
✅ **Signup** - Standard in-app flow, triggers email verification
✅ **Login** - Standard in-app flow
✅ **Navigation** - All deep links properly configured
✅ **URL Format** - Fixed to prevent double `://`

---

**Last Updated**: 2024
**Status**: ✅ Production Ready

