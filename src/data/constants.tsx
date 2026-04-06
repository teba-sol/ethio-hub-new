import { Product, Festival } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Handwoven Dorze Gabi',
    description: 'A traditional heavy cotton blanket with intricate, colorful borders woven by the Dorze people of the Gamo Highlands.',
    culturalStory: 'The Gabi is more than a blanket; it is a symbol of protection and respect. In Dorze culture, the patterns woven into the borders represent the weaver\'s lineage and the mountains they call home.',
    price: 145,
    category: 'Textiles',
    artisanId: 'a1',
    artisanName: 'Abebe Weaving Collective',
    images: ['https://images.unsplash.com/photo-1590736704728-f4730bb30770?q=80&w=1000&auto=format&fit=crop'],
    isVerified: true,
    rating: 4.9,
    status: 'Approved',
    stock: 12,
    sku: 'ETH-TX-001',
    material: '100% Organic Ethiopian Cotton',
    isHandmade: true,
    productionTime: 21,
    shippingLocations: ['Worldwide'],
    shippingCost: 25,
    estimatedDelivery: '10-14 days',
    returnPolicy: '30-day heritage guarantee.',
    currency: 'USD'
  },
  {
    id: 'p2',
    name: 'Hand-burnished Jebena Pot',
    description: 'Traditional clay coffee pot with a spherical base and narrow neck, hand-burnished to a deep obsidian sheen.',
    culturalStory: 'The Jebena is the heart of the Ethiopian coffee ceremony. Each pot is molded from the earth of the Rift Valley, representing the hospitality that is fundamental to Ethiopian life.',
    price: 65,
    category: 'Pottery',
    artisanId: 'a2',
    artisanName: 'Fikirte Ceramics',
    images: ['https://images.unsplash.com/photo-1544787210-2827448b303c?q=80&w=1000&auto=format&fit=crop'],
    isVerified: true,
    rating: 4.8,
    status: 'Approved',
    stock: 8,
    sku: 'ETH-PO-002',
    material: 'Local Red Clay',
    isHandmade: true,
    productionTime: 14,
    shippingLocations: ['Worldwide'],
    shippingCost: 30,
    estimatedDelivery: '14-21 days',
    returnPolicy: 'Breakage insurance included.',
    currency: 'USD'
  },
  {
    id: 'p3',
    name: 'Lalibela Silver Processional Cross',
    description: 'A stunning sterling silver pendant inspired by the rock-hewn processional crosses of Lalibela.',
    culturalStory: 'The geometric complexity of the Lalibela cross symbolizes the interconnectedness of faith, history, and geometry. No two crosses are exactly alike, reflecting the unique hand of the silversmith.',
    price: 120,
    category: 'Jewelry',
    artisanId: 'a3',
    artisanName: 'Solomon’s Heritage Silver',
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000&auto=format&fit=crop'],
    isVerified: true,
    rating: 4.7,
    status: 'Approved',
    stock: 5,
    sku: 'ETH-JW-003',
    material: '925 Sterling Silver',
    isHandmade: true,
    productionTime: 10,
    shippingLocations: ['Worldwide'],
    shippingCost: 15,
    estimatedDelivery: '7-10 days',
    returnPolicy: 'Full refund within 30 days.',
    currency: 'USD'
  },
  {
    id: 'p4',
    name: 'Harari Colorful Woven Basket',
    description: 'Vibrantly dyed grass baskets used for ceremonial displays in Harari households.',
    culturalStory: 'Known as "Mesob," these baskets are the pride of Harari women. The vibrant colors and patterns are a visual language of the walled city of Harar.',
    price: 85,
    category: 'Basketry',
    artisanId: 'a4',
    artisanName: 'Harar Women’s Guild',
    images: ['https://images.unsplash.com/photo-1605647540924-852290f6b0d5?q=80&w=1000&auto=format&fit=crop'],
    isVerified: true,
    rating: 5.0,
    status: 'Approved',
    stock: 20,
    sku: 'ETH-BK-004',
    material: 'Natural Grass & Organic Dyes',
    isHandmade: true,
    productionTime: 30,
    shippingLocations: ['Worldwide'],
    shippingCost: 20,
    estimatedDelivery: '14-20 days',
    returnPolicy: 'Exchanges only for handcrafted items.',
    currency: 'USD'
  }
];

