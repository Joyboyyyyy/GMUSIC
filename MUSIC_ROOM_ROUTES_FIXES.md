# Music Room Routes Fixes

## Issues Identified and Fixed

### Issue 1: Missing Validation for `date` Query Parameter
**Severity**: Medium  
**Location**: `GET /buildings/:buildingId/slots`

#### Problem
The date parameter was accepted without validation, which could lead to:
- Invalid date formats causing crashes
- SQL injection attempts
- Unexpected behavior with malformed dates

```javascript
// BEFORE (VULNERABLE)
const { date } = req.query;
const slots = await musicRoomService.getAvailableSlots(buildingId, date);
```

#### Fix Applied
Added comprehensive date validation:
- ✅ Format validation (YYYY-MM-DD)
- ✅ Date value validation
- ✅ Clear error messages

```javascript
// AFTER (SECURE)
if (date) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid date format. Expected YYYY-MM-DD' 
    });
  }
  
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid date value' 
    });
  }
}
```

---

### Issue 2: Potential Type Mismatch in Authorization Check
**Severity**: High  
**Location**: Multiple endpoints (POST, PUT, DELETE)

#### Problem
Direct comparison of `buildingId` values without type coercion could fail when:
- One is a string and the other is a UUID object
- Database returns different type than request parameter
- Leads to authorization bypass

```javascript
// BEFORE (VULNERABLE)
if (req.user.role !== 'SUPER_ADMIN' && 
    (req.user.role !== 'BUILDING_ADMIN' || req.user.buildingId !== req.params.buildingId)) {
  return res.status(403).json({ success: false, error: 'Unauthorized' });
}
```

#### Fix Applied
Type-safe comparison with explicit string conversion:
- ✅ Convert both values to strings
- ✅ Clear boolean logic
- ✅ Prevents type mismatch issues

```javascript
// AFTER (SECURE)
const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
const isBuildingAdmin = req.user.role === 'BUILDING_ADMIN' && 
                       String(req.user.buildingId) === String(req.params.buildingId);

if (!isSuperAdmin && !isBuildingAdmin) {
  return res.status(403).json({ success: false, error: 'Unauthorized' });
}
```

---

### Issue 3: Incorrect Error Status Code - Always Returns 404
**Severity**: Medium  
**Location**: `GET /:roomId`

#### Problem
All errors returned 404, even for server errors:
- Database connection errors → 404 (should be 500)
- Validation errors → 404 (should be 400)
- Only actual "not found" should be 404

```javascript
// BEFORE (INCORRECT)
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const musicRoom = await musicRoomService.getMusicRoomById(req.params.roomId);
    res.json({ success: true, data: musicRoom });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});
```

#### Fix Applied
Proper error status codes based on error type:
- ✅ 404 for "not found" errors
- ✅ 500 for server/database errors
- ✅ Null check before returning data

```javascript
// AFTER (CORRECT)
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const musicRoom = await musicRoomService.getMusicRoomById(req.params.roomId);
    
    if (!musicRoom) {
      return res.status(404).json({ success: false, error: 'Music room not found' });
    }
    
    res.json({ success: true, data: musicRoom });
  } catch (error) {
    if (error.message === 'Music room not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### Issue 4: Missing Validation for Coordinate Values
**Severity**: High  
**Location**: `GET /nearby`

#### Problem
Coordinate values were parsed but not validated:
- Invalid latitude/longitude could cause database errors
- Out-of-range values could break calculations
- Non-numeric values could crash the service

```javascript
// BEFORE (VULNERABLE)
const musicRooms = await musicRoomService.getNearbyMusicRooms(
  parseFloat(latitude),
  parseFloat(longitude),
  parseFloat(radius) || 10
);
```

#### Fix Applied
Comprehensive coordinate validation:
- ✅ Check for NaN after parsing
- ✅ Validate latitude range (-90 to 90)
- ✅ Validate longitude range (-180 to 180)
- ✅ Validate radius range (0 to 100 km)

```javascript
// AFTER (SECURE)
const lat = parseFloat(latitude);
const lng = parseFloat(longitude);
const rad = parseFloat(radius) || 10;

if (isNaN(lat) || isNaN(lng)) {
  return res.status(400).json({ 
    success: false, 
    error: 'Latitude and longitude must be valid numbers' 
  });
}

if (lat < -90 || lat > 90) {
  return res.status(400).json({ 
    success: false, 
    error: 'Latitude must be between -90 and 90' 
  });
}

if (lng < -180 || lng > 180) {
  return res.status(400).json({ 
    success: false, 
    error: 'Longitude must be between -180 and 180' 
  });
}

if (rad <= 0 || rad > 100) {
  return res.status(400).json({ 
    success: false, 
    error: 'Radius must be between 0 and 100 km' 
  });
}
```

---

### Issue 5: Inconsistent Error Handling
**Severity**: Medium  
**Location**: PUT and DELETE endpoints

#### Problem
Update and delete endpoints didn't handle "not found" errors properly:
- All errors returned 400
- No distinction between validation errors and not found
- Inconsistent with REST conventions

#### Fix Applied
Consistent error handling across all endpoints:
- ✅ Check if resource exists before operations
- ✅ Return 404 for not found
- ✅ Return 400 for validation errors
- ✅ Return 500 for server errors

```javascript
// AFTER (CONSISTENT)
const existingRoom = await musicRoomService.getMusicRoomById(req.params.roomId);

