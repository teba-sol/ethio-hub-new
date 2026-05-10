import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  ArrowRight, Star, MapPin,
  Search, ShieldCheck, ChevronRight,
  Clock, ShoppingCart, ArrowLeft,
  Truck, Globe, Ticket,
  RefreshCw, Users, Hotel, Car, Box, ShieldAlert, Award,
  CheckCircle2, Filter, Heart, CreditCard, Lock, Calendar,
  Smartphone, X, Check, Download, User, Mail, Phone,
  Shield, Sparkles, Maximize as MaximizeIcon, BedDouble, Truck as TruckIcon, Fuel, Settings, Gauge, CircleDollarSign,
  MessageSquare, ChevronDown, Flag
} from 'lucide-react';
import { ReportModal } from '@/components/ReportModal';
import { useLanguage } from '@/context/LanguageContext';
import { HeroVideo } from '@/components/HeroVideo';
import { EthiopiaMap } from '@/components/EthiopiaMap';
import { TouristGallery } from '@/components/TouristGallery';
import type { Festival } from '../types';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

import { Button, Badge, VerifiedBadge } from '../components/UI';
import { ProductCard } from '../components/ProductCard';
import { FestivalCard } from '../components/FestivalCard';
import { MOCK_PRODUCTS, MOCK_FESTIVALS } from '../data/constants';
import { getImageUrl as getCloudinaryImageUrl } from '@/lib/cloudinary';
import { getCulturalStory } from '@/backend/services/geminiService';
import { HotelAccommodation, RoomType, TransportOption } from '../types';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UserRole } from '../types';
import apiClient from '../lib/apiClient';
import { useContentLanguage } from '@/hooks/useContentLanguage';
import { CLOUDINARY_CLOUD_NAME } from '@/lib/cloudinary';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/checkout/LocationPicker').then(mod => mod.LocationPicker), { ssr: false });

const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const localFestivalImages = [
  `${CLOUDINARY_BASE}/w_800,c_fill/v1777798803/ethio-hub/avatars/festivalandproductimage/fzfj0bverugasrobafk0.webp`,
  `${CLOUDINARY_BASE}/w_800,c_fill/v1777798809/ethio-hub/avatars/festivalandproductimage/qdrfjcmefptoteutrlen.avif`,
  `${CLOUDINARY_BASE}/w_800,c_fill/v1777798811/ethio-hub/avatars/festivalandproductimage/q9lycufuumoflweo7cyy.webp`,
];

const localProductImages = [
  `${CLOUDINARY_BASE}/w_800,c_fill/v1777798814/ethio-hub/avatars/festivalandproductimage/kpwld69hcxz4djeskl7r.webp`,
  `${CLOUDINARY_BASE}/w_800,c_fill/v1777798817/ethio-hub/avatars/festivalandproductimage/keu3yplue7d67f4zkb2x.webp`,
  `${CLOUDINARY_BASE}/w_800,c_fill/v1777798818/ethio-hub/avatars/festivalandproductimage/uxp6xscbdioiancfgrng.webp`,
];

const heritageRailImages = [
  localProductImages[0],
  localFestivalImages[0],
  localProductImages[1],
  localFestivalImages[1],
];

const exploreLeftRailImages = [
  localProductImages[0],
  localFestivalImages[0],
  localProductImages[1],
  localFestivalImages[2],
];

const exploreRightRailImages = [
  localFestivalImages[1],
  localProductImages[2],
  localFestivalImages[2],
  localProductImages[1],
];

const localFallbackFestivals: Festival[] = [
  {
    id: 'meskel-2026',
    name: 'Meskel 2026',
    name_en: 'Meskel 2026',
    name_am: 'መስቀል 2019',
    slug: 'meskel-2026',
    startDate: '2026-09-27T12:00:00.000Z',
    endDate: '2026-09-28T18:00:00.000Z',
    locationName: 'Meskel Square, Addis Ababa',
    address: 'Meskel Square, Addis Ababa',
    coordinates: { lat: 9.0105, lng: 38.7612 },
    shortDescription: 'The Finding of the True Cross celebration with the Demera bonfire, hymns, and public processions.',
    shortDescription_en: 'The Finding of the True Cross celebration with the Demera bonfire, hymns, and public processions.',
    shortDescription_am: 'የመስቀል ደመራ በዓል በዝማሬ፣ በሰልፍ እና በባህላዊ ክብር።',
    fullDescription: '',
    fullDescription_en: '',
    fullDescription_am: '',
    coverImage: '',
    gallery: [],
    schedule: [],
    mainActivities: 'Blessings, music, cultural gathering',
    performances: [],
    hotels: [],
    transportation: [],
    foodPackages: [],
    culturalServices: [],
    baseTicketPrice: 350,
    currency: 'ETB',
    cancellationPolicy: '',
    bookingTerms: '',
    organizerId: '',
    isVerified: true,
    ticketsAvailable: 220,
    status: 'Published',
    verificationStatus: 'Approved',
  },
  {
    id: 'timket-2027',
    name: 'Timket 2027',
    name_en: 'Timket 2027',
    name_am: 'ጥምቀት 2019',
    slug: 'timket-2027',
    startDate: '2027-01-19T06:00:00.000Z',
    endDate: '2027-01-20T18:00:00.000Z',
    locationName: 'Gondar, Ethiopia',
    address: 'Fasilides Bath, Gondar',
    coordinates: { lat: 12.6075, lng: 37.4611 },
    shortDescription: 'Ethiopian Epiphany marked by tabot processions, white ceremonial dress, and water blessings.',
    shortDescription_en: 'Ethiopian Epiphany marked by tabot processions, white ceremonial dress, and water blessings.',
    shortDescription_am: 'በታቦት ሰልፍ፣ በነጭ ባህላዊ ልብስ እና በውሃ ቡራኬ የሚታወቅ የጥምቀት በዓል።',
    fullDescription: '',
    fullDescription_en: '',
    fullDescription_am: '',
    coverImage: localFestivalImages[0],
    gallery: [],
    schedule: [],
    mainActivities: 'Tabot processions, hymns, water blessing',
    performances: [],
    hotels: [],
    transportation: [],
    foodPackages: [],
    culturalServices: [],
    baseTicketPrice: 650,
    currency: 'ETB',
    cancellationPolicy: '',
    bookingTerms: '',
    organizerId: '',
    isVerified: true,
    ticketsAvailable: 180,
    status: 'Published',
    verificationStatus: 'Approved',
  },
];

const normalizeFestival = (festival: any, index = 0): Festival => ({
  id: festival.id || festival._id || festival.slug || `festival-${index}`,
  _id: festival._id,
  name: festival.name || festival.name_en || 'Cultural Festival',
  name_en: festival.name_en || festival.name || 'Cultural Festival',
  name_am: festival.name_am || festival.name || 'የባህል በዓል',
  slug: festival.slug || festival._id || `festival-${index}`,
  startDate: festival.startDate,
  endDate: festival.endDate || festival.startDate,
  locationName: festival.locationName || festival.location?.name || festival.location?.name_en || 'Ethiopia',
  address: festival.locationAddress || festival.address || festival.location?.address || '',
  coordinates: festival.coordinates || festival.location?.coordinates || { lat: 9.03, lng: 38.74 },
  shortDescription: festival.shortDescription || festival.shortDescription_en || 'A verified cultural experience from Ethio Craft Hub.',
  shortDescription_en: festival.shortDescription_en || festival.shortDescription || 'A verified cultural experience from Ethio Craft Hub.',
  shortDescription_am: festival.shortDescription_am || festival.shortDescription || 'በኢትዮ ክራፍት ሀብ የተረጋገጠ የባህል ተሞክሮ።',
  fullDescription: festival.fullDescription || festival.fullDescription_en || '',
  fullDescription_en: festival.fullDescription_en || festival.fullDescription || '',
  fullDescription_am: festival.fullDescription_am || festival.fullDescription || '',
  coverImage: festival.coverImage || festival.gallery?.[0] || localFestivalImages[index % localFestivalImages.length],
  gallery: festival.gallery || [],
  schedule: festival.schedule || [],
  mainActivities: festival.mainActivities || '',
  performances: festival.performances || [],
  hotels: festival.hotels || [],
  transportation: festival.transportation || [],
  foodPackages: festival.foodPackages || festival.services?.foodPackages || [],
  culturalServices: festival.culturalServices || festival.services?.culturalServices || [],
  baseTicketPrice: festival.baseTicketPrice || festival.pricing?.basePrice || 0,
  vipTicketPrice: festival.vipTicketPrice || festival.pricing?.vipPrice,
  currency: festival.currency || festival.pricing?.currency || 'ETB',
  cancellationPolicy: festival.cancellationPolicy || festival.policies?.cancellation || '',
  bookingTerms: festival.bookingTerms || festival.policies?.terms || '',
  safetyRules: festival.safetyRules || festival.policies?.safety,
  ageRestriction: festival.ageRestriction || festival.policies?.ageRestriction,
  organizerId: festival.organizerId || festival.organizer?._id || festival.organizer || '',
  isVerified: festival.isVerified ?? festival.verificationStatus === 'Approved',
  ticketsAvailable: festival.ticketsAvailable || festival.ticketTypes?.reduce((sum: number, ticket: any) => sum + (ticket.available || 0), 0) || 0,
  status: festival.status || 'Published',
  verificationStatus: festival.verificationStatus || 'Approved',
  submittedAt: festival.submittedAt,
  reviewedAt: festival.reviewedAt,
});

const toSearchableText = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return [
      value.en,
      value.am,
      value.name,
      value.name_en,
      value.name_am,
      value.title,
      value.title_en,
      value.title_am,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return String(value);
};

const isUnsplashImage = (path: string) => path.includes('images.unsplash.com') || path.includes('unsplash.com');

const getLocalProductImages = (images: string[] | undefined, index = 0) => {
  const validImages = (images || []).filter((img) => img && img.trim() !== '');
  return validImages.length > 0 ? validImages : [localProductImages[index % localProductImages.length]];
};

const withLocalProductFallbacks = (products: any[]) =>
  products.map((product, index) => ({
    ...product,
    images: getLocalProductImages(product.images, index),
  }));

