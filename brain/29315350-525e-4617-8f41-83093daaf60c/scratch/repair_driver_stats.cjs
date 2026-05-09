const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Define Schemas manually
const WalletSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  availableBalance: { type: Number, default: 0 },
  lifetimeEarned: { type: Number, default: 0 },
  deliveryEarnings: { type: Number, default: 0 },
  deliveryTripsCompleted: { type: Number, default: 0 },
  userRole: String
});

const UserSchema = new mongoose.Schema({
  deliveryProfile: {
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  }
});

const DeliveryLogSchema = new mongoose.Schema({
  deliveryGuyId: mongoose.Schema.Types.ObjectId,
  shippingFee: Number
});

async function fix() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.atlas_URL);
    console.log('Connected.');

    const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    const DeliveryLog = mongoose.models.DeliveryLog || mongoose.model('DeliveryLog', DeliveryLogSchema);

    const logs = await DeliveryLog.find({});
    const driverStats = {};
    logs.forEach(log => {
      const id = log.deliveryGuyId.toString();
      if (!driverStats[id]) driverStats[id] = { trips: 0, earned: 0 };
      driverStats[id].trips += 1;
      driverStats[id].earned += (log.shippingFee * 0.8);
    });

    for (const [driverId, stats] of Object.entries(driverStats)) {
      console.log(`Fixing stats for driver ${driverId}...`);
      
      // Update User Profile
      await User.findByIdAndUpdate(driverId, {
        'deliveryProfile.totalDeliveries': stats.trips,
        'deliveryProfile.totalEarnings': stats.earned
      });

      // Update Wallet
      await Wallet.findOneAndUpdate(
        { userId: driverId },
        { 
          lifetimeEarned: stats.earned,
          deliveryEarnings: stats.earned,
          deliveryTripsCompleted: stats.trips
        }
      );
    }

    console.log('Stats repair complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fix();
