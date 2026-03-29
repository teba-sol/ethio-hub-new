import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  day: number;
  title: string;
  activities: string;
  performers: string[];
  festival: mongoose.Schema.Types.ObjectId;
}

const ScheduleSchema: Schema = new Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    activities: { type: String, required: true },
    performers: [{ type: String }],
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

export default mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);