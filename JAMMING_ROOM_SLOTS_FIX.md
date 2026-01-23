# Jamming Room Slots API Fix

## Issue
The `/api/music-rooms/buildings/:buildingId/slots` endpoint was returning a 500 error when trying to fetch real-time slot availability.

## Root Cause
The code was using an invalid enum value `'ATTENDED'` in the Prisma query for `SlotEnrollment` status filtering. According to the database schema, the valid `EnrollmentStatus` enum values are:
- `CONFIRMED`
- `WAITLIST`
- `CANCELLED`
- `COMPLETED`

The value `'ATTENDED'` does not exist in the enum, causing Prisma to throw a validation error.

## Fixes Applied

### 1. Fixed Invalid Enum Value
Changed the query in `backend/src/services/musicRoom.service.js` from:
```javascript
status: {
  in: ['CONFIRMED', 'ATTENDED'],
}
```

To:
```javascript
status: {
  in: ['CONFIRMED', 'COMPLETED'],
}
```

### 2. Fixed Slot Availability Logic (Prevent Double-Booking)
**IMPORTANT**: Updated the logic to prevent double-booking of music rooms.

**Previous Logic** (WRONG):
- Only marked slots as unavailable if they were FULLY BOOKED (currentEnrollment >= maxCapacity)
- This allowed jamming room bookings even when a course was scheduled

**New Logic** (CORRECT):
- Marks a slot as unavailable if ANY course enrollment exists for that time
- Prevents conflict: If a student has a course lesson at 9am, the jamming room CANNOT be booked at 9am
- Ensures music rooms are not double-booked between courses and jamming sessions

```javascript
// Check if slot has ANY confirmed/completed enrollments
// OR if the slot is marked as fully booked
if (slot.slotEnrollments.length > 0 || slot.currentEnrollment > 0) {
  bookedSlots.add(hour);
}
```

## What This Does
The API now correctly:
1. Fetches all time slots from the `time_slots` table for the specified building and date
2. Checks `slot_enrollments` for ANY bookings with status `CONFIRMED` or `COMPLETED`
3. Marks slots as unavailable if:
   - ANY course enrollment exists for that time slot, OR
   - The slot's currentEnrollment > 0
4. Returns slots with proper availability status
5. **Prevents double-booking**: Course lessons and jamming room bookings cannot overlap

## Example Scenario
- Building: "Tarush"
- Date: January 22, 2026
- Course: Piano lesson at 9:00 AM - 10:00 AM (Student A enrolled)
- Result: The 9:00 AM slot will show as "Booked" (orange) for jamming room bookings
- User B cannot book the jamming room from 9:00 AM - 10:00 AM

## Frontend Integration
The frontend (`SelectSlotScreen.tsx`) already has the correct implementation:
- Displays booked slots in orange color (#fb923c / #ea580c)
- Shows "Booked" badge on unavailable slots
- Makes booked slots unclickable
- No mock data fallbacks

## Testing
To test the fix:
1. Ensure the backend server is running
2. Create a course enrollment for a specific time slot
3. Navigate to the jamming room booking flow in the app
4. Select the same building and date
5. The time slot with the course enrollment should show as "Booked"
6. Verify the slot is unclickable

## Files Modified
- `backend/src/services/musicRoom.service.js` - Fixed enum value and slot availability logic
