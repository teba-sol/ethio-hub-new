import { connectDB } from '../src/lib/mongodb';
import Order from '../src/models/order.model';
import Payment from '../src/models/payment.model';
import Wallet from '../src/models/wallet.model';
import Transaction from '../src/models/transaction.model';
import User from '../src/models/User';
import mongoose from 'mongoose';

async function testDB() {
  try {
    console.log('Connecting to DB...');
    const conn = await connectDB();
    if (!conn) {
      console.error('Failed to connect to DB');
      process.exit(1);
    }
    console.log('Connected successfully to:', mongoose.connection.name);
    console.log('Database Name:', mongoose.connection.db?.databaseName || 'unknown');

    const orderCount = await Order.countDocuments();
    const paymentCount = await Payment.countDocuments();
    const walletCount = await Wallet.countDocuments();
    const transactionCount = await Transaction.countDocuments();
    const userCount = await User.countDocuments();

    console.log('Counts:');
    console.log('- Users:', userCount);
    console.log('- Orders:', orderCount);
    console.log('- Payments:', paymentCount);
    console.log('- Wallets:', walletCount);
    console.log('- Transactions:', transactionCount);

    if (userCount > 0) {
      const sampleUser = await User.findOne();
      console.log('Sample User ID:', sampleUser._id);
    }

    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testDB();
