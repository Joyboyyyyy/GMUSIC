# Design Document: Profile Picture Consistency Fix

## Overview

This design addresses the profile picture inconsistency between web and mobile applications by establishing `profilePicture` as the single authoritative field while maintaining `avatar` for backward compatibility. The solution ensures both fields are synchronized during updates and provides a clear migration path for existing data.

### Current State Analysis

**Database Schema:**
- User table has TWO fields: `avatar` (String?) and `profilePicture` (String?)
- Both fields can store profile picture URLs independently

**Backend Behavior:**
- `auth.service.js` lines 478-484: Syncs both fields when either is updated
- Registration creates both fields with identical default avatar URLs
- Update profile endpoint accepts both `avatar` and `profilePicture` parameters

**Mobile App Behavior:**
- `ProfileScreen.tsx` line 134: Displays `user?.profilePicture || user?.avatar`
- `avatar.ts` line 68: Uploads to Supabase Storage and updates via `/api/auth/me` with `avatar` field
- `authStore.ts`: Stores user object with both fields from backend

**Web App Behavior:**
- Unknown which field is used (needs investigation)
- Likely source of inconsistency

### Root Cause

The inconsistency occurs because:
1. Mobile app uploads update the `avatar` field
2. Mobile app displays `profilePicture` field first (with fallback to `avatar`)
3. Web app likely uses a different field
4. Backend syncs both fields but the sync logic may not cover all update paths

## Architecture

### Field Designation

**Primary Field:** `profilePicture`
- Authoritative source for profile picture URLs
- Used by all clients for display
- Updated by all upload operations

**Secondary Field:** `avatar`
- Maintained for backward compatibility
- Synchronized with `profilePicture` on every update
- Will be deprecated in future versions

### Data Flow

```
┌─────────────────┐
│  Mobile Upload  │
│   (avatar.ts)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Backend API                │
│  PUT /api/auth/me           │
│  { profilePicture: url }    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  auth.service.updateProfile │
│  - Set profilePicture       │
│  - Sync to avatar           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Database Update            │
│  profilePicture = url       │
│  avatar = url               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  API Response               │
│  { profilePicture, avatar } │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Client Display             │
│  user.profilePicture        │
└─────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. AuthService.updateProfile (auth.service.js)

**Current Implementation:**
```javascript
// Lines 478-484
if (profilePicture) {
  updateData.profilePicture = profilePicture;
  updateData.avatar = profilePicture; // Keep avatar in sync
} else if (avatar) {
  updateData.avatar = avatar;
  updateData.profilePicture = avatar; // Keep profilePicture in sync
}
```

**Updated Implementation:**
```javascript
// Prioritize profilePicture as primary field
if (profilePicture) {
  updateData.profilePicture = profilePicture;
  updateData.avatar = profilePicture; // Sync to avatar
} else if (avatar) {
  // Accept avatar for backward compatibility
  updateData.profilePicture = avatar; // Sync to profilePicture (primary)
  updateData.avatar = avatar;
}
```

**Changes:**
- Maintain existing sync logic
- Add comments clarifying `profilePicture` is primary
- Ensure both fields always have the same value

#### 2. AuthService.register (auth.service.js)

**Current Implementation:**
```javascript
avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}...`,
profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}...`,
```

**No changes needed** - already creates both fields with identical values.

#### 3. AuthService.getProfile (auth.service.js)

**Current Implementation:**
```javascript
select: {
  avatar: true,
  profilePicture: true,
  // ... other fields
}
```

**No changes needed** - already returns both fields.

### Mobile App Components

#### 1. Avatar Upload Utility (src/utils/avatar.ts)

**Current Implementation (line 68):**
```typescript
await api.put('/api/auth/me', { avatar: avatarUrl });
```

**Updated Implementation:**
```typescript
await api.put('/api/auth/me', { profilePicture: avatarUrl });
```

**Changes:**
- Change parameter from `avatar` to `profilePicture`
- Update to use primary field
- Backend will sync to `avatar` automatically

#### 2. Profile Display (src/screens/ProfileScreen.tsx)

**Current Implementation (line 134):**
```typescript
user?.profilePicture || user?.avatar
```

**Updated Implementation:**
```typescript
user?.profilePicture || user?.avatar || 'https://i.pravatar.cc/300'
```

**Changes:**
- Keep fallback logic for backward compatibility
- Add default avatar as final fallback
- Primary field (`profilePicture`) is checked first

#### 3. Auth Store (src/store/authStore.ts)

**Current Implementation:**
- Stores complete user object from backend
- No profile picture specific logic

**No changes needed** - store already handles both fields correctly.

### Web App Components

**Investigation Required:**
- Identify which field web app uses for display
- Identify which field web app updates on upload
- Update to use `profilePicture` as primary field
- Ensure consistency with mobile app

## Data Models

### User Model (Prisma Schema)

**Current Schema:**
```prisma
model User {
  avatar          String?
  profilePicture  String?
  // ... other fields
}
```

**No schema changes required** - both fields remain in database.

### API Response Format

**GET /api/auth/me Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "profilePicture": "https://storage.url/path/to/image.jpg",
    "avatar": "https://storage.url/path/to/image.jpg",
    // ... other fields
  }
}
```

