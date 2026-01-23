# Requirements Document

## Introduction

This specification addresses the profile picture inconsistency between the web and mobile applications. Currently, users report seeing different profile pictures across platforms due to the database having two separate fields (`avatar` and `profilePicture`) that are not consistently synchronized or used across all platforms.

## Glossary

- **System**: The complete application including web frontend, mobile app, and backend API
- **Backend**: The Node.js/Express API server that handles authentication and user profile management
- **Mobile_App**: The React Native mobile application
- **Web_App**: The web frontend application
- **User_Profile**: The user data stored in the database including profile picture information
- **Profile_Picture_URL**: The publicly accessible URL pointing to the user's profile picture
- **Avatar_Field**: The `avatar` column in the User database table
- **ProfilePicture_Field**: The `profilePicture` column in the User database table
- **Supabase_Storage**: The cloud storage service used to store uploaded profile pictures

## Requirements

### Requirement 1: Single Source of Truth for Profile Pictures

**User Story:** As a user, I want my profile picture to be the same across all platforms, so that my identity is consistent throughout the application.

#### Acceptance Criteria

1. THE System SHALL maintain a single authoritative field for storing profile picture URLs
2. WHEN a user uploads a profile picture, THE System SHALL store the URL in the authoritative field
3. WHEN a user's profile is retrieved, THE System SHALL return the profile picture from the authoritative field
4. THE System SHALL ensure backward compatibility with existing profile pictures stored in either field

### Requirement 2: Consistent Profile Picture Display

**User Story:** As a user, I want to see the same profile picture on both web and mobile apps, so that I have a consistent experience across platforms.

#### Acceptance Criteria

1. WHEN a user views their profile on the Mobile_App, THE System SHALL display the same profile picture as on the Web_App
2. WHEN a user views another user's profile, THE System SHALL display the same profile picture across all platforms
3. WHEN a profile picture is not available, THE System SHALL display a consistent default avatar across all platforms

### Requirement 3: Profile Picture Upload Synchronization

**User Story:** As a user, I want my profile picture to update immediately across all platforms when I upload a new one, so that I don't see outdated pictures.

#### Acceptance Criteria

1. WHEN a user uploads a profile picture from the Mobile_App, THE Backend SHALL update the authoritative profile picture field
2. WHEN a user uploads a profile picture from the Web_App, THE Backend SHALL update the authoritative profile picture field
3. WHEN a profile picture is updated, THE Backend SHALL ensure the change is reflected in all API responses
4. WHEN a profile picture upload completes, THE System SHALL return the updated profile picture URL to the client

### Requirement 4: Database Field Consolidation

**User Story:** As a developer, I want a clear data model for profile pictures, so that the codebase is maintainable and consistent.

#### Acceptance Criteria

1. THE Backend SHALL designate one field as the primary profile picture field
2. THE Backend SHALL maintain the secondary field for backward compatibility during migration
3. WHEN updating a user profile, THE Backend SHALL synchronize both fields to ensure consistency
4. THE Backend SHALL document which field is the authoritative source

### Requirement 5: API Consistency

**User Story:** As a developer, I want the API to return consistent profile picture data, so that all clients can reliably display user profiles.

#### Acceptance Criteria

1. WHEN the Backend returns user profile data, THE System SHALL include the profile picture URL in a consistent field name
2. WHEN the Mobile_App requests user profile data, THE Backend SHALL return the same profile picture URL as for the Web_App
3. WHEN the Backend updates a user profile, THE System SHALL return the updated profile picture URL in the response
4. THE Backend SHALL ensure the `/api/auth/me` endpoint returns consistent profile picture data

### Requirement 6: Migration Safety

**User Story:** As a system administrator, I want existing profile pictures to remain accessible during the fix, so that no user data is lost.

#### Acceptance Criteria

1. WHEN the fix is deployed, THE System SHALL preserve all existing profile picture URLs
2. WHEN a user has a profile picture in either field, THE System SHALL display that picture
3. IF a user has different URLs in both fields, THE System SHALL prioritize the most recently updated field
4. THE System SHALL not delete or overwrite existing profile picture data without explicit migration

### Requirement 7: Client-Side Consistency

**User Story:** As a developer, I want the mobile and web clients to use the same field for displaying profile pictures, so that the codebase is consistent.

#### Acceptance Criteria

1. THE Mobile_App SHALL use the authoritative profile picture field for display
2. THE Web_App SHALL use the authoritative profile picture field for display
3. WHEN displaying a user profile, THE Mobile_App SHALL not need fallback logic between multiple fields
4. THE Mobile_App SHALL update the correct field when uploading a new profile picture
