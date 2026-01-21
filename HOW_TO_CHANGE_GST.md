# 📝 How to Change GST Rate

## 🎯 **Quick Guide**

The GST rate is now centralized in a single configuration file, making it easy to change whenever needed.

---

## 📍 **Location**

File: `src/config/tax.ts`

---

## 🔧 **How to Change GST Rate**

### **Option 1: Change GST Percentage**

Open `src/config/tax.ts` and modify the `GST_RATE`:

```typescript
export const TAX_CONFIG = {
  // Change this value (0.18 = 18%, 0.12 = 12%, etc.)
  GST_RATE: 0.18,  // ← Change this number
  
  TAX_NAME: 'GST',
  APPLY_TAX: true,
};
```

**Examples:**
- For **12% GST**: Change to `0.12`
- For **5% GST**: Change to `0.05`
- For **28% GST**: Change to `0.28`
- For **0% GST**: Change to `0.00`

### **Option 2: Disable Tax Completely**

```typescript
export const TAX_CONFIG = {
  GST_RATE: 0.18,
  TAX_NAME: 'GST',
  APPLY_TAX: false,  // ← Set to false to disable tax
};
```

### **Option 3: Change Tax Name**

```typescript
export const TAX_CONFIG = {
  GST_RATE: 0.18,
  TAX_NAME: 'VAT',  // ← Change to 'VAT', 'Sales Tax', etc.
  APPLY_TAX: true,
};
```

---

## 🔄 **After Making Changes**

1. **Save the file** (`src/config/tax.ts`)
2. **Reload the app** (shake device → Reload)
3. **Test checkout** to verify new tax rate

The changes will automatically apply to:
- ✅ Checkout screen
- ✅ Cart calculations
- ✅ Payment amounts
- ✅ Invoice generation
- ✅ All price displays

---

## 📊 **Examples**

### **Current Setup (18% GST)**
```
Subtotal: ₹500
GST (18%): ₹90
Total: ₹590
```

### **After Changing to 12% GST**
```typescript
GST_RATE: 0.12
```
Result:
```
Subtotal: ₹500
GST (12%): ₹60
Total: ₹560
```

### **After Changing to 5% GST**
```typescript
GST_RATE: 0.05
```
Result:
```
Subtotal: ₹500
GST (5%): ₹25
Total: ₹525
```

---

## 🎯 **Where Tax is Applied**

The tax configuration is used in:

1. **CheckoutScreen** - Shows tax breakdown
2. **CartScreen** - Calculates total with tax
3. **Payment Processing** - Final amount includes tax
4. **Invoices** - Tax details in receipts

---

## ⚠️ **Important Notes**

1. **Decimal Format**: Use decimal format (0.18 for 18%, not 18)
2. **Rounding**: Tax is automatically rounded to nearest rupee
3. **No App Rebuild**: Changes take effect immediately after reload
4. **Consistent**: Tax rate applies to all purchases (courses, jamming rooms, etc.)

---

## 🧪 **Testing After Change**

1. Go to any course or jamming room
2. Add to cart or proceed to checkout
3. Verify tax calculation:
   - Check percentage displayed
   - Verify tax amount
   - Confirm total is correct

---

## 💡 **Pro Tips**

### **Different Tax Rates for Different Items**
If you need different tax rates for different items in the future, you can extend the config:

```typescript
export const TAX_CONFIG = {
  DEFAULT_RATE: 0.18,
  JAMMING_ROOM_RATE: 0.12,
  COURSE_RATE: 0.18,
  TAX_NAME: 'GST',
  APPLY_TAX: true,
};
```

### **Tax Exemptions**
To exempt certain items from tax, you can add logic:

```typescript
export const calculateTax = (subtotal: number, itemType?: string): number => {
  if (!TAX_CONFIG.APPLY_TAX) return 0;
  if (itemType === 'educational') return 0; // Tax-free education
  return Math.round(subtotal * TAX_CONFIG.GST_RATE);
};
```

---

## 📞 **Need Help?**

If you need to implement:
- Multiple tax rates
- Tax exemptions
- Regional tax variations
- Complex tax calculations

Just let me know and I can help implement those features!

---

## ✅ **Summary**

**To change GST from 18% to any other rate:**

1. Open `src/config/tax.ts`
2. Change `GST_RATE: 0.18` to your desired rate (e.g., `0.12` for 12%)
3. Save and reload the app
4. Done! ✨

The new tax rate will automatically apply everywhere in the app.