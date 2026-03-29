import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  foodPackages: string[];
  culturalServices: string[];
  specialAssistance: string[];
  extras: string[];
  festival: mongoose.Schema.Types.ObjectId;
}

const ServiceSchema: Schema = new Schema(
  {
    foodPackages: [{ type: String }],
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