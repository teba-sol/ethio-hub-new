import mongoose, { Document, Schema } from 'mongoose';

export interface IHotel extends Document {
  name: string;
  address: string;
  rooms: {
    type: string;
    price: number;
    availability: number;
  }[];
  festival: mongoose.Schema.Types.ObjectId;
}

const HotelSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    rooms: [
      {
        type: { type: String, required: true },
        price: { type: Number, required: true },
        availability: { type: Number, required: true },
      },
    ],
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

export default mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);