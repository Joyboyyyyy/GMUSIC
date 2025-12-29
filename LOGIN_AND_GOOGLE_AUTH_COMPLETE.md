# Login Page and Google Authentication - Complete Documentation

## 📋 **Overview**

The login page provides multiple authentication methods: email/password, Google OAuth, and Apple Sign-In (iOS only). It features a modern gradient design with smooth navigation and redirect handling.

---

## 🏗️ **Architecture**

```
LoginScreen.tsx
├── Email/Password Login
│   ├── Form validation
│   ├── API call to /api/auth/login
│   └── JWT token storage
├── Google OAuth
│   ├── expo-auth-session/providers/google
│   ├── Google API userinfo fetch
│   └── Local state management
├── Apple Sign-In (iOS only)
│   ├── expo-apple-authentication
│   └── Credential handling
└── Navigation
    ├── Redirect path handling
    ├── Signup navigation
    └── Forgot password navigation
```

---

## 📁 **File Structure**

### **Frontend Files**

1. **`src/screens/auth/LoginScreen.tsx`**
   - Main login component
   - All authentication methods

2. **`src/store/authStore.ts`**
   - `loginWithCredentials()` - Email/password login
   - `loginWithGoogle()` - Google OAuth state management
   - `loginWithApple()` - Apple Sign-In state management
   - `redirectPath` - Navigation redirect handling

3. **`src/utils/api.ts`**
   - Axios instance configuration
   - Token management

### **Backend Files**

1. **`backend/src/routes/auth.routes.js`**
   - Route: `POST /api/auth/login`

2. **`backend/src/controllers/auth.controller.js`**
   - `login()` - Email/password authentication

3. **`backend/src/services/auth.service.js`**
   - `login()` - Password verification and JWT generation

---

## 🎨 **Login Screen UI**

### **Visual Design**

**Background:**
- Linear gradient: `['#5b21b6', '#7c3aed', '#a78bfa']` (purple gradient)
- Full screen gradient background

**Header:**
- Music emoji: 🎵 (60px)
- Title: "Gretex Music Room" (28px, bold, white)
- Subtitle: "Learn music from the best" (16px, light purple)

**Form:**
- White input fields with rounded corners (12px)
- Dark text on white background
- Labels above inputs (14px, white, semibold)