export const MOCK_FESTIVALS: Festival[] = [
  {
    id: 'f1',
    name: 'Timket 2025 (Epiphany)',
    slug: 'timket-epiphany',
    startDate: '2025-01-19',
    endDate: '2025-01-21',
    locationName: 'Gondar, Ethiopia',
    address: 'Fasil Ghebbi, Gondar',
    coordinates: { lat: 12.6075, lng: 37.4611 },
    shortDescription: 'Witness the breathtaking outdoor baptismal ceremony in the historic pools of King Fasilides.',
    fullDescription: 'Timket is the most significant celebration in the Ethiopian Orthodox calendar. It commemorates the baptism of Jesus in the Jordan River. Thousands of pilgrims dressed in white gather to witness the Tabots (replicas of the Ark of the Covenant) being carried to water sources in a massive, vibrant procession.',
    coverImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1200&auto=format&fit=crop',
    gallery: [],
    schedule: [
      { day: 1, title: 'Ketera (The Eve)', activities: 'Procession of the Tabots from local churches to the baptismal site.' },
      { day: 2, title: 'Main Ceremony', activities: 'Early morning liturgy followed by the blessing and sprinkling of water.' },
      { day: 3, title: 'Kana Ze Galila', activities: 'The feast of the Wedding at Cana, celebrating Jesus\' first miracle.' }
    ],
    mainActivities: 'Processions, Hymns, Water Blessing, Traditional Dancing (Escesta)',
    performances: ['Gondar Cultural Troupe', 'Church Choirs'],
    hotels: [
      {
        id: 'h1',
        name: 'Goha Hotel Gondar',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
        address: 'Hilltop, Gondar',
        starRating: 4,
        description: 'Overlooking the imperial city of Gondar, Goha offers the best views of the castles.',
        fullDescription: 'Goha Hotel Gondar is a premier accommodation offering breathtaking views of the Fasil Ghebbi imperial compound. Located on the hills of Gondar, our hotel combines traditional Ethiopian hospitality with modern amenities. Guests enjoy spacious rooms, authentic local cuisine, and easy access to the city cultural sites.',
        policies: 'No smoking, 2 PM check-in.',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        facilities: ['Free WiFi', 'Swimming Pool', 'Restaurant', 'Free Parking', 'Room Service'],
        gallery: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop'
        ],
        roomTypes: [
          {
            id: 'r1',
            name: 'Deluxe Suite',
            description: 'Spacious suite with castle views and modern amenities.',
            capacity: 2,
            pricePerNight: 210,
            availabilityCount: 4,
            image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop',
            sqm: 45,
            amenities: ['Free WiFi', 'Air Conditioning', 'Mini Bar', 'TV'],
            bedType: 'King Size'
          },
          {
            id: 'r2',
            name: 'Superior Queen',
            description: 'Cozy room with traditional decor and city views.',
            capacity: 2,
            pricePerNight: 140,
            availabilityCount: 12,
            image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop',
            sqm: 28,
            amenities: ['Free WiFi', 'Air Conditioning', 'TV'],
            bedType: 'Queen Size'
          }
        ]
      }
    ],
    transportation: [
      {
        id: 't1',
        type: 'Private Car',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop',
        price: 85,
        availability: 5,
        description: 'Full day luxury sedan with professional driver. Includes bottled water and WiFi.',
        pickupLocations: ['Gondar Airport', 'Town Center', 'Goha Hotel']
      },
      {
        id: 't2',
        type: 'VIP SUV',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop',
        price: 150,
        availability: 3,
        description: 'Luxury SUV with premium leather seating, AC, and refreshments.',
        pickupLocations: ['Gondar Airport', 'All Hotels']
      }
    ],
    foodPackages: ['Traditional Buffet', 'Coffee Ceremony Access'],
    culturalServices: ['Local Guide', 'Ceremonial White Shamma Rental'],
    baseTicketPrice: 75,
    currency: 'USD',
    cancellationPolicy: 'Refundable up to 30 days before the event.',
    bookingTerms: 'Official Tourism Board pass included.',
    organizerId: 'o1',
    isVerified: true,
    ticketsAvailable: 120
  },
  {
    id: 'f2',
    name: 'Meskel 2025',
    slug: 'meskel-festival',
    startDate: '2025-09-27',
    endDate: '2025-09-28',
    locationName: 'Addis Ababa',
    address: 'Meskel Square, Addis Ababa',
    coordinates: { lat: 9.0105, lng: 38.7612 },
    shortDescription: 'The Festival of the Finding of the True Cross, marked by the lighting of the massive Demera bonfire.',
    fullDescription: 'Meskel has been celebrated for over 1,600 years. The central event is the burning of a large bonfire, or Demera, in the heart of Addis Ababa. It symbolizes the smoke that guided Queen Helena to the location of the True Cross in Jerusalem.',
    coverImage: 'https://images.unsplash.com/photo-1523805081446-eb9a40e2b728?q=80&w=1200&auto=format&fit=crop',
    gallery: [],
    schedule: [
      { day: 1, title: 'Demera Eve', activities: 'Lighting of the bonfire in Meskel Square amid singing and dancing.' },
      { day: 2, title: 'Meskel Day', activities: 'Feasting and visiting family to celebrate the finding of the cross.' }
    ],
    mainActivities: 'Bonfire lighting, Chants, Feasting',
    performances: ['Patriarchate Choir'],
    hotels: [
      {
        id: 'h2',
        name: 'Skylight Hotel',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000&auto=format&fit=crop',
        address: 'Bole, Addis Ababa',
        starRating: 5,
        description: 'Ultra-modern 5-star hotel near Bole International Airport.',
        policies: 'Passport required, 24h cancellation.',
        checkInTime: '15:00',
        checkOutTime: '12:00',
        roomTypes: [
          {
            id: 'r3',
            name: 'Executive Suite',
            description: 'Modern luxury with city views.',
            capacity: 2,
            pricePerNight: 350,
            availabilityCount: 8,
            image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop',
            sqm: 65
          }
        ]
      }
    ],
    transportation: [
      {
        id: 't2',
        type: 'VIP SUV',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop',
        price: 150,
        availability: 10,
        description: 'V8 Land Cruiser with professional escort and refreshments.',
        pickupLocations: ['Bole Airport', 'Hotel Lobby', 'Meskel Square']
      }
    ],
    foodPackages: ['Meskel Feast Package'],
    culturalServices: ['VIP Grandstand Seating'],
    baseTicketPrice: 45,
    currency: 'USD',
    cancellationPolicy: 'Non-refundable.',
    bookingTerms: 'Security check required at entry.',
    organizerId: 'o1',
    isVerified: true,
    ticketsAvailable: 450
  }
];
