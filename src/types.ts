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

export interface Product {
  id: string;
  name: string; // For backward compatibility
  name_en: string;
  name_am: string;
  description: string; // For backward compatibility
  description_en: string;
  description_am: string;
  culturalStory_en?: string;
  culturalStory_am?: string;
  price: number;
  category: string;
  artisanId: string;
  artisanName: string;
  images: string[];
  isVerified: boolean;
  rating: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  stock: number;
  sku: string;
  material?: string;
  material_en?: string;
  material_am?: string;
  careInstructions_en?: string;
  careInstructions_am?: string;
  isHandmade: boolean;
  productionTime: number;
  shippingLocations: string[];
  shippingCost: number;
  estimatedDelivery: string;
  returnPolicy: string;
  currency: string;
}

export interface RoomType {
  id: string;
  _id?: string;
  name: string; // For backward compatibility
  name_en: string;
  name_am: string;
  description: string; // For backward compatibility
  description_en: string;
  description_am: string;
  capacity: number;
  pricePerNight: number;
  availability: number;
  image: string;
  sqm: number;
  amenities: string[];
  bedType: string;
  initialAvailability?: number;
  bookedCount?: number;
  remaining?: number;
  isSoldOut?: boolean;
}

export interface FoodPackage {
  id: string;
  _id?: string;
  name: string; // For backward compatibility
  name_en: string;
  name_am: string;
  description: string; // For backward compatibility
  description_en: string;
  description_am: string;
  pricePerPerson: number;
  items: string[];
}

export interface HotelAccommodation {
  id: string;
  name: string; // For backward compatibility
  name_en: string;
  name_am: string;
  image: string;
  address: string;
  starRating: number;
  description: string; // For backward compatibility
  description_en: string;
  description_am: string;
  fullDescription: string; // For backward compatibility
  fullDescription_en: string;
  fullDescription_am: string;
  policies: string;
  checkInTime: string;
  checkOutTime: string;
  facilities: string[];
  rooms: RoomType[];
  gallery: string[];
}

export interface TransportOption {
  id: string;
  _id?: string;
  type: 'Private Car' | 'VIP SUV' | 'Shuttle Bus' | 'Luxury Coach' | 'Helicopter Transfer'; // For backward compatibility
  type_en: string;
  type_am: string;
  provider?: string;
  image: string;
  price: number;
  availability?: number;
  capacity?: number;
  features?: string[];
  description: string; // For backward compatibility
  description_en: string;
  description_am: string;
  pickupLocations?: string[];
  initialAvailability?: number;
  bookedCount?: number;
  remaining?: number;
  isSoldOut?: boolean;
}

export interface Festival {
  id: string;
  _id?: string;
  name: string; // For backward compatibility
  name_en: string;
  name_am: string;
  slug: string;
  startDate: string;
  endDate: string;
  locationName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  shortDescription: string; // For backward compatibility
  shortDescription_en: string;
  shortDescription_am: string;
  fullDescription: string; // For backward compatibility
  fullDescription_en: string;
  fullDescription_am: string;
  coverImage: string;
  gallery: string[];
  schedule: { day: number; title: string; activities: string }[];
  mainActivities: string;
  performances: string[];
  hotels: HotelAccommodation[];
  transportation: TransportOption[];
  foodPackages: Array<{ name: string; description: string; pricePerPerson: number; items: string[]; _id?: string }>;
  culturalServices: string[];
  baseTicketPrice?: number;
  vipTicketPrice?: number;
  earlyBirdPrice?: number;
  currency: string;
  cancellationPolicy: string;
  bookingTerms: string;
  safetyRules?: string;
  ageRestriction?: string;
  organizerId: string;
  isVerified: boolean;
  ticketsAvailable: number;
  ticketsSold?: number;
  revenue?: number;
  status: 'Draft' | 'Published' | 'Completed' | 'Cancelled';
  verificationStatus: 'Draft' | 'Pending Approval' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Not Submitted';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  isEditedAfterApproval?: boolean;
  reverificationRequested?: boolean;
  lastEditedAt?: string;
}

export interface Booking {
  id: string;
  userId: string;
  festivalId: string;
  hotelId?: string;
  roomId?: string;
  transportId?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Checked-in';
  totalPrice: number;
  bookingDate: string;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalPrice: number;
  orderDate: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  targetId: string; // Product or Festival ID
  targetName: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
}
