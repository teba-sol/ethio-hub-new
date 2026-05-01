import mongoose, { Model, Schema } from "mongoose";

export type AdminActionSubject = "user" | "event" | "product";
export type AdminActionDecision = "approve" | "reject";

export interface IAdminActionToken extends mongoose.Document {
  tokenHash: string;
  subjectType: AdminActionSubject;
  subjectId: mongoose.Types.ObjectId;
  action: AdminActionDecision;
  emailTo: string;
  expiresAt: Date;
  usedAt: Date | null;
  meta?: Record<string, unknown>;
}

const AdminActionTokenSchema = new Schema<IAdminActionToken>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    subjectType: {
      type: String,
      enum: ["user", "event", "product"],
      required: true,
      index: true,
    },
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, enum: ["approve", "reject"], required: true },
    emailTo: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    usedAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AdminActionTokenSchema.index({ subjectType: 1, subjectId: 1, action: 1 });

const AdminActionToken: Model<IAdminActionToken> =
  mongoose.models.AdminActionToken ||
  mongoose.model<IAdminActionToken>("AdminActionToken", AdminActionTokenSchema);

export default AdminActionToken;
