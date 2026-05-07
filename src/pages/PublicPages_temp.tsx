import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight, Star, MapPin,
  Search, ShieldCheck, ChevronRight,
  Clock, ShoppingCart, ArrowLeft,
  Truck, Globe, Ticket,
  RefreshCw, Users, Hotel, Car, Box, ShieldAlert, Award,
  CheckCircle2, Filter, Heart, CreditCard, Lock, Calendar,
  Smartphone, X, Check, Download, User, Mail, Phone,
  Shield, Sparkles, Maximize as MaximizeIcon, BedDouble, Truck as TruckIcon, Fuel, Settings, Gauge, CircleDollarSign
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { HeroVideo } from '@/components/HeroVideo';
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
import { getCulturalStory } from '@/backend/services/geminiService';
import { HotelAccommodation, RoomType, TransportOption } from '../types';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UserRole } from '../types';
import apiClient from '../lib/apiClient';
import { useContentLanguage } from '@/hooks/useContentLanguage';

const festivalAndProductImageBase = '/uploads/avatars/festivalandproductimage';

const localFestivalImages = [
  `${festivalAndProductImageBase}/festivalimage1.webp`,
  `${festivalAndProductImageBase}/festivalimage2.avif`,
  `${festivalAndProductImageBase}/event3.webp`,
];

const localProductImages = [
  `${festivalAndProductImageBase}/product%20image%201.webp`,
  `${festivalAndProductImageBase}/clothproduct2.webp`,
  `${festivalAndProductImageBase}/product3.webp`,
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
    coverImage: localFestivalImages[1],
    gallery: [],
    schedule: [],
    mainActivities: 'Demera bonfire, chants, processions',
    performances: [],
    hotels: [],
    transportation: [],
    foodPackages: [],
    culturalServices: [],
    baseTicketPrice: 500,
    currency: 'ETB',
    cancellationPolicy: '',
    bookingTerms: '',
    organizerId: '',
    isVerified: true,
    ticketsAvailable: 300,
    status: 'Published',
    verificationStatus: 'Approved',
  },
  {
    id: 'irreecha-2026',
    name: 'Irreecha 2026',
    name_en: 'Irreecha 2026',
    name_am: 'ኢሬቻ 2019',
    slug: 'irreecha-2026',
    startDate: '2026-10-04T08:00:00.000Z',
    endDate: '2026-10-04T18:00:00.000Z',
    locationName: 'Hora Finfinne, Addis Ababa',
    address: 'Hora Finfinne, Addis Ababa',
    coordinates: { lat: 9.034, lng: 38.75 },
    shortDescription: 'A thanksgiving festival celebrated with Oromo cultural dress, songs, blessings, and community gatherings.',
    shortDescription_en: 'A thanksgiving festival celebrated with Oromo cultural dress, songs, blessings, and community gatherings.',
    shortDescription_am: 'በኦሮሞ ባህላዊ አልባሳት፣ በመዝሙር እና በምስጋና የሚከበር በዓል።',
    fullDescription: '',
    fullDescription_en: '',
    fullDescription_am: '',
    coverImage: localFestivalImages[2],
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
  coverImage: localFestivalImages[index % localFestivalImages.length] || festival.coverImage || festival.gallery?.[0],
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
  const cleanImages = (images || []).filter((image) => image && !isUnsplashImage(image));
  return cleanImages.length > 0 ? cleanImages : [localProductImages[index % localProductImages.length]];
};

const withLocalProductFallbacks = (products: any[]) =>
  products.map((product, index) => ({
    ...product,
    images: getLocalProductImages(product.images, index),
  }));

