import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "tourist", "organizer", "artisan"],
      default: "tourist"
    },

    status: {
      type: String,
      enum: ["Active", "Suspended", "Banned", "Deleted"],
      default: "Active"
    },

    phone: {
      type: String,
      default: null
    },

    lastLogin: {
      type: Date,
      default: null
    },

    artisanStatus: {
      type: String,
      enum: ["Not Submitted", "Pending", "Under Review", "Approved", "Rejected", "Modification Requested"],
      default: "Not Submitted"
    },

    organizerStatus: {
      type: String,
      enum: ["Not Submitted", "Pending", "Under Review", "Approved", "Rejected", "Modification Requested"],
      default: "Not Submitted"
    },

    rejectionReason: {
      type: String,
    },

    // Organizer Profile Fields
    organizerProfile: {
      companyName: { type: String },
      phone: { type: String },
      website: { type: String },
      address: { type: String },
      bio: { type: String },
      avatar: { type: String },
      payoutMethod: { type: String, enum: ['bank', 'telebirr', 'chapa', null], default: null },
      bankName: { type: String },
      accountHolderName: { type: String },
      accountNumber: { type: String },
      isVerified: { type: Boolean, default: false },
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorSecret: { type: String, default: null },
      loginAlerts: { type: Boolean, default: false },
      notifications: {
        newBooking: { type: Boolean, default: true },
        newReview: { type: Boolean, default: true },
        payoutProcessed: { type: Boolean, default: true },
        eventReminders: { type: Boolean, default: false },
        emailFrequency: { type: String, enum: ['instant', 'daily', 'weekly'], default: 'instant' },
        smsNotifications: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: true },
      },
      preferences: {
        language: { type: String, default: 'English' },
        currency: { type: String, default: 'ETB' },
        timezone: { type: String, default: 'Africa/Addis_Ababa' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' },
        defaultLandingPage: { type: String, default: 'Overview' },
        darkMode: { type: Boolean, default: false },
      },
    },

    // Tourist Profile Fields
    touristProfile: {
      phone: { type: String },
      country: { type: String },
      nationality: { type: String },
      dateOfBirth: { type: String },
      profileImage: { type: String },
    },

    // Password reset fields
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },

    // Email verification fields
    isVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, index: true },
    emailVerificationTokenExpiry: { type: Date, default: null },
    emailVerificationResendWindowStart: { type: Date, default: null },
    emailVerificationResendCount: { type: Number, default: 0 },
    adminApprovalStatus: {
      type: String,
      enum: ["NOT_REQUIRED", "PENDING_ADMIN_APPROVAL", "APPROVED", "REJECTED"],
      default: "NOT_REQUIRED",
      index: true,
    },
    adminApprovalReviewedAt: { type: Date, default: null },
    adminApprovalReason: { type: String, default: null },
    reportsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true
  }
);

UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ artisanStatus: 1 });
UserSchema.index({ organizerStatus: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ email: 1 });

const User =
  mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
