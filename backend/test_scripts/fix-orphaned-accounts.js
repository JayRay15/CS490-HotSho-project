import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { clerkClient } from '@clerk/express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import { User } from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI or MONGO_URI not found in environment variables');
  process.exit(1);
}

/**
 * Fix orphaned accounts - accounts in DB without corresponding Clerk account
 * or Clerk accounts without DB records
 */
async function fixOrphanedAccounts(email) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Checking for orphaned accounts for: ${email}\n`);
    
    // Check database
    console.log('📊 Checking database...');
    const dbUser = await User.findOne({ email });
    if (dbUser) {
      console.log(`✅ Found user in database:`);
      console.log(`   - ID: ${dbUser._id}`);
      console.log(`   - Clerk ID: ${dbUser.auth0Id}`);
      console.log(`   - Name: ${dbUser.name}`);
      console.log(`   - Created: ${dbUser.createdAt}`);
    } else {
      console.log(`❌ No user found in database with email: ${email}`);
    }

    // Check Clerk
    console.log('\n📊 Checking Clerk...');
    let clerkUsers = null;
    try {
      clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });
      
      if (clerkUsers.data && clerkUsers.data.length > 0) {
        console.log(`✅ Found ${clerkUsers.data.length} user(s) in Clerk:`);
        clerkUsers.data.forEach((u, idx) => {
          console.log(`\n   User ${idx + 1}:`);
          console.log(`   - Clerk ID: ${u.id}`);
          console.log(`   - Email: ${u.emailAddresses[0]?.emailAddress}`);
          console.log(`   - Name: ${u.firstName} ${u.lastName}`);
          console.log(`   - Created: ${new Date(u.createdAt).toLocaleString()}`);
        });

        // Check for mismatch
        if (dbUser) {
          const clerkUser = clerkUsers.data.find(cu => cu.id === dbUser.auth0Id);
          if (!clerkUser) {
            console.log(`\n⚠️  MISMATCH DETECTED!`);
            console.log(`   Database has Clerk ID: ${dbUser.auth0Id}`);
            console.log(`   But Clerk has different ID(s): ${clerkUsers.data.map(u => u.id).join(', ')}`);
            console.log(`\n   This means the account was deleted and re-created in Clerk.`);
          }
        }
      } else {
        console.log(`❌ No user found in Clerk with email: ${email}`);
      }
    } catch (clerkError) {
      if (clerkError.status === 404) {
        console.log(`❌ No user found in Clerk with email: ${email}`);
      } else {
        console.error(`❌ Error checking Clerk:`, clerkError.message);
      }
    }

    // Diagnosis
    console.log('\n\n🔬 DIAGNOSIS:');
    console.log('═'.repeat(60));
    
    const hasDbRecord = !!dbUser;
    const hasClerkRecord = clerkUsers?.data && clerkUsers.data.length > 0;

    if (!hasDbRecord && !hasClerkRecord) {
      console.log('✅ CLEAN STATE: No orphaned accounts found.');
      console.log('   User can register normally.');
    } else if (hasDbRecord && !hasClerkRecord) {
      console.log('⚠️  ORPHANED DATABASE RECORD:');
      console.log('   Database has a record but Clerk doesn\'t.');
      console.log('   This blocks re-registration.');
      console.log('\n   FIX: Delete the database record:');
      console.log(`   await User.deleteOne({ email: "${email}" });`);
    } else if (!hasDbRecord && hasClerkRecord) {
      console.log('⚠️  ORPHANED CLERK ACCOUNT:');
      console.log('   Clerk has an account but database doesn\'t.');
      console.log('   User should be able to register, but may encounter issues.');
      console.log('\n   FIX: Delete the Clerk account:');
      clerkUsers.data.forEach(u => {
        console.log(`   await clerkClient.users.deleteUser("${u.id}");`);
      });
    } else {
      // Both exist - check if they match
      const clerkUser = clerkUsers.data.find(cu => cu.id === dbUser.auth0Id);
      if (clerkUser) {
        console.log('✅ PROPER STATE: Database and Clerk records match.');
        console.log('   Account is properly set up.');
      } else {
        console.log('❌ MISMATCHED RECORDS:');
        console.log('   Both systems have records but they don\'t match.');
        console.log('   Database points to a different Clerk ID than what exists.');
        console.log('\n   FIX: Delete the database record and let user re-register:');
        console.log(`   await User.deleteOne({ email: "${email}" });`);
      }
    }

    console.log('═'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

/**
 * Clean up orphaned database record for email
 */
async function cleanupDbRecord(email, confirm = false) {
  if (!confirm) {
    console.log('⚠️  This will permanently delete the database record.');
    console.log('   Run with --confirm flag to proceed.');
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const result = await User.deleteOne({ email });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Deleted database record for: ${email}`);
    } else {
      console.log(`ℹ️  No database record found for: ${email}`);
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
 * Clean up orphaned Clerk account
 */
async function cleanupClerkAccount(email, confirm = false) {
  if (!confirm) {
    console.log('⚠️  This will permanently delete the Clerk account.');
    console.log('   Run with --confirm flag to proceed.');
    return;
  }

  try {
    const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });
    
    if (clerkUsers.data && clerkUsers.data.length > 0) {
      for (const user of clerkUsers.data) {
        console.log(`🗑️  Deleting Clerk account: ${user.id}`);
        await clerkClient.users.deleteUser(user.id);
        console.log(`✅ Deleted Clerk account for: ${email}`);
      }
    } else {
      console.log(`ℹ️  No Clerk account found for: ${email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Parse command line arguments
const command = process.argv[2];
const email = process.argv[3];
const confirmFlag = process.argv.includes('--confirm');

if (!email) {
  console.log('Usage:');
  console.log('  node fix-orphaned-accounts.js check <email>');
  console.log('  node fix-orphaned-accounts.js cleanup-db <email> [--confirm]');
  console.log('  node fix-orphaned-accounts.js cleanup-clerk <email> [--confirm]');
  console.log('\nExamples:');
  console.log('  node fix-orphaned-accounts.js check manan121@gmail.com');
  console.log('  node fix-orphaned-accounts.js cleanup-db manan121@gmail.com --confirm');
  console.log('  node fix-orphaned-accounts.js cleanup-clerk manan121@gmail.com --confirm');
  process.exit(1);
}

switch (command) {
  case 'check':
    fixOrphanedAccounts(email);
    break;
  case 'cleanup-db':
    cleanupDbRecord(email, confirmFlag);
    break;
  case 'cleanup-clerk':
    cleanupClerkAccount(email, confirmFlag);
    break;
  default:
    console.log('Unknown command:', command);
    console.log('Use: check, cleanup-db, or cleanup-clerk');
    process.exit(1);
}
