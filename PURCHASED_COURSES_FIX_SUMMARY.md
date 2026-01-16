# Purchased Courses Display Fix - Complete Summary

## Problem
User purchased 2 courses but they were not showing as "Owned" on the Dashboard. The PackCard component was not displaying the green "Owned" badge for purchased courses.

## Root Cause Analysis

### Original Issue
When a user purchases a course via Razorpay:
1. A `Payment` record is created with status `PENDING`
2. After successful payment, status is updated to `COMPLETED`
3. The `courseId` is stored in Razorpay order notes
4. **BUT** no `SlotEnrollment` record is created automatically

The original `getUserCourses()` method ONLY checked `SlotEnrollment` records, so purchased courses without slot bookings were invisible.

## Solution Implemented

### Backend Changes

#### 1. Updated `backend/src/services/course.service.js`
- Modified `getUserCourses()` to use **TWO methods** to find purchased courses:
  - **Method 1**: Check `SlotEnrollment` records (existing logic)
  - **Method 2**: Check completed `Payment` records and fetch courseId from Razorpay order notes

```javascript
async getUserCourses(userId) {
  const coursesMap = new Map();
  
  // Method 1: SlotEnrollments
  const slotEnrollments = await db.slotEnrollment.findMany({
    where: { studentId: userId, status: 'CONFIRMED' },
    include: { slot: { include: { course: {...} } } }
  });
  
  // Method 2: Completed Payments
  const completedPayments = await db.payment.findMany({
    where: { studentId: userId, status: 'COMPLETED' }
  });
  
  for (const payment of completedPayments) {
    const order = await razorpay.orders.fetch(payment.gatewayOrderId);
    const courseId = order.notes?.courseId;
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (course) coursesMap.set(course.id, course);
  }
  
  return Array.from(coursesMap.values());
}
```

#### 2. Fixed Route Order in `backend/src/routes/course.routes.js`
- Moved `/user/my-courses` route **BEFORE** `/:courseId` route
- This prevents Express from treating "user" as a courseId parameter

```javascript
// CORRECT ORDER:
router.get('/user/my-courses', authenticate, getUserCourses);  // Specific route first
router.get('/:courseId', getCourseById);                       // Generic route after
```

### Frontend Changes

#### 3. Updated `src/components/PackCard.tsx`
- Added `usePurchasedCoursesStore` hook
- Check if course is purchased using `hasPurchased(pack.id)`
- Show green "Owned" badge instead of price badge for purchased courses
- Hide cart button for owned courses

```tsx
const { hasPurchased } = usePurchasedCoursesStore();
const isOwned = hasPurchased(pack.id);

{isOwned ? (
  <View style={styles.ownedBadge}>
    <Ionicons name="checkmark-circle" size={12} color="#fff" />
    <Text style={styles.ownedText}>Owned</Text>
  </View>
) : (
  <View style={styles.priceBadge}>
    <Text style={styles.priceText}>₹{pack.price}</Text>
  </View>
)}
```

#### 4. Enhanced `src/store/purchasedCoursesStore.ts`
- Added comprehensive logging to `syncFromBackend()`
- Logs API request/response details
- Logs course extraction and store updates
- Helps debug sync issues

### Debugging Enhancements

#### 5. Created `backend/debug-purchased-courses.js`
- Standalone script to check database state
- Verifies user exists
- Lists all SlotEnrollments
- Lists all Payments with Razorpay order details
- Shows courseId from order notes
- Verifies courses exist in database

Usage:
```bash
cd backend
node debug-purchased-courses.js <userId>
```

#### 6. Added Comprehensive Logging
- Backend: Detailed logs in `getUserCourses()` showing each step
- Frontend: Logs in `syncFromBackend()` and `PackCard` component
- Helps trace the complete flow from database → API → store → UI

## Data Flow

