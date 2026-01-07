# Design Document

## Overview

This design implements a building-based signup flow where users search and select buildings instead of entering codes. The system handles public buildings (immediate access) and private buildings (document verification required) differently. Post-signup, the Home Screen displays the user's building with enrolled courses and a section to browse public buildings.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React Native)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  SignupScreen → BuildingSearchInput → HomeScreen (MyBuilding + Browse)  │
│                           ↓                                              │
│                    buildingStore (Zustand)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js/Express)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  GET  /api/buildings/search?q=query  → Search buildings                 │
│  GET  /api/buildings/public          → List public buildings            │
│  GET  /api/users/me/building         → Get user's building              │
│  GET  /api/users/me/enrolled-courses → Get enrolled courses             │
│  POST /api/auth/register             → Register (updated)               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### BuildingSearchInput Component
```typescript
interface Building {
  id: string;
  name: string;
  city: string;
  address: string;
  visibilityType: 'PUBLIC' | 'PRIVATE';
}
```

### API Endpoints

- `GET /api/buildings/search?q=query` - Search buildings by name/city
- `GET /api/buildings/public` - Get all public buildings
- `GET /api/users/me/enrolled-courses` - Get user's enrolled courses

## Data Models

Uses existing Prisma models: Building, User, SlotEnrollment, Course

## Correctness Properties

### Property 1: Building Search Returns Matching Results
*For any* search query string, all buildings returned by the search API should contain the query string in either their name or city (case-insensitive).
**Validates: Requirements 1.2, 6.1**

### Property 2: Search Results Only Include Active Buildings
*For any* building returned by the search API, the building should have `isActive = true` and `approvalStatus = 'ACTIVE'`.
**Validates: Requirements 6.3**

### Property 3: Public Building Signup Sets Correct Status
*For any* user who signs up with a public building, the resulting user record should have `approvalStatus = 'ACTIVE'` and `buildingId` set to the selected building.
**Validates: Requirements 2.2, 2.3**

### Property 4: Private Building Signup Sets Pending Status
*For any* user who signs up with a private building, the resulting user record should have `approvalStatus = 'PENDING_VERIFICATION'` and `buildingId` set to the selected building.
**Validates: Requirements 3.4, 3.5**

### Property 5: Browse Buildings Shows Only Public
*For any* building displayed in the Browse Buildings section, the building should have `visibilityType = 'PUBLIC'`.
**Validates: Requirements 5.1**

### Property 6: My Building Section Visibility
*For any* user with a non-null `buildingId`, the My Building section should be visible. *For any* user with null `buildingId`, the My Building section should be hidden.
**Validates: Requirements 4.1, 4.5**

### Property 7: Enrolled Courses Match User Enrollments
*For any* course displayed in the user's enrolled courses list, there should exist a confirmed `SlotEnrollment` record linking the user to a slot in that course.
**Validates: Requirements 4.4, 7.1**

## Error Handling

| Scenario | Handling |
|----------|----------|
| Building search API fails | Show "Unable to search buildings" |
| No buildings match search | Show "No buildings found" |
| Document upload fails | Show error, allow retry |

## Testing Strategy

- Unit tests for components
- Property-based tests using fast-check
- Integration tests for signup flows
