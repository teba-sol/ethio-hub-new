export enum UserRole {
  TOURIST = 'tourist',
  ARTISAN = 'artisan',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
  DELIVERY = 'delivery'
}

export type ArtisanStatus = 'Not Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Modification Requested';
export type OrganizerStatus = 'Not Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Modification Requested';
export type DeliveryStatus = 'Not Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Modification Requested';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  suspensionReason?: string | null;
  suspendedAt?: string | null;
  isVerified: boolean;
  profileImage: string;
  artisanStatus?: ArtisanStatus;
  organizerStatus?: OrganizerStatus;
  deliveryStatus?: DeliveryStatus;
  organizerProfile?: {
    companyName?: string;
    phone?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatar?: string;
    payoutMethod?: string;
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    isVerified?: boolean;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    loginAlerts?: boolean;
    notifications?: {
      newBooking?: boolean;
      newReview?: boolean;
      payoutProcessed?: boolean;
      eventReminders?: boolean;
      emailFrequency?: string;
      smsNotifications?: boolean;
      pushNotifications?: boolean;
    };
    preferences?: {
      language?: string;
      currency?: string;
      timezone?: string;
      dateFormat?: string;
      defaultLandingPage?: string;
      darkMode?: boolean;
    };
  };
  touristProfile?: {
    phone?: string;
    country?: string;
    nationality?: string;
    bio?: string;
    profileImage?: string;
    interests?: string[];
    language?: string;
    currency?: string;
  };
  artisanProfile?: {
    companyName?: string;
    phone?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatar?: string;
    specialties?: string[];
    yearsOfExperience?: number;
  };
  deliveryProfile?: {
    phone?: string;
    vehicleType?: string;
    licensePlate?: string;
    bankName?: string;
    accountNumber?: string;
    telebirrNumber?: string;
    profileImage?: string;
    idDocument?: string;
    availabilityStatus?: string;
    totalDeliveries?: number;
    rating?: number;
    totalEarnings?: number;
  };
}
