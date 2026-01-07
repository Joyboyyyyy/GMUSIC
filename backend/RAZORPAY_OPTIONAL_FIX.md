# Razorpay Optional Configuration Fix

## Problem
The backend was crashing on startup with:
```
Error: `key_id` or `oauthToken` is mandatory
```
This happened because Razorpay was being initialized even when environment variables `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` were missing.

## Solution
Made Razorpay initialization conditional - the server now starts successfully without Razorpay keys, and Razorpay is only initialized when both environment variables are present.

## Changes Made

### 1. `src/config/razorpay.js`
- **Before**: Always initialized Razorpay, causing crash if keys missing
- **After**: Conditionally initializes Razorpay only when both keys exist
- Exports `null` when Razorpay is disabled
- Logs clear warning message when disabled

```javascript
// Check if both Razorpay environment variables are present
const hasRazorpayKeys = 
  process.env.RAZORPAY_KEY_ID && 
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_ID.trim() !== '' &&
  process.env.RAZORPAY_KEY_SECRET.trim() !== '';

// Initialize Razorpay only when both keys are present
export const razorpay = hasRazorpayKeys
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

// Log warning if Razorpay is disabled
if (!hasRazorpayKeys) {
  console.warn('⚠️  Razorpay disabled: missing environment variables');
  console.warn('   To enable Razorpay, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  console.warn('   Payment endpoints will return errors until Razorpay is configured.');
}
```

### 2. `src/services/razorpay.service.js`
Updated all service functions to check for `null` razorpay instance:

- **`createRazorpayOrder`**: Checks `if (!razorpay)` before use
- **`verifyRazorpayPayment`**: Checks for razorpay and key_secret before use
- **`handleRazorpayWebhook`**: Checks for razorpay and webhook_secret before use

All functions throw clear error messages when Razorpay is not configured.

### 3. Controllers
No changes needed - controllers already handle errors gracefully by catching exceptions and returning appropriate HTTP responses.

## Behavior

### When Razorpay Keys Are Missing:
- ✅ Server starts successfully
- ✅ `/health` endpoint works
- ✅ All other endpoints work normally
- ⚠️ Warning logged: "Razorpay disabled: missing environment variables"
- ❌ Razorpay payment endpoints return error: "Razorpay is not configured..."

### When Razorpay Keys Are Present:
- ✅ Server starts successfully
- ✅ Razorpay initialized normally
- ✅ All payment endpoints work as expected
- ✅ No warnings logged

## Testing

### Test 1: Server Starts Without Keys
```bash
# Remove or comment out Razorpay keys in .env
# Start server
cd backend
npm start

# Expected: Server starts, warning logged, /health works
```

### Test 2: Razorpay Endpoints Without Keys
```bash
curl -X POST http://localhost:3000/api/payments/razorpay/order \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "courseId": "test"}'

# Expected: 400 error with message "Razorpay is not configured..."
```

### Test 3: Server Starts With Keys
```bash
# Add Razorpay keys to .env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# Start server
npm start

# Expected: Server starts, no warnings, Razorpay initialized
```

## Environment Variables

### Required for Razorpay (Optional):
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret  # Optional, for webhooks
```

### Development:
You can run the server without these variables. Payment endpoints will return errors, but the server will function normally for all other features.

## Files Modified
1. `src/config/razorpay.js` - Conditional initialization
2. `src/services/razorpay.service.js` - Null checks added

## Files That Handle Null Safely
- `src/controllers/razorpay.controller.js` - Already catches errors
- `src/routes/razorpay.routes.js` - Routes still work, return errors when needed

## Result
✅ Backend starts without crashing when Razorpay keys are missing
✅ `/health` endpoint works
✅ Payments still work when env vars are provided
✅ Clear error messages when Razorpay is disabled
✅ No breaking changes to existing functionality