**Buttons:**
- Primary button: Dark background (#1f2937), white text
- Social buttons: White background, colored icons
- Disabled state: 50% opacity

**Links:**
- Light purple text (#e9d5ff)
- Bold white text for "Sign Up"
- "Forgot Password?" link below signup

### **Layout Structure**

```tsx
<LinearGradient>
  <KeyboardAvoidingView>
    <ScrollView>
      <View style={styles.header}>
        {/* Logo, Title, Subtitle */}
      </View>
      
      <View style={styles.form}>
        {/* Email Input */}
        {/* Password Input */}
        {/* Login Button */}
        
        {/* Divider: "or continue with" */}
        
        {/* Social Login Buttons */}
        {/* Google Button */}
        {/* Apple Button (iOS only) */}
        
        {/* Sign Up Link */}
        {/* Forgot Password Link */}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
</LinearGradient>
```

---

## 🔐 **Email/Password Login**

### **Flow**

1. **User Input**
   - Email field (keyboard type: email-address)
   - Password field (secure text entry)
   - Both required for button to be enabled

2. **Validation**
   ```tsx
   if (!email.trim() || !password.trim()) {
     Alert.alert('Login Error', 'Please enter email and password.');
     return;
   }
   ```

3. **API Call**
   ```tsx
   const { user, token } = await loginWithCredentials(email, password);
   ```

4. **Backend Processing**
   - **Route:** `POST /api/auth/login`
   - **Request:**
     ```json
     {
       "email": "user@example.com",
       "password": "SecurePass123!"
     }
     ```
   - **Backend Service:**
     ```javascript
     // Find user by email
     const user = await prisma.user.findUnique({ where: { email } });
     
     // Verify password (Argon2id + pepper)
     const isValid = await argon2.verify(user.password, password + pepper);
     
     // Generate JWT token
     const token = generateToken({ userId: user.id, email, role: user.role });
     
     // Return user and token
     return { user, token };
     ```
   - **Response:**
     ```json
     {
       "success": true,
       "message": "Login successful",
       "data": {
         "user": {
           "id": "user-uuid",
           "email": "user@example.com",
           "name": "John Doe",
           "avatar": "...",
           "role": "user",
           "isVerified": true
         },
         "token": "jwt-token-here"
       }
     }
     ```

5. **State Management**
   ```tsx
   // Store token in SecureStore
   await login(user, token);
   
   // Sets:
   // - user in authStore
   // - token in SecureStore
   // - isAuthenticated = true
   // - axios default headers
   ```

6. **Navigation**
   - Checks for `redirectPath` (if user was redirected to login)
   - Navigates to requested screen or Main (Home tab)

### **Error Handling**

```tsx
catch (e: any) {
  const errorMessage = e.message || 'Login failed. Please check your credentials.';
  Alert.alert('Login Failed', errorMessage);
}
```

**Common Errors:**
- Invalid credentials → "Invalid email or password"
- User not found → "User not found"
- Network error → "Login failed. Please check your credentials."

---

## 🔵 **Google OAuth Authentication**

### **Setup Requirements**

**1. Google Cloud Console Setup:**
- Create OAuth 2.0 credentials
- Configure authorized redirect URIs
- Get Client ID

**2. Environment Variables:**
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**3. Dependencies:**
```json
{
  "expo-auth-session": "~7.0.10",
  "expo-web-browser": "~15.0.10"
}
```

### **OAuth Flow**

**1. Configuration**
```tsx
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
});
```

**2. User Initiates Login**
```tsx
const handleGoogleSignIn = () => {
  if (promptAsync) {
    promptAsync(); // Opens Google OAuth consent screen
  } else {
    Alert.alert('Error', 'Google Sign In is not available');
  }
};
```

**3. OAuth Response Handling**
```tsx
useEffect(() => {
  if (response?.type === 'success') {
    handleGoogleLogin(response.authentication?.accessToken);
  }
}, [response]);
```

**4. Fetch User Info**
```tsx
const handleGoogleLogin = async (accessToken?: string) => {
  if (!accessToken) return;

  try {
    // Fetch user info from Google API
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const googleUser = await userInfoResponse.json();
    
    // googleUser contains:
    // {
    //   id: "google-user-id",
    //   email: "user@gmail.com",
    //   name: "John Doe",
    //   picture: "https://lh3.googleusercontent.com/..."
    // }
    
    loginWithGoogle(googleUser);
    
    // Handle navigation (same as email login)
  } catch (error) {
    Alert.alert('Error', 'Google login failed');
  }
};
```

**5. State Management**
```tsx
loginWithGoogle: (googleUser: any) => {
  const user: User = {
    id: googleUser.id || Date.now().toString(),
    name: googleUser.name || googleUser.email?.split('@')[0] || 'Google User',
    email: googleUser.email || '',
    avatar: googleUser.picture || `https://i.pravatar.cc/150?u=${googleUser.email}`,
  };

  set({ user, isAuthenticated: true });
}
```

### **Google OAuth Response Types**

```tsx
response?.type === 'success'  // User authorized
response?.type === 'cancel'   // User cancelled
response?.type === 'error'    // OAuth error
response?.type === 'dismiss'  // User dismissed modal
```

### **Access Token Usage**

The access token is used to:
1. Fetch user profile from Google API
2. Extract: id, email, name, picture
3. Create local user object
4. Set authentication state

**Note:** The access token is NOT stored. Only user info is extracted and stored locally.

---

## 🍎 **Apple Sign-In (iOS Only)**

### **Setup Requirements**

**1. Apple Developer Account:**
- Enable Sign in with Apple capability
- Configure App ID

**2. Dependencies:**
```json
{
  "expo-apple-authentication": "~8.0.8"
}
```

### **Apple Sign-In Flow**

**1. Check Platform**
```tsx
{Platform.OS === 'ios' && (
  <TouchableOpacity
    style={styles.appleButton}
    onPress={handleAppleLogin}
  >
    <Ionicons name="logo-apple" size={20} color="#000" />
    <Text>Apple</Text>
  </TouchableOpacity>
)}
```

**2. Request Credentials**
```tsx
const handleAppleLogin = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // credential contains:
    // {
    //   user: "apple-user-id",
    //   email: "user@privaterelay.appleid.com" (if provided),
    //   fullName: { givenName: "John", familyName: "Doe" },
    //   identityToken: "...",
    //   authorizationCode: "..."
    // }

    loginWithApple(credential);
    
    // Handle navigation
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      return; // User cancelled, don't show error
    }
    Alert.alert('Error', 'Apple login failed');
  }
};
```

**3. State Management**
```tsx
loginWithApple: (appleUser: any) => {
  const user: User = {
    id: appleUser.user || Date.now().toString(),
    name: appleUser.fullName?.givenName 
      ? `${appleUser.fullName.givenName} ${appleUser.fullName.familyName || ''}`
      : 'Apple User',
    email: appleUser.email || `apple_${Date.now()}@privaterelay.com`,
    avatar: `https://i.pravatar.cc/150?u=${appleUser.user}`,
  };

  set({ user, isAuthenticated: true });
}
```

---

## 🧭 **Navigation & Redirect Handling**

### **Redirect Path System**

The app supports redirecting users to their originally requested screen after login.

**1. Setting Redirect Path**
```tsx
// When user tries to access protected screen
useAuthStore.getState().setRedirectPath({
  name: 'Checkout',
  params: { packId: '123' }
});

