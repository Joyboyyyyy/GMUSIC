# Seed Jamming Rooms Fixes

## Overview
Fixed two critical issues in `seed-jamming-rooms.js` that caused incorrect room creation and inconsistent data.

## Issues Fixed

### 1. Room Template Count Limits Actual Rooms Created
**Problem**: The code had only 3 room templates but tried to create rooms based on `building.musicRoomCount`. If a building had `musicRoomCount: 5`, only 3 rooms would be created, causing a mismatch.

**Location**: Lines 113-127 (room template definition and slicing)

**Fix**: 
- Expanded room templates from 3 to 5
- Implemented cycling logic to reuse templates when needed
- Added room numbering for duplicate template usage
- Now correctly creates the exact number of rooms specified in `musicRoomCount`

**Before**:
```javascript
const musicRooms = [
  { name: 'Studio A - Main Hall', ... },
  { name: 'Studio B - Acoustic Room', ... },
  { name: 'Studio C - Electric Lounge', ... },
];
const roomsToCreate = musicRooms.slice(0, building.musicRoomCount);
// If musicRoomCount = 5, only 3 rooms created!
```

**After**:
```javascript
const roomTemplates = [
  { name: 'Studio A - Main Hall', ... },
  { name: 'Studio B - Acoustic Room', ... },
  { name: 'Studio C - Electric Lounge', ... },
  { name: 'Studio D - Recording Suite', ... },
  { name: 'Studio E - Band Practice', ... },
];

// Cycle through templates if needed
for (let i = 0; i < targetCount; i++) {
  const template = roomTemplates[i % roomTemplates.length];
  const roomNumber = Math.floor(i / roomTemplates.length) > 0 
    ? ` ${Math.floor(i / roomTemplates.length) + 1}` 
    : '';
  roomsToCreate.push({
    ...template,
    name: `${template.name}${roomNumber}`,
  });
}
// Now creates exactly musicRoomCount rooms, cycling templates as needed
```

### 2. Inconsistent `isActive` Filtering
**Problem**: Two queries used different filtering logic:
- Line 103: Checked for existing rooms WITHOUT `isActive` filter
- Line 141: Counted rooms WITH `isActive: true` filter

This inconsistency could cause:
- Skipping buildings that have inactive rooms
- Incorrect room counts
- Data integrity issues

**Location**: Lines 103 and 141

**Fix**: Added consistent `isActive: true` filter to both queries

**Before**:
```javascript
// Line 103 - NO isActive filter
const existingRooms = await prisma.musicRoom.findMany({
  where: { buildingId: building.id },
});

// Line 141 - WITH isActive filter
const actualRoomCount = await prisma.musicRoom.count({
  where: { buildingId: building.id, isActive: true },
});
```

**After**:
```javascript
// Line 103 - NOW WITH isActive filter
const existingRooms = await prisma.musicRoom.findMany({
  where: { 
    buildingId: building.id,
    isActive: true,
  },
});

// Line 141 - STILL WITH isActive filter (consistent)
const actualRoomCount = await prisma.musicRoom.count({
  where: { buildingId: building.id, isActive: true },
});
```

## Additional Improvements
- Added 2 new room templates (Studio D and Studio E) for better variety
- Implemented smart room naming with numbering for template reuse
- Ensured exact room count matches `musicRoomCount` specification

## Testing Recommendations
1. Test with building having `musicRoomCount: 3` (should create 3 rooms)
2. Test with building having `musicRoomCount: 5` (should create 5 rooms)
3. Test with building having `musicRoomCount: 7` (should create 7 rooms, cycling templates)
4. Verify all queries consistently filter by `isActive: true`
5. Run seed script multiple times to ensure idempotency

## Files Modified
- `backend/seed-jamming-rooms.js`

## Impact
- **Data Integrity**: Ensures room counts match specifications
- **Consistency**: All queries now use same filtering logic
- **Scalability**: Can handle any musicRoomCount value
- **Reliability**: Prevents duplicate room creation on re-runs

## Status
✅ All fixes applied
✅ Ready for testing
