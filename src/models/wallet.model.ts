import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  userRole: 'artisan' | 'organizer' | 'admin';
  pendingBalance: number;
  availableBalance: number;
  lifetimeEarned: number;
  lifetimePaidOut: number;
  lifetimeRefunded: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    userRole: {
      type: String,
      enum: ['artisan', 'organizer', 'admin'],
      required: true,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimePaidOut: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
export default Wallet;