// Then navigate to Login
navigation.navigate('Auth', { screen: 'Login' });
```

**2. Handling Redirect After Login**
```tsx
const currentRedirectPath = redirectPath;

if (currentRedirectPath) {
  clearRedirectPath();
  
  const screenName = currentRedirectPath.name;
  const screenParams = currentRedirectPath.params || {};
  
  // Tab screens (Library, Profile, Dashboard)
  if (screenName === 'Library' || screenName === 'Profile' || screenName === 'Dashboard') {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'Main', 
            params: { screen: screenName } 
          }
        ],
      })
    );
  } else {
    // Stack screens (Checkout, Chat, etc.)
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'Main' },
          { name: screenName as never, params: screenParams as never }
        ],
      })
    );
  }
} else {
  // No redirect: navigate to Main (Home tab)
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  );
}
```

### **Navigation Targets**

**Tab Screens (in MainNavigator):**
- `Library` → `Main` with `{ screen: 'Library' }`
- `Profile` → `Main` with `{ screen: 'Profile' }`
- `Dashboard` → `Main` with `{ screen: 'Dashboard' }`

**Stack Screens:**
- `Checkout` → `Main` → `Checkout` with params
- `Chat` → `Main` → `Chat` with params
- `PackDetail` → `Main` → `PackDetail` with params

---

## 📊 **State Management**

### **Auth Store Methods**

**1. `loginWithCredentials(email, password)`**
```tsx
// Calls: POST /api/auth/login
// Returns: { user, token }
// Stores: token in SecureStore
// Sets: user, token, isAuthenticated = true
```

**2. `login(user, token)`**
```tsx
// Stores token in SecureStore
// Sets axios default headers
// Updates auth state
```

**3. `loginWithGoogle(googleUser)`**
```tsx
// Creates user object from Google data
// Sets: user, isAuthenticated = true
// Does NOT store token (local auth only)
```

**4. `loginWithApple(appleUser)`**
```tsx
// Creates user object from Apple data
// Sets: user, isAuthenticated = true
// Does NOT store token (local auth only)
```

### **State Structure**

```tsx
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  redirectPath: RedirectPath | null;
  
  // Methods
  login: (user: User, token: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ user: User; token: string }>;
  loginWithGoogle: (googleUser: any) => void;
  loginWithApple: (appleUser: any) => void;
  setRedirectPath: (path: string | RedirectPath) => void;
  clearRedirectPath: () => void;
}
```

---

## 🎯 **Form Validation**

### **Email/Password Requirements**

**Email:**
- Required field
- Keyboard type: `email-address`
- Auto-capitalize: `none`
- Trimmed before validation

**Password:**
- Required field
- Secure text entry (hidden)
- Minimum length: 6 characters (enforced by backend)

**Button State:**
```tsx
disabled={!email.trim() || !password.trim() || loading}
```

**Visual Feedback:**
```tsx
style={[
  styles.button,
  (!email.trim() || !password.trim()) && { opacity: 0.5 },
]}
```

---

## 🔄 **Loading States**

### **Loading Indicators**

**1. Login Button**
```tsx
{loading ? (
  <ActivityIndicator color="#fff" />
) : (
  <Text style={styles.buttonText}>Login</Text>
)}
```

**2. Social Buttons**
```tsx
disabled={!request || loading}  // Google
disabled={loading}              // Apple
```

**3. Loading State Management**
```tsx
// Set loading in authStore
set({ loading: true });

