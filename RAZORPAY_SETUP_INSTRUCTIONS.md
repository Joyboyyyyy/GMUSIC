# Razorpay Payment Integration - Setup Instructions

## ✅ What's Been Configured

1. ✅ Razorpay SDK installed (`react-native-razorpay` v2.3.1)
2. ✅ Android ProGuard rules added
3. ✅ iOS URL scheme configured
4. ✅ Payment test screen created
5. ✅ API configuration ready

---

## 📁 Files Created/Modified

### 1. Created: `src/screens/PaymentTestScreen.tsx`
   - Complete payment integration screen
   - Uses exact options structure as requested
   - Proper error handling and logging

### 2. Modified: `android/app/proguard-rules.pro`
   - Added Razorpay ProGuard keep rules

### 3. Modified: `app.json`
   - Added iOS URL schemes for Razorpay and UPI apps

### 4. API Config: `src/config/api.ts`
   - Already configured with your IP: `http://192.168.2.122:3000`
   - Easy to change for different environments

---

## 🚀 Running the App

### Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   ```
   Server should run on `http://192.168.2.122:3000`

2. **Update API URL** (if needed)
   
   Edit `src/config/api.ts`:
   ```typescript
   export const API_BASE_URL = __DEV__
     ? "http://192.168.2.122:3000"  // Your computer's IP for device testing
     : "https://your-production-api.com";
   ```

   **Important for Device Testing:**
   - For Android device → Use your computer's LAN IP (e.g., `192.168.2.122`)
   - For iOS simulator → `localhost` works fine
   - Find your IP: 
     - Windows: `ipconfig` → IPv4 Address
     - Mac/Linux: `ifconfig` → inet address

### Install Dependencies

```bash
cd "Gretex music Room"
npm install
```

### Run on Android Device

```bash
# Connect your Android device via USB
# Enable USB debugging

npx expo run:android

# OR if using Expo CLI
npm run android
```

**For Android Device:**
- Ensure device and computer are on the same Wi-Fi network
- Use computer's IP address in `src/config/api.ts`
- Example: `http://192.168.2.122:3000`

### Run on iOS Simulator

```bash
# First time setup
cd ios
pod install
cd ..

# Run
npx expo run:ios

# OR
npm run ios
```

**For iOS Simulator:**
- `localhost` works fine in API URL
- No network configuration needed

---

## 📱 Adding Payment Screen to Navigation

To test the payment screen, add it to your navigation. Here's an example:

**Option 1: Add to existing navigation stack**

Edit `src/navigation/types.ts` and add:
```typescript
export type RootStackParamList = {
  // ... existing routes
  PaymentTest: undefined;
};
```

Then add route in your navigator:
```typescript
import PaymentTestScreen from '../screens/PaymentTestScreen';

// In your navigator component
<Stack.Screen name="PaymentTest" component={PaymentTestScreen} />
```

**Option 2: Quick test - Add button to HomeScreen**

Add a temporary button to navigate to payment screen:
```typescript
import { useNavigation } from '@react-navigation/native';
import PaymentTestScreen from '../screens/PaymentTestScreen';

// Add navigation route or button
```

---

## 🧪 Testing Payment Flow

### Test Card Details (Razorpay Test Mode)

**Success Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Failure Card:**
- Card Number: `5104 0600 0000 0008`
- CVV: Any 3 digits
- Expiry: Any future date

**UPI Test:**
- UPI ID: `success@razorpay`

### Testing Steps

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run App on Device/Simulator**
   ```bash
   npx expo run:android  # or run:ios
   ```

3. **Navigate to Payment Test Screen**

4. **Click "Pay Now" Button**

5. **Complete Payment**
   - Enter test card details
   - Check console logs for detailed responses
   - Verify success/failure alerts

---

## 🔍 Code Overview

### Payment Screen: `src/screens/PaymentTestScreen.tsx`

**Key Features:**
- ✅ Calls backend: `POST /api/payments/razorpay/order`
- ✅ Uses exact JSON structure from your backend response
- ✅ Opens Razorpay checkout with correct options
- ✅ Logs all responses to console
- ✅ Handles success and failure cases
- ✅ Shows loading states

**Options Object (as requested):**
```typescript
const options = {
  key: data.key,
  amount: data.order.amount,
  currency: data.order.currency,
  name: "Test Payment",
  description: "React Native Razorpay Test Transaction",
  order_id: data.order.id,
  notes: data.order.notes,
  prefill: {
    name: "Test User",
    email: "test@example.com",
    contact: "9999999999",
  },
  theme: { color: "#3399cc" }
};
```

---

## 🐛 Troubleshooting

### Issue: "Network request failed" on Android Device

**Solution:**
1. Verify backend is running: `http://192.168.2.122:3000`
2. Check device and computer are on same Wi-Fi
3. Update `src/config/api.ts` with correct IP
4. Test backend URL in device browser: `http://192.168.2.122:3000/api/payments/razorpay/order`

### Issue: Razorpay checkout not opening

**Solution:**
1. Verify `react-native-razorpay` is installed: `npm list react-native-razorpay`
2. Rebuild native code: `npx expo prebuild --clean`
3. For Android: `npx expo run:android`
4. For iOS: `cd ios && pod install && cd .. && npx expo run:ios`

### Issue: Payment succeeds but shows error

**Solution:**
- Check console logs for detailed error messages
- Verify backend verification endpoint is working
- Check Razorpay dashboard for payment status

### Issue: ProGuard errors on Android release build

**Solution:**
- ProGuard rules are already added in `android/app/proguard-rules.pro`
- If errors persist, verify the rules file is included in `build.gradle`

---

## 📝 Important Notes

1. **Package Name:**
   - The correct package is `react-native-razorpay` (already installed)
   - Not `razorpay-react-native`

2. **JSON Fields:**
   - All fields are used exactly as provided in backend response
   - No modifications to JSON structure

3. **API URL:**
   - Easily replaceable in `src/config/api.ts`
   - Uses `getApiUrl()` helper function

4. **Test Mode:**
   - Currently using Razorpay test keys
   - Replace with live keys for production

---

## ✅ Verification Checklist

- [x] Razorpay SDK installed
- [x] Android ProGuard configured
- [x] iOS URL scheme configured
- [x] Payment screen created
- [x] API URL configurable
- [ ] Backend server running
- [ ] App runs on device/simulator
- [ ] Payment flow tested

---

## 🎯 Next Steps

1. **Add to Navigation:**
   - Integrate `PaymentTestScreen` into your app navigation

2. **Update User/Course IDs:**
   - Replace hardcoded IDs in `PaymentTestScreen.tsx` with actual values
   - Or fetch from your app state/navigation params

3. **Add Verification:**
   - Uncomment verification endpoint call in `startPayment()`
   - Handle verification response appropriately

4. **Production:**
   - Replace test Razorpay keys with live keys
   - Update production API URL
   - Test thoroughly before going live

---

**Setup Complete!** 🎉

Your Razorpay integration is ready to test. Follow the steps above to run and test the payment flow on your device.

