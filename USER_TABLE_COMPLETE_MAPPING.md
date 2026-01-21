# User Table Complete Column Mapping

## Overview
The `users` table is the backbone of the authentication, authorization, and user management system. This document maps every column to its purpose, processes, and flows.

---

## 1. IDENTITY & AUTHENTICATION

### `id` (UUID, Primary Key)
- **Purpose**: Unique user identifier
- **Generated**: Automatically via `gen_random_uuid()`
- **Used In**: All relations, JWT tokens, API authentication
- **Process**: Created on registration, never changes

### `email` (VARCHAR(255), Unique, Indexed)
- **Purpose**: User login identifier and communication
- **Validation**: Must be unique, valid email format
- **Used In**: 
  - Login authentication
  - Password reset emails
  - Email verification
  - Notifications
- **Process**: 
  - Signup: Validated for uniqueness
  - Login: Used to find user record
  - Forgot Password: Used to send reset link

### `password` (VARCHAR(255))
- **Purpose**: Hashed password for authentication
- **Security**: 
  - Argon2id hash (mobile app)
  - BCrypt hash (web app - legacy)
  - Peppered with `PASSWORD_PEPPER` env variable
- **Used In**: Login verification
- **Process**:
  - Signup: Hashed with Argon2id before storage
  - Login: Verified using Argon2 or BCrypt
  - Reset: Updated via forgot password flow
  - Change: Updated via change password flow (requires current password)

### `name` (VARCHAR(100))
- **Purpose**: User's display name
- **Used In**: UI display, email greetings, avatar generation
- **Process**: 
  - Signup: Required field
  - Profile: Can be updated
  - Google OAuth: Extracted from Google profile

---

## 2. EMAIL VERIFICATION SYSTEM

### `emailVerified` (BOOLEAN, Default: false)
- **Purpose**: Tracks if user has verified their email
- **Used In**: Login gate (mobile users must verify before login)
- **Process**:
  - Signup: Set to `false`
  - Email Verification: Set to `true` when token is validated
  - Google OAuth: Set to `true` (pre-verified)
- **Flow**: User cannot login until `emailVerified = true` (mobile only)

### `verificationToken` (VARCHAR(255), Nullable)
- **Purpose**: Stores hashed email verification token
- **Security**: SHA-256 hash of UUID token
- **Used In**: Email verification deep link
- **Process**:
  - Signup: Generated as UUID, hashed with SHA-256, stored
  - Email: Raw token sent in verification link
  - Verification: Raw token hashed and compared with stored hash
  - Success: Set to `null` after verification
- **Expiry**: Linked to `verificationExpiry`

### `verificationExpiry` (TIMESTAMPTZ, Nullable)
- **Purpose**: Expiration timestamp for verification token
- **Duration**: 30 minutes from generation
- **Used In**: Token validation
- **Process**:
  - Signup: Set to `now() + 30 minutes`
  - Verification: Checked before accepting token
  - Expired: Token rejected, user must request new one
  - Success: Set to `null` after verification

---

## 3. PASSWORD RESET SYSTEM

### `resetToken` (VARCHAR(255), Nullable)
- **Purpose**: Stores hashed password reset token
- **Security**: SHA-256 hash of 32-byte random token
- **Used In**: Forgot password flow
- **Process**:
  - Forgot Password: Generated as random bytes, hashed with SHA-256, stored
  - Email: Raw token sent in reset link
  - Reset: Raw token hashed and compared with stored hash
  - Success: Set to `null` after password reset
- **Expiry**: Linked to `resetTokenExpiry`

### `resetTokenExpiry` (TIMESTAMPTZ, Nullable)
- **Purpose**: Expiration timestamp for reset token
- **Duration**: 15 minutes from generation
- **Used In**: Token validation
- **Process**:
  - Forgot Password: Set to `now() + 15 minutes`
  - Reset: Checked before accepting token
  - Expired: Token rejected, user must request new one
  - Success: Set to `null` after password reset

### `passwordChangedAt` (TIMESTAMPTZ, Default: CURRENT_TIMESTAMP)
- **Purpose**: Audit trail for password changes
- **Used In**: Security auditing, compliance
- **Process**: Updated whenever password is changed (reset or change password)

---

## 4. SECURITY & ACCOUNT PROTECTION

### `failedLoginAttempts` (SMALLINT, Default: 0)
- **Purpose**: Track consecutive failed login attempts
- **Used In**: Account lockout mechanism
- **Process**:
  - Login Failure: Incremented by 1
  - Login Success: Reset to 0
  - Threshold: 5 attempts triggers account lock

### `lastFailedLogin` (TIMESTAMPTZ, Nullable)
- **Purpose**: Timestamp of last failed login
- **Used In**: Security auditing, lockout tracking
- **Process**:
  - Login Failure: Updated to current timestamp
  - Login Success: Reset to `null`

### `isLockedUntil` (TIMESTAMPTZ, Nullable)
- **Purpose**: Account lockout expiration timestamp
- **Duration**: 10 