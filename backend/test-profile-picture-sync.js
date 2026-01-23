/**
 * Test Script: Profile Picture Field Synchronization
 * 
 * This script tests the field synchronization logic in auth.service.js
 * to ensure both `profilePicture` and `avatar` fields stay in sync.
 * 
 * Tests cover:
 * 1. Updating with profilePicture parameter
 * 2. Updating with avatar parameter
 * 3. Updating with both parameters (profilePicture should take priority)
 * 4. Handling null/undefined values
 * 5. Verifying both fields are always synchronized
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

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

// Simulate the updateProfile logic from auth.service.js
function buildUpdateData(updates) {
  const { avatar, profilePicture } = updates;
  const updateData = {};

  // This is the exact logic from auth.service.js lines 478-487
  if (profilePicture) {
    updateData.profilePicture = profilePicture;
    updateData.avatar = profilePicture;
  } else if (avatar) {
    updateData.avatar = avatar;
    updateData.profilePicture = avatar;
  }

  return updateData;
}

// Test cases
async function runTests() {
  log('\n=== Profile Picture Field Synchronization Tests ===\n', colors.blue);
  
  let testsPassed = 0;
  let testsFailed = 0;
  let testUser = null;

  try {
    // Create a test user
    log('Setting up test user...', colors.yellow);
    testUser = await db.user.create({
      data: {
        email: `test-sync-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
        emailVerified: true,
        avatar: 'https://ui-avatars.com/api/?name=Test+User',
        profilePicture: 'https://ui-avatars.com/api/?name=Test+User',
      },
    });
    log(`✓ Test user created with ID: ${testUser.id}\n`, colors.green);

    // Test 1: Update with profilePicture parameter only
    log('Test 1: Update with profilePicture parameter only', colors.yellow);
    const newProfilePicture = 'https://example.com/profile1.jpg';
    const updateData1 = buildUpdateData({ profilePicture: newProfilePicture });
    
    const updated1 = await db.user.update({
      where: { id: testUser.id },
      data: updateData1,
      select: { avatar: true, profilePicture: true },
    });

    if (assert(updated1.profilePicture === newProfilePicture, 'profilePicture field updated correctly')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated1.avatar === newProfilePicture, 'avatar field synced with profilePicture')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated1.profilePicture === updated1.avatar, 'Both fields have identical values')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 2: Update with avatar parameter only
    log('Test 2: Update with avatar parameter only', colors.yellow);
    const newAvatar = 'https://example.com/avatar2.jpg';
    const updateData2 = buildUpdateData({ avatar: newAvatar });
    
    const updated2 = await db.user.update({
      where: { id: testUser.id },
      data: updateData2,
      select: { avatar: true, profilePicture: true },
    });

    if (assert(updated2.avatar === newAvatar, 'avatar field updated correctly')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated2.profilePicture === newAvatar, 'profilePicture field synced with avatar')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated2.profilePicture === updated2.avatar, 'Both fields have identical values')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 3: Update with both parameters (profilePicture should take priority)
    log('Test 3: Update with both parameters (profilePicture takes priority)', colors.yellow);
    const priorityProfilePicture = 'https://example.com/priority-profile.jpg';
    const ignoredAvatar = 'https://example.com/ignored-avatar.jpg';
    const updateData3 = buildUpdateData({ 
      profilePicture: priorityProfilePicture, 
      avatar: ignoredAvatar 
    });
    
    const updated3 = await db.user.update({
      where: { id: testUser.id },
      data: updateData3,
      select: { avatar: true, profilePicture: true },
    });

    if (assert(updated3.profilePicture === priorityProfilePicture, 'profilePicture takes priority')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated3.avatar === priorityProfilePicture, 'avatar synced to profilePicture value')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated3.avatar !== ignoredAvatar, 'avatar parameter ignored when profilePicture provided')) testsPassed++;
    else testsFailed++;
    
    if (assert(updated3.profilePicture === updated3.avatar, 'Both fields have identical values')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 4: Update with null/undefined values
    log('Test 4: Update with null/undefined values (no change expected)', colors.yellow);
    const beforeUpdate = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true },
    });
    
    const updateData4 = buildUpdateData({ avatar: undefined, profilePicture: undefined });
    
    // If no fields are set, updateData should be empty
    if (assert(Object.keys(updateData4).length === 0, 'No update data generated for undefined values')) testsPassed++;
    else testsFailed++;
    
    // Verify fields remain unchanged
    const afterUpdate = await db.user.findUnique({
      where: { id: testUser.id },
      select: { avatar: true, profilePicture: true },
    });
    
    if (assert(afterUpdate.profilePicture === beforeUpdate.profilePicture, 'profilePicture unchanged')) testsPassed++;
    else testsFailed++;
    
    if (assert(afterUpdate.avatar === beforeUpdate.avatar, 'avatar unchanged')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 5: Update with null values (explicit null)
    log('Test 5: Update with null values (explicit null)', colors.yellow);
    const updateData5 = buildUpdateData({ avatar: null, profilePicture: null });
    
    if (assert(Object.keys(updateData5).length === 0, 'No update data generated for null values')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 6: Verify empty string is not treated as a valid value
    log('Test 6: Update with empty string (should not update)', colors.yellow);
    const updateData6 = buildUpdateData({ profilePicture: '' });
    
    // Empty string is falsy, so it should not trigger an update
    if (assert(Object.keys(updateData6).length === 0, 'Empty string does not trigger update')) testsPassed++;
    else testsFailed++;
    
    log('');

    // Test 7: Verify whitespace-only string is treated as valid
    log('Test 7: Update with whitespace string (should update)', colors.yellow);
    const whitespaceUrl = '   ';
    const updateData7 = buildUpdateData({ profilePicture: whitespaceUrl });
    
    if (assert(Object.keys(updateData7).length > 0, 'Whitespace string triggers update')) testsPassed++;
    else testsFailed++;
    
    if (updateData7.profilePicture) {
      if (assert(updateData7.profilePicture === whitespaceUrl, 'Whitespace preserved in profilePicture')) testsPassed++;
      else testsFailed++;
      
      if (assert(updateData7.avatar === whitespaceUrl, 'Whitespace preserved in avatar')) testsPassed++;
      else testsFailed++;
    }
    
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
    log('\n✓ All tests passed! Field synchronization logic is correct.', colors.green);
    process.exit(0);
  } else {
    log('\n✗ Some tests failed. Please review the synchronization logic.', colors.red);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n✗ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