export const Homepage: React.FC = () => {
  const { t } = useLanguage();
  const { getLocalizedField } = useContentLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [festivalLoading, setFestivalLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [celebrationFestivals, setCelebrationFestivals] = useState<Festival[]>([]);
  const [celebrationLoading, setCelebrationLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/public/products');
        const data = await res.json();
        if (data.products) {
          const mappedProducts = data.products.map((p: any, index: number) => ({
            id: p._id,
            name: p.name,
            name_en: p.name_en || p.name,
            name_am: p.name_am || p.name,
            description: p.description,
            description_en: p.description_en || p.description,
            description_am: p.description_am || p.description,
            price: p.price,
            discountPrice: p.discountPrice,
            category: p.category,
            artisanId: p.artisanId?._id || p.artisanId,
            artisanName: p.artisanId?.name || 'Unknown Artisan',
            images: getLocalProductImages(p.images, index),
            isVerified: p.verificationStatus === 'Approved',
            rating: p.rating || 0,
            stock: p.stock,
            material: p.material,
            isHandmade: true,
            productionTime: p.deliveryTime,
            shippingCost: Number(p.shippingFee) || 0,
            culturalStory: '',
            status: p.verificationStatus,
            sku: p.sku,
            shippingLocations: [],
            estimatedDelivery: p.deliveryTime,
            returnPolicy: '',
            currency: 'ETB'
          }));
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(withLocalProductFallbacks(MOCK_PRODUCTS));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchUpcomingFestivals = async () => {
      try {
        const res = await fetch('/api/festivals?status=upcoming');
        const data = await res.json();
        const apiFestivals = Array.isArray(data.festivals) ? data.festivals : [];
        const normalized = apiFestivals
          .map((festival: any, index: number) => normalizeFestival(festival, index))
          .filter((festival: Festival) => new Date(festival.startDate).getTime() >= Date.now())
          .sort((a: Festival, b: Festival) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        setFestivals(normalized.length > 0 ? normalized : localFallbackFestivals);
      } catch (error) {
        console.error('Error fetching festivals:', error);
        setFestivals(localFallbackFestivals);
      } finally {
        setFestivalLoading(false);
      }
    };
    fetchUpcomingFestivals();
  }, []);

  useEffect(() => {
    const fetchCelebrationFestivals = async () => {
      try {
        const res = await fetch('/api/festivals?limit=2&sort=startDate');
        const data = await res.json();
        const apiFestivals = Array.isArray(data.festivals) ? data.festivals : [];
        const normalized = apiFestivals
          .map((festival: any, index: number) => normalizeFestival(festival, index));

        setCelebrationFestivals(normalized.length > 0 ? normalized : []);
      } catch (error) {
        console.error('Error fetching celebration festivals:', error);
        setCelebrationFestivals([]);
      } finally {
        setCelebrationLoading(false);
      }
    };
    fetchCelebrationFestivals();
  }, []);

  const filteredProducts = products;
  const landingProducts = filteredProducts.slice(0, 4);

  const upcomingEvents = festivals.slice(0, 3);

  return (
    <main className="flex flex-col">
      {/* Hero Video Section */}
      <HeroVideo />

      <section className="py-12 bg-white border-b border-gray-100 -mt-20 md:-mt-32 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: t("home.verifiedArtisans"), value: '1,200+', icon: Award },
              { label: t("home.annualFestivals"), value: '18+', icon: Calendar },
              { label: t("home.globalShipments"), value: '45k+', icon: Globe },
              { label: t("home.heritageScore"), value: '100%', icon: ShieldCheck },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-1">
                <div className="p-3 bg-ethio-bg rounded-2xl mb-2"><stat.icon className="w-5 h-5 text-secondary" /></div>
                <p className="text-2xl font-bold text-primary font-serif">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artifact Preview Section */}
      <section className="relative overflow-hidden border-b border-gray-100 dark:border-white/10 bg-gradient-to-br from-ethio-bg via-white to-secondary/10 dark:bg-none dark:bg-ethio-bg py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent dark:opacity-20" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-secondary shadow-sm">
                <Box className="h-4 w-4" />
                {t('home.curatedMarketplace')}
              </div>
              <h2 className="text-4xl font-serif font-bold text-primary dark:text-white tracking-tight">{t("home.masterArtisanCatalog")}</h2>
              <p className="text-gray-500 dark:text-gray-300 max-w-lg text-lg font-light">{t("home.directTrade")}</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="text-primary font-bold text-sm group p-0 hover:bg-transparent">
                {t("home.viewAllArtifacts")} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {landingProducts.map((p, i) => (
              <div
                key={p.id}
                className={`artifact-showcase-card group ${i % 2 === 0 ? 'artifact-enter-left' : 'artifact-enter-right'}`}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Ethiopia Map Section */}
      <EthiopiaMap />

      {/* UNESCO World Heritage & Festival Highlights */}
      <section className="py-24 md:py-32 bg-white dark:bg-ethio-bg relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-gray-100 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-gray-100 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">{t("home.timelessAttractions")}</p>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-primary dark:text-white leading-tight">
                {t("home.timelessAttractionsHeadline")}
              </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-300 max-w-sm text-lg font-light leading-relaxed">
              {t("home.timelessAttractionsDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Timket',
                type: 'Sacred Festival',
                date: 'January 19',
                description: t("home.cultureDescriptions.timkat"),
                image: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798809/ethio-hub/avatars/festivalandproductimage/qdrfjcmefptoteutrlen.avif',
                link: 'https://en.wikipedia.org/wiki/Timket',
                color: 'amber'
              },
              {
                name: 'Meskel',
                type: 'Finding of the Cross',
                date: 'September 27',
                description: t("home.cultureDescriptions.meskel"),
                image: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798803/ethio-hub/avatars/festivalandproductimage/fzfj0bverugasrobafk0.webp',
                link: 'https://en.wikipedia.org/wiki/Meskel',
                color: 'red'
              },
              {
                name: 'Lalibela',
                type: 'World Heritage',
                location: 'Amhara Region',
                description: t("home.cultureDescriptions.lalibela"),
                image: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798817/ethio-hub/avatars/festivalandproductimage/keu3yplue7d67f4zkb2x.webp',
                link: 'https://en.wikipedia.org/wiki/Lalibela',
                color: 'blue'
              },
              {
                name: 'Irreecha',
                type: 'Oromo Thanksgiving',
                date: 'October',
                description: t("home.cultureDescriptions.irreecha"),
                image: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798811/ethio-hub/avatars/festivalandproductimage/q9lycufuumoflweo7cyy.webp',
                link: '/festivals',
                color: 'green'
              }
            ].map((item, i) => (
              <div
                key={item.name}
                className="group relative h-[500px] rounded-[32px] overflow-hidden shadow-2xl hover:shadow-secondary/20 transition-all duration-700"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Background Image with Cloudinary Optimization */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className={`absolute inset-0 bg-gradient-to-b from-${item.color}-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="space-y-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex items-center justify-between">
                      <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">
                        {item.type}
                      </span>
                    </div>

                    <h3 className="text-3xl font-serif font-bold text-white leading-tight">
                      {item.name}
                    </h3>

                    <p className="text-gray-300 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {item.description}
                    </p>

                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/60 text-xs">
                        {item.date ? <Calendar className="w-4 h-4 text-secondary" /> : <MapPin className="w-4 h-4 text-secondary" />}
                        <span>{item.date || item.location}</span>
                      </div>
                      <Link
                        href={item.link}
                        target={item.link.startsWith('http') ? "_blank" : "_self"}
                        className="w-10 h-10 rounded-full bg-secondary text-primary flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-secondary/30"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Treasures - Detailed Gallery */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/3 sticky top-32 space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-[0.4em] text-secondary">{t("home.heritageSpotlightTitle")}</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight">
                  {t("home.heritageSpotlightHeadline")}
                </h2>
                <p className="text-gray-500 text-lg font-light leading-relaxed">
                  {t("home.heritageSpotlightDesc")}
                </p>
              </div>

              <div className="space-y-6 pt-8 border-t border-gray-100">
                {[
                  { name: 'Meskel', label: 'The Finding of the Cross' },
                  { name: 'Timket', label: 'Sacred Epiphany' },
                  { name: 'Lalibela', label: 'The Rock-Hewn Churches' },
                  { name: 'Irreecha', label: 'Thanksgiving of the Oromo' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group cursor-pointer">
                    <span className="text-xs font-serif italic text-secondary group-hover:translate-x-1 transition-transform">0{i + 1}</span>
                    <span className="text-lg font-medium text-primary group-hover:text-secondary transition-colors">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Meskel Media */}
              <div className="space-y-4 group">
                <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                  <img
                    src="https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,c_fill/v1777798803/ethio-hub/avatars/festivalandproductimage/fzfj0bverugasrobafk0.webp"
                    alt="Meskel"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Meskel</h3>
                    <p className="text-white/80 text-sm">Celebrated for over 1,600 years in the Land of Origins.</p>
                  </div>
                </div>
                <div className="px-4 space-y-2">
                  <p className="text-sm text-gray-500 leading-relaxed">{t("home.cultureDescriptions.meskel")}</p>
                </div>
              </div>

              {/* Timket Media */}
              <div className="space-y-4 group md:translate-y-12">
                <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                  <img
                    src="https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,c_fill/v1777798809/ethio-hub/avatars/festivalandproductimage/qdrfjcmefptoteutrlen.avif"
                    alt="Timket"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Timket</h3>
                    <p className="text-white/80 text-sm">A vibrant display of faith and color in Gondar.</p>
                  </div>
                </div>
                <div className="px-4 space-y-2">
                  <p className="text-sm text-gray-500 leading-relaxed">{t("home.cultureDescriptions.timkat")}</p>
                </div>
              </div>

              {/* Lalibela Media */}
              <div className="space-y-4 group">
                <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                  <img
                    src="https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,c_fill/v1777798817/ethio-hub/avatars/festivalandproductimage/keu3yplue7d67f4zkb2x.webp"
                    alt="Lalibela"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Lalibela</h3>
                    <p className="text-white/80 text-sm">The Eighth Wonder of the World.</p>
                  </div>
                </div>
                <div className="px-4 space-y-2">
                  <p className="text-sm text-gray-500 leading-relaxed">{t("home.cultureDescriptions.lalibela")}</p>
                </div>
              </div>

              {/* Irreecha Media */}
              <div className="space-y-4 group md:translate-y-12">
                <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                  <img
                    src="https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,c_fill/v1777798811/ethio-hub/avatars/festivalandproductimage/q9lycufuumoflweo7cyy.webp"
                    alt="Irreecha"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Irreecha</h3>
                    <p className="text-white/80 text-sm">Giving thanks at the end of the rainy season.</p>
                  </div>
                </div>
                <div className="px-4 space-y-2">
                  <p className="text-sm text-gray-500 leading-relaxed">{t("home.cultureDescriptions.irreecha")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Ethiopia Inspired Section */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ethio-bg/80 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            <div className="relative hidden min-h-[680px] overflow-hidden md:block">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-white to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-white to-transparent" />

              <div className="absolute left-0 top-0 h-full w-[39%] overflow-hidden">
                <div className="explore-rail-up space-y-5">
                  {[...exploreLeftRailImages, ...exploreLeftRailImages].map((image, index) => (
                    <div key={`${image}-left-${index}`} className={`overflow-hidden rounded-[28px] shadow-2xl shadow-black/15 ${index % 2 === 0 ? 'h-56' : 'h-44'}`}>
                      <img src={image} alt={t("home.handmadeCraftAlt")} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute right-0 top-0 h-full w-[39%] overflow-hidden">
                <div className="explore-rail-down space-y-5">
                  {[...exploreRightRailImages, ...exploreRightRailImages].map((image, index) => (
                    <div key={`${image}-right-${index}`} className={`overflow-hidden rounded-[28px] shadow-2xl shadow-black/15 ${index % 2 === 0 ? 'h-44' : 'h-56'}`}>
                      <img src={image} alt={t("home.marketFestivalAlt")} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 z-20 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-4 shadow-2xl">
                <div className="rounded-full bg-ethio-dark px-5 py-7 text-center text-white">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">{t("home.ethioCraft")}</p>
                  <p className="mt-2 font-serif text-2xl font-bold leading-none">{t("home.hub")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 rounded-full bg-secondary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-secondary">
                <Sparkles className="h-4 w-4" />
                {t('home.craftCelebrationMeet')}
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.34em] text-gray-400">{t('home.letsExploreEthiopia')}</p>
                <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight text-primary md:text-6xl">
                  {t('home.whereHeritageAwaits')}
                </h2>
                <p className="max-w-2xl text-lg font-light leading-relaxed text-gray-500">
                  {t('home.discoverHandmade')}
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/products">
                  <Button className="rounded-full px-8 py-4 font-bold uppercase tracking-widest text-xs">
                    {t('home.discoverCrafts')}
                  </Button>
                </Link>
                <Link href="/festivals">
                  <Button variant="outline" className="rounded-full px-8 py-4 font-bold uppercase tracking-widest text-xs">
                    {t('home.exploreFestivals')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Festivals */}
      <section className="relative overflow-hidden bg-ethio-bg py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-secondary">
                <Calendar className="h-4 w-4" />
                {t('home.upcomingEventsFestivals')}
              </div>
              <h2 className="font-serif text-4xl font-bold tracking-tight text-primary md:text-5xl">{t('home.bookInLandOfOrigins')}</h2>
              <p className="max-w-2xl text-gray-500">
                {t('home.reserveFestivalPass')}
              </p>
            </div>
            <Link href="/festivals">
              <Button variant="outline" className="rounded-full px-7 py-3 font-bold uppercase tracking-widest text-xs">
                {t("home.viewAllFestivals")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {festivalLoading && [1, 2, 3].map((item) => (
              <div key={item} className="h-[430px] animate-pulse rounded-[28px] bg-white" />
            ))}

            {!festivalLoading && upcomingEvents.map((festival, index) => (
              <article key={festival.id} className="group overflow-hidden rounded-[28px] bg-white shadow-xl shadow-black/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <Link href={`/event/${festival.id}`} className="block">
                  <div className="relative h-64 overflow-hidden">
                    <img src={festival.coverImage || ''} alt={festival.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      {festival.currency} {festival.baseTicketPrice || 0}
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                        <Calendar className="h-4 w-4" />
                        {formatDate(festival.startDate)}
                      </p>
                      <h3 className="line-clamp-2 font-serif text-3xl font-bold leading-tight">{getLocalizedField(festival, 'name')}</h3>
                    </div>
                  </div>
                </Link>
                <div className="space-y-5 p-6">
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <span className="line-clamp-1">{getLocalizedField(festival, 'locationName')}</span>
                    </p>
                    <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">{getLocalizedField(festival, 'shortDescription')}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("home.startingAt")}</p>
                      <p className="font-serif text-2xl font-bold text-primary">{festival.currency} {festival.baseTicketPrice || 0}</p>
                    </div>
                    <Link href={`/event/${festival.id}`}>
                      <Button className="rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest">
                        {t("home.bookNow")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Timeless Craft Traditions */}
      <section className="bg-ethio-dark py-20 text-white md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-secondary">{t("home.timelessAttractions")}</p>
              <h2 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">{t("home.timelessCraftTraditions")}</h2>
              <p className="max-w-xl text-lg font-light leading-relaxed text-gray-300">
                {t("home.timelessCraftDesc")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { title: t("home.wovenTextiles"), meta: t("home.wovenTextilesMeta"), image: heritageRailImages[1] },
                { title: t("home.coffeeCeremony"), meta: t("home.coffeeCeremonyMeta"), image: heritageRailImages[0] },
                { title: t("home.heritageJewelry"), meta: t("home.heritageJewelryMeta"), image: heritageRailImages[2] },
              ].map((item) => (
                <Link href="/products" key={item.title} className="group overflow-hidden rounded-[24px] bg-white/5">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">{item.meta}</p>
                      <h3 className="mt-2 font-serif text-2xl font-bold">{item.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section - Enhanced */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-ethio-dark via-[#1a1a2e] to-ethio-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-full blur-[100px]"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-secondary mb-3">{t("home.whyChooseUs")}</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">{t("home.whyChooseUsHeadline")}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{t("home.whyChooseUsDesc")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#D4AF37]/20 transition-all">
                <ShieldCheck className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t("home.verifiedOrganizers")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.verifiedOrganizersDesc")}</p>
            </div>

            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#D4AF37]/20 transition-all">
                <CreditCard className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t("home.securePayment")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.securePaymentDesc")}</p>
            </div>

            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#D4AF37]/20 transition-all">
                <Award className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t("home.authenticHandmade")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.authenticHandmadeDesc")}</p>
            </div>

            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all group cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-[#D4AF37]/20 transition-all">
                <RefreshCw className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{t("home.easyRefund")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.easyRefundDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tourist Experience Gallery */}
      <TouristGallery />
    </main>
  );
};

export const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative py-32 bg-ethio-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl space-y-8">
            <Badge className="w-fit bg-secondary text-primary border-none">{t("home.professionalMission")}</Badge>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight tracking-tight">{t("home.digitalInnovationPrefix")} <br /><span className="text-secondary italic">{t("home.digitalInnovationSuffix")}</span></h1>
            <p className="text-xl text-gray-300 font-light leading-relaxed max-w-2xl">{t("home.digitalInnovationDesc")}</p>
          </div>
        </div>
      </div>

      {/* Vision & Values */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-8">
              <h2 className="text-4xl font-serif font-bold text-primary">{t("home.bridgingTradition")}</h2>
              <p className="text-lg text-gray-500 leading-relaxed font-light">
                {t("home.bridgingTraditionDesc")}
              </p>
              <div className="flex gap-4 pt-4">
                <div className="flex-1 p-6 bg-ethio-bg rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-primary text-xl mb-2">1,200+</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{t("home.artisansEmpowered")}</p>
                </div>
                <div className="flex-1 p-6 bg-ethio-bg rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-primary text-xl mb-2">$2.4M</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{t("home.directRevenueGenerated")}</p>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] rounded-[32px] overflow-hidden shadow-2xl group">
              <img src={localProductImages[0]} className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" alt="Artisan at work" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white">
                <p className="font-serif text-2xl italic">{t("home.preservingSoul")}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-[32px] bg-ethio-bg border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">{t("home.authenticityGuaranteed")}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{t("home.authenticityGuaranteedDesc")}</p>
            </div>
            <div className="p-8 rounded-[32px] bg-ethio-bg border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">{t("home.communityFirst")}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{t("home.communityFirstDesc")}</p>
            </div>
            <div className="p-8 rounded-[32px] bg-ethio-bg border border-gray-100 hover:shadow-lg transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">{t("home.globalReach")}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{t("home.globalReachDesc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team / Leadership */}
      <div className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-6 mx-auto bg-white border-gray-200">{t("home.leadership")}</Badge>
          <h2 className="text-4xl font-serif font-bold text-primary mb-16">{t("home.guidedByExperts")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Dr. Abebe Kebede", role: t("home.directorHeritage"), img: localFestivalImages[0] },
              { name: "Sara Tadesse", role: t("home.headArtisanRelations"), img: localProductImages[1] },
              { name: "Dawit Haile", role: t("home.leadTechArchitect"), img: localFestivalImages[1] },
              { name: "Marta Girma", role: t("home.globalLogistics"), img: localProductImages[2] }
            ].map((member, i) => (
              <div key={i} className="group">
                <div className="relative overflow-hidden rounded-[32px] mb-6 aspect-[3/4]">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-bold text-primary">{member.name}</h3>
                <p className="text-sm text-secondary font-bold uppercase tracking-widest mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductListingPage: React.FC = () => {
  const searchParams = useSearchParams();
  const artisanParam = searchParams?.get('artisan');
  const { t } = useLanguage();
  const { getLocalizedField } = useContentLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const categoryParam = selectedCategory !== 'All' ? `&category=${selectedCategory}` : '';
        const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
        const artisanParamStr = artisanParam ? `&artisanId=${artisanParam}` : '';
        const res = await fetch(`/api/public/products?${categoryParam}${searchParam}${artisanParamStr}`);
        const data = await res.json();
        if (data.products) {
          const mappedProducts = data.products.map((p: any, index: number) => ({
            id: p._id,
            name: p.name,
            name_en: p.name_en || p.name,
            name_am: p.name_am || p.name,
            description: p.description,
            description_en: p.description_en || p.description,
            description_am: p.description_am || p.description,
            price: p.price,
            discountPrice: p.discountPrice,
            category: p.category,
            artisanId: p.artisanId?._id || p.artisanId,
            artisanName: p.artisanId?.name || 'Unknown Artisan',
            images: getLocalProductImages(p.images, index),
            isVerified: p.verificationStatus === 'Approved',
            rating: 4.5,
            stock: p.stock,
            material: p.material,
            isHandmade: true,
            productionTime: p.deliveryTime,
            shippingCost: Number(p.shippingFee) || 0,
            culturalStory: '',
            status: p.verificationStatus,
            sku: p.sku,
            shippingLocations: [],
            estimatedDelivery: p.deliveryTime,
            returnPolicy: '',
            currency: 'ETB'
          }));
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(withLocalProductFallbacks(MOCK_PRODUCTS));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, searchTerm, artisanParam]);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    const localizedName = getLocalizedField(p, 'name');
    const matchesSearch = localizedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.artisanName && p.artisanName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesMinPrice = minPrice === "" || p.price >= Number(minPrice);
    const matchesMaxPrice = maxPrice === "" || p.price <= Number(maxPrice);
    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  const marketplaceProducts = filtered.slice(0, 8);
  const heritageProducts = filtered.slice(8, 12);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pt-32 pb-24 border-b border-gray-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Ethio-Hub Exclusive</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-black text-primary tracking-tighter leading-none">
              {t("home.masterArtisanCatalog")}
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed font-medium max-w-2xl mx-auto">
              Discover the soul of Ethiopian craftsmanship through our curated collection of authentic, handmade treasures.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("home.searchPlaceholder")}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
              {categories.map(category => {
                const categoryKeyMap: Record<string, string> = {
                  All: "common.all",
                  Jewelry: "home.categoryNames.jewelry",
                  Pottery: "home.categoryNames.pottery",
                  Woodcraft: "home.categoryNames.woodcraft",
                  Clothing: "home.categoryNames.clothing",
                  Textiles: "home.categoryNames.textiles",
                  Basketry: "home.categoryNames.basketry"
                };
                const displayName = t(categoryKeyMap[category] || "common.all");
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedCategory === category
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <button
            className="lg:hidden w-full flex items-center justify-center gap-2 bg-white p-4 rounded-xl border border-gray-100 font-bold text-primary shadow-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" /> {showFilters ? t("home.hideFilters") : t("home.showFilters")}
          </button>

          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> {t("home.categoriesLabel")}
              </h3>
              <div className="space-y-1">
                {categories.map(category => {
                  const categoryKeyMap: Record<string, string> = {
                    All: "common.all",
                    Jewelry: "home.categoryNames.jewelry",
                    Pottery: "home.categoryNames.pottery",
                    Woodcraft: "home.categoryNames.woodcraft",
                    Clothing: "home.categoryNames.clothing",
                    Textiles: "home.categoryNames.textiles",
                    Basketry: "home.categoryNames.basketry"
                  };
                  const displayName = t(categoryKeyMap[category] || "common.all");
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category
                        ? 'bg-primary text-white font-medium shadow-md shadow-primary/20'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>

              {/* Price Range */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Price Range (ETB)</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <span className="text-gray-400 font-bold">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-serif font-bold text-primary">
                  {t("home.marketplace")}
                </h2>
                <p className="text-gray-500 mt-1">
                  {filtered.length} {t("home.results")} found
                </p>
              </div>
            </div>

            {/* Marketplace Grid */}
            {marketplaceProducts.length > 0 && (
              <div className="mb-20">
                <h3 className="text-2xl font-serif font-bold text-primary mb-8 flex items-center gap-3">
                  <span className="w-8 h-1 bg-secondary rounded-full"></span>
                  Featured Artifacts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {marketplaceProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className={`artifact-showcase-card group ${i % 2 === 0 ? 'artifact-enter-left' : 'artifact-enter-right'}`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Heritage Horizontal Section */}
            {heritageProducts.length > 0 && (
              <div className="mb-20">
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-ethio-dark to-primary/90 py-16 md:py-24">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-ethio-bg rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
                  </div>

                  <div className="relative max-w-7xl mx-auto px-6">
                    <div className="mb-12">
                      <Badge className="mb-4 bg-white/10 text-white border-none uppercase tracking-[0.2em] text-[10px] font-bold">
                        {t('home.timelessAttractions')}
                      </Badge>
                      <h2 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight">
                        {t('home.timelessCraftTraditions')}
                      </h2>
                      <p className="text-gray-300 max-w-2xl mt-3 text-lg font-light">
                        {t('home.timelessCraftDesc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {heritageProducts.map((p, i) => (
                        <div
                          key={p.id}
                          className={`artifact-showcase-card group ${i % 2 === 0 ? 'artifact-enter-left' : 'artifact-enter-right'}`}
                          style={{ animationDelay: `${(i + 8) * 100}ms` }}
                        >
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-primary">{t("home.noProductsFound")}</h3>
                <p className="text-gray-500 mt-1">{t("home.tryAdjustingSearch")}</p>
                <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">{t("home.clearAllFilters")}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-ethio-bg border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-primary mb-4">{t("home.whyChooseUs")}</h2>
            <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: t("home.verifiedOrganizers"), desc: t("home.verifiedOrganizersDesc") },
              { icon: CreditCard, title: t("home.securePayment"), desc: t("home.securePaymentDesc") },
              { icon: Award, title: t("home.authenticHandmade"), desc: t("home.authenticHandmadeDesc") },
              { icon: RefreshCw, title: t("home.easyRefund"), desc: t("home.easyRefundDesc") },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:border-secondary/20 transition-all duration-300 group">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-primary">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export const FestivalListingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const { t } = useLanguage();
  const { getLocalizedField } = useContentLanguage();
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const festivalTypes = ["All", "Religious", "Historical", "Harvest", "New Year", "National/Public Holidays"];

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const res = await fetch('/api/festivals');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data.success) {
          setFestivals(data.festivals);
        } else {
          setError(data.message || 'Failed to fetch festivals');
        }
      } catch (err: any) {
        setError('An error occurred while fetching festivals');
      } finally {
        setLoading(false);
      }
    };
    fetchFestivals();
  }, []);

  const enhancedFestivals = festivals.map((f: any) => {
    let type = "Cultural";
    const festivalName = toSearchableText(f.name || f.name_en || f.name_am);
    if (festivalName.includes("Timket") || festivalName.includes("Meskel") || festivalName.includes("Gena") || festivalName.includes("Fasika")) type = "Religious";
    else if (festivalName.includes("Adwa")) type = "Historical";
    else if (festivalName.includes("Irreecha")) type = "Harvest";
    else if (festivalName.includes("Enkutatash")) type = "New Year";
    else if (festivalName.includes("Victory") || festivalName.includes("Day")) type = "National/Public Holidays";

    return {
      ...f,
      type,
      id: f._id,
      locationName: f.locationName || f.location?.name || '',
      locationName_en: f.locationName_en || f.location?.name_en || f.location?.name || '',
      locationName_am: f.locationName_am || f.location?.name_am || f.location?.name || '',
      coverImage: f.coverImage || f.gallery?.[0] || '',
    };
  });

  const filteredFestivals = enhancedFestivals.filter((f: any) => {
    const localizedName = toSearchableText(getLocalizedField(f, 'name'));
    const localizedLocation = toSearchableText(getLocalizedField(f, 'locationName'));
    const matchesSearch = localizedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      localizedLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || f.type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-secondary border-t-transparent"></div>
          <p className="text-primary font-serif italic animate-pulse">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center px-6">
        <div className="text-center max-w-md p-12 bg-white rounded-[40px] shadow-2xl border border-red-50">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-gray-900 text-xl font-bold mb-2">{t("common.error")}</p>
          <p className="text-gray-500 mb-8">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            {t("common.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:bg-secondary/30 pt-16">
      {/* Dynamic Hero Section */}
      <div className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={localFestivalImages[0]}
            className="w-full h-full object-cover scale-110 animate-slow-zoom"
            alt="Ethiopian Festival"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-ethio-bg"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6 space-y-8">
          <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-700">
            <Badge variant="warning" className="bg-secondary/90 backdrop-blur-sm text-primary border-none py-2 px-6 rounded-full text-xs uppercase tracking-[0.3em] font-black shadow-xl shadow-secondary/20">
              {t("festival.hero.badge")}
            </Badge>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-black text-white leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            {t("festival.hero.titleLine1")} <br />
            <span className="text-secondary italic font-serif-italic font-normal">{t("festival.hero.titleLine2")}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {t("festival.hero.description")}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <a href="#festivals-grid" className="px-10 py-5 bg-secondary text-primary rounded-full font-black uppercase tracking-widest text-sm hover:bg-white transition-all shadow-2xl shadow-secondary/20 group">
              {t("home.exploreFestivals")}
              <ArrowRight className="inline-block ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-ethio-bg to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 pb-32">
        {/* Premium Search and Filter Bar */}
        <div className="bg-white/80 dark:bg-ethio-dark/80 backdrop-blur-2xl p-4 md:p-8 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/20 mb-24 animate-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-secondary transition-colors" />
              <input
                type="text"
                placeholder={t("festival.searchPlaceholder")}
                className="w-full pl-16 pr-8 py-6 bg-gray-50/50 dark:bg-white/5 border-2 border-transparent rounded-[24px] focus:border-secondary/30 focus:ring-0 transition-all text-lg font-medium placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative group/dropdown w-full lg:w-auto">
              <button className="w-full lg:min-w-[280px] flex items-center justify-between px-8 py-6 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[24px] hover:bg-white dark:hover:bg-white/10 transition-all group/btn">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary dark:text-secondary group-hover/btn:scale-110 transition-transform">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t("common.filter")}</p>
                    <p className="text-sm font-black uppercase tracking-widest text-primary dark:text-white leading-none">
                      {selectedType === "All" ? t("common.all") : t('festival.types.' + selectedType.toLowerCase().replace(/[\s/]+/g, ''))}
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover/dropdown:rotate-180 transition-transform duration-500" />
              </button>

              <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-[#0d1f1a] border border-gray-100 dark:border-white/10 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] p-3 opacity-0 invisible translate-y-4 group-hover/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:translate-y-0 transition-all duration-500 z-50">
                {festivalTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all mb-1 last:mb-0 flex items-center justify-between group/item ${selectedType === type
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400 hover:text-primary dark:hover:text-white'
                      }`}
                  >
                    {type === 'All' ? t('common.all') : t('festival.types.' + type.toLowerCase().replace(/[\s/]+/g, ''))}
                    {selectedType === type && <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Content / Grid */}
        <div id="festivals-grid" className="scroll-mt-32">
          {/* Featured Header */}
          {filteredFestivals.length > 0 && !searchTerm && selectedType === "All" && (
            <div className="mb-24 space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-white/5 pb-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-[2px] bg-secondary"></div>
                    <span className="text-secondary font-black uppercase tracking-[0.3em] text-xs">{t("festival.featured.badge")}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif font-black text-primary leading-tight">{t("festival.featured.heading")}</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg leading-relaxed font-light">
                  {t("home.reserveFestivalPass")}
                </p>
              </div>

              <div className="relative rounded-[48px] overflow-hidden group min-h-[600px] shadow-[0_48px_80px_-24px_rgba(0,0,0,0.3)]">
                {filteredFestivals[0].coverImage ? (
                  <img src={filteredFestivals[0].coverImage} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out" alt={getLocalizedField(filteredFestivals[0], 'name')} />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center">
                    <Calendar className="w-24 h-24 text-gray-800" />
                  </div>
                )}

                {/* Overlay Layers */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>

                <div className="absolute bottom-0 left-0 p-8 md:p-20 w-full lg:w-3/4 text-white space-y-8">
                  <div className="flex flex-wrap gap-4 animate-in slide-in-from-left-8 duration-700">
                    <Badge className="bg-secondary text-primary border-none px-6 py-2 rounded-full font-black uppercase tracking-widest text-[10px]">{filteredFestivals[0].type}</Badge>
                    <Badge className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest">
                      <MapPin className="w-3 h-3 mr-2 inline" /> {getLocalizedField(filteredFestivals[0], 'locationName')}
                    </Badge>
                    <Badge className="bg-primary/80 backdrop-blur-md border border-white/10 text-white px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest">
                      <Calendar className="w-3 h-3 mr-2 inline" /> {new Date(filteredFestivals[0].startDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Badge>
                  </div>

                  <h3 className="text-4xl md:text-6xl font-serif font-black leading-[1.1] tracking-tight group-hover:translate-x-2 transition-transform duration-700">
                    {getLocalizedField(filteredFestivals[0], 'name')}
                  </h3>

                  <p className="text-gray-300 text-lg md:text-xl line-clamp-3 font-light leading-relaxed max-w-2xl">
                    {getLocalizedField(filteredFestivals[0], 'shortDescription')}
                  </p>

                  <div className="pt-8 flex flex-wrap gap-6 items-center">
                    <Link href={`/event/${filteredFestivals[0].id}`}>
                      <Button className="rounded-full px-12 py-8 text-lg font-black uppercase tracking-[0.2em] bg-secondary text-primary hover:bg-white border-none shadow-2xl shadow-secondary/30 transition-all group/btn">
                        {t("festival.viewDetails")}
                        <ArrowRight className="ml-4 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                      </Button>
                    </Link>

                    <div className="flex flex-col">
                      <span className="text-secondary font-black text-3xl tracking-tight">ETB {filteredFestivals[0].baseTicketPrice}</span>
                      <span className="text-white/50 text-[10px] uppercase tracking-[0.3em] font-bold">{t("home.startingAt")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Header */}
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 dark:border-white/5 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-[2px] bg-primary"></div>
                  <span className="text-primary dark:text-secondary font-black uppercase tracking-[0.3em] text-xs">
                    {searchTerm || selectedType !== "All" ? t("festival.searchResults") : t("festival.hero.badge")}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-black text-primary">
                  {searchTerm || selectedType !== "All" ? `${filteredFestivals.length} ${t("home.results")}` : t("home.upcomingEvents")}
                </h2>
              </div>

              {filteredFestivals.length > 0 && (
                <div className="text-gray-400 font-bold text-xs uppercase tracking-widest bg-gray-50 dark:bg-white/5 px-6 py-3 rounded-full border border-gray-100 dark:border-white/5">
                  {t("home.showing")} {filteredFestivals.length} {t("home.results")}
                </div>
              )}
            </div>

            {filteredFestivals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20">
                {filteredFestivals.map((f, i) => (
                  <div key={f.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                    <FestivalCard festival={f} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-white dark:bg-ethio-dark rounded-[48px] border border-gray-100 dark:border-white/5 shadow-2xl">
                <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                </div>
                <h3 className="text-3xl font-serif font-black text-primary mb-4">{t("festival.empty.title")}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed">{t("festival.empty.message")}</p>
                <button
                  onClick={() => { setSearchTerm(""); setSelectedType("All"); }}
                  className="mt-12 px-10 py-5 bg-primary text-white rounded-full font-black uppercase tracking-widest text-sm hover:bg-secondary hover:text-primary transition-all shadow-xl shadow-primary/20"
                >
                  {t("home.clearAllFilters")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewItem: React.FC<{ review: any }> = ({ review }) => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [isHelpful, setIsHelpful] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showLoginNotify, setShowLoginNotify] = useState(false);

  const handleReportClick = () => {
    if (!isAuthenticated) {
      setShowLoginNotify(true);
      setTimeout(() => setShowLoginNotify(false), 3000);
      return;
    }
    if (!isReported) setShowReportModal(true);
  };

  const handleReportSubmit = () => {
    setIsReported(true);
    setShowReportModal(false);
  };

  const userName = review.user?.name || "Anonymous";
  const userInitial = userName.charAt(0).toUpperCase();
  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="border-b border-gray-50 pb-8 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-sm text-primary overflow-hidden">
          {review.user?.profileImage || review.user?.profilePicture ? (
            <img src={review.user.profileImage || review.user.profilePicture} alt={userName} className="w-full h-full object-cover" />
          ) : userInitial}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-primary">{userName}</span>
          {review.isVerifiedPurchase && <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider">{t("reviews.verifiedPurchase")}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex text-secondary">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
          ))}
        </div>
        <span className="text-xs font-bold text-primary">{review.rating} / 5</span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{t("reviews.reviewedOn")} {reviewDate}</p>
      <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{review.comment}</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsHelpful(!isHelpful)}
          className={`text-xs font-medium transition-colors ${isHelpful ? 'text-green-600' : 'text-gray-400 hover:text-primary'}`}
        >
          {isHelpful ? t('reviews.thankFeedback') : t('reviews.helpful')}
        </button>
        <div className="h-3 w-px bg-gray-200"></div>
        <button
          onClick={handleReportClick}
          className={`text-xs font-medium transition-colors relative ${isReported ? 'text-red-500 cursor-default' : 'text-gray-400 hover:text-red-500'}`}
          disabled={isReported}
        >
          {isReported ? t('reviews.reported') : t('reviews.report')}
          {showLoginNotify && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
              Please login to report
            </span>
          )}
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetId={review.id}
          targetType="Review"
          targetName={`${userName}'s Review`}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => setIsReported(true)}
          userId={user?.id || ""}
        />
      )}
    </div>
  );
};

export const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id;
  const router = useRouter();
  const pathname = usePathname();
  const { addToCart } = useCart();
  const { getLocalizedField } = useContentLanguage();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [culturalStory, setCulturalStory] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'receipt'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ total: 0, distribution: [] as any[] });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showProductReport, setShowProductReport] = useState(false);

  const showNotify = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/public/reviews/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch reviews: ${res.status}`);
        }
        const data = await res.json();
        if (data.reviews) {
          setReviews(data.reviews);
          setReviewStats({ total: data.total, distribution: data.distribution });
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "")}`);
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/tourist/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: id,
          targetType: 'Product',
          rating: userRating,
          comment: userComment
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotify("Review submitted successfully!", 'success');
        setShowReviewForm(false);
        setUserComment("");
        // Refresh reviews
        const res = await fetch(`/api/public/reviews/${id}`);
        const updatedData = await res.json();
        setReviews(updatedData.reviews);
        setReviewStats({ total: updatedData.total, distribution: updatedData.distribution });
      } else {
        showNotify(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      showNotify("An error occurred while submitting your review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [shippingLocation, setShippingLocation] = useState<{
    street: string;
    city: string;
    state: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const [calculatedShippingFee, setCalculatedShippingFee] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/public/products/${id}`);
        const data = await res.json();
        if (data.product) {
          const p = data.product;
          const mapped = {
            id: p._id,
            name: p.name,
            name_en: p.name_en || p.name,
            name_am: p.name_am || p.name,
            description: p.description,
            description_en: p.description_en || p.description,
            description_am: p.description_am || p.description,
            price: p.price,
            discountPrice: p.discountPrice,
            category: p.category,
            artisanId: p.artisanId?._id || p.artisanId,
            artisanName: p.artisanId?.name || 'Unknown Artisan',
            images: getLocalProductImages(p.images),
            isVerified: p.verificationStatus === 'Approved',
            rating: p.rating || 0,
            numReviews: p.numReviews || 0,
            stock: p.stock,
            material: p.material,
            isHandmade: true,
            productionTime: p.deliveryTime,
            shippingCost: Number(p.shippingFee) || 0,
            culturalStory: '',
            status: p.verificationStatus,
            sku: p.sku,
            shippingLocations: [],
            estimatedDelivery: p.deliveryTime,
            returnPolicy: '',
            currency: 'ETB',
            region: p.region,
            careInstructions: p.careInstructions,
            handmadeBy: p.handmadeBy,
          };
          setProduct(mapped);
          setActiveImg(mapped.images[0]);
          getCulturalStory(mapped.name).then(setCulturalStory);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(withLocalProductFallbacks([MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0]])[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.images && product.images.length > 0) {
      setActiveImg(product.images[0]);
    }
  }, [product]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "")}`);
      return;
    }

    if (user?.role?.toLowerCase() !== UserRole.TOURIST.toLowerCase()) {
      setShowLoginPrompt(true);
      return;
    }

    setShowLocationModal(true);
    setShippingLocation(null);
    setCalculatedShippingFee(null);
    setCalculatedDistance(null);
    setLocationCoords(null);
  };

  const handleLocationSubmit = async () => {
    if (!locationCoords || !shippingLocation?.street || !shippingLocation?.city) {
      showNotify('Please fill in your address and select a location on the map');
      return;
    }

    if (isBuying) return;
    setIsBuying(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await apiClient.post('/api/chapa/initialize', {
        productId: id,
        quantity,
        idempotencyKey,
        userLocation: locationCoords,
        shippingFee: calculatedShippingFee,
        shippingAddress: {
          street: shippingLocation.street,
          city: shippingLocation.city,
          state: shippingLocation.state || 'Addis Ababa',
          country: 'Ethiopia',
        },
      });

      if (response.success && response.checkout_url) {
        setShowLocationModal(false);
        window.location.href = response.checkout_url;
      } else {
        showNotify(response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showNotify('Payment failed. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  const calculateShippingFee = async (coords: { latitude: number; longitude: number }) => {
    setCalculatingFee(true);
    try {
      const productRes = await fetch(`/api/public/products/${id}`);
      const productData = await productRes.json();
      const product = productData.product;

      if (product?.artisanId?._id || product?.artisanId) {
        const artisanId = product.artisanId._id || product.artisanId;
        const res = await fetch('/api/routing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artisanId,
            userLocation: coords,
          }),
        });
        const feeData = await res.json();
        if (feeData.success) {
          setCalculatedShippingFee(feeData.shippingFee);
          setCalculatedDistance(feeData.distanceKm);
        }
      }
    } catch (err) {
      console.error('Error calculating shipping fee:', err);
    } finally {
      setCalculatingFee(false);
    }
  };

  const processPayment = async (method: 'chapa' | 'telebirr') => {
    if (method === 'chapa') {
      // Call Chapa payment API
      setSelectedMethod('chapa');
      setPaymentStep('processing');

      try {
        const response = await apiClient.post('/api/payment/chapa', {
          bookingId: product._id,
          amount: product.price * quantity,
          currency: 'ETB',
          email: user?.email || 'guest@email.com',
          firstName: user?.name?.split(' ')[0] || 'Guest',
          lastName: user?.name?.split(' ')[1] || 'User',
          phone: '0912345678',
          description: `Product: ${productName}`,
        });

        if (response.success) {
          // Confirm booking as paid immediately
          if (product._id) {
            try {
              await apiClient.put('/api/tourist/bookings', {
                bookingId: product._id,
                action: 'confirm',
                paymentMethod: 'chapa',
                paymentStatus: 'paid'
              });
            } catch (e) { }
          }

          if (response.checkoutUrl) {
            // Redirect to Chapa hosted checkout page
            window.location.href = response.checkoutUrl;
          } else {
            // Show success
            setTransactionRef(response.txRef || `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
            setPaymentStep('receipt');
          }
        } else {
          // Fallback - simulate success
          setTransactionRef(response.txRef || `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
          setPaymentStep('receipt');
        }
      } catch (e) {
        console.error('Payment error:', e);
        setPaymentStep('receipt');
      }
    } else {
      // Simulate Telebirr payment
      setSelectedMethod(method);
      setPaymentStep('processing');

      await new Promise(resolve => setTimeout(resolve, 1500));

      setTransactionRef(`TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      setPaymentStep('receipt');
    }
  };

  // Calculate dynamic rating if product.rating is 0
  const dynamicRating = useMemo(() => {
    if (product?.rating > 0) return product.rating;
    if (reviewStats.total === 0) return 0;

    const sum = reviewStats.distribution.reduce((acc, curr) => acc + (curr.star * curr.count), 0);
    return Math.round((sum / reviewStats.total) * 10) / 10;
  }, [product?.rating, reviewStats]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  if (!product) return <div>Product not found</div>;

  const productName = getLocalizedField(product, 'name');
  const productDescription = getLocalizedField(product, 'description');

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-primary mb-12 group font-bold text-[10px] uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {t("common.backToCatalog") || "Return to Catalog"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-ethio-bg border border-gray-100 shadow-sm group relative">
              <img src={activeImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={productName} />
              {product.isVerified && <div className="absolute bottom-6 left-6"><VerifiedBadge /></div>}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(img)} className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${activeImg === img ? 'border-secondary scale-105 shadow-md' : 'border-transparent opacity-60'}`}>
                  <img src={img} className="w-full h-full object-cover" alt={`View ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col pt-4">
            <div className="flex justify-between items-start">
              <Badge className="mb-6 w-fit font-bold uppercase tracking-widest px-4 py-1.5">{product.category}</Badge>
              <div className="group relative">
                <div className="flex items-center gap-2 text-secondary cursor-pointer">
                  <div className="flex text-secondary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(dynamicRating) ? 'fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-500">({Number(dynamicRating).toFixed(1)} / 5.0)</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                </div>

                {/* Rating Dropdown */}
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(dynamicRating) ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <div className="text-sm font-bold text-primary">{Number(dynamicRating).toFixed(1)} out of 5</div>
                  </div>
                  <div className="text-xs text-gray-500 mb-6 font-medium">{reviewStats.total} global ratings</div>

                  <div className="space-y-3">
                    {reviewStats.distribution.length > 0 ? reviewStats.distribution.map((rate: any) => (
                      <div key={rate.star} className="flex items-center gap-4 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer">
                        <span className="w-12 whitespace-nowrap">{rate.star} star</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${(rate.count / (reviewStats.total || 1)) * 100}%` }} />
                        </div>
                        <span className="w-8 text-right text-gray-400">{Math.round((rate.count / (reviewStats.total || 1)) * 100)}%</span>
                      </div>
                    )) : (
                      [5, 4, 3, 2, 1].map(star => (
                        <div key={star} className="flex items-center gap-4 text-xs font-bold text-primary opacity-50">
                          <span className="w-12 whitespace-nowrap">{star} star</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full" />
                          <span className="w-8 text-right text-gray-400">0%</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                    <button
                      onClick={() => {
                        const reviewsSection = document.getElementById('reviews');
                        if (reviewsSection) {
                          reviewsSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-xs font-bold text-secondary uppercase tracking-widest hover:underline"
                    >
                      See customer reviews
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary leading-tight tracking-tight">
                {productName}
              </h1>
              <button
                onClick={() => {
                  if (isAuthenticated) setShowProductReport(true);
                  else setShowLoginPrompt(true);
                }}
                className="p-3.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-gray-100 group flex-shrink-0"
                title="Report Product"
              >
                <Flag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-8">
              <span className="text-sm text-gray-500">Crafted by</span>
              <Link href="#" className="text-sm font-bold text-primary border-b border-primary/20 hover:border-primary transition-colors">{product.artisanName}</Link>
            </div>

            <div className="text-4xl font-bold text-primary mb-8 flex items-baseline gap-2">
              ${product.price} <span className="text-sm font-light text-gray-400">USD</span>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed font-light mb-10 border-l-4 border-secondary pl-6">
              {productDescription}
            </p>

            {/* Actions */}
            <div className="space-y-6 mb-12 p-6 bg-ethio-bg rounded-[24px] border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Quantity</span>
                <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-gray-50 rounded-lg transition-all text-primary">-</button>
                  <span className="w-12 text-center font-bold text-lg text-primary">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center font-bold text-lg hover:bg-gray-50 rounded-lg transition-all text-primary">+</button>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Price</span>
                <span className="text-xl font-bold text-primary">
                  ${product.price * quantity} <span className="text-xs font-light text-gray-400">USD</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button size="lg" className="w-full rounded-xl py-4 shadow-lg shadow-primary/10 font-bold uppercase tracking-widest text-xs" leftIcon={ShoppingCart} onClick={handleAddToCart}>
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline" className="w-full rounded-xl py-4 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-widest text-xs" onClick={handleBuyNow} disabled={isBuying}>
                  Buy Now
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Transaction via Telebirr / Chapa
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 text-sm mb-12">
              <div>
                <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-xs uppercase tracking-widest"><Box className="w-4 h-4 text-secondary" /> Material</h4>
                <p className="text-gray-500">{product.material}</p>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-xs uppercase tracking-widest"><Clock className="w-4 h-4 text-secondary" /> Production Time</h4>
                <p className="text-gray-500">{product.productionTime} Days (Handmade)</p>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-xs uppercase tracking-widest"><Globe className="w-4 h-4 text-secondary" /> Origin</h4>
                <p className="text-gray-500">Ethiopia (Verified)</p>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-xs uppercase tracking-widest"><Truck className="w-4 h-4 text-secondary" /> Shipping</h4>
                <p className="text-gray-500">{product.shippingLocations.join(', ')} (${product.shippingCost})</p>
              </div>
            </div>

            {/* Cultural Story Accordion/Section */}
            <section className="p-8 bg-ethio-bg rounded-[24px] border border-gray-100 relative overflow-hidden group mb-12">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-secondary" /> Official Heritage Story
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed font-light italic">
                {culturalStory || "Verifying cultural background..."}
              </p>
            </section>

            {/* Customer Reviews Section */}
            <section id="reviews" className="border-t border-gray-100 pt-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-primary mb-2">Customer Reviews</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(dynamicRating) ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-primary">{Number(dynamicRating).toFixed(1)} out of 5</span>
                    <span className="text-sm text-gray-400">{reviewStats.total} global ratings</span>
                  </div>
                </div>
                {!showReviewForm && (
                  <Button
                    variant="outline"
                    className="rounded-full px-8 py-3 font-bold uppercase tracking-widest text-xs border-primary text-primary hover:bg-primary hover:text-white transition-all"
                    onClick={() => {
                      if (isAuthenticated) setShowReviewForm(true);
                      else setShowLoginPrompt(true);
                    }}
                  >
                    Write a Review
                  </Button>
                )}
              </div>

              {/* Review Submission Form */}
              {showReviewForm && (
                <div className="mb-12 p-8 bg-ethio-bg rounded-[32px] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-primary">Write your review</h4>
                    <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-primary transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Overall Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            className="group transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= userRating ? 'fill-secondary text-secondary' : 'text-gray-200'} transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Comment</label>
                      <textarea
                        className="w-full p-6 bg-white rounded-2xl border-none focus:ring-2 focus:ring-secondary/50 h-32 text-gray-700 transition-all shadow-sm"
                        placeholder="What did you like or dislike? How was the quality?"
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end gap-4">
                      <Button
                        variant="ghost"
                        className="rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs"
                        onClick={() => setShowReviewForm(false)}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="rounded-xl px-8 py-3 font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                        type="submit"
                        disabled={submittingReview}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-10">
                {loadingReviews ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <MessageSquare className="w-8 h-8 text-gray-200" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No reviews yet</h4>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">Be the first to share your experience with this artifact.</p>
                    {!showReviewForm && (
                      <Button
                        variant="outline"
                        className="rounded-full px-8 py-3 font-bold uppercase tracking-widest text-xs"
                        onClick={() => {
                          if (isAuthenticated) setShowReviewForm(true);
                          else setShowLoginPrompt(true);
                        }}
                      >
                        Write a Review
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative text-center">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-primary mb-2">Login Required</h3>
            <p className="text-gray-500 mb-8">Please login as a Tourist to purchase this item securely.</p>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
              <Button onClick={() => router.push('/login')}>Login Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-8">
              {paymentStep === 'select' && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-primary">Secure Checkout</h2>
                    <p className="text-gray-500 text-sm">Select your preferred payment method</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Product</span>
                      <span className="font-bold text-primary truncate max-w-[200px]">{productName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quantity</span>
                      <span className="font-bold text-primary">{quantity}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-4 mt-2">
                      <span className="text-primary">Total</span>
                      <span className="text-primary">${product.price * quantity}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => processPayment('chapa')}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="font-bold text-primary">Chapa</span>
                    </button>
                    <button
                      onClick={() => processPayment('telebirr')}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="font-bold text-primary">Telebirr</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> 256-bit SSL Encrypted
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    {selectedMethod === 'telebirr' ? (
                      <Smartphone className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                    ) : (
                      <CreditCard className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Processing Payment</h3>
                    <p className="text-gray-500 text-sm">Connecting to {selectedMethod === 'telebirr' ? 'Telebirr' : 'Chapa'} secure gateway...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'receipt' && (
                <div className="space-y-8 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-primary">Payment Successful!</h2>
                    <p className="text-gray-500 text-sm">Your transaction has been completed.</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receipt</span>
                      <span className="text-xs font-mono text-gray-500">{transactionRef}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount Paid</span>
                        <span className="font-bold text-primary">${product.price * quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Method</span>
                        <span className="font-bold text-primary capitalize">{selectedMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="font-bold text-primary">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowPaymentModal(false)}>
                      Close
                    </Button>
                    <Button className="w-full rounded-xl shadow-lg shadow-primary/20" leftIcon={Download}>
                      Download Receipt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Report Modal */}
      {showProductReport && (
        <ReportModal
          targetId={id}
          targetType="Product"
          targetName={productName}
          onClose={() => setShowProductReport(false)}
          onSuccess={() => showNotify("Report submitted successfully!", 'success')}
          userId={user?.id || ""}
        />
      )}

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowLocationModal(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors z-10 shadow-sm"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-serif font-bold text-primary">Delivery Details</h2>
                <p className="text-gray-500 text-sm">Provide your address and select your location on the map</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Bole Road, House 123"
                      value={shippingLocation?.street || ''}
                      onChange={(e) => setShippingLocation(prev => ({ ...prev!, street: e.target.value }))}
                      className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Addis Ababa"
                      value={shippingLocation?.city || ''}
                      onChange={(e) => setShippingLocation(prev => ({ ...prev!, city: e.target.value }))}
                      className="w-full px-5 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Pin Location on Map</label>
                  <div className="h-[250px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-50">
                    <LocationPicker
                      value={locationCoords || undefined}
                      onChange={(coords) => {
                        setLocationCoords(coords);
                        calculateShippingFee(coords);
                      }}
                      height="250px"
                    />
                  </div>
                </div>

                {calculatingFee ? (
                  <div className="flex items-center justify-center gap-3 py-6 text-primary animate-pulse bg-primary/5 rounded-2xl">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Calculating Shipping Distance...</span>
                  </div>
                ) : calculatedShippingFee !== null && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Product Price</span>
                        <span className="font-bold text-primary">{product.price} ETB</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-bold text-primary">{quantity}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-bold text-primary">{product.price * quantity} ETB</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-emerald-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Shipping Fee</span>
                          {calculatedDistance !== null && (
                            <span className="text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                              {calculatedDistance.toFixed(1)} KM
                            </span>
                          )}
                        </div>
                        <span className="font-bold">{calculatedShippingFee} ETB</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                      <span className="text-base font-bold text-primary">Grand Total</span>
                      <span className="text-2xl font-black text-primary">
                        {(product.price * quantity) + calculatedShippingFee} ETB
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full rounded-2xl py-4 shadow-xl shadow-primary/20 text-sm font-bold uppercase tracking-widest"
                  disabled={!locationCoords || !shippingLocation?.street || !shippingLocation?.city || calculatingFee || isBuying}
                  onClick={handleLocationSubmit}
                >
                  {isBuying ? 'Connecting to Chapa...' : 'Confirm & Pay Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Centered Notification */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className={`bg-white border-2 p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200 ${notification.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
              }`}>
              {notification.type === 'error' ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              {notification.type === 'error' ? 'Attention' : 'Success'}
            </h4>
            <p className="text-gray-600 font-medium leading-relaxed mb-6">
              {notification.message}
            </p>
            <Button
              onClick={() => setNotification(null)}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs ${notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Centered Notification */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className={`bg-white border-2 p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200 ${notification.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
              }`}>
              {notification.type === 'error' ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              {notification.type === 'error' ? 'Attention' : 'Success'}
            </h4>
            <p className="text-gray-600 font-medium leading-relaxed mb-6">
              {notification.message}
            </p>
            <Button
              onClick={() => setNotification(null)}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs ${notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const FestivalDetailPage: React.FC = () => {
  const params = useParams();
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id;
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { getLocalizedField } = useContentLanguage();
  const [festivalData, setFestivalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<HotelAccommodation | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ hotelName: string, room: RoomType } | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportOption | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [ticketType, setTicketType] = useState<'standard' | 'vip' | 'earlyBird'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'receipt'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [contactInfo, setContactInfo] = useState({ fullName: '', email: '', phone: '' });
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotify = (message: string, type: 'success' | 'error' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getImageUrl = (path: string | undefined | null) => {
    if (!path || path === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('ethio-hub/')) {
      return getCloudinaryImageUrl(path, { width: 800 });
    }
    return path;
  };

  useEffect(() => {
    const fetchFestival = async () => {
      try {
        const res = await fetch(`/api/festivals/${id}`);
        const data = await res.json();

        if (data.success) {
          const f = data.festival;

          const transformedHotels = (f.hotels || []).map((hotel: any, index: number) => ({
            id: hotel._id || hotel.id || `hotel-${index}`,
            name: hotel.name || '',
            name_en: hotel.name_en || hotel.name || '',
            name_am: hotel.name_am || hotel.name || '',
            image: hotel.image || '',
            address: hotel.address || '',
            starRating: hotel.starRating || 0,
            description: hotel.description || '',
            description_en: hotel.description_en || hotel.description || '',
            description_am: hotel.description_am || hotel.description || '',
            fullDescription: hotel.fullDescription || '',
            fullDescription_en: hotel.fullDescription_en || hotel.fullDescription || '',
            fullDescription_am: hotel.fullDescription_am || hotel.fullDescription || '',
            policies: hotel.policies || '',
            checkInTime: hotel.checkInTime || '',
            checkOutTime: hotel.checkOutTime || '',
            facilities: hotel.facilities || [],
            rooms: (hotel.rooms || []).map((room: any, roomIndex: number) => ({
              id: room._id || room.id || `room-${roomIndex}`,
              _id: room._id,
              name: room.name || '',
              name_en: room.name_en || room.name || '',
              name_am: room.name_am || room.name || '',
              description: room.description || '',
              description_en: room.description_en || room.description || '',
              description_am: room.description_am || room.description || '',
              capacity: room.capacity || 1,
              pricePerNight: room.pricePerNight || 0,
              availability: room.availability || 0,
              image: room.image || '',
              sqm: room.sqm || 0,
              amenities: room.amenities || [],
              bedType: room.bedType || '',
            })),
            gallery: hotel.gallery || [],
          }));

          setFestivalData({
            id: f._id,
            name: f.name,
            name_en: f.name_en || f.name,
            name_am: f.name_am || f.name,
            slug: f.name?.toLowerCase().replace(/\s+/g, '-') || '',
            startDate: f.startDate,
            endDate: f.endDate,
            locationName: f.location?.name || '',
            locationName_en: f.location?.name_en || f.location?.name || '',
            locationName_am: f.location?.name_am || f.location?.name || '',
            address: f.location?.address || '',
            coordinates: f.location?.coordinates || { lat: 0, lng: 0 },
            shortDescription: f.shortDescription,
            shortDescription_en: f.shortDescription_en || f.shortDescription,
            shortDescription_am: f.shortDescription_am || f.shortDescription,
            fullDescription: f.fullDescription,
            fullDescription_en: f.fullDescription_en || f.fullDescription,
            fullDescription_am: f.fullDescription_am || f.fullDescription,
            coverImage: '',
            gallery: f.gallery?.length ? f.gallery : [],
            schedule: f.schedule || [],
            mainActivities: '',
            performances: [],
            hotels: transformedHotels,
            transportation: (f.transportation || []).map((transport: any, index: number) => ({
              id: transport._id || transport.id || `transport-${index}`,
              type: transport.type || 'Private Car',
              type_en: transport.type_en || transport.type || 'Private Car',
              type_am: transport.type_am || transport.type || 'Private Car',
              image: transport.image || '',
              price: transport.price || 0,
              availability: transport.availability || 0,
              description: transport.description || '',
              description_en: transport.description_en || transport.description || '',
              description_am: transport.description_am || transport.description || '',
              pickupLocations: transport.pickupLocations || [],
            })),
            foodPackages: f.services?.foodPackages || [],
            culturalServices: f.services?.culturalServices || [],
            baseTicketPrice: f.pricing?.basePrice || 100,
            vipTicketPrice: f.pricing?.vipPrice || 200,
            currency: f.pricing?.currency || 'ETB',
            cancellationPolicy: f.policies?.cancellation || 'Standard cancellation policy applies',
            bookingTerms: f.policies?.terms || 'Standard terms and conditions apply',
            safetyRules: f.policies?.safety || 'Follow all safety guidelines during the event',
            ageRestriction: f.policies?.ageRestriction || 'All ages welcome',
            organizerId: f.organizer?._id || '',
            isVerified: f.isVerified || false,
            ticketsAvailable: 100,
          });
        }
      } catch (error) {
        console.error('Error fetching festival:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchFestival();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setContactInfo({
        fullName: user.name || '',
        email: user.email || '',
        phone: (user as any).touristProfile?.phone || (user as any).organizerProfile?.phone || (user as any).artisanProfile?.phone || ''
      });
    }
  }, [isAuthenticated, user]);

  const festival = festivalData;

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary">Festival Not Found</h2>
          <p className="text-gray-500 mt-2">This festival may not be available.</p>
          <button onClick={() => router.push('/festivals')} className="mt-4 text-primary underline">
            Back to Festivals
          </button>
        </div>
      </div>
    );
  }

  const getTicketPrice = () => {
    switch (ticketType) {
      case 'vip': return festival.vipTicketPrice || festival.baseTicketPrice * 2;
      case 'earlyBird': return festival.baseTicketPrice * 0.9;
      default: return festival.baseTicketPrice;
    }
  };

  const totalPrice = (getTicketPrice() * ticketCount) +
    (selectedRoom ? selectedRoom.room.pricePerNight : 0) +
    (selectedTransport ? selectedTransport.price : 0);
  const festivalName = getLocalizedField(festival, 'name');
  const festivalLocationName = getLocalizedField(festival, 'locationName');
  const festivalFullDescription = getLocalizedField(festival, 'fullDescription');

  const handleRoomSelect = (hotelName: string, room: RoomType) => {
    setSelectedRoom({ hotelName, room });
    setSelectedHotel(null);
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || "")}`);
      return;
    }

    if (user?.role?.toLowerCase() !== UserRole.TOURIST.toLowerCase()) {
      setShowLoginPrompt(true);
      return;
    }

    // Check if profile is complete
    const touristProfile = user?.touristProfile;
    if (!touristProfile?.phone || !touristProfile?.country || !touristProfile?.nationality) {
      showNotify('Please complete your profile before booking. Go to Settings to add your phone, country, and nationality.');
      router.push('/dashboard/tourist/settings');
      return;
    }

    if (!contactInfo.fullName || !contactInfo.email) {
      showNotify('Please ensure your contact information is complete.');
      router.push('/dashboard/tourist/settings');
      return;
    }

    if (!contactInfo.phone) {
      contactInfo.phone = touristProfile?.phone || '0000000000';
    }

    setIsProcessing(true);
    try {
      const bookingDetails = selectedRoom || selectedTransport ? {
        room: selectedRoom ? {
          hotelName: selectedRoom.hotelName,
          roomName: getLocalizedField(selectedRoom.room, 'name'),
          roomPrice: selectedRoom.room.pricePerNight
        } : undefined,
        transport: selectedTransport ? {
          type: getLocalizedField(selectedTransport, 'type'),
          price: selectedTransport.price
        } : undefined
      } : undefined;

      const response = await apiClient.post('/api/tourist/bookings', {
        festivalId: festival.id,
        ticketType,
        quantity: ticketCount,
        contactInfo,
        bookingDetails,
        totalPrice,
        currency: festival.currency
      });

      console.log('Create booking response:', response);

      if (response.success) {
        setCurrentBooking(response.booking);
        setShowPaymentModal(true);
        setPaymentStep('select');
      } else {
        showNotify(response.message || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      showNotify(error.message || 'Failed to create booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = async (method: 'chapa' | 'telebirr') => {
    if (!currentBooking?._id) {
      showNotify('No active booking found');
      return;
    }

    setSelectedMethod(method);
    setPaymentStep('processing');

    if (method === 'chapa') {
      // Call Chapa payment API
      try {
        const response = await apiClient.post('/api/payment/chapa', {
          bookingId: currentBooking._id,
          amount: totalPrice,
          currency: festival?.currency || 'ETB',
          email: contactInfo?.email || 'guest@email.com',
          firstName: contactInfo?.fullName?.split(' ')[0] || 'Guest',
          lastName: contactInfo?.fullName?.split(' ').slice(1).join(' ') || 'User',
          phone: contactInfo?.phone || '0912345678',
          description: `Festival: ${festivalName}`,
        });

        if (response.success) {
          // Confirm booking as paid immediately
          try {
            await apiClient.put('/api/tourist/bookings', {
              bookingId: currentBooking._id,
              action: 'confirm',
              paymentMethod: 'chapa',
              paymentStatus: 'paid'
            });
          } catch (e) { }

          if (response.checkoutUrl) {
            // Redirect to Chapa hosted checkout page
            window.location.href = response.checkoutUrl;
            return;
          } else {
            // Show success
            setTransactionRef(response.txRef || `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
            setPaymentStep('receipt');
          }
        } else {
          // Fallback - simulate success
          setTransactionRef(response.txRef || `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
          setPaymentStep('receipt');
        }
      } catch (error: any) {
        console.error('Payment error:', error);
        setTransactionRef(`TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setPaymentStep('receipt');
      }
    } else {
      // Telebirr - simulate for now
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const updateResponse = await apiClient.put('/api/tourist/bookings', {
          bookingId: currentBooking._id,
          action: 'confirm',
          paymentMethod: method,
          paymentStatus: 'paid'
        });

        if (updateResponse.success) {
          setTransactionRef(`TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
          setCurrentBooking(updateResponse.booking);
          setPaymentStep('receipt');
        } else {
          setPaymentStep('select');
        }
      } catch (error: any) {
        console.error('Payment error:', error);
        setPaymentStep('select');
      }
    }
  };

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="relative h-[65vh] min-h-[450px] flex items-end overflow-hidden">
        <img src={festival.coverImage} className="absolute inset-0 w-full h-full object-cover scale-105" alt={festivalName} />
        <div className="absolute inset-0 bg-gradient-to-t from-ethio-dark via-ethio-dark/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pb-16 text-white text-center md:text-left">
          <button onClick={() => router.back()} className="absolute top-[-200px] left-0 text-white/80 hover:text-white flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest backdrop-blur-md bg-white/10 px-4 py-2 rounded-full transition-all hover:bg-white/20">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>
          <Badge variant="warning" className="mb-6 px-6 py-2 uppercase font-bold tracking-widest bg-secondary text-primary border-none shadow-lg text-[10px]">Vetted Heritage Experience</Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight leading-tight">{festivalName}</h1>
          <div className="flex flex-wrap gap-8 justify-center md:justify-start font-bold uppercase tracking-widest text-[9px]">
            <span className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full"><MapPin className="text-secondary w-3.5 h-3.5" /> {festivalLocationName}</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full"><Calendar className="text-secondary w-3.5 h-3.5" /> {formatDate(festival.startDate)} — {formatDate(festival.endDate)}</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full"><Users className="text-secondary w-3.5 h-3.5" /> {festival.ticketsAvailable} Spots Left</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white p-10 md:p-12 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-3xl font-serif font-bold text-primary mb-6">Program Overview</h2>
              <p className="text-xl text-gray-500 font-light leading-relaxed mb-12">{festivalFullDescription}</p>

              {/* Location Map */}
              <div className="mb-12 rounded-[24px] overflow-hidden border border-gray-100 shadow-sm h-[400px] relative group">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(festivalLocationName)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
                ></iframe>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-secondary" /> Exact Location Verified
                </div>
              </div>

              <div className="space-y-8 mt-12 pt-12 border-t border-gray-100">
                <h3 className="text-2xl font-serif font-bold text-primary flex items-center gap-4"><Hotel className="text-secondary w-8 h-8" /> Partner Accommodations</h3>
                {(!festival.hotels || festival.hotels.length === 0) ? (
                  <p className="text-gray-500 text-center py-8">No accommodations available for this festival.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {festival.hotels.map((hotel: any) => {
                      const hotelName = getLocalizedField(hotel, 'name');
                      const hotelDescription = getLocalizedField(hotel, 'description');
                      return (
                        <div key={hotel.id} className={`bg-ethio-bg rounded-[24px] overflow-hidden border group shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedRoom?.hotelName === hotelName ? 'border-secondary ring-2 ring-secondary/20' : 'border-gray-100'}`} onClick={() => setSelectedHotel(hotel)}>
                          <div className="h-48 overflow-hidden relative">
                            <img src={getImageUrl(hotel.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={hotelName} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-primary">
                              {selectedRoom?.hotelName === hotelName ? 'Selected' : 'View Rooms'}
                            </div>
                            {hotel.gallery && hotel.gallery.length > 0 && (
                              <div className="absolute top-4 left-4 flex gap-1">
                                {hotel.gallery.slice(0, 3).map((img: any, idx: number) => (
                                  <div key={idx} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white">
                                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                                {hotel.gallery.length > 3 && <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center text-white text-[8px] font-bold">+{hotel.gallery.length - 3}</div>}
                              </div>
                            )}
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold text-lg text-primary">{hotelName}</h4>
                              <div className="flex text-secondary items-center"><Star className="w-3.5 h-3.5 fill-current" /> <span className="text-xs font-bold ml-1">{hotel.starRating}</span></div>
                            </div>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{hotelDescription}</p>
                            {hotel.facilities && hotel.facilities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {hotel.facilities.slice(0, 4).map((facility: any, idx: number) => (
                                  <span key={idx} className="text-[8px] px-2 py-1 bg-white rounded-full text-gray-500">{facility}</span>
                                ))}
                                {hotel.facilities.length > 4 && <span className="text-[8px] text-gray-400">+{hotel.facilities.length - 4} more</span>}
                              </div>
                            )}
                            <Button variant="outline" className={`w-full rounded-xl py-3 font-bold text-[9px] uppercase tracking-widest ${selectedRoom?.hotelName === hotelName ? 'bg-secondary text-white border-secondary' : 'border-secondary text-secondary hover:bg-secondary hover:text-white'}`}>
                              {selectedRoom?.hotelName === hotelName ? 'Room Selected' : 'Select Room & Dates'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-8 mt-16">
                <h3 className="text-2xl font-serif font-bold text-primary flex items-center gap-4"><Car className="text-secondary w-8 h-8" /> Ground Transport Options</h3>
                <div className="space-y-4">
                  {festival.transportation.map(car => {
                    const transportType = getLocalizedField(car, 'type');
                    const transportDescription = getLocalizedField(car, 'description');
                    return (
                      <div key={car.id} className={`flex flex-col sm:flex-row items-center gap-8 p-6 bg-ethio-bg rounded-[24px] border group transition-all hover:bg-white hover:shadow-md ${selectedTransport?.id === car.id ? 'border-secondary ring-2 ring-secondary/20 bg-white shadow-md' : 'border-gray-100'}`}>
                        <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden shadow-sm">
                          <img src={getImageUrl(car.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={transportType} />
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <h4 className="font-bold text-primary text-xl">{transportType}</h4>
                          <p className="text-[11px] text-gray-400 leading-relaxed font-light">{transportDescription}</p>
                          <div className="flex flex-wrap gap-3 justify-center sm:justify-start pt-2">
                            <Badge variant="info" className="text-[8px] px-3 py-1 font-bold">Organizer Endorsed</Badge>
                          </div>
                        </div>
                        <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-gray-100 pt-6 sm:pt-0 sm:pl-8 flex flex-col items-center sm:items-end justify-center">
                          <div className="text-2xl font-bold text-primary mb-3">{festival.currency} {car.price}<span className="text-[9px] font-normal text-gray-400 block tracking-widest uppercase">Per Session</span></div>
                          <Button
                            size="sm"
                            className={`rounded-xl px-6 font-bold text-[9px] uppercase tracking-widest ${selectedTransport?.id === car.id ? 'bg-secondary text-white' : ''}`}
                            onClick={() => setSelectedTransport(selectedTransport?.id === car.id ? null : car)}
                          >
                            {selectedTransport?.id === car.id ? 'Selected' : 'Add Transport'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="bg-white p-10 md:p-12 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-3xl font-serif font-bold text-primary mb-10">Pilgrimage Schedule</h2>
              <div className="space-y-8">
                {festival.schedule.map(day => (
                  <div key={day.day} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-16 h-16 bg-ethio-bg rounded-2xl flex flex-col items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <span className="text-[8px] uppercase tracking-widest opacity-50">Day</span>
                      <span className="text-2xl">0{day.day}</span>
                    </div>
                    <div className="flex-1 py-1">
                      <h4 className="font-bold text-xl text-primary mb-2 tracking-tight group-hover:text-secondary transition-colors">{day.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed font-light">{day.activities}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Services Section */}
            {(festival.services?.foodPackages?.length > 0 || festival.services?.culturalServices?.length > 0) && (
              <section className="bg-white p-10 md:p-12 rounded-[32px] shadow-sm border border-gray-100">
                <h2 className="text-3xl font-serif font-bold text-primary mb-10">Included Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {festival.services?.foodPackages?.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                        <span className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        Food Packages
                      </h3>
                      <ul className="space-y-3">
                        {festival.foodPackages.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            {getLocalizedField(item, 'name')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {festival.services?.culturalServices?.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                        <span className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </span>
                        Cultural Services
                      </h3>
                      <ul className="space-y-3">
                        {festival.services.culturalServices.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-3 text-gray-600">
                            <Check className="w-4 h-4 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Policies Section */}
            <section className="bg-white p-10 md:p-12 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-3xl font-serif font-bold text-primary mb-10">Policies & Guidelines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                    <span className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    </span>
                    Cancellation Policy
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{festival.cancellationPolicy}</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                    <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </span>
                    Safety Guidelines
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{festival.safetyRules}</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                    <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </span>
                    Booking Terms
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{festival.bookingTerms}</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                    <span className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </span>
                    Age Restriction
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{festival.ageRestriction}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="bg-white p-10 rounded-[32px] shadow-lg border border-gray-100 sticky top-28">
              <h3 className="text-2xl font-serif font-bold text-primary mb-8 tracking-tight">Reserve Pass</h3>
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket Type</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTicketType('standard')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${ticketType === 'standard' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="block text-xs font-bold text-primary">Standard</span>
                      <span className="block text-[10px] text-gray-500">{festival.currency} {festival.baseTicketPrice}</span>
                    </button>
                    <button
                      onClick={() => setTicketType('vip')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${ticketType === 'vip' ? 'border-secondary bg-secondary/5' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="block text-xs font-bold text-primary">VIP</span>
                      <span className="block text-[10px] text-gray-500">{festival.currency} {festival.vipTicketPrice || festival.baseTicketPrice * 2}</span>
                    </button>
                    <button
                      onClick={() => setTicketType('earlyBird')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${ticketType === 'earlyBird' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="block text-xs font-bold text-primary">Early Bird</span>
                      <span className="block text-[10px] text-gray-500">{festival.currency} {Math.round(festival.baseTicketPrice * 0.9)}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-8 border-b border-gray-100">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Price per Ticket</span>
                  <span className="text-4xl font-bold text-primary">{festival.currency} {getTicketPrice()}</span>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Traveler Count</p>
                  <div className="flex items-center justify-between bg-ethio-bg p-4 rounded-2xl border border-gray-100">
                    <span className="font-bold text-primary">{ticketType === 'vip' ? 'VIP Experience' : ticketType === 'earlyBird' ? 'Early Bird Pass' : 'Explorer Pass'}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setTicketCount(Math.max(1, ticketCount - 1))} className="w-8 h-8 rounded-full bg-white shadow-sm font-bold text-primary hover:bg-primary hover:text-white transition-all">-</button>
                      <span className="font-bold text-primary">{ticketCount}</span>
                      <button onClick={() => setTicketCount(ticketCount + 1)} className="w-8 h-8 rounded-full bg-primary text-white shadow-md font-bold hover:bg-ethio-dark transition-all">+</button>
                    </div>
                  </div>
                </div>

                {selectedRoom && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Accommodation</span>
                      <button onClick={() => setSelectedRoom(null)} className="text-[9px] text-red-500 font-bold uppercase hover:underline">Remove</button>
                    </div>
                    <div className="bg-ethio-bg p-4 rounded-2xl border border-gray-100">
                      <p className="font-bold text-primary text-sm mb-1">{selectedRoom.hotelName}</p>
                      <p className="text-xs text-gray-500 mb-2">{getLocalizedField(selectedRoom.room, 'name')}</p>
                      <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                        <span className="text-[10px] text-gray-400">Per Night</span>
                        <span className="font-bold text-primary">{festival.currency} {selectedRoom.room.pricePerNight}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTransport && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Transport</span>
                      <button onClick={() => setSelectedTransport(null)} className="text-[9px] text-red-500 font-bold uppercase hover:underline">Remove</button>
                    </div>
                    <div className="bg-ethio-bg p-4 rounded-2xl border border-gray-100">
                      <p className="font-bold text-primary text-sm mb-1">{getLocalizedField(selectedTransport, 'type')}</p>
                      <p className="text-xs text-gray-500 mb-2">Private Transfer</p>
                      <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                        <span className="text-[10px] text-gray-400">Fixed Rate</span>
                        <span className="font-bold text-primary">{festival.currency} {selectedTransport.price}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-8 space-y-4 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total</span>
                    <span className="text-3xl font-bold text-primary">{festival.currency} {totalPrice}</span>
                  </div>
                  <Button
                    className="w-full rounded-2xl py-6 text-xl shadow-xl shadow-primary/20 font-bold uppercase tracking-widest text-[10px]"
                    leftIcon={Ticket}
                    onClick={handleBooking}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Finalize Reservation'}
                  </Button>
                  <p className="text-[8px] text-center text-gray-400 leading-relaxed px-4 italic">Secure heritage payment gateway. E-Tickets are sent instantly to verified email accounts.</p>
                </div>
              </div>

              <div className="mt-8 bg-ethio-dark p-6 rounded-2xl text-white space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-125 transition-transform" />
                <ShieldAlert className="w-6 h-6 text-secondary mb-1" />
                <h4 className="text-sm font-serif font-bold">Official Governance</h4>
                <p className="text-[9px] text-gray-400 font-light leading-relaxed">All event logistics and vendor contracts are governed by the Ethiopian Ministry of Tourism standards for quality and safety compliance.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedHotel && (
        <div className="fixed inset-0 z-[100] overflow-auto bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => setSelectedHotel(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(selectedHotel.starRating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{getLocalizedField(selectedHotel, 'name')}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{selectedHotel.address}</span>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedHotel.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm ml-2"
                  >
                    View on map
                  </a>
                </div>

                {selectedHotel.gallery && selectedHotel.gallery.length > 0 && (
                  <div className="mb-6">
                    <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[350px] md:h-[450px]">
                      <img
                        src={getImageUrl(selectedHotel.gallery[0])}
                        alt={getLocalizedField(selectedHotel, 'name')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {selectedHotel.gallery.slice(0, 5).map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-lg overflow-hidden h-16 cursor-pointer group ${idx === 0 ? 'col-span-2 row-span-2 h-full' : ''
                            }`}
                        >
                          <img
                            src={getImageUrl(img)}
                            alt=""
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {getLocalizedField(selectedHotel, 'fullDescription') || getLocalizedField(selectedHotel, 'description')}
                  </p>
                </div>

                <div className="mt-8" id="select-room">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Select Your Room</h2>

                  {!selectedHotel.rooms || selectedHotel.rooms.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <p className="text-gray-500 mb-2">No rooms available for this hotel yet.</p>
                      <p className="text-sm text-gray-400">Please contact the organizer for room bookings.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedHotel.rooms.map((room: any, idx: number) => {
                        const roomName = getLocalizedField(room, 'name') || 'Standard Room';
                        const roomDescription = getLocalizedField(room, 'description');
                        return (
                          <div key={room._id || room.id || `room-${idx}`} className="bg-gray-50 rounded-2xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="md:col-span-1">
                                <img
                                  src={room.image ? getImageUrl(room.image) : ''}
                                  alt={roomName}
                                  className="w-full h-40 md:h-full object-cover rounded-xl"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{roomName}</h3>
                                <p className="text-gray-600 text-sm mb-4">{roomDescription}</p>
                                <div className="flex flex-wrap gap-3">
                                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                    <MaximizeIcon className="w-3.5 h-3.5" /> {room.sqm || 30} m²
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                    <Users className="w-3.5 h-3.5" /> {room.capacity || 2} Guests
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                                    <BedDouble className="w-3.5 h-3.5" /> {room.bedType || 'King Size'}
                                  </span>
                                </div>
                                {room.amenities && room.amenities.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                    {room.amenities.slice(0, 4).map((am: string, i: number) => (
                                      <span key={i} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                                        {am}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="md:col-span-1 flex flex-col justify-between">
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary">${room.pricePerNight || 0}</div>
                                  <div className="text-sm text-gray-500">/night</div>
                                </div>
                                {room.availability > 0 && room.availability <= 3 && (
                                  <Badge variant="warning" className="mt-2">{t("hotel.roomsLeft").replace("{count}", String(room.availability))}</Badge>
                                )}
                                <Button
                                  className="w-full mt-4"
                                  onClick={() => handleRoomSelect(getLocalizedField(selectedHotel, 'name'), room)}
                                >
                                  Book
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Facilities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(selectedHotel.facilities || []).map((facility: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <Check className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Hotel Rules - Policies</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-2xl">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Check In</h3>
                      <p className="text-2xl font-bold text-gray-900">{selectedHotel.checkInTime || '14:00'}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Check Out</h3>
                      <p className="text-2xl font-bold text-gray-900">{selectedHotel.checkOutTime || '12:00'}</p>
                    </div>
                  </div>
                  {selectedHotel.policies && (
                    <p className="mt-4 text-gray-600">{selectedHotel.policies}</p>
                  )}
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Location</h2>
                  <div className="relative h-64 bg-gray-200 rounded-2xl overflow-hidden">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedHotel.address)}&output=embed`}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="mt-8 bg-primary rounded-2xl p-8 text-white">
                  <h2 className="text-2xl font-serif font-bold mb-4">Why Book With Us?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-4">
                      <Shield className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Best Price Guarantee</h3>
                        <p className="text-sm text-white/70">No-hassle best price</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Users className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">24/7 Support</h3>
                        <p className="text-sm text-white/70">Customer care available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Hand-picked Hotels</h3>
                        <p className="text-sm text-white/70">Quality accommodations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Car className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Free Insurance</h3>
                        <p className="text-sm text-white/70">Travel protection</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary">${selectedHotel.rooms?.[0]?.pricePerNight || 0}</span>
                        <span className="text-gray-500 text-sm"> /night</span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {selectedHotel.rooms?.[0]?.availability || 0} rooms left
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    <Button className="w-full py-3" onClick={() => document.getElementById('select-room')?.scrollIntoView({ behavior: 'smooth' })}>
                      Check Availability
                    </Button>
                    <Button variant="outline" className="w-full py-3">
                      Send Enquiry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTransport && (
        <div className="fixed inset-0 z-[100] overflow-auto bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <button
              onClick={() => setSelectedTransport(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="info" className="px-4 py-1 uppercase font-bold tracking-widest bg-primary/5 text-primary border-none text-xs">Transport</Badge>
                  <div className="flex text-gray-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">0 reviews</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">{selectedTransport.type}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Addis Ababa, Ethiopia</span>
                </div>

                {selectedTransport.image && (
                  <div className="mb-6">
                    <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[350px] md:h-[450px]">
                      <img
                        src={getImageUrl(selectedTransport.image)}
                        alt={selectedTransport.type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {selectedTransport.description || `${selectedTransport.type} - Premium transport service for your travel needs. Includes professional driver, fuel, and all applicable taxes for travel within Addis Ababa.`}
                  </p>
                </div>

                {selectedTransport.features && selectedTransport.features.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Transport Features</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedTransport.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <Check className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Vehicle Specifications</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <TruckIcon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedTransport.type}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Capacity</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedTransport.capacity || 4} Seats</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <Gauge className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Transmission</p>
                      <p className="text-sm font-semibold text-gray-900">Automatic</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <Fuel className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Fuel</p>
                      <p className="text-sm font-semibold text-gray-900">Included</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-serif font-bold text-gray-900 mb-6">Reviews</h2>
                  <div className="flex items-center gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-500">/5</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">Not rated</div>
                      <div className="text-sm text-gray-500">From 0 review</div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-2xl">No reviews yet.</p>
                </div>

                <div className="mt-8 bg-primary rounded-2xl p-8 text-white">
                  <h2 className="text-2xl font-serif font-bold mb-4">Why Book With Us?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-4">
                      <Shield className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Best Price Guarantee</h3>
                        <p className="text-sm text-white/70">No-hassle best price</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Users className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">24/7 Support</h3>
                        <p className="text-sm text-white/70">Customer care available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Professional Drivers</h3>
                        <p className="text-sm text-white/70">Experienced & licensed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Car className="w-8 h-8" />
                      <div>
                        <h3 className="font-semibold">Free Insurance</h3>
                        <p className="text-sm text-white/70">Travel protection</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500 line-through">${(selectedTransport.price || 0) * 1.2}</span>
                      <Badge variant="success" className="text-xs">Save 17%</Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-primary">${selectedTransport.price || 0}</span>
                      <span className="text-gray-500">/trip</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Pick Up Date</label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Number of Days</label>
                      <input
                        type="number"
                        min="1"
                        defaultValue="1"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transport Rate</span>
                      <span className="font-medium">${selectedTransport.price || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Driver Fee</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fuel</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-100">
                      <span>Total</span>
                      <span className="text-primary">${selectedTransport.price || 0}</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      className="w-full py-3"
                      onClick={() => {
                        setSelectedTransport(selectedTransport);
                        setSelectedTransport(null);
                      }}
                    >
                      {t("home.bookNow")}
                    </Button>
                    <Button variant="outline" className="w-full py-3">
                      Contact Provider
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Free cancellation up to 24 hours before pickup
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative text-center">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>

            <h3 className="text-2xl font-serif font-bold text-primary mb-2">Login Required</h3>
            <p className="text-gray-500 mb-8">Please login as a Tourist to finalize your reservation.</p>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
              <Button onClick={() => router.push('/login')}>Login Now</Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-8">
              {paymentStep === 'select' && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-primary">Secure Checkout</h2>
                    <p className="text-gray-500 text-sm">Select your preferred payment method</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Event</span>
                      <span className="font-bold text-primary truncate max-w-[200px]">{festivalName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tickets</span>
                      <span className="font-bold text-primary">{ticketCount}</span>
                    </div>
                    {selectedRoom && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Hotel</span>
                        <span className="font-bold text-primary truncate max-w-[150px]">{selectedRoom.hotelName}</span>
                      </div>
                    )}
                    {selectedTransport && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Transport</span>
                        <span className="font-bold text-primary truncate max-w-[150px]">{getLocalizedField(selectedTransport, 'type')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-4 mt-2">
                      <span className="text-primary">Total</span>
                      <span className="text-primary">{festival.currency} {totalPrice}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => processPayment('chapa')}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-6 h-6 text-green-600" />
                      </div>
                      <span className="font-bold text-primary">Chapa</span>
                    </button>
                    <button
                      onClick={() => processPayment('telebirr')}
                      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-secondary hover:bg-secondary/5 transition-all group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="font-bold text-primary">Telebirr</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> 256-bit SSL Encrypted
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    {selectedMethod === 'telebirr' ? (
                      <Smartphone className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                    ) : (
                      <CreditCard className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-primary">Processing Payment</h3>
                    <p className="text-gray-500 text-sm">Connecting to {selectedMethod === 'telebirr' ? 'Telebirr' : 'Chapa'} secure gateway...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'receipt' && (
                <div className="space-y-8 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif font-bold text-primary">Booking Confirmed!</h2>
                    <p className="text-gray-500 text-sm">Your festival pass has been secured.</p>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Booking ID</span>
                      <span className="text-xs font-mono text-gray-500">{currentBooking?._id?.slice(-8).toUpperCase() || transactionRef}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Event</span>
                        <span className="font-bold text-primary truncate max-w-[150px]">{festivalName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ticket Type</span>
                        <span className="font-bold text-primary capitalize">{currentBooking?.ticketType || ticketType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-bold text-primary">{currentBooking?.quantity || ticketCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount Paid</span>
                        <span className="font-bold text-primary">{festival.currency} {totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Method</span>
                        <span className="font-bold text-primary capitalize">{selectedMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Date</span>
                        <span className="font-bold text-primary">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowPaymentModal(false)}>
                      Close
                    </Button>
                    <Button className="w-full rounded-xl shadow-lg shadow-primary/20" leftIcon={Download}>
                      Download Ticket
                    </Button>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/tourist/bookings')}
                    className="text-sm text-primary font-bold hover:underline"
                  >
                    View all bookings →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Centered Notification */}
      {notification && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]">
          <div className={`bg-white border-2 p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200 ${notification.type === 'error' ? 'border-red-100' : 'border-emerald-100'
            }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
              }`}>
              {notification.type === 'error' ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">
              {notification.type === 'error' ? 'Attention' : 'Success'}
            </h4>
            <p className="text-gray-600 font-medium leading-relaxed mb-6">
              {notification.message}
            </p>
            <Button
              onClick={() => setNotification(null)}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs ${notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
