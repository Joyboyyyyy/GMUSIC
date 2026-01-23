/**
 * Test Script: Profile Picture API Integration Tests
 * 
 * This script tests the complete API flow for profile picture updates
 * through the actual auth service and API endpoints.
 * 
 * Tests cover:
 * 1. API endpoint updates with profilePicture
 * 2. API endpoint updates with avatar
 * 3. Response format validation
 * 4. Database consistency after API calls
 * 5. Edge cases with special characters and long URLs
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import authService from './src/services/auth.service.js';

dotenv.config();

const db = new PrismaClient();

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (condition) {
    log(`✓ ${message}`, colors.green);
    return true;
  } else {
    log(`✗ ${message}`, colors.red);
    return false;
  }
}

// Test cases
async function runTests() {
  log('\n=== Profile Picture API Integration Tests ===\n', colors.blue);
  
  let testsPassed = 0;
  let testsFailed = 0;
  let testUser = null;

  try {
    // Create a test user
    log('Setting up test user...', colors.yellow);
    testUser = await db.user.create({
      data: {
        email: `test-api-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'API Test User',
        emailVerified: true,
        avatar: 'https://ui-avatars.com/api/?name=API+Test',
        profilePicture: 'https://ui-avatars.com/api/?name=API+Test',
      },
    });
    log(`✓ Test user created with ID: ${testUser.id}\n`, colors.green);

    // Test 1: Update via authService with profilePicture
    log('Test 1: Update via authService with profilePicture', colors.yellow);
    const newProfilePicture = 'https://example.com/new-profile.jpg';
    const result1 = await authService.updateProfile(testUser.id, {
      profilePicture: newProfilePicture,
    });

    if (assert(result1.profilePicture === newProfilePicture, 'Service returns updated profilePicture')) testsPassed++;
    else testsFailed++;
    
    if (assert(result1.avatar === newProfilePicture, 'Service returns synced avatar')) testsPassed++;
    else testsFailed++;

    // Verify in database
    const dbUser1 = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true },
    });

    if (assert(dbUser1.profilePicture === newProfilePicture, 'Database profilePicture updated')) testsPassed++;
    else testsFailed++;
    
    if (assert(dbUser1.avatar === newProfilePicture, 'Database avatar synced')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 2: Update via authService with avatar
    log('Test 2: Update via authService with avatar', colors.yellow);
    const newAvatar = 'https://example.com/new-avatar.jpg';
    const result2 = await authService.updateProfile(testUser.id, {
      avatar: newAvatar,
    });

    if (assert(result2.avatar === newAvatar, 'Service returns updated avatar')) testsPassed++;
    else testsFailed++;
    
    if (assert(result2.profilePicture === newAvatar, 'Service returns synced profilePicture')) testsPassed++;
    else testsFailed++;

    // Verify in database
    const dbUser2 = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true },
    });

    if (assert(dbUser2.avatar === newAvatar, 'Database avatar updated')) testsPassed++;
    else testsFailed++;
    
    if (assert(dbUser2.profilePicture === newAvatar, 'Database profilePicture synced')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 3: Update with both parameters (profilePicture priority)
    log('Test 3: Update with both parameters via authService', colors.yellow);
    const priorityUrl = 'https://example.com/priority.jpg';
    const ignoredUrl = 'https://example.com/ignored.jpg';
    const result3 = await authService.updateProfile(testUser.id, {
      profilePicture: priorityUrl,
      avatar: ignoredUrl,
    });

    if (assert(result3.profilePicture === priorityUrl, 'profilePicture takes priority in response')) testsPassed++;
    else testsFailed++;
    
    if (assert(result3.avatar === priorityUrl, 'avatar synced to profilePicture in response')) testsPassed++;
    else testsFailed++;

    // Verify in database
    const dbUser3 = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true },
    });

    if (assert(dbUser3.profilePicture === priorityUrl, 'Database has priority URL')) testsPassed++;
    else testsFailed++;
    
    if (assert(dbUser3.avatar === priorityUrl, 'Database avatar synced to priority URL')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 4: Update with URL containing special characters
    log('Test 4: Update with URL containing special characters', colors.yellow);
    const specialUrl = 'https://storage.example.com/images/user%20profile%20(1).jpg?token=abc123&size=large';
    const result4 = await authService.updateProfile(testUser.id, {
      profilePicture: specialUrl,
    });

    if (assert(result4.profilePicture === specialUrl, 'Special characters preserved in profilePicture')) testsPassed++;
    else testsFailed++;
    
    if (assert(result4.avatar === specialUrl, 'Special characters preserved in avatar')) testsPassed++;
    else testsFailed++;

    const dbUser4 = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true },
    });

    if (assert(dbUser4.profilePicture === specialUrl, 'Database preserves special characters in profilePicture')) testsPassed++;
    else testsFailed++;
    
    if (assert(dbUser4.avatar === specialUrl, 'Database preserves special characters in avatar')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 5: Update with very long URL
    log('Test 5: Update with very long URL', colors.yellow);
    const longUrl = 'https://storage.example.com/' + 'a'.repeat(500) + '.jpg';
    const result5 = await authService.updateProfile(testUser.id, {
      profilePicture: longUrl,
    });

    if (assert(result5.profilePicture === longUrl, 'Long URL preserved in profilePicture')) testsPassed++;
    else testsFailed++;
    
    if (assert(result5.avatar === longUrl, 'Long URL preserved in avatar')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 6: Update other fields without touching profile picture
    log('Test 6: Update other fields without affecting profile picture', colors.yellow);
    const beforeUpdate = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true, bio: true },
    });

    const result6 = await authService.updateProfile(testUser.id, {
      bio: 'Updated bio text',
    });

    if (assert(result6.profilePicture === beforeUpdate.profilePicture, 'profilePicture unchanged when not in update')) testsPassed++;
    else testsFailed++;
    
    if (assert(result6.avatar === beforeUpdate.avatar, 'avatar unchanged when not in update')) testsPassed++;
    else testsFailed++;
    
    if (assert(result6.bio === 'Updated bio text', 'Other fields updated correctly')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 7: Verify response includes both fields
    log('Test 7: Verify API response format', colors.yellow);
    const finalUrl = 'https://example.com/final-test.jpg';
    const result7 = await authService.updateProfile(testUser.id, {
      profilePicture: finalUrl,
    });

    if (assert('profilePicture' in result7, 'Response includes profilePicture field')) testsPassed++;
    else testsFailed++;
    
    if (assert('avatar' in result7, 'Response includes avatar field')) testsPassed++;
    else testsFailed++;
    
    if (assert(typeof result7.profilePicture === 'string', 'profilePicture is a string')) testsPassed++;
    else testsFailed++;
    
    if (assert(typeof result7.avatar === 'string', 'avatar is a string')) testsPassed++;
    else testsFailed++;
    
    log('');

  } catch (error) {
    log(`\n✗ Test execution failed: ${error.message}`, colors.red);
    console.error(error);
    testsFailed++;
  } finally {
    // Cleanup: Delete test user
    if (testUser) {
      try {
        await db.user.delete({ where: { id: testUser.id } });
        log(`\n✓ Test user cleaned up`, colors.green);
      } catch (error) {
        log(`\n✗ Failed to cleanup test user: ${error.message}`, colors.red);
      }
    }

    await db.$disconnect();
  }

  // Summary
  log('\n=== Test Summary ===', colors.blue);
  log(`Total Tests: ${testsPassed + testsFailed}`);
  log(`Passed: ${testsPassed}`, colors.green);
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
  
  if (testsFailed === 0) {
    log('\n✓ All API integration tests passed!', colors.green);
    log('✓ Field synchronization works correctly through the auth service.', colors.green);
    process.exit(0);
  } else {
    log('\n✗ Some tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
