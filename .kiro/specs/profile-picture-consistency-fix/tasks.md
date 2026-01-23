# Implementation Plan: Profile Picture Consistency Fix

## Overview

This implementation plan fixes the profile picture inconsistency between web and mobile apps by establishing `profilePicture` as the authoritative field while maintaining `avatar` for backward compatibility. The plan ensures both fields are synchronized and all clients use consistent data.

## Tasks

- [ ] 1. Update backend profile update logic
  - [x] 1.1 Add clarifying comments to auth.service.js updateProfile method
    - Add comment identifying `profilePicture` as the primary field
    - Add comment explaining `avatar` is maintained for backward compatibility
    - Document the field synchronization behavior
    - _Requirements: 4.1, 4.4_

  - [x] 1.2 Ensure field synchronization logic is correct
    - Verify both fields are updated when either is provided
    - Ensure `profilePicture` takes priority when both are provided
    - Test that sync logic handles null/undefined values correctly
    - _Requirements: 4.3, 1.2_

  - [ ]* 1.3 Write property test for field synchronization
    - **Property 6: Field Synchronization on Update**
    - **Validates: Requirements 4.3**
    - Generate random profile picture URLs
    - Update user profile via API
    - Verify both `avatar` and `profilePicture` fields have identical values
    - _Requirements: 4.3_

- [ ] 2. Update mobile app avatar upload utility
  - [x] 2.1 Change avatar.ts to use profilePicture parameter
    - Update line 68 in `src/utils/avatar.ts`
    - Change `{ avatar: avatarUrl }` to `{ profilePicture: avatarUrl }`
    - Add comment explaining this updates the primary field
    - _Requirements: 3.1, 7.4_

  - [x] 2.2 Update upload success logging
    - Update console logs to reference `profilePicture` field
    - Ensure error messages are clear about which field failed
    - _Requirements: 3.1_

  - [ ]* 2.3 Write property test for mobile upload
    - **Property 1: Profile Picture Upload Updates Primary Field**
    - **Validates: Requirements 1.2, 3.1**
    - Generate random profile picture URLs
    - Simulate mobile app upload
    - Verify `profilePicture` field is updated in database
    - _Requirements: 1.2, 3.1_

- [ ] 3. Verify mobile app profile display logic
  - [x] 3.1 Review ProfileScreen.tsx display logic
    - Verify line 134 uses `user?.profilePicture || user?.avatar` fallback
    - Ensure default avatar is provided as final fallback
    - Add comment explaining the fallback order
    - _Requirements: 2.1, 2.3_

  - [x] 3.2 Check other components that display user avatars
    - Search for all uses of `user.avatar` or `user.profilePicture`
    - Ensure consistent fallback logic across all components
    - Update to use `profilePicture` as primary field
    - _Requirements: 2.1, 7.1_

  - [ ]* 3.3 Write property test for profile retrieval
    - **Property 2: Profile Retrieval Returns Primary Field**
    - **Validates: Requirements 1.3**
    - Generate random users with profile pictures
    - Retrieve profile via API
    - Verify response includes `profilePicture` field with correct URL
    - _Requirements: 1.3_

- [ ] 4. Add backward compatibility tests
  - [ ]* 4.1 Write property test for legacy data handling
    - **Property 3: Backward Compatibility with Existing Data**
    - **Validates: Requirements 1.4**
    - Generate users with various field combinations:
      - Only `avatar` populated
      - Only `profilePicture` populated
      - Both fields populated with same value
      - Both fields populated with different values (edge case)
    - Verify all cases return a valid profile picture URL
    - _Requirements: 1.4, 6.2_

  - [ ]* 4.2 Write unit test for default avatar
    - **Property 5: Default Avatar for Missing Pictures**
    - **Validates: Requirements 2.3**
    - Create user with no profile picture (both fields null)
    - Retrieve profile via API
    - Verify response includes a valid default avatar URL
    - _Requirements: 2.3_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Investigate and update web app (if needed)
  - [x] 6.1 Identify web app profile picture display logic
    - Search web app codebase for profile picture rendering
    - Document which field is currently used
    - _Requirements: 2.1, 7.2_

  - [x] 6.2 Identify web app profile picture upload logic
    - Search web app codebase for profile picture upload
    - Document which field is currently updated
    - _Requirements: 3.2_

  - [x] 6.3 Update web app to use profilePicture field
    - Update display components to use `profilePicture` as primary
    - Update upload logic to send `profilePicture` parameter
    - Add fallback to `avatar` for backward compatibility
    - _Requirements: 2.1, 3.2, 7.2_

  - [ ]* 6.4 Write integration test for cross-platform consistency
    - **Property 4: API Consistency Across Platforms**
    - **Validates: Requirements 2.1, 2.2, 5.1, 5.4**
    - Create user and update profile picture
    - Call multiple API endpoints (`/api/auth/me`, user search, etc.)
    - Verify all endpoints return same `profilePicture` URL
    - _Requirements: 2.1, 2.2, 5.1, 5.4_

- [ ] 7. Add API response validation tests
  - [ ]* 7.1 Write property test for update response
    - **Property 7: Update Response Includes New URL**
    - **Validates: Requirements 3.4**
    - Generate random profile picture URLs
    - Update user profile via API
    - Verify response includes updated `profilePicture` URL
    - _Requirements: 3.4, 5.3_

  - [ ]* 7.2 Write property test for change propagation
    - **Property 8: Changes Reflected Across All Endpoints**
    - **Validates: Requirements 3.3**
    - Update user profile picture
    - Call multiple API endpoints that return user data
    - Verify all subsequent calls reflect the new URL
    - _Requirements: 3.3_

- [ ] 8. Update API documentation
  - [x] 8.1 Document profilePicture as primary field
    - Update API documentation to specify `profilePicture` as authoritative
    - Mark `avatar` as deprecated but maintained for compatibility
    - Update request/response examples to use `profilePicture`
    - _Requirements: 4.4_

  - [x] 8.2 Add migration notes for existing clients
    - Document the field consolidation for developers
    - Provide migration guide for clients using `avatar` field
    - Explain backward compatibility guarantees
    - _Requirements: 6.1, 6.4_

- [ ] 9. Final checkpoint - Verify cross-platform consistency
  - Test profile picture upload from mobile app
  - Verify same picture appears on web app (if available)
  - Test profile picture upload from web app (if available)
  - Verify same picture appears on mobile app
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each property test should run minimum 100 iterations
- Backend changes should be deployed before client updates
- Web app investigation (Task 6) may reveal no changes are needed if web already uses `profilePicture`
- Field synchronization ensures backward compatibility during migration
- No database schema changes required - both fields remain in the schema
