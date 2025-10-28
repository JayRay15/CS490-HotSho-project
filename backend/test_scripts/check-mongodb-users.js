import mongoose from 'mongoose';
import 'dotenv/config';

// Import User model
import { User } from '../src/models/User.js';

async function checkUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    
    console.log(`📊 Total users in database: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 Users in database:');
      console.log('═'.repeat(80));
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log(`   Name:        ${user.name}`);
        console.log(`   Email:       ${user.email}`);
        console.log(`   Clerk ID:    ${user.auth0Id}`);
        console.log(`   Created:     ${user.createdAt}`);
        console.log(`   Updated:     ${user.updatedAt}`);
        if (user.picture) {
          console.log(`   Picture:     ${user.picture}`);
        }
      });
      
      console.log('\n' + '═'.repeat(80));
    } else {
      console.log('⚠️  No users found in database');
    }

    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
