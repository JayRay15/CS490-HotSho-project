import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const usersCollection = mongoose.connection.db.collection('users');

    // Check for duplicate emails
    console.log('=== Checking for DUPLICATE EMAILS ===');
    const emailDuplicates = await usersCollection.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: { id: '$_id', auth0Id: '$auth0Id' } } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (emailDuplicates.length > 0) {
      console.log('⚠️  DUPLICATE EMAILS FOUND:');
      emailDuplicates.forEach(d => {
        console.log(`  Email: ${d._id}`);
        d.docs.forEach(doc => console.log(`    - _id: ${doc.id}, auth0Id: ${doc.auth0Id}`));
      });
    } else {
      console.log('✅ No duplicate emails found');
    }

    // Check for duplicate auth0Ids
    console.log('\n=== Checking for DUPLICATE AUTH0IDs ===');
    const auth0Duplicates = await usersCollection.aggregate([
      { $group: { _id: '$auth0Id', count: { $sum: 1 }, docs: { $push: { id: '$_id', email: '$email' } } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (auth0Duplicates.length > 0) {
      console.log('⚠️  DUPLICATE AUTH0IDs FOUND:');
      auth0Duplicates.forEach(d => {
        console.log(`  auth0Id: ${d._id}`);
        d.docs.forEach(doc => console.log(`    - _id: ${doc.id}, email: ${doc.email}`));
      });
    } else {
      console.log('✅ No duplicate auth0Ids found');
    }

    // Check for null/undefined auth0Id
    console.log('\n=== Checking for NULL/MISSING AUTH0IDs ===');
    const nullAuth0 = await usersCollection.find({ 
      $or: [{ auth0Id: null }, { auth0Id: { $exists: false } }, { auth0Id: '' }] 
    }).toArray();

    if (nullAuth0.length > 0) {
      console.log('⚠️  USERS WITH MISSING auth0Id:');
      nullAuth0.forEach(u => console.log(`  - _id: ${u._id}, email: ${u.email}`));
    } else {
      console.log('✅ All users have auth0Id');
    }

    // List all users
    console.log('\n=== ALL USERS ===');
    const allUsers = await usersCollection.find({}, { 
      projection: { email: 1, auth0Id: 1, createdAt: 1 } 
    }).sort({ createdAt: -1 }).limit(20).toArray();

    console.log(`Showing last ${allUsers.length} users:`);
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email} | auth0Id: ${u.auth0Id?.substring(0, 20)}... | created: ${u.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDuplicates();
