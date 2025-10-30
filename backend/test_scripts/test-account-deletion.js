import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import User model
import { User } from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

/**
 * Test script to verify account deletion is working correctly
 * This script will:
 * 1. List all users with their deletion status
 * 2. Check if any accounts are marked as deleted but still in database
 * 3. Show accounts that should have been deleted
 */
async function testAccountDeletion() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log('ℹ️  No users found in database');
      return;
    }

    // Check for users with isDeleted flag (should NOT exist with new implementation)
    const deletedFlaggedUsers = allUsers.filter(u => u.isDeleted === true);
    if (deletedFlaggedUsers.length > 0) {
      console.log(`⚠️  WARNING: Found ${deletedFlaggedUsers.length} users with isDeleted flag (should be 0):`);
      deletedFlaggedUsers.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u._id}, Auth0: ${u.auth0Id})`);
        console.log(`     isDeleted: ${u.isDeleted}, deletedAt: ${u.deletedAt}`);
      });
      console.log('\n🔧 These accounts should have been permanently deleted from database.');
      console.log('   To clean them up, run: User.deleteMany({ isDeleted: true })\n');
    } else {
      console.log('✅ No users with isDeleted flag found (correct behavior)\n');
    }

    // List all active users
    console.log('📋 Active users in database:');
    allUsers
      .filter(u => !u.isDeleted)
      .forEach((u, index) => {
        console.log(`${index + 1}. ${u.email}`);
        console.log(`   Name: ${u.name}`);
        console.log(`   ID: ${u._id}`);
        console.log(`   Auth0 ID: ${u.auth0Id}`);
        console.log(`   Created: ${u.createdAt}`);
        console.log(`   Has isDeleted field: ${u.isDeleted !== undefined}`);
        console.log('');
      });

    // Check for orphaned deleted accounts
    const orphanedDeleted = await User.countDocuments({ isDeleted: true });
    if (orphanedDeleted > 0) {
      console.log(`\n⚠️  Found ${orphanedDeleted} orphaned deleted account(s)`);
      console.log('   Run cleanup to remove them:\n');
      console.log('   const result = await User.deleteMany({ isDeleted: true });');
      console.log('   console.log(`Deleted ${result.deletedCount} accounts`);\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Clean up orphaned deleted accounts
 */
async function cleanupOrphanedAccounts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧹 Looking for orphaned deleted accounts...');
    const deletedUsers = await User.find({ isDeleted: true });
    
    if (deletedUsers.length === 0) {
      console.log('✅ No orphaned deleted accounts found');
      return;
    }

    console.log(`⚠️  Found ${deletedUsers.length} orphaned deleted account(s):`);
    deletedUsers.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u._id})`);
    });

    console.log('\n🗑️  Permanently deleting these accounts...');
    const result = await User.deleteMany({ isDeleted: true });
    console.log(`✅ Deleted ${result.deletedCount} account(s) from database\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run based on command line argument
const command = process.argv[2];

if (command === 'cleanup') {
  console.log('🧹 Running cleanup of orphaned deleted accounts...\n');
  cleanupOrphanedAccounts();
} else {
  console.log('🔍 Testing account deletion status...\n');
  testAccountDeletion();
}

// Add note about usage
if (!command) {
  console.log('\nℹ️  Usage:');
  console.log('   node test-account-deletion.js          # Check deletion status');
  console.log('   node test-account-deletion.js cleanup  # Clean up orphaned accounts\n');
}
