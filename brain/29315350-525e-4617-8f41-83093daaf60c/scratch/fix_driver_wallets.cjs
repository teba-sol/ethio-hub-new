const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Define Schemas manually to avoid importing complexity
const WalletSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  availableBalance: { type: Number, default: 0 },
  lifetimeEarned: { type: Number, default: 0 },
  deliveryEarnings: { type: Number, default: 0 },
  deliveryTripsCompleted: { type: Number, default: 0 },
  userRole: String
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
    const DeliveryLog = mongoose.models.DeliveryLog || mongoose.model('DeliveryLog', DeliveryLogSchema);

    const logs = await DeliveryLog.find({});
    console.log(`Found ${logs.length} delivery logs.`);

    const driverStats = {};
    logs.forEach(log => {
      const id = log.deliveryGuyId.toString();
      if (!driverStats[id]) driverStats[id] = { trips: 0, earned: 0 };
      driverStats[id].trips += 1;
      driverStats[id].earned += (log.shippingFee * 0.8);
    });

    for (const [driverId, stats] of Object.entries(driverStats)) {
      console.log(`Checking driver ${driverId}...`);
      let wallet = await Wallet.findOne({ userId: driverId });
      
      if (!wallet) {
        console.log(`Creating missing wallet for driver ${driverId} with ${stats.earned} ETB.`);
        wallet = new Wallet({
          userId: driverId,
          userRole: 'delivery',
          availableBalance: stats.earned,
          lifetimeEarned: stats.earned,
          deliveryEarnings: stats.earned,
          deliveryTripsCompleted: stats.trips
        });
        await wallet.save();
      } else if (wallet.availableBalance === 0 && stats.earned > 0 && (wallet.lifetimePaidOut || 0) === 0) {
        console.log(`Repairing 0 balance wallet for driver ${driverId} to ${stats.earned} ETB.`);
        wallet.availableBalance = stats.earned;
        wallet.lifetimeEarned = stats.earned;
        wallet.deliveryEarnings = stats.earned;
        wallet.deliveryTripsCompleted = stats.trips;
        await wallet.save();
      }
    }

    console.log('Fix complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fix();
