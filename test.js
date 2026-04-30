const mongoose = require(" mongoose\);
async function main() {
 await mongoose.connect(\mongodb://localhost:27017/ethiohub\);
 const Wallet = mongoose.model(\Wallet\);
 const Transaction = mongoose.model(\Transaction\);
 const wallets = await Wallet.find();
 console.log(\Wallets:\, wallets.length);
 wallets.forEach(w => console.log(w.userId, w.availableBalance));
 const transactions = await Transaction.find();
 console.log(\Transactions:\, transactions.length);
 transactions.forEach(t => console.log(t.type, t.amount));
 await mongoose.disconnect();
}
main().catch(e => console.error(e));
