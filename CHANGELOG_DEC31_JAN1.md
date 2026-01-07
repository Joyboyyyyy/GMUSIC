# Gretex Music Room - Development Changelog
## December 31, 2025 - January 1, 2026

---

## TASK 1: Fix Prisma Schema/Database Sync Issues
**Status:** ✅ Completed

**Problem:** Database column mismatches causing errors

**Changes:**
- `isVerified` → `emailVerified`
- `verificationExpires` → `verificationExpiry`
- `enrollment` → `slotEnrollment`
- Removed `address` column from auth.service.js

**Files Modified:**
- `backend/prisma/schema.prisma`
- `backend/src/services/auth.service.js`

---

## TASK 2: Fix SignupScreen.tsx BOM Encoding Issue
**Status:** ✅ Completed

**Problem:** BOM character causing Metro bundling failure

**Solution:** Rewrote file using PowerShell UTF8 encoding without BOM

**Files Modified:**
- `src/screens/auth/SignupScreen.tsx`

---

## TASK 3: Building-based Course Access System
**Status:** ✅ Completed

**Features Added:**
1. **BuildingCoursesScreen** - Dedicated screen showing all courses for a specific building
2. **AllBuildingsScreen** - List view of all public buildings
3. **Browse Buildings Section** on HomeScreen - Horizontal scroll of building cards
4. **Building Navigation** - Tap building card → View building's courses

**Backend Routes Added to app.js:**
- `/api/buildings` → buildingRoutes
- `/api/slots` → slotRoutes
- `/api/bookings` → bookingRoutes
- `/api/notifications` → notificationRoutes
- `/api/admin` → adminRoutes

**API Paths Fixed:**
- All paths in `api.service.ts` now include `/api` prefix

**Files Created:**
- `src/screens/BuildingCoursesScreen.tsx`
- `src/screens/AllBuildingsScreen.tsx`

**Files Modified:**
- `src/screens/HomeScreen.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/types.ts`
- `backend/src/app.js`
- `src/services/api.service.ts`

---

## TASK 4: Update Avatar/Profile Picture Path
**Status:** ✅ Completed

**Change:** Profile pictures now stored in `profile-pictures/avatars/` folder

**Functions Updated:**
- `uploadAvatar`
- `getAvatarUrl`
- `deleteAvatar`

**Files Modified:**
- `src/utils/avatar.ts`

---

## TASK 5: Fix Android Build Issues
**Status:** ✅ Completed

**Problems Fixed:**
1. Empty `network_security_config.xml` causing XML parse error
2. Gradle cache issues

**Solution:**
- Fixed XML file with proper network security config
- Cleaned gradle cache and build folders
- Successfully ran `npx expo run:android`

**Files Modified:**
- `android/app/src/main/res/xml/network_security_config.xml`

---

## TASK 6: HomeScreen Layout Reorder
**Status:** ✅ Completed

**New Layout Order:**
1. Header (Hello, Music Lover!)
2. Search bar
3. "Feel The Music" banner
4. Browse Buildings section
5. Featured Lessons (courses)
6. Browse by Category
7. Featured Teachers
8. Trending Now
9. New Releases
10. What Students Say

**Files Modified:**
- `src/screens/HomeScreen.tsx`

---

## TASK 7: Fix Building Routes Order
**Status:** ✅ Completed

**Problem:** Express was matching `/my-building/courses` as `/:id` parameter

**Solution:** Moved `/my-building/courses` route BEFORE `/:id` route

**Files Modified:**
- `backend/src/routes/building.routes.js`

---

## Summary of New Features

### Frontend
- ✅ Browse Buildings section on HomeScreen
- ✅ Building cards with name, city, course count
- ✅ BuildingCoursesScreen for viewing building-specific courses
- ✅ AllBuildingsScreen for browsing all public buildings
- ✅ Proper navigation flow: Home → Building → Courses

### Backend
- ✅ Public buildings API (`/api/buildings/public`) - no auth required
- ✅ Building courses API
- ✅ All building/slot/booking/notification/admin routes mounted
- ✅ Proper route ordering to avoid parameter conflicts

### Database
- ✅ Schema aligned with actual database columns
- ✅ Building model with PUBLIC/PRIVATE visibility
- ✅ Course model linked to buildings

---

## Known Issues / Notes
- 401 error for "my building courses" is expected if user has stale auth token
- Public buildings section requires buildings with `visibilityType: 'PUBLIC'` and `approvalStatus: 'ACTIVE'`
- Use PowerShell `[System.IO.File]::WriteAllText()` for reliable file writes on Windows