export const Homepage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [festivalLoading, setFestivalLoading] = useState(true);
  const [loading, setLoading] = useState(true);

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

  const filteredProducts = products;
  const landingProducts = filteredProducts.slice(0, 4).map((product, index) => ({
    ...product,
    images: [localProductImages[index % localProductImages.length]],
  }));

  const upcomingEvents = festivals.slice(0, 3);

  return (
    <main className="flex flex-col">
      {/* Hero Video Section */}
      <HeroVideo />

      <section className="py-12 bg-white border-b border-gray-100 -mt-10 relative z-20">
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
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-ethio-bg via-white to-secondary/10 py-16 md:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-secondary shadow-sm">
                  <Box className="h-4 w-4" />
                  {t('home.curatedMarketplace')}
                </div>
                <h2 className="text-4xl font-serif font-bold text-primary tracking-tight">{t("home.masterArtisanCatalog")}</h2>
                <p className="text-gray-500 max-w-lg text-lg font-light">{t("home.directTrade")}</p>
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
                    <img src={localFestivalImages[index % localFestivalImages.length]} alt={festival.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      {festival.currency} {festival.baseTicketPrice || 0}
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                        <Calendar className="h-4 w-4" />
                        {formatDate(festival.startDate)}
                      </p>
                      <h3 className="line-clamp-2 font-serif text-3xl font-bold leading-tight">{festival.name}</h3>
                    </div>
                  </div>
                </Link>
                <div className="space-y-5 p-6">
                  <div className="space-y-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <span className="line-clamp-1">{festival.locationName}</span>
                    </p>
                    <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">{festival.shortDescription}</p>
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

      {/* Why Choose Us */}
      <section className="py-12 md:py-24 bg-ethio-dark text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold mb-4">{t("home.whyChooseUs")}</h2>
            <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("home.verifiedOrganizers")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.verifiedOrganizersDesc")}</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("home.securePayment")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.securePaymentDesc")}</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("home.authenticHandmade")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.authenticHandmadeDesc")}</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("home.easyRefund")}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t("home.easyRefundDesc")}</p>
            </div>
          </div>
        </div>
      </section>
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
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight tracking-tight">{t("home.digitalInnovationPrefix")} <br/><span className="text-secondary italic">{t("home.digitalInnovationSuffix")}</span></h1>
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
                           p.category.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
     return matchesSearch && matchesCategory;
   });

   const marketplaceProducts = filtered.slice(0, 8);
   const heritageProducts = filtered.slice(8, 12);

   return (
     <div className="min-h-screen bg-white">
       {/* Hero Section */}
       <section className="relative overflow-hidden bg-gradient-to-br from-ethio-bg via-white to-secondary/10 py-20 md:py-28 border-b border-gray-100">
         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
         <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
         <div className="max-w-7xl mx-auto px-6 relative">
           <div className="text-center max-w-3xl mx-auto space-y-6">
             <Badge className="bg-secondary text-primary border-none uppercase tracking-[0.2em] text-[10px] font-bold">
               {t('home.curatedMarketplace')}
             </Badge>
             <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary tracking-tight">
               {t("home.masterArtisanCatalog")}
             </h1>
             <p className="text-xl text-gray-500 leading-relaxed font-light">
               {t("home.directTrade")}
             </p>
           </div>

           {/* Stats Banner */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
             {[
               { value: '1,200+', label: t("home.verifiedArtisans"), icon: Award },
               { value: '5,000+', label: 'Handcrafted Items', icon: Box },
               { value: '45k+', label: t("home.globalShipments"), icon: Globe },
               { value: '100%', label: t("home.heritageScore"), icon: ShieldCheck },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col items-center text-center space-y-2 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                 <div className="p-3 bg-ethio-bg rounded-2xl"><stat.icon className="w-6 h-6 text-secondary" /></div>
                 <p className="text-2xl font-bold text-primary font-serif">{stat.value}</p>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
               </div>
             ))}
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
                     className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                       selectedCategory === category
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
                       className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                         selectedCategory === category
                           ? 'bg-primary text-white font-medium shadow-md shadow-primary/20'
                           : 'text-gray-600 hover:bg-gray-50'
                       }`}
                     >
                       {displayName}
                     </button>
                   );
                 })}
               </div>

               {/* Price Range (Mock) */}
               <div className="mt-8 pt-8 border-t border-gray-100">
                 <h3 className="font-bold text-primary mb-4 text-sm">{t("home.priceRange")}</h3>
                 <div className="space-y-3 text-sm text-gray-600">
                   <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                     <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" />
                     <span>{t("home.under50")}</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                     <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" />
                     <span>{t("home.price50to100")}</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                     <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" />
                     <span>{t("home.price100to200")}</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                     <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" />
                     <span>{t("home.over200")}</span>
                   </label>
                 </div>
               </div>

               {/* Rating (Mock) */}
               <div className="mt-8 pt-8 border-t border-gray-100">
                 <h3 className="font-bold text-primary mb-4 text-sm">{t("home.averageCustomerReview")}</h3>
                 <div className="space-y-2">
                   {[4, 3, 2, 1].map((rating) => (
                     <div key={rating} className="flex items-center gap-2 cursor-pointer hover:opacity-80 group">
                       <div className="flex text-yellow-400">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-current' : 'text-gray-200'}`} />
                         ))}
                       </div>
                       <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">{t("home.andUp")}</span>
                     </div>
                   ))}
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
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                 <button onClick={() => {setSearchTerm(""); setSelectedCategory("All");}} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">{t("home.clearAllFilters")}</button>
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
  }

export default Homepage;
