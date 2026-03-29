import mongoose, { Document, Schema } from 'mongoose';

export interface IPricing extends Document {
  basePrice: number;
  vipPrice: number;
  currency: string;
  earlyBird: number;
  groupDiscount: number;
  festival: mongoose.Schema.Types.ObjectId;
}

const PricingSchema: Schema = new Schema(
  {
    basePrice: { type: Number, required: true },
    vipPrice: { type: Number },
    currency: { type: String, required: true },
    earlyBird: { type: Number },
    groupDiscount: { type: Number },
    festival: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Festival',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Pricing || mongoose.model<IPricing>('Pricing', PricingSchema);