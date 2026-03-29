import mongoose, { Document, Schema } from 'mongoose';

export interface ITransportation extends Document {
  type: string;
  provider: string;
  price: number;
  availability: number;
  festival: mongoose.Schema.Types.ObjectId;
}

const TransportationSchema: Schema = new Schema(
  {
    type: { type: String, required: true },
    provider: { type: String, required: true },
    price: { type: Number, required: true },
    availability: { type: Number, required: true },
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

export default mongoose.models.Transportation || mongoose.model<ITransportation>('Transportation', TransportationSchema);