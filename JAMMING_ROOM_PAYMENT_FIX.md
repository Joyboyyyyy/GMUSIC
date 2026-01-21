# Jamming Room Payment Fix

## Issue
When trying to pay for a jamming room booking, the app crashed with:
```
Invalid `prisma.course.findUnique()` invocation:
Inconsistent column data: Error creating UUID, invalid character: 
expected an optional prefix of `urn:uuid:` followed by [0-9a-fA-F-], found `s` at 1
```

## Root Cause
The jamming room booking flow was creating a fake `packId` like `slot-${Date.now()}` (e.g., `slot-1737123456789`) and passing it to the Razorpay payment service. The backend was trying to look up this ID as a Course UUID in the database, which failed because:

1. The ID starts with 's' (not a valid UUID format)
2. No course exists with this ID in the database
3. Jamming room bookings are not courses - they're room reservations

## Solution
Modified the payment flow to detect and handle jamming room bookings separately:

### Backend Changes

#### 1. `backend/src/services/razorpay.service.js`
- Added `createJammingRoomOrder()` helper function
- Modified `createRazorpayOrder()` to accept `isJammingRoom` and `jammingRoomData` parameters
- Added detection logic: if `courseId` starts with `"slot-"` OR `isJammingRoom` is true, use jamming room flow
- Jamming room orders:
  - Don't look up courses in database
  - Use price from `jammingRoomData`
  - Create payment records with type metadata
  - Include booking details (date, time, building) in Razorpay order notes

#### 2. `backend/src/controllers/razorpay.controller.js`
- Updated `createOrder()` to accept and pass through `isJammingRoom` and `jammingRoomData`
- Logs now show jamming room status for debugging

### Frontend Changes

#### 3. `src/screens/CheckoutScreen.tsx`
- Detects jamming room bookings via `firstItem.type === 'jamming_room'` or `route.params?.isJammingRoom`
- Sends additional data to backend:
  ```typescript
  {
    userId,
    courseId,
    isJammingRoom: true,
    jammingRoomData: {
      price: 500,
      title: "Jamming Room - 10:00 AM",
      buildingId: "building-uuid",
      date: "2026-01-20",
      time: "10:00 AM",
      duration: 60
    }
  }
  ```

## How It Works Now

### Jamming Room Payment Flow
1. User selects building, date, and time slot
2. `SelectSlotScreen` creates a booking item with:
   - `type: 'jamming_room'`
   - `packId: slot-${timestamp}` (temporary ID)
   - Price, date, time, building info
3. Navigates to `CheckoutScreen` with `isJammingRoom: true`
4. CheckoutScreen detects jamming room and sends full booking data to backend
5. Backend detects `slot-` prefix or `isJammingRoom` flag
6. Uses `createJammingRoomOrder()` instead of course lookup
7. Creates Razorpay order with jamming room details
8. Payment proceeds normally
9. On success, booking is confirmed

### Course Payment Flow (Unchanged)
1. User selects a course pack
2. CheckoutScreen sends `userId` and `courseId` (valid UUID)
3. Backend looks up course in database
4. Creates Razorpay order with course price
5. Payment proceeds normally

## Files Modified
- ✅ `backend/src/services/razorpay.service.js` - Added jamming room support
- ✅ `backend/src/controllers/razorpay.controller.js` - Pass through jamming room data
- ✅ `src/screens/CheckoutScreen.tsx` - Send jamming room data to backend

## Testing
To test the fix:

1. **Start backend server**:
   ```powershell
   cd backend
   npm start
   ```

2. **Rebuild Android app** (to apply MainActivity fix):
   ```powershell
   npx expo run:android
   ```

3. **Test jamming room booking**:
   - Navigate to "Book Room" tab
   - Select a building
   - Choose a date and time slot
   - Click "Proceed to Payment"
   - Login if needed
   - Verify checkout screen shows correct price with GST
   - Click "Complete Payment"
   - Razorpay should open with correct amount
   - Complete payment (test mode)
   - Verify booking confirmation

4. **Test course payment** (should still work):
   - Browse courses
   - Add to cart
   - Checkout
   - Complete payment

## Expected Behavior
✅ Jamming room bookings create payment orders without database course lookup  
✅ Course purchases still work with database validation  
✅ Both flows use the same Razorpay integration  
✅ Payment records are created correctly for both types  
✅ No UUID validation errors  

## Prevention
- Jamming room bookings now have their own payment path
- Backend validates the type of booking before database lookups
- Frontend clearly marks jamming room items with `type: 'jamming_room'`
- Temporary IDs (slot-*) are only used in frontend, never sent to database

## Related Issues Fixed
- ✅ Android crash: `MainActivity.kt` - Fixed `super.onCreate(null)` → `super.onCreate(savedInstanceState)`
- ✅ TypeScript cache error: `BookingInvoiceScreen.tsx` - Stale cache (file doesn't exist)
- ✅ Jamming room payment: UUID validation error - This fix

## Status
🎉 **READY FOR TESTING** - All fixes applied, jamming room payment flow complete
