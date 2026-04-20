export enum UserRole {
  TOURIST = 'tourist',
  ARTISAN = 'artisan',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

export type ArtisanStatus = 'Not Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Modification Requested';
export type OrganizerStatus = 'Not Submitted' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Modification Requested';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  profileImage: string;
  artisanStatus?: ArtisanStatus;
  organizerStatus?: OrganizerStatus;
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
}

export interface Product {
  id: string;
  name: string;
  description: string;
  culturalStory: string;
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
  material: string;
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
  name: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  availability: number;
  image: string;
  sqm: number;
  amenities: string[];
  bedType: string;
}

export interface FoodPackage {
  id: string;
  _id?: string;
  name: string;
  description: string;
  pricePerPerson: number;
  items: string[];
}

export interface HotelAccommodation {
  id: string;
  name: string;
  image: string;
  address: string;
  starRating: number;
  description: string;
  fullDescription: string;
  policies: string;
  checkInTime: string;
  checkOutTime: string;
  facilities: string[];
  rooms: RoomType[];
  gallery: string[];
}

export interface TransportOption {
  id: string;
  type: 'Private Car' | 'VIP SUV' | 'Shuttle Bus' | 'Luxury Coach' | 'Helicopter Transfer';
  provider?: string;
  image: string;
  price: number;
  availability?: number;
  capacity?: number;
  features?: string[];
  description: string;
  pickupLocations?: string[];
}

export interface Festival {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  locationName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  gallery: string[];
  schedule: { day: number; title: string; activities: string }[];
  mainActivities: string;
  performances: string[];
  hotels: HotelAccommodation[];
  transportation: TransportOption[];
  foodPackages: string[];
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
  status: 'Draft' | 'Published' | 'Cancelled';
  verificationStatus: 'Not Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected';
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