```
Purchase Flow:
1. User clicks "Buy" → CheckoutScreen
2. Razorpay payment → courseId stored in order.notes
3. Payment verified → Payment.status = 'COMPLETED'
4. PaymentSuccessScreen → addPurchasedCourse(courseId) to local store

Display Flow:
1. DashboardScreen mounts → syncFromBackend()
2. API call → GET /api/courses/user/my-courses
3. Backend → getUserCourses(userId)
4. Method 1: Check SlotEnrollments
5. Method 2: Check Payments → Fetch Razorpay orders → Extract courseId
6. Return courses → Frontend store updated
7. PackCard checks hasPurchased(courseId) → Show "Owned" badge
```

## Testing Steps

### 1. Restart Backend Server
```bash
cd backend
npm start
```

### 2. Check Backend Logs
Look for:
```
[CourseService] 🔍 DEBUG: Getting purchased courses for user: <id>
[CourseService] ✅ Found X completed payments
[CourseService] 📡 Fetching Razorpay order details...
[CourseService] 🎯 Extracted courseId: <id>
[CourseService] ✅ Course found: <name>
[CourseService] 🎉 FINAL RESULT: X purchased courses
```

### 3. Clear App Cache (if needed)
```powershell
.\clear-all-caches.ps1
npx expo start --clear
```

### 4. Test in App
1. Open app
2. Navigate to Dashboard
3. Pull down to refresh
4. Check console logs for `[PurchasedCoursesStore]` messages
5. Verify courses show green "Owned" badge

### 5. Run Debug Script
```bash
cd backend
node debug-purchased-courses.js <your-user-id>
```

## Expected Behavior

### Before Fix
- ❌ Purchased courses show price badge
- ❌ Cart button visible on purchased courses
- ❌ "My Purchased Courses" section empty
- ❌ `/api/courses/user/my-courses` returns empty array

### After Fix
- ✅ Purchased courses show green "Owned" badge
- ✅ No cart button on purchased courses
- ✅ "My Purchased Courses" section populated
- ✅ `/api/courses/user/my-courses` returns purchased courses
- ✅ Dashboard shows correct count

## Files Modified

### Backend
1. `backend/src/services/course.service.js` - Added Method 2 for payments
2. `backend/src/routes/course.routes.js` - Fixed route order
3. `backend/debug-purchased-courses.js` - New debug script

### Frontend
4. `src/components/PackCard.tsx` - Added owned badge logic
5. `src/store/purchasedCoursesStore.ts` - Enhanced logging

## Important Notes

1. **No Database Migration Required** - Uses existing Payment table
2. **Razorpay Dependency** - Requires Razorpay API to be configured
3. **Order Notes Critical** - courseId MUST be in Razorpay order.notes
4. **Backward Compatible** - Still works with SlotEnrollments
5. **Dev Client Caching** - May need cache clear to see changes

## Potential Issues

### If courses still don't show:

1. **Check Razorpay Configuration**
   - Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`
   - Test with debug script

2. **Check Order Notes**
   - Run debug script to see if courseId is in order.notes
   - If missing, check `razorpay.service.js` createRazorpayOrder()

3. **Check Payment Status**
   - Verify Payment.status = 'COMPLETED' in database
   - Check Payment.gatewayOrderId is not null

4. **Check Course Exists**
   - Verify course with that ID exists in database
   - Check course.isActive = true

5. **Backend Not Restarted**
   - Code changes require server restart
   - Stop and start backend server

6. **Frontend Cache**
   - Run `clear-all-caches.ps1`
   - Restart Expo with `--clear` flag

## Success Criteria

✅ Backend returns purchased courses from `/api/courses/user/my-courses`
✅ Frontend store syncs courses on Dashboard mount
✅ PackCard shows "Owned" badge for purchased courses
✅ "My Purchased Courses" section populated on Dashboard
✅ Debug script shows correct data in database
✅ Backend logs show successful course fetching
✅ Frontend logs show successful sync

## Next Steps

1. Restart backend server
2. Test with your account
3. Share debug script output if issues persist
4. Check backend and frontend logs
5. Verify Razorpay order notes contain courseId

---

**Status**: ✅ Code Fixed - Ready for Testing
**Date**: 2026-01-14
**Issue**: Purchased courses not showing as owned
**Solution**: Dual-method course fetching (SlotEnrollments + Payments)
