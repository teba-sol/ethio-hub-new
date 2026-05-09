import mongoose from 'mongoose';

const uri = 'mongodb+srv://user2:S4664v3525!@cluster0.b9cyd.mongodb.net/ethio-craft-hub?retryWrites=true&w=majority&appName=Cluster0';

async function listIndexes() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    if (!db) return;
    
    const indexes = await db.collection('users').indexes();
    console.log(JSON.stringify(indexes, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

listIndexes();
