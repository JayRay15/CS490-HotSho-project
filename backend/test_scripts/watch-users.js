import mongoose from 'mongoose';
import 'dotenv/config';

// Optional: filter by email passed as CLI arg
const emailFilter = process.argv[2];

async function watchUsers() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected. Watching changes on users collection...');

  const pipeline = [];
  if (emailFilter) {
    // Match inserts/updates where the document email equals the filter
    pipeline.push({ $match: { 'fullDocument.email': emailFilter } });
  }

  const changeStream = mongoose.connection.collection('users').watch(pipeline, { fullDocument: 'updateLookup' });

  const pretty = (obj) => JSON.stringify(obj, null, 2);

  changeStream.on('change', (change) => {
    const ts = new Date().toLocaleString();
    console.log(`\n📡 [${ts}] Change detected: ${change.operationType}`);
    if (change.fullDocument) {
      const { name, email, auth0Id, createdAt, updatedAt } = change.fullDocument;
      console.log(pretty({ name, email, auth0Id, createdAt, updatedAt }));
    } else {
      console.log(pretty(change));
    }
  });

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\n🔌 Closing change stream and connection...');
    await changeStream.close();
    await mongoose.connection.close();
    process.exit(0);
  });
}

watchUsers().catch((err) => {
  console.error('❌ Watch error:', err);
  process.exit(1);
});
