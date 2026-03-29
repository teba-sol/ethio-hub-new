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

    artisanStatus: {
      type: String,
      enum: ["Not Submitted", "Pending", "Under Review", "Approved", "Rejected", "Modification Requested"]
    },

    organizerStatus: {
      type: String,
      enum: ["Not Submitted", "Pending", "Under Review", "Approved", "Rejected", "Modification Requested"]
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
  },
  {
    timestamps: true
  }
);

const User =
  mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
