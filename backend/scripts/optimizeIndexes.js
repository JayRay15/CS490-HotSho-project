/**
 * Database Index Optimization Script
 * 
 * Creates and manages MongoDB indexes for optimal query performance.
 * Run this script after deployment or when adding new query patterns.
 * 
 * Usage: node scripts/optimizeIndexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Index definitions for each collection
const indexDefinitions = {
  users: [
    // Primary lookup by Clerk ID (unique)
    { fields: { clerkId: 1 }, options: { unique: true, sparse: true, name: 'clerkId_unique' } },
    // Email lookup
    { fields: { email: 1 }, options: { unique: true, sparse: true, name: 'email_unique' } },
    // Text search on name fields
    { fields: { 'profile.firstName': 'text', 'profile.lastName': 'text', 'profile.headline': 'text' }, 
      options: { name: 'user_text_search', weights: { 'profile.firstName': 10, 'profile.lastName': 10, 'profile.headline': 5 } } },
    // Timestamp for sorting
    { fields: { createdAt: -1 }, options: { name: 'createdAt_desc' } },
  ],
  
  jobs: [
    // Primary lookup by userId (most common query)
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + status (common filter)
    { fields: { userId: 1, status: 1 }, options: { name: 'userId_status' } },
    // Compound: userId + archived (listing queries)
    { fields: { userId: 1, archived: 1 }, options: { name: 'userId_archived' } },
    // Compound: userId + createdAt (sorted listings)
    { fields: { userId: 1, createdAt: -1 }, options: { name: 'userId_createdAt_desc' } },
    // Compound: userId + status + archived (filtered listings)
    { fields: { userId: 1, status: 1, archived: 1 }, options: { name: 'userId_status_archived' } },
    // Compound: userId + company (company filtering)
    { fields: { userId: 1, company: 1 }, options: { name: 'userId_company' } },
    // Text search on title, company, location
    { fields: { title: 'text', company: 'text', location: 'text' }, 
      options: { name: 'jobs_text_search', weights: { title: 10, company: 5, location: 3 } } },
    // Deadline queries
    { fields: { userId: 1, deadline: 1, status: 1 }, options: { name: 'userId_deadline_status' } },
    // Coordinates for geo queries
    { fields: { 'coordinates.lat': 1, 'coordinates.lng': 1 }, options: { name: 'coordinates', sparse: true } },
  ],
  
  interviews: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + jobId (job interviews)
    { fields: { userId: 1, jobId: 1 }, options: { name: 'userId_jobId' } },
    // Compound: userId + date (upcoming interviews)
    { fields: { userId: 1, date: 1 }, options: { name: 'userId_date' } },
    // Compound: userId + status
    { fields: { userId: 1, status: 1 }, options: { name: 'userId_status' } },
  ],
  
  resumes: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + isDefault
    { fields: { userId: 1, isDefault: 1 }, options: { name: 'userId_isDefault' } },
    // Compound: userId + createdAt
    { fields: { userId: 1, createdAt: -1 }, options: { name: 'userId_createdAt_desc' } },
  ],
  
  coverletters: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + jobId
    { fields: { userId: 1, jobId: 1 }, options: { name: 'userId_jobId' } },
    // Compound: userId + createdAt
    { fields: { userId: 1, createdAt: -1 }, options: { name: 'userId_createdAt_desc' } },
  ],
  
  goals: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + status
    { fields: { userId: 1, status: 1 }, options: { name: 'userId_status' } },
    // Compound: userId + category
    { fields: { userId: 1, category: 1 }, options: { name: 'userId_category' } },
    // Deadline queries
    { fields: { userId: 1, dueDate: 1 }, options: { name: 'userId_dueDate' } },
  ],
  
  contacts: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + company
    { fields: { userId: 1, company: 1 }, options: { name: 'userId_company' } },
    // Text search
    { fields: { name: 'text', company: 'text', title: 'text' }, 
      options: { name: 'contacts_text_search' } },
  ],
  
  geocodingcaches: [
    // Address lookup (unique)
    { fields: { address: 1 }, options: { unique: true, name: 'address_unique' } },
    // TTL index for cache expiration
    { fields: { createdAt: 1 }, options: { expireAfterSeconds: 2592000, name: 'cache_ttl' } }, // 30 days
  ],
  
  salarybenchmarkcaches: [
    // Lookup by job title and location
    { fields: { jobTitle: 1, location: 1 }, options: { name: 'jobTitle_location' } },
    // TTL index for cache expiration
    { fields: { createdAt: 1 }, options: { expireAfterSeconds: 604800, name: 'cache_ttl' } }, // 7 days
  ],
  
  responsetimepredictions: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + jobId
    { fields: { userId: 1, jobId: 1 }, options: { name: 'userId_jobId' } },
    // Compound: userId + createdAt
    { fields: { userId: 1, createdAt: -1 }, options: { name: 'userId_createdAt_desc' } },
  ],
  
  interviewpredictions: [
    // Primary lookup by userId
    { fields: { userId: 1 }, options: { name: 'userId' } },
    // Compound: userId + jobId
    { fields: { userId: 1, jobId: 1 }, options: { name: 'userId_jobId' } },
  ],
  
  apiusages: [
    // TTL index for cleanup
    { fields: { timestamp: 1 }, options: { expireAfterSeconds: 2592000, name: 'usage_ttl' } }, // 30 days
    // Aggregate queries by endpoint
    { fields: { endpoint: 1, timestamp: -1 }, options: { name: 'endpoint_timestamp' } },
  ],
};

// Connect to MongoDB
async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');
    return mongoose.connection.db;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// Create indexes for a collection
async function createIndexes(db, collectionName, indexes) {
  const collection = db.collection(collectionName);
  console.log(`\n📊 Processing collection: ${collectionName}`);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const { fields, options } of indexes) {
    try {
      // Check if index already exists
      const existingIndexes = await collection.indexes();
      const indexExists = existingIndexes.some(idx => idx.name === options.name);
      
      if (indexExists) {
        console.log(`   ⏭️  Index "${options.name}" already exists`);
        skipped++;
        continue;
      }
      
      // Create the index
      await collection.createIndex(fields, options);
      console.log(`   ✅ Created index "${options.name}"`);
      created++;
      
    } catch (err) {
      console.error(`   ❌ Error creating index "${options.name}":`, err.message);
      errors++;
    }
  }
  
  return { created, skipped, errors };
}

// List existing indexes
async function listIndexes(db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    const indexes = await collection.indexes();
    return indexes;
  } catch (err) {
    return [];
  }
}

// Get index statistics
async function getIndexStats(db, collectionName) {
  try {
    const collection = db.collection(collectionName);
    const stats = await collection.aggregate([{ $indexStats: {} }]).toArray();
    return stats;
  } catch (err) {
    return [];
  }
}

// Main optimization function
async function optimizeIndexes() {
  console.log('🚀 Starting Database Index Optimization\n');
  console.log('=' .repeat(50));
  
  const db = await connect();
  
  const summary = {
    totalCreated: 0,
    totalSkipped: 0,
    totalErrors: 0,
    collections: []
  };
  
  // Get list of collections
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  console.log(`\nFound ${collectionNames.length} collections in database`);
  
  // Process each collection
  for (const [collName, indexes] of Object.entries(indexDefinitions)) {
    if (collectionNames.includes(collName)) {
      const result = await createIndexes(db, collName, indexes);
      summary.totalCreated += result.created;
      summary.totalSkipped += result.skipped;
      summary.totalErrors += result.errors;
      summary.collections.push({
        name: collName,
        ...result
      });
    } else {
      console.log(`\n⚠️  Collection "${collName}" not found in database`);
    }
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📈 OPTIMIZATION SUMMARY\n');
  console.log(`   Created:  ${summary.totalCreated} indexes`);
  console.log(`   Skipped:  ${summary.totalSkipped} indexes (already exist)`);
  console.log(`   Errors:   ${summary.totalErrors} indexes`);
  
  // Show index statistics for key collections
  console.log('\n📊 INDEX STATISTICS FOR KEY COLLECTIONS:\n');
  
  for (const collName of ['jobs', 'users', 'interviews']) {
    if (collectionNames.includes(collName)) {
      const indexes = await listIndexes(db, collName);
      console.log(`   ${collName}: ${indexes.length} indexes`);
      indexes.forEach(idx => {
        if (idx.name !== '_id_') {
          console.log(`      - ${idx.name}: ${JSON.stringify(idx.key)}`);
        }
      });
    }
  }
  
  // Disconnect
  await mongoose.disconnect();
  console.log('\n✅ Optimization complete!');
}

// Run if called directly
optimizeIndexes().catch(console.error);

export { optimizeIndexes, indexDefinitions };
