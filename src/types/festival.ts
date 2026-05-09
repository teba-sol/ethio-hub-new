export interface RoomType {
  id: string;
  _id?: string;
  name: string;
  name_en: string;
  name_am: string;
  description: string;
  description_en: string;
  description_am: string;
  capacity: number;
  pricePerNight: number;
  availability: number;
  image: string;
  sqm: number;
  amenities: string[];
  bedType: string;
  tier: 'vip' | 'standard' | 'both';
  initialAvailability?: number;
  bookedCount?: number;
  remaining?: number;
  isSoldOut?: boolean;
}

export interface FoodPackage {
  id: string;
  _id?: string;
  name: string;
  name_en: string;
  name_am: string;
  description: string;
  description_en: string;
  description_am: string;
  pricePerPerson: number;
  items: string[];
}

export interface HotelAccommodation {
  id: string;
  name: string;
  name_en: string;
  name_am: string;
  image: string;
  address: string;
  starRating: number;
  description: string;
  description_en: string;
  description_am: string;
  fullDescription: string;
  fullDescription_en: string;
  fullDescription_am: string;
  policies: string;
  checkInTime: string;
  checkOutTime: string;
  facilities: string[];
  foodAndDrink?: string[];
  propertyType?: string;
  hotelServices?: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  hotelRules?: string[];
  gallery: string[];
  rooms: RoomType[];
}

export interface TransportOption {
  id: string;
  _id?: string;
  type: 'Private Car' | 'VIP SUV' | 'Shuttle Bus' | 'Luxury Coach' | 'Helicopter Transfer';
  type_en: string;
  type_am: string;
  provider?: string;
  image: string;
  price: number;
  availability?: number;
  capacity?: number;
  vipIncluded: boolean;
  features?: string[];
  description: string;
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
  name: string;
  name_en: string;
  name_am: string;
  slug: string;
  startDate: string;
  endDate: string;
  locationName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  shortDescription: string;
  shortDescription_en: string;
  shortDescription_am: string;
  fullDescription: string;
  fullDescription_en: string;
  fullDescription_am: string;
  coverImage: string;
  gallery: string[];
  schedule: Array<{
    day: number;
    title: string;
    title_en?: string;
    title_am?: string;
    activities: string;
    activities_en?: string;
    activities_am?: string;
    time?: string;
    performers?: string[];
  }>;
  mainActivities: string;
  performances: string[];
  hotels: HotelAccommodation[];
  transportation: TransportOption[];
  foodPackages: Array<{ name: string; description: string; pricePerPerson: number; items: string[]; _id?: string }>;
  culturalServices: string[];
  baseTicketPrice?: number;
  vipTicketPrice?: number;
  vipPerks?: string[];
  ticketTypes?: Array<{
    name: string;
    name_en?: string;
    name_am?: string;
    price: number;
    quantity?: number;
    available?: number;
    perks?: string[];
    benefits?: string[];
  }>;
  earlyBirdPrice?: number;
  currency: string;
  cancellationPolicy: string;
  bookingTerms: string;
  safetyRules?: string;
  ageRestriction?: string;
  policies?: {
    cancellation?: string;
    terms?: string;
    safety?: string;
    ageRestriction?: string;
    ageRestriction_en?: string;
    ageRestriction_am?: string;
    cancellation_en?: string;
    cancellation_am?: string;
    terms_en?: string;
    terms_am?: string;
    safety_en?: string;
    safety_am?: string;
  };
  pricing?: {
    basePrice?: number;
    standardPrice?: number;
    regularPrice?: number;
    vipPrice?: number;
    currency?: string;
    earlyBird?: number;
    earlyBirdDays?: number;
    earlyBirdDeadline?: string;
    groupDiscount?: number;
    vipIncludedHotels?: string[];
    vipIncludedTransport?: string[];
  };
  location?: {
    name?: string;
    name_en?: string;
    name_am?: string;
    address?: string;
    coordinates?: { lat?: number; lng?: number };
  };
  organizerId: string | { name: string; email?: string; _id?: string };
  organizer?: {
    _id: string;
    name: string;
    email: string;
  };
  isVerified: boolean;
  ticketsAvailable: number;
  totalCapacity?: number;
  capacity?: number;
  ticketsSold?: number;
  revenue?: number;
  createdAt?: string;
  updatedAt?: string;
  services?: {
    foodPackages?: FoodPackage[];
    culturalServices?: string[];
    culturalServices_en?: string[];
    culturalServices_am?: string[];
    specialAssistance?: string[];
    specialAssistance_en?: string[];
    specialAssistance_am?: string[];
    extras?: string[];
    extras_en?: string[];
    extras_am?: string[];
  };
  status: 'Draft' | 'Published' | 'Completed' | 'Cancelled';
  verificationStatus: 'Draft' | 'Pending Approval' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Not Submitted';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  isEditedAfterApproval?: boolean;
  reverificationRequested?: boolean;
  lastEditedAt?: string;
  type?: string;
}