**PUT /api/auth/me Request:**
```json
{
  "profilePicture": "https://storage.url/path/to/new-image.jpg"
}
```

**PUT /api/auth/me Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profilePicture": "https://storage.url/path/to/new-image.jpg",
    "avatar": "https://storage.url/path/to/new-image.jpg",
    // ... other fields
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

**Redundant Properties:**
- 5.2 is redundant with 2.1 and 2.2 (all test API consistency across clients)
- 5.3 is redundant with 3.4 (both test update response includes new URL)
- 6.2 is redundant with 1.4 (both test backward compatibility)
- 7.4 is redundant with 3.1 (both test mobile upload updates correct field)

**Combined Properties:**
- 2.1 and 2.2 can be combined into one property about API consistency
- 3.1 and 3.2 can be combined into one property about upload handling

**Edge Cases:**
- 6.3 (conflicting URLs in both fields) will be handled by generators

After reflection, the unique testable properties are:

1. Profile picture upload updates authoritative field (combines 1.2, 3.1, 3.2)
2. Profile retrieval returns authoritative field (1.3)
3. Backward compatibility with existing data (1.4)
4. API consistency across all endpoints (combines 2.1, 2.2, 5.1, 5.4)
5. Default avatar when no picture exists (2.3)
6. Field synchronization on update (4.3)
7. Update response includes new URL (3.4)
8. Changes reflected in all API responses (3.3)

### Correctness Properties

Property 1: Profile Picture Upload Updates Primary Field
*For any* user and any valid profile picture URL, when the profile picture is updated via the API (from mobile or web), the `profilePicture` field in the database should contain the new URL.
**Validates: Requirements 1.2, 3.1, 3.2**

Property 2: Profile Retrieval Returns Primary Field
*For any* user with a profile picture, when their profile is retrieved via any API endpoint, the response should include the `profilePicture` field with the correct URL.
**Validates: Requirements 1.3**

Property 3: Backward Compatibility with Existing Data
*For any* user with a profile picture stored in either the `avatar` field only, `profilePicture` field only, or both fields, retrieving their profile should return a valid profile picture URL.
**Validates: Requirements 1.4**

Property 4: API Consistency Across Platforms
*For any* user, when their profile is retrieved via different API endpoints (e.g., `/api/auth/me`, user search, etc.), all responses should return the same profile picture URL in the `profilePicture` field.
**Validates: Requirements 2.1, 2.2, 5.1, 5.4**

Property 5: Default Avatar for Missing Pictures
*For any* user without a profile picture (both fields are null or empty), when their profile is retrieved, the system should return a valid default avatar URL.
**Validates: Requirements 2.3**

Property 6: Field Synchronization on Update
*For any* user and any profile picture update, after the update completes, both the `avatar` and `profilePicture` fields in the database should contain identical values.
**Validates: Requirements 4.3**

Property 7: Update Response Includes New URL
*For any* profile picture update request, the API response should include the updated profile picture URL in the `profilePicture` field.
**Validates: Requirements 3.4**

Property 8: Changes Reflected Across All Endpoints
*For any* user, after updating their profile picture, all subsequent API calls that return user data should reflect the new profile picture URL.
**Validates: Requirements 3.3**

## Error Handling

