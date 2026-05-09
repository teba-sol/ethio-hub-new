import mongoose from 'mongoose';

const uri = 'mongodb+srv://user2:S4664v3525!@cluster0.b9cyd.mongodb.net/ethio-craft-hub?retryWrites=true&w=majority&appName=Cluster0';

async function addIndex() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
      console.error("DB not connected");
      return;
  }
  
  console.log("Creating compound indexes...");
  await db.collection('users').createIndex({ role: 1, createdAt: -1 });
  await db.collection('users').createIndex({ role: 1, artisanStatus: 1, createdAt: -1 });
  await db.collection('users').createIndex({ role: 1, organizerStatus: 1, createdAt: -1 });
  await db.collection('users').createIndex({ role: 1, deliveryStatus: 1, createdAt: -1 });
  console.log("Indexes created successfully!");
  
  await mongoose.disconnect();
}

addIndex().catch(console.error);
