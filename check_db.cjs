const mongoose = require('mongoose');

const uri = 'mongodb+srv://user2:S4664v3525!@cluster0.b9cyd.mongodb.net/ethio-craft-hub?retryWrites=true&w=majority&appName=Cluster0';

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const artisans = await db.collection('users').find({ role: 'artisan' }).limit(10).toArray();
  const artisanIds = artisans.map(a => a._id);
  
  const profiles = await db.collection('artisanprofiles').find({ userId: { $in: artisanIds } }).toArray();
  
  let totalBytes = 0;
  profiles.forEach(p => {
    totalBytes += JSON.stringify(p).length;
  });
  
  console.log(`Artisan count: ${artisans.length}`);
  console.log(`Profile count: ${profiles.length}`);
  console.log(`Total profile data size: ${totalBytes} bytes`);
  
  await mongoose.disconnect();
}

check().catch(console.error);