// After API call
set({ loading: false });
```

---

## 🎨 **Styling Details**

### **Color Palette**

- **Gradient:** `['#5b21b6', '#7c3aed', '#a78bfa']`
- **White:** `#fff` (inputs, buttons)
- **Dark:** `#1f2937` (primary button)
- **Light Purple:** `#e9d5ff` (links, subtitle)
- **Muted Gray:** `#9ca3af` (placeholders)
- **Google Red:** `#DB4437` (Google icon)
- **Divider:** `#c4b5fd`

### **Typography**

- **Title:** 28px, bold, white
- **Subtitle:** 16px, light purple
- **Labels:** 14px, semibold, white
- **Inputs:** 16px, dark gray
- **Button Text:** 16px, bold, white
- **Link Text:** 14px, light purple
- **Divider Text:** 14px, light purple

### **Spacing**

- **Container Padding:** 20px
- **Input Margin Bottom:** 20px
- **Button Padding:** 18px vertical
- **Divider Margin:** 24px vertical
- **Link Margin Top:** 24px

### **Border Radius**

- **Inputs:** 12px
- **Buttons:** 12px
- **Social Buttons:** 12px

---

## 🔗 **Links & Navigation**

### **Sign Up Link**

```tsx
<TouchableOpacity
  style={styles.linkButton}
  onPress={() => navigation.navigate('Signup' as never)}
>
  <Text style={styles.linkText}>
    Don't have an account?{' '}
    <Text style={styles.linkTextBold}>Sign Up</Text>
  </Text>
</TouchableOpacity>
```

### **Forgot Password Link**

```tsx
<TouchableOpacity
  style={{ marginTop: 16, alignItems: "center" }}
  onPress={() => navigation.navigate("ForgotPassword")}
>
  <Text style={{ color: "#d8b4fe", fontSize: 15, fontWeight: "600" }}>
    Forgot Password?
  </Text>
</TouchableOpacity>
```

---

## 🛡️ **Security Features**

### **Password Security**

- **Secure Text Entry:** Password field is hidden
- **No Password Storage:** Passwords are hashed (Argon2id) on backend
- **Token Storage:** JWT tokens stored in SecureStore (encrypted)

### **OAuth Security**

- **Access Token:** Used only to fetch user info, not stored
- **User Data:** Only extracted fields (id, email, name, picture) are stored
- **No Backend Validation:** Google/Apple login is client-side only (no backend verification)

### **Error Messages**

- **Generic Errors:** Don't reveal if email exists
- **Clear Messages:** User-friendly error descriptions
- **No Stack Traces:** Errors logged but not shown to user

---

## 📱 **Platform-Specific Features**

### **iOS**

- **Apple Sign-In:** Available only on iOS
- **Keyboard Avoiding:** Uses `padding` behavior
- **Safe Area:** Handled by parent navigator

### **Android**

- **Keyboard Avoiding:** Uses `height` behavior
- **No Apple Sign-In:** Button hidden on Android

### **Web**

- **OAuth Redirect:** Uses WebBrowser for OAuth flow
- **Deep Links:** Handled via expo-linking

---

