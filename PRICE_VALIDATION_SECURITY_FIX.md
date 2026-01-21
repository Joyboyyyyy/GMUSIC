# Price Validation Security Fix

## Issue Identified
**Severity**: Medium  
**Type**: Price Manipulation Vulnerability

### The Problem
The cart system stored prices in the `CartItem` table using the `priceAtAdd` field. While this is useful for historical tracking, it created a potential security vulnerability:

1. **Price Change Exploitation**: Users could add items to cart at current price, wait for price increases, then checkout at the old (lower) stored price
2. **Potential API Tampering**: If cart items could be manipulated through API calls, users might be able to set arbitrary prices
3. **Race Condition**: Price changes between cart addition and checkout weren't properly validated

### Example Attack Scenario
```
1. User adds Course A to cart when price is ₹500
2. CartItem stores priceAtAdd = 500
3. Admin increases Course A price to ₹1000
4. User checks out and potentially pays only ₹500 (the stored price)
```

## Security Measures Implemented

### 1. Cart Price Validation (booking.service.js)
**Fixed in**: `getCart()` method

The cart now:
- ✅ Always fetches current prices from the database
- ✅ Compares stored `priceAtAdd` with current database price
- ✅ Flags items where prices have changed
- ✅ Calculates totals using CURRENT prices, not stored prices

```javascript
// SECURITY: Always use current price from database, not stored priceAtAdd
const currentPrice = item.slot?.course?.pricePerSlot || item.slot?.course?.price || 0;
return {
  ...item,
  currentPrice,        // Current price from database
  priceAtAdd: item.priceAtAdd,  // Historical price (reference only)
  priceChanged: Math.abs(currentPrice - item.priceAtAdd) > 0.01,
};
```

### 2. Pre-Checkout Validation
**New method**: `validateCartPrices()`

Added a dedicated validation function that:
- ✅ Checks all cart items for price changes
- ✅ Provides detailed price comparison
- ✅ Returns validation status before payment
- ✅ Alerts users if prices have changed

```javascript
async validateCartPrices(studentId) {
  // Validates all cart items
  // Returns: { valid, items, totalCurrentPrice, totalStoredPrice, message }
}
```

### 3. Payment Service Protection (Already Secure)
**File**: `razorpay.service.js`

The Razorpay payment service was already properly secured:
- ✅ NEVER trusts client-provided prices
- ✅ Always fetches prices from database before creating orders
- ✅ Validates price is positive and numeric
- ✅ Uses database as single source of truth

```javascript
// SECURITY: Price validation happens here - NEVER trust client-provided prices
const course = await db.course.findUnique({ where: { id: courseId } });
const coursePrice = course.pricePerSlot || course.price;

// Validate course price from database
if (!coursePrice || typeof coursePrice !== 'number' || coursePrice <= 0) {
  throw new Error(`Invalid course price: ${coursePrice}`);
}
```

## Security Best Practices Applied

### Defense in Depth
1. **Cart Level**: Validate prices when displaying cart
2. **Checkout Level**: Validate prices before payment initiation
3. **Payment Level**: Validate prices when creating payment orders

### Single Source of Truth
- Database is the ONLY source for pricing
- Stored prices (`priceAtAdd`) are for reference/history only
- All calculations use fresh database queries

### User Experience
- Users are notified if prices change
- Clear messaging about price differences
- Transparent pricing at all stages

## Testing Recommendations

### Manual Testing
1. Add item to cart at price X
2. Change course price in database to Y
3. View cart - should show current price Y
4. Attempt checkout - should charge price Y

### Security Testing
1. Try to manipulate `priceAtAdd` via API
2. Verify payment uses database price, not manipulated value
3. Test race conditions with concurrent price changes

### Edge Cases
- Zero or negative prices
- Very large prices (overflow)
- Null/undefined prices
- Currency conversion issues

## Migration Notes

### Database Changes
No database schema changes required. The `priceAtAdd` field remains for historical tracking.

### API Changes
The cart API response now includes:
- `currentPrice`: Current price from database
- `priceAtAdd`: Historical price when added
- `priceChanged`: Boolean flag if prices differ

### Frontend Updates Needed
Frontend should:
1. Display `currentPrice` to users, not `priceAtAdd`
2. Show warning if `priceChanged === true`
3. Use `validateCartPrices()` before checkout
4. Handle price change notifications gracefully

## Verification Checklist

- [x] Cart displays current prices from database
- [x] Cart flags price changes
- [x] Cart totals use current prices
- [x] Validation function added
- [x] Payment service validates prices
- [x] Documentation updated
- [ ] Frontend updated to use new fields
- [ ] Security testing completed
- [ ] User acceptance testing completed

## Related Files Modified

1. `backend/src/services/booking.service.js`
   - Updated `getCart()` method
   - Added `validateCartPrices()` method

2. `backend/src/services/razorpay.service.js`
   - Added security documentation comments
   - No logic changes (already secure)

## Conclusion

The price validation vulnerability has been addressed through multiple layers of validation. The system now:
- ✅ Prevents price manipulation attacks
- ✅ Handles price changes gracefully
- ✅ Maintains price history for reference
- ✅ Provides clear user communication
- ✅ Follows security best practices

**Status**: Fixed and ready for testing
**Next Steps**: Update frontend to handle new cart response format