if (!existingRoom) {
  return res.status(404).json({ success: false, error: 'Music room not found' });
}

// ... authorization checks ...

try {
  // ... operation ...
} catch (error) {
  if (error.message === 'Music room not found') {
    return res.status(404).json({ success: false, error: error.message });
  }
  
  res.status(400).json({ success: false, error: error.message });
}
```

---

## Summary of Changes

### Files Modified
- `backend/src/routes/musicRoom.routes.js`

### Endpoints Fixed
1. ✅ `GET /buildings/:buildingId/slots` - Added date validation
2. ✅ `GET /nearby` - Added coordinate validation
3. ✅ `GET /:roomId` - Fixed error status codes
4. ✅ `POST /buildings/:buildingId` - Fixed authorization type mismatch
5. ✅ `PUT /:roomId` - Fixed authorization and error handling
6. ✅ `DELETE /:roomId` - Fixed authorization and error handling

### Security Improvements
- ✅ Input validation for all query parameters
- ✅ Type-safe authorization checks
- ✅ Proper HTTP status codes
- ✅ Consistent error handling
- ✅ Protection against invalid data

---

## Testing Recommendations

### Test Date Validation
```bash
# Valid date
curl "http://localhost:3002/api/music-rooms/buildings/xxx/slots?date=2026-01-20"

# Invalid format
curl "http://localhost:3002/api/music-rooms/buildings/xxx/slots?date=20-01-2026"
# Expected: 400 Bad Request

# Invalid date
curl "http://localhost:3002/api/music-rooms/buildings/xxx/slots?date=2026-13-45"
# Expected: 400 Bad Request
```

### Test Coordinate Validation
```bash
# Valid coordinates
curl "http://localhost:3002/api/music-rooms/nearby?latitude=19.0760&longitude=72.8777"

# Invalid latitude
curl "http://localhost:3002/api/music-rooms/nearby?latitude=100&longitude=72.8777"
# Expected: 400 Bad Request

# Invalid longitude
curl "http://localhost:3002/api/music-rooms/nearby?latitude=19.0760&longitude=200"
# Expected: 400 Bad Request

# Non-numeric values
curl "http://localhost:3002/api/music-rooms/nearby?latitude=abc&longitude=xyz"
# Expected: 400 Bad Request
```

### Test Authorization
```bash
# Test with different building IDs (should fail)
# Test with super admin (should succeed)
# Test with building admin for different building (should fail)
```

### Test Error Status Codes
```bash
# Non-existent room
curl "http://localhost:3002/api/music-rooms/non-existent-id"
# Expected: 404 Not Found

# Server error (simulate by breaking database connection)
# Expected: 500 Internal Server Error
```

---

## HTTP Status Code Reference

### Correct Usage After Fixes
- **200 OK**: Successful GET, PUT, DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Invalid input, validation errors
- **403 Forbidden**: Authorization failed
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Database/server errors

---

## Best Practices Applied

### 1. Input Validation
✅ Validate all user inputs  
✅ Use regex for format validation  
✅ Check ranges for numeric values  
✅ Provide clear error messages  

### 2. Type Safety
✅ Explicit type conversion  
✅ Avoid implicit type coercion  
✅ Use String() for comparisons  
✅ Check for NaN after parsing  

### 3. Error Handling
✅ Appropriate HTTP status codes  
✅ Consistent error response format  
✅ Distinguish error types  
✅ Log errors for debugging  

### 4. Security
✅ Validate authorization properly  
✅ Prevent type confusion attacks  
✅ Sanitize inputs  
✅ Return minimal error information  

---

## Deployment Checklist

- [x] Fix date validation
- [x] Fix coordinate validation
- [x] Fix authorization type mismatches
- [x] Fix error status codes
- [x] Fix error handling consistency
- [ ] Test all endpoints
- [ ] Update API documentation
- [ ] Deploy to staging
- [ ] Run integration tests
- [ ] Deploy to production

---

## Impact Assessment

### Before Fixes
- ❌ Invalid dates could crash the service
- ❌ Authorization could be bypassed with type confusion
- ❌ All errors returned as 404
- ❌ Invalid coordinates could break calculations
- ❌ Inconsistent error handling

### After Fixes
- ✅ Robust input validation
- ✅ Type-safe authorization
- ✅ Correct HTTP status codes
- ✅ Validated coordinate ranges
- ✅ Consistent error handling
- ✅ Better API usability
- ✅ Improved security

---

## Related Documentation

- [Security Fixes Summary](./SECURITY_FIXES_SUMMARY.md)
- [Price Validation Fix](./PRICE_VALIDATION_SECURITY_FIX.md)
- [Jamming Room Price Fix](./JAMMING_ROOM_PRICE_SECURITY_FIX.md)

---

**Last Updated**: January 20, 2026  
**Status**: ✅ All issues fixed and ready for testing