## 🔍 **Error Handling**

### **Login Errors**

```tsx
catch (e: any) {
  const errorMessage = e.message || 'Login failed. Please check your credentials.';
  Alert.alert('Login Failed', errorMessage);
}
```

### **Google OAuth Errors**

```tsx
catch (error) {
  Alert.alert('Error', 'Google login failed');
}
```

### **Apple Sign-In Errors**

```tsx
catch (error: any) {
  if (error.code === 'ERR_CANCELED') {
    return; // User cancelled, don't show error
  }
  Alert.alert('Error', 'Apple login failed');
}
```

---

## 🧪 **Testing**

### **Manual Testing Checklist**

- [ ] Email/password login with valid credentials
- [ ] Email/password login with invalid credentials
- [ ] Empty email/password validation
- [ ] Google OAuth flow (opens consent screen)
- [ ] Google OAuth success (fetches user info)
- [ ] Google OAuth cancel (no error shown)
- [ ] Apple Sign-In on iOS (opens Apple auth)
- [ ] Apple Sign-In cancel (no error shown)
- [ ] Redirect path handling (after protected screen)
- [ ] Navigation to Signup
- [ ] Navigation to Forgot Password
- [ ] Loading states (button disabled, spinner)
- [ ] Keyboard avoiding behavior
- [ ] Scroll behavior on small screens

---

## 📝 **Code Examples**

### **Complete Login Handler**

```tsx
const handleLogin = async () => {
  try {
    // Validate input
    if (!email.trim() || !password.trim()) {
      Alert.alert('Login Error', 'Please enter email and password.');
      return;
    }

    // Call API
    const { user, token } = await loginWithCredentials(email, password);
    
    // Store token and set state
    await login(user, token);
    
    // Handle redirect
    const currentRedirectPath = redirectPath;
    if (currentRedirectPath) {
      clearRedirectPath();
      // Navigate to requested screen
    } else {
      // Navigate to Main
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }
  } catch (e: any) {
    Alert.alert('Login Failed', e.message || 'Login failed. Please check your credentials.');
  }
};
```

### **Complete Google OAuth Handler**

```tsx
const handleGoogleLogin = async (accessToken?: string) => {
  if (!accessToken) return;

  try {
    // Fetch user info
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const googleUser = await userInfoResponse.json();
    
    // Set auth state
    loginWithGoogle(googleUser);
    
    // Handle navigation (same as email login)
    // ...
  } catch (error) {
    Alert.alert('Error', 'Google login failed');
  }
};
```

---

## 🔧 **Configuration**

### **Environment Variables**

```env
# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### **Google Cloud Console Setup**

1. **Create OAuth 2.0 Client ID:**
   - Go to Google Cloud Console
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application (for Expo)

2. **Authorized Redirect URIs:**
   ```
   https://auth.expo.io/@your-username/your-app
   exp://127.0.0.1:19000/--/oauth
   ```

3. **Get Client ID:**
   - Copy the Client ID
   - Add to `.env` as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

---

## 📚 **API Endpoints**

### **Login Endpoint**

**POST `/api/auth/login`**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "...",
      "role": "user",
      "isVerified": true
    },
    "token": "jwt-token-here"
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

---

## 🎯 **Summary**

### **Authentication Methods**

1. ✅ **Email/Password** - Full backend integration, JWT tokens
2. ✅ **Google OAuth** - Client-side only, no backend verification
3. ✅ **Apple Sign-In** - iOS only, client-side only

### **Key Features**

- ✅ Modern gradient UI design
- ✅ Multiple authentication methods
- ✅ Redirect path handling
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Platform-specific features
- ✅ Secure token storage

### **Files Involved**

**Frontend:**
- `src/screens/auth/LoginScreen.tsx` - Main component
- `src/store/authStore.ts` - State management
- `src/utils/api.ts` - API configuration

**Backend:**
- `backend/src/routes/auth.routes.js` - Routes
- `backend/src/controllers/auth.controller.js` - Controllers
- `backend/src/services/auth.service.js` - Business logic

---

**This completes the login page and Google authentication documentation!** 🎉

