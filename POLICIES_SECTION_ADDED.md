# Policies Section Added to Profile

## Implementation

Added Terms & Conditions, Cookie Policy, and Refund Policy links inside the About section in ProfileScreen.

## Changes Made

### ProfileScreen.tsx

1. **Added State for Expansion**:
   - `aboutExpanded` state to toggle About section

2. **Separated Menu Items**:
   - Removed "About" from main menu items
   - Created separate `policyItems` array with:
     - Terms & Conditions
     - Cookie Policy
     - Refund Policy

3. **Created Expandable About Section**:
   - Clickable About card with chevron indicator
   - Expands to show:
     - App version information (Version 1.0.0)
     - App tagline ("Learn music from the best")
     - Three policy links with icons

4. **Added Styles**:
   - `expandedContent` - Container for expanded content
   - `versionInfo` - App version display area
   - `policyLinks` - Container for policy links
   - `policyItem` - Individual policy link style

## UI/UX

### Collapsed State:
```
┌─────────────────────────────┐
│ ℹ️  About                    │
│    App version and policies ▼│
└─────────────────────────────┘
```

### Expanded State:
```
┌─────────────────────────────┐
│ ℹ️  About                    │
│    App version and policies ▲│
├─────────────────────────────┤
│ Gretex Music Room           │
│ Version 1.0.0               │
│ Learn music from the best   │
├─────────────────────────────┤
│ 📄 Terms & Conditions     → │
│ 🛡️  Cookie Policy         → │
│ 💰 Refund Policy          → │
└─────────────────────────────┘
```

## Features

- **Expandable/Collapsible**: Tap to expand/collapse
- **Visual Feedback**: Chevron changes direction (down/up)
- **Clean Design**: Follows design system (8dp spacing, proper typography)
- **Icon Indicators**: Each policy has a relevant icon
- **Placeholder Actions**: Currently shows "Coming Soon" alerts
- **Accessible**: Proper touch targets and visual hierarchy

## Design System Compliance

- Uses `SPACING` constants (xs, sm, md)
- Uses `COMPONENT_SIZES.icon.sm` for icons
- Uses `RADIUS.md` for border radius
- Uses theme colors (text, textSecondary, textMuted, border, surfaceVariant)
- Follows typography scale (label, bodySmall, caption)

## Future Enhancements

To make policies functional:

1. **Create Policy Screens**:
   ```typescript
   // src/screens/TermsScreen.tsx
   // src/screens/CookiePolicyScreen.tsx
   // src/screens/RefundPolicyScreen.tsx
   ```

2. **Add Routes** in `RootStackParamList`:
   ```typescript
   Terms: undefined;
   CookiePolicy: undefined;
   RefundPolicy: undefined;
   ```

3. **Update Navigation**:
   ```typescript
   { 
     icon: 'document-text-outline', 
     title: 'Terms & Conditions', 
     onPress: () => navigation.navigate('Terms') 
   },
   ```

4. **Add Policy Content**:
   - Fetch from backend API
   - Or embed as markdown/HTML
   - Display in scrollable view

## Testing

1. Open Profile screen
2. Scroll to bottom
3. Tap "About" section
4. Verify it expands showing version and policies
5. Tap policy links to see "Coming Soon" alerts
6. Tap "About" again to collapse

## Files Modified

- `src/screens/ProfileScreen.tsx`

## No Breaking Changes

- All existing functionality preserved
- About section moved from menu to separate expandable card
- Backward compatible
