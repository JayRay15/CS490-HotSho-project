/**
 * Test script to verify account deletion from both database and Clerk
 * Run this after deleting an account to verify it's gone from both systems
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { clerkClient } from '@clerk/express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import { User } from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

/**
 * Test account deletion - verify account is gone from both DB and Clerk
 */
async function testDeletion(email) {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Searching for account: ${email}`);
    
    // Check database
    const dbUser = await User.findOne({ email });
    if (dbUser) {
      console.log(`❌ FAIL: Account still exists in database!`);
      console.log(`   - ID: ${dbUser._id}`);
      console.log(`   - Auth0 ID: ${dbUser.auth0Id}`);
      console.log(`   - Name: ${dbUser.name}`);
      console.log(`   - Created: ${dbUser.createdAt}`);
      return false;
    } else {
      console.log(`✅ PASS: Account not found in database (correctly deleted)`);
    }

    // Check Clerk (search by email)
    try {
      console.log(`\n🔍 Searching Clerk for: ${email}`);
      const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });
      
      if (clerkUsers.data && clerkUsers.data.length > 0) {
        console.log(`❌ FAIL: Account still exists in Clerk!`);
        clerkUsers.data.forEach(u => {
          console.log(`   - Clerk ID: ${u.id}`);
          console.log(`   - Email: ${u.emailAddresses[0]?.emailAddress}`);
          console.log(`   - Created: ${new Date(u.createdAt).toLocaleString()}`);
        });
        return false;
      } else {
        console.log(`✅ PASS: Account not found in Clerk (correctly deleted)`);
      }
    } catch (clerkError) {
      if (clerkError.status === 404) {
        console.log(`✅ PASS: Account not found in Clerk (correctly deleted)`);
      } else {
        console.error(`⚠️  Error checking Clerk:`, clerkError.message);
      }
    }

    console.log(`\n✅ SUCCESS: Account "${email}" is fully deleted from both systems!\n`);
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    return false;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Get email from command line
const testEmail = process.argv[2];

if (!testEmail) {
  console.log('Usage: node test-deletion-complete.js <email>');
  console.log('Example: node test-deletion-complete.js manan121@gmail.com\n');
  process.exit(1);
}

testDeletion(testEmail);
