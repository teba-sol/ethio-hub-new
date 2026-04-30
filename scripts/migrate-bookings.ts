import mongoose from 'mongoose';
import { connectDB } from '../src/lib/mongodb';
import Booking from '../src/models/booking.model';

async function run() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Update all bookings that have missing or zero commission fields
    const result = await Booking.updateMany(
      {
        $or: [
          { adminCommission: { $exists: false } },
          { adminCommission: null },
          { organizerEarnings: { $exists: false } },
          { organizerEarnings: null },
          { commissionRate: { $exists: false } },
          { commissionRate: null }
        ]
      },
      {
        $set: {
          adminCommission: 0,
          organizerEarnings: 0,
          commissionRate: 0.10,
        }
      }
    );

    console.log('Migration completed');
    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    // Also verify the schema update
    const sample = await Booking.findOne().lean();
    console.log('Sample booking fields:', Object.keys(sample || {}));

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  }
}

run();
