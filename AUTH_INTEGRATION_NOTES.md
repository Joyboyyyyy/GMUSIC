# Backend Auth Integration - Implementation Notes

## ✅ Changes Applied

All authentication has been updated to use real backend API calls with JWT tokens stored securely.

---

## 📦 Required Dependencies

**IMPORTANT:** Install these packages before running the app:

```bash
npm install axios expo-secure-store
```

Or with yarn:
```bash
yarn add axios expo-secure-store
```

---

## 📁 Files Modified

### 1. `src/utils/api.ts` (NEW)
- Created axios instance with base URL configuration
- `setAuthToken()` function to attach JWT to requests
- Request interceptor for automatic token attachment
- Base URL: `process.env.BACKEND_BASE_URL` or `http://localhost:3000`

### 2. `src/store/authStore.ts` (UPDATED)
- **Added:**
  - `init()` - Auto-login on app start (checks stored token)
  - `fetchMe()` - Fetch current user profile
  - `token` state - Stores JWT token
  - `loading` state - Loading indicator
  - SecureStore integration for token storage

- **Updated:**
  - `login()` - Now calls `POST /api/auth/login`
  - `signup()` - Now calls `POST /api/auth/register`
  - `logout()` - Clears SecureStore token
  - `updateUser()` - Now calls `PUT /api/auth/me`

- **Kept:**
  - `loginWithGoogle()` - Still mock (needs backend integration)
  - `loginWithApple()` - Still mock (needs backend integration)
  - `redirectPath` - Navigation redirect logic

### 3. `src/screens/auth/LoginScreen.tsx` (UPDATED)
- Uses `loading` from authStore instead of local state
- Error handling shows backend error messages
- Navigation logic preserved
- Social login buttons still work (but use mock auth)

### 4. `src/screens/auth/SignupScreen.tsx` (UPDATED)
- Uses `loading` from authStore instead of local state
- Error handling shows backend error messages
- Navigation to Main screen after successful signup

### 5. `App.tsx` (UPDATED)
- Added `useEffect` to call `authStore.init()` on app start
- Auto-login if valid token exists in SecureStore

---

## 🔧 Configuration

### Environment Variable

Set the backend URL in your `.env` file or Expo config:

```env
BACKEND_BASE_URL=http://localhost:3000
```

Or for device testing (use your computer's IP):
```env
BACKEND_BASE_URL=http://192.168.100.40:3000
```

**Note:** The existing `src/config/api.ts` file is still present but not used by the new auth system. The new `src/utils/api.ts` uses `process.env.BACKEND_BASE_URL`.

---

## 🔐 Security Features

1. **Secure Token Storage:**
   - JWT tokens stored in Expo SecureStore (encrypted storage)
   - Tokens persist across app restarts
   - Auto-cleared on logout or invalid token

2. **Automatic Token Attachment:**
   - All API requests automatically include `Authorization: Bearer <token>` header
   - Token set via `setAuthToken()` after login/signup

3. **Token Validation:**
   - On app start, stored token is validated by calling `/api/auth/me`
   - Invalid tokens are automatically cleared

---

## 🔄 Authentication Flow

### Login Flow:
```
1. User enters email/password
2. Calls POST /api/auth/login
3. Backend returns { success: true, data: { user, token } }
4. Token saved to SecureStore
5. Token attached to axios instance
6. User state updated
7. Navigate to Main screen
```

### Auto-Login Flow:
```
1. App starts → App.tsx calls authStore.init()
2. Check SecureStore for token
3. If token exists:
   - Set token in axios
   - Call GET /api/auth/me to validate
   - If valid → Set user state
   - If invalid → Clear token
4. If no token → User stays logged out
```

### Logout Flow:
```
1. User clicks logout
2. Clear token from SecureStore
3. Remove token from axios instance
4. Clear user state
5. Navigate to Auth screen
```

---

## 📡 Backend API Expectations

### Login Endpoint: `POST /api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "user@example.com",
      "avatar": "https://...",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Register Endpoint: `POST /api/auth/register`
**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same format as login

### Get Profile Endpoint: `GET /api/auth/me`
**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "user@example.com",
    "avatar": "https://...",
    "role": "student"
  }
}
```

---

## ⚠️ Important Notes

1. **Social Login (Google/Apple):**
   - Currently uses mock authentication
   - To integrate with backend:
     - Send OAuth token to backend
     - Backend should return JWT token
     - Update `loginWithGoogle()` and `loginWithApple()` methods

2. **Error Handling:**
   - All errors show user-friendly messages from backend
   - Network errors are caught and displayed
   - Invalid tokens are automatically cleared

3. **Loading States:**
   - `authStore.loading` indicates when auth operations are in progress
   - Used by LoginScreen and SignupScreen to show loading indicators

4. **Token Expiration:**
   - Backend should handle token expiration
   - If `/api/auth/me` returns 401, token is cleared automatically
   - User will need to login again

---

## 🧪 Testing

### Test Login:
1. Start backend server
2. Open app
3. Enter valid credentials
4. Should navigate to Main screen
5. Token should persist after app restart

### Test Auto-Login:
1. Login successfully
2. Close app completely
3. Reopen app
4. Should automatically log in (if token still valid)

### Test Logout:
1. Click logout
2. Token should be cleared
3. Should navigate to Auth screen
4. Reopening app should not auto-login

---

## 🔄 Migration from Mock Auth

The following changes were made:
- ✅ Removed mock `setTimeout` delays
- ✅ Removed mock user creation
- ✅ Added real API calls
- ✅ Added SecureStore for token persistence
- ✅ Added token validation on app start
- ✅ Preserved all navigation logic
- ✅ Preserved social login UI (but still uses mock)

---

## 📝 Next Steps

1. **Install Dependencies:**
   ```bash
   npm install axios expo-secure-store
   ```

2. **Configure Backend URL:**
   - Set `BACKEND_BASE_URL` in `.env` or Expo config
   - Or update `src/utils/api.ts` with your backend URL

3. **Test Authentication:**
   - Ensure backend is running
   - Test login/signup flows
   - Verify token persistence

4. **Optional - Social Login Integration:**
   - Update `loginWithGoogle()` to call backend
   - Update `loginWithApple()` to call backend
   - Backend should accept OAuth tokens and return JWT

---

## ✅ Status

- ✅ Real backend authentication integrated
- ✅ JWT token storage with SecureStore
- ✅ Auto-login on app start
- ✅ Error handling
- ✅ Loading states
- ✅ Navigation preserved
- ⚠️ Social login still uses mock (needs backend integration)

---

**Last Updated:** Based on current implementation  
**Status:** Ready for testing (after installing dependencies)