### Upload Failures

**Scenario:** Supabase Storage upload fails
- **Handling:** Return error to client, do not update database
- **User Experience:** Show error message, allow retry
- **Logging:** Log upload error with user ID and error details

**Scenario:** Database update fails after successful upload
- **Handling:** Log error, return failure to client
- **User Experience:** Show error message, image remains in storage but not linked to user
- **Recovery:** Cleanup job can remove orphaned images

### API Errors

**Scenario:** Invalid profile picture URL provided
- **Handling:** Validate URL format before database update
- **Response:** 400 Bad Request with validation error
- **User Experience:** Show validation error message

**Scenario:** User not found during update
- **Handling:** Return 404 Not Found
- **User Experience:** Redirect to login if authentication expired

### Data Inconsistency

**Scenario:** Fields have different values (legacy data)
- **Handling:** Prioritize `profilePicture` field, sync to `avatar` on next update
- **User Experience:** Display `profilePicture` value
- **Migration:** Background job can sync all users

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Test specific upload scenarios (mobile app, web app)
- Test API endpoint responses for known users
- Test error handling for invalid URLs
- Test backward compatibility with specific legacy data patterns
- Test default avatar generation

**Property-Based Tests:**
- Test profile picture updates across all possible valid URLs
- Test field synchronization for all update operations
- Test API consistency across all endpoints
- Test backward compatibility with all field combinations
- Minimum 100 iterations per property test

### Property-Based Testing Configuration

**Library:** Use `fast-check` for JavaScript/TypeScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: **Feature: profile-picture-consistency-fix, Property {number}: {property_text}**

**Example Test Structure:**
```typescript
// Feature: profile-picture-consistency-fix, Property 1: Profile Picture Upload Updates Primary Field
test('profile picture upload updates profilePicture field', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.webUrl(), // Generate random valid URLs
      fc.uuid(),   // Generate random user IDs
      async (profilePictureUrl, userId) => {
        // Create user
        const user = await createTestUser(userId);
        
        // Update profile picture
        await api.put('/api/auth/me', { profilePicture: profilePictureUrl });
        
        // Verify database
        const updatedUser = await db.user.findUnique({ where: { id: userId } });
        expect(updatedUser.profilePicture).toBe(profilePictureUrl);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Cross-Platform Consistency:**
- Test that mobile app and web app receive identical data from API
- Test that uploads from both platforms update the same field
- Test that profile displays show the same image URL

**End-to-End Flows:**
1. User uploads profile picture from mobile → Verify web shows same picture
2. User uploads profile picture from web → Verify mobile shows same picture
3. New user registration → Verify default avatar is consistent
4. User with legacy data logs in → Verify profile picture displays correctly

### Migration Testing

**Data Migration Validation:**
- Test users with only `avatar` field populated
- Test users with only `profilePicture` field populated
- Test users with both fields populated (same value)
- Test users with both fields populated (different values)
- Test users with neither field populated

**Rollback Safety:**
- Verify no data loss if deployment is rolled back
- Verify both fields remain accessible during migration
- Verify clients can handle both old and new response formats

## Implementation Notes

### Deployment Strategy

**Phase 1: Backend Update**
1. Deploy backend changes to sync both fields
2. Update mobile app upload to use `profilePicture` parameter
3. Monitor logs for any errors

**Phase 2: Client Updates**
1. Deploy mobile app update
2. Deploy web app update (after investigation)
3. Verify consistency across platforms

**Phase 3: Data Migration (Optional)**
1. Run background job to sync all existing users
2. Verify all users have consistent field values
3. Monitor for any data inconsistencies

### Monitoring

**Metrics to Track:**
- Profile picture upload success rate
- API response times for profile endpoints
- Field synchronization failures
- Default avatar usage rate

**Alerts:**
- Alert if field synchronization fails
- Alert if upload success rate drops below threshold
- Alert if API errors spike after deployment

### Documentation Updates

**API Documentation:**
- Document `profilePicture` as the primary field
- Mark `avatar` as deprecated but maintained for compatibility
- Update API examples to use `profilePicture`

**Code Comments:**
- Add comments in `auth.service.js` explaining field roles
- Add comments in `avatar.ts` explaining upload flow
- Add comments in display components explaining field priority
