# Implementation Plan: Building Signup Flow

## Overview

Implement building search in signup, conditional document upload for private buildings, and My Building + Browse Buildings sections on Home Screen.

## Tasks

- [ ] 1. Create Backend Building Service and API
  - [ ] 1.1 Create building.service.js with searchBuildings and getPublicBuildings methods
    - Implement search by name/city with case-insensitive matching
    - Filter by isActive=true and approvalStatus='ACTIVE'
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 1.2 Create building.controller.js with search and public endpoints
    - GET /api/buildings/search?q=query
    - GET /api/buildings/public
    - _Requirements: 6.1, 6.4_
  - [ ] 1.3 Add building routes to backend router
    - _Requirements: 6.1_

- [ ] 2. Update Auth Service for Building-Based Signup
  - [ ] 2.1 Modify auth.service.js register method to accept buildingId instead of buildingCode
    - Set approvalStatus based on building visibilityType
    - PUBLIC → ACTIVE, PRIVATE → PENDING_VERIFICATION
    - _Requirements: 2.2, 2.3, 3.4, 3.5_

- [ ] 3. Create Enrolled Courses API
  - [ ] 3.1 Add getEnrolledCourses method to course.service.js
    - Query SlotEnrollment with status='CONFIRMED'
    - Include course details and building info
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 3.2 Add /api/users/me/enrolled-courses endpoint
    - _Requirements: 7.1_

- [ ] 4. Create BuildingSearchInput Component
  - [ ] 4.1 Create src/components/BuildingSearchInput.tsx
    - Searchable input with debounced API calls
    - Display building name, city, PUBLIC/PRIVATE badge
    - Handle selection and empty states
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 5. Update SignupScreen with Building Search
  - [ ] 5.1 Replace building code input with BuildingSearchInput
    - Remove buildingCode state, add selectedBuilding state
    - _Requirements: 1.1_
  - [ ] 5.2 Add conditional document upload for private buildings
    - Show document upload section when private building selected
    - Show explanation message for verification
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 5.3 Update signup API call to use buildingId
    - Pass buildingId and governmentIdUrl to register endpoint
    - _Requirements: 2.1, 3.4_

- [ ] 6. Create MyBuildingSection Component
  - [ ] 6.1 Create src/components/MyBuildingSection.tsx
    - Display building name, city, address
    - Show course count and enrolled courses list
    - Handle navigation to building courses
    - _Requirements: 4.2, 4.3, 4.4, 4.6_

- [ ] 7. Create BrowseBuildingsSection Component
  - [ ] 7.1 Create src/components/BrowseBuildingsSection.tsx
    - Display horizontal list of public building cards
    - Show name, city, PUBLIC badge
    - Include "See All" button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Update HomeScreen with Building Sections
  - [ ] 8.1 Add MyBuildingSection to HomeScreen
    - Fetch user's building and enrolled courses
    - Conditionally render based on user.buildingId
    - _Requirements: 4.1, 4.5_
  - [ ] 8.2 Add BrowseBuildingsSection to HomeScreen
    - Fetch public buildings from API
    - Place below MyBuildingSection
    - _Requirements: 5.1_

- [ ] 9. Create Building Store
  - [ ] 9.1 Create src/store/buildingStore.ts
    - Store user's building, public buildings, enrolled courses
    - Add fetch methods for each
    - _Requirements: 4.1, 5.1_

- [ ] 10. Checkpoint - Test Full Flow
  - Ensure all tests pass, ask the user if questions arise.
  - Test signup with public building
  - Test signup with private building + document
  - Test Home Screen sections

## Notes

- Backend changes are safe - new endpoints don't affect existing functionality
- SignupScreen changes replace building code with search - ensure backward compatibility
- HomeScreen changes add new sections without modifying existing ones
