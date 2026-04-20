import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodPackage {
  id?: number;
  name: string;
  description: string;
  pricePerPerson: number;
  items: string[];
}

export interface IService extends Document {
  foodPackages: IFoodPackage[];
  culturalServices: string[];
  specialAssistance: string[];
  extras: string[];
  festival: mongoose.Schema.Types.ObjectId;
}

const FoodPackageSchema: Schema = new Schema({
  id: { type: Number },
  name: { type: String },
  description: { type: String },
  pricePerPerson: { type: Number },
  items: [{ type: String }],
}, { _id: false });

const ServiceSchema: Schema = new Schema(
  {
    foodPackages: [FoodPackageSchema],
    culturalServices: [{ type: String }],
    specialAssistance: [{ type: String }],
    extras: [{ type: String }],
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

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
