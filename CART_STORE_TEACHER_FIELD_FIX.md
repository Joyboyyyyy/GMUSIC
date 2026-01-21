# Cart Store Teacher Field Fix

## Overview
Fixed type mismatch in `CartItem` interface where the `teacher` field was required but doesn't apply to jamming room bookings.

## Issue

### Problem
**Location**: Line 10 in `src/store/cartStore.ts`

The `CartItem` interface required a `teacher` field for all cart items:

```typescript
export interface CartItem {
  id: string;
  packId: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
  teacher: {        // ⚠️ REQUIRED but doesn't apply to jamming rooms
    name: string;
  };
  type?: 'course' | 'jamming_room';
  // ... other fields
}
```

### Why This Is Wrong
- **Courses** have teachers (instructors)
- **Jamming room bookings** do NOT have teachers (they're room rentals)
- Forcing jamming rooms to have a teacher field led to:
  - Fake teacher objects: `teacher: { name: 'Gretex Music Room' }`
  - Type mismatches
  - Confusing data model
  - Potential runtime errors

### Impact
This forced workarounds in multiple places:
1. SelectSlotScreen had to create fake teacher object
2. CheckoutScreen would crash if teacher was undefined
3. CartScreen would crash if teacher was undefined
4. Data model didn't match business logic

## Fix Applied

### 1. Made Teacher Field Optional
**File**: `src/store/cartStore.ts`

```typescript
export interface CartItem {
  id: string;
  packId: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
  teacher?: {       // ✅ NOW OPTIONAL
    name: string;
  };
  type?: 'course' | 'jamming_room';
  // ... other fields
}
```

### 2. Added Conditional Rendering in CheckoutScreen
**File**: `src/screens/CheckoutScreen.tsx` (line 327)

**Before**:
```typescript
<Text style={styles.packTeacher}>{item.teacher.name}</Text>
// Would crash if teacher is undefined
```

**After**:
```typescript
{item.teacher && <Text style={styles.packTeacher}>{item.teacher.name}</Text>}
// Only renders if teacher exists
```

### 3. Added Conditional Rendering in CartScreen
**File**: `src/screens/CartScreen.tsx` (line 83)

**Before**:
```typescript
<Text variant="caption">{item.teacher.name}</Text>
// Would crash if teacher is undefined
```

**After**:
```typescript
{item.teacher && <Text variant="caption">{item.teacher.name}</Text>}
// Only renders if teacher exists
```

### 4. Removed Fake Teacher from SelectSlotScreen
**File**: `src/screens/booking/SelectSlotScreen.tsx` (line 157)

**Before**:
```typescript
const jammingRoomPack = {
  // ... other fields
  teacher: { name: 'Gretex Music Room' },  // ❌ Fake teacher
  type: 'jamming_room' as const,
};
```

**After**:
```typescript
const jammingRoomPack = {
  // ... other fields
  // No teacher field - it's optional!
  type: 'jamming_room' as const,
};
```

## Data Model Clarity

### Course Items
```typescript
{
  id: 'course-123',
  title: 'Guitar Basics',
  price: 2999,
  teacher: { name: 'John Doe' },  // ✅ Has teacher
  type: 'course'
}
```

### Jamming Room Items
```typescript
{
  id: 'slot-456',
  title: 'Jamming Room - 3:00 PM',
  price: 500,
  // No teacher field                // ✅ No teacher needed
  type: 'jamming_room',
  buildingId: 'building-789',
  date: '2026-01-20',
  time: '3:00 PM',
  duration: 60
}
```

## Benefits

1. **Type Safety**: TypeScript now correctly reflects business logic
2. **No Fake Data**: Removed workaround fake teacher objects
3. **Crash Prevention**: Conditional rendering prevents undefined access
4. **Clarity**: Data model matches real-world entities
5. **Maintainability**: Easier to understand and extend

## Testing Recommendations

1. **Course Checkout**:
   - Add course to cart
   - Verify teacher name displays in cart
   - Verify teacher name displays in checkout
   - Complete purchase

2. **Jamming Room Checkout**:
   - Book jamming room slot
   - Verify no teacher name displays (or shows alternative)
   - Verify checkout works without teacher
   - Complete booking

3. **Mixed Cart**:
   - Add both course and jamming room to cart
   - Verify courses show teacher
   - Verify jamming rooms don't show teacher
   - Complete checkout with mixed items

## Files Modified
- `src/store/cartStore.ts`
- `src/screens/CheckoutScreen.tsx`
- `src/screens/CartScreen.tsx`
- `src/screens/booking/SelectSlotScreen.tsx`

## Status
✅ Teacher field made optional
✅ Conditional rendering added
✅ Fake teacher objects removed
✅ Type safety improved
✅ Ready for testing
