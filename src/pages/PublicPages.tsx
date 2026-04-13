import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, Star, MapPin, 
  Search, ShieldCheck, ChevronRight,
  Clock, ShoppingCart, ArrowLeft,
  Truck, Globe, Ticket,
  RefreshCw, Users, Hotel, Car, Box, ShieldAlert, Award,
  CheckCircle2, Filter, Heart, CreditCard, Lock, Calendar,
  Smartphone, X, Check, Download
} from 'lucide-react';

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

export const Homepage: React.FC = () => {
  // Filter Products
  const filteredProducts = MOCK_PRODUCTS;

  // New Arrivals (Mock: take last 5)
  const newArrivals = [...MOCK_PRODUCTS].reverse().slice(0, 5);
  
  // Top Rated (Mock: sort by rating)
  const topRated = [...MOCK_PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 5);

  // Filter Festivals
  const filteredFestivals = MOCK_FESTIVALS;

  // Split Festivals (Mock logic since dates are past)
  const liveEvents = filteredFestivals.slice(0, 1);
  const upcomingEvents = filteredFestivals.slice(1);

  return (
    <main className="flex flex-col">
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-ethio-dark">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 scale-105" alt="Ethiopian Heritage" />
          <div className="absolute inset-0 bg-gradient-to-b from-ethio-dark/60 to-ethio-dark" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-white w-full text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-in zoom-in duration-700">
            <Badge variant="info" className="py-2 px-6 bg-secondary text-primary border-none uppercase tracking-[0.2em] font-bold text-[10px]">Unified Cultural Platform</Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold leading-tight tracking-tight">Discover the Heart of <br /> <span className="text-secondary italic">Ethiopian Heritage.</span></h1>
            
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-gray-100 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Verified Artisans', value: '1,200+', icon: Award },
              { label: 'Annual Festivals', value: '18+', icon: Calendar },
              { label: 'Global Shipments', value: '45k+', icon: Globe },
              { label: 'Heritage Score', value: '100%', icon: ShieldCheck },
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

      {/* Top Rated Section */}
      <section className="py-16 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-4">
              <div className="space-y-2 animate-in slide-in-from-left duration-700">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-secondary fill-current" />
                  <span className="text-xs font-bold uppercase tracking-widest text-secondary">Community Favorites</span>
                </div>
                <h2 className="text-4xl font-serif font-bold text-primary tracking-tight">Top Rated Collections</h2>
                <p className="text-gray-500 max-w-lg text-lg font-light">Highly acclaimed pieces loved by our global community.</p>
              </div>
              <Link href="/products" className="self-start md:self-auto">
                <Button variant="ghost" className="text-primary font-bold text-sm group p-0 hover:bg-transparent">
                  Explore Top Rated <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="flex overflow-x-auto pb-8 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory gap-6">
              {topRated.map((p, i) => (
                <div key={p.id} className="min-w-[280px] md:min-w-[340px] snap-center animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
      </section>

      {/* Standard Product Grid Section */}
      <section className="py-12 md:py-24 bg-ethio-bg border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif font-bold text-primary tracking-tight">Master Artisan Catalog</h2>
                <p className="text-gray-500 max-w-lg text-lg font-light">Direct trade pieces hand-selected for authenticity and quality.</p>
              </div>
              <Link href="/products"><Button variant="ghost" className="text-primary font-bold text-sm group p-0 hover:bg-transparent">View All Artifacts <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></Button></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
      </section>

      {/* Cultural Events Intro Text */}
      <section className="py-12 md:py-16 bg-white text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div className="w-16 h-1 bg-secondary mx-auto rounded-full"></div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary">Experience the Soul of Ethiopia</h2>
          <p className="text-gray-500 text-lg leading-relaxed font-light">
            From the vibrant processions of Timket to the mesmerizing bonfires of Meskel, immerse yourself in living history. 
            Secure your spot at these sacred gatherings with verified local support.
          </p>
        </div>
      </section>

      {/* Live / Happening Now Events */}
      {liveEvents.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">Live / Happening Now</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {liveEvents.map(f => <FestivalCard key={f.id} festival={f} />)}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="py-12 bg-white pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-10">
              <Calendar className="w-6 h-6 text-secondary" />
              <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">Upcoming Events</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {upcomingEvents.map(f => <FestivalCard key={f.id} festival={f} />)}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-12 md:py-24 bg-ethio-dark text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif font-bold mb-4">Why Choose EthioCraft Hub?</h2>
            <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Organizers</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Every event organizer is vetted by the Ministry of Tourism for authenticity.</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Payment</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Seamless transactions via Telebirr and Chapa with buyer protection.</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Authentic Handmade</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Direct from master artisans, preserving centuries of craftsmanship.</p>
            </div>
            
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Refund Policy</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Worry-free shopping with our transparent return and refund process.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Hero Section */}
    <div className="relative py-32 bg-ethio-dark overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl space-y-8">
                <Badge className="w-fit bg-secondary text-primary border-none">Professional Mission</Badge>
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight tracking-tight">Digital Innovation in <br/><span className="text-secondary italic">Cultural Commerce.</span></h1>
                <p className="text-xl text-gray-300 font-light leading-relaxed max-w-2xl">Ethio-Craft Hub serves as the official digital infrastructure for the preservation and trade of Ethiopian cultural assets, aligned with national tourism strategies for 2025.</p>
            </div>
        </div>
    </div>

    {/* Vision & Values */}
    <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                <div className="space-y-8">
                    <h2 className="text-4xl font-serif font-bold text-primary">Bridging Tradition & Technology</h2>
                    <p className="text-lg text-gray-500 leading-relaxed font-light">
                        We are building the bridge between Ethiopia's master artisans and the global marketplace. By leveraging secure digital payments and verified logistics, we eliminate intermediaries and ensure that the true value of heritage craftsmanship goes back to the creators.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <div className="flex-1 p-6 bg-ethio-bg rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-primary text-xl mb-2">1,200+</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Artisans Empowered</p>
                        </div>
                        <div className="flex-1 p-6 bg-ethio-bg rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-primary text-xl mb-2">$2.4M</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Direct Revenue Generated</p>
                        </div>
                    </div>
                </div>
                <div className="relative h-[500px] rounded-[32px] overflow-hidden shadow-2xl group">
                    <img src="https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000" alt="Artisan at work" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-8 left-8 text-white">
                        <p className="font-serif text-2xl italic">"Preserving our soul, one artifact at a time."</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 rounded-[32px] bg-ethio-bg border border-gray-100 hover:shadow-lg transition-all group">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-4">Authenticity Guaranteed</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">Every item is vetted by our heritage council. We trace the lineage of each artifact to ensure it meets the Ministry of Tourism's standards.</p>
                </div>
                <div className="p-8 rounded-[32px] bg-ethio-bg border border-gray-100 hover:shadow-lg transition-all group">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <Users className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-4">Community First</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">We are a collective. 5% of all platform fees are reinvested into artisan training programs and digital literacy workshops.</p>
                </div>
                <div className="p-8 rounded-[32px] bg-ethio-bg border border-gray-100 hover:shadow-lg transition-all group">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                        <Globe className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary mb-4">Global Reach</h3>
                    <p className="text-gray-500 leading-relaxed text-sm">From Addis Ababa to New York, we handle the complex logistics of international art trade, making Ethiopian culture accessible to the world.</p>
                </div>
            </div>
        </div>
    </div>

    {/* Team / Leadership */}
    <div className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <Badge className="mb-6 mx-auto bg-white border-gray-200">Our Leadership</Badge>
            <h2 className="text-4xl font-serif font-bold text-primary mb-16">Guided by Industry Experts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { name: "Dr. Abebe Kebede", role: "Director of Heritage", img: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=1974&auto=format&fit=crop" },
                    { name: "Sara Tadesse", role: "Head of Artisan Relations", img: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=1972&auto=format&fit=crop" },
                    { name: "Dawit Haile", role: "Lead Tech Architect", img: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=1935&auto=format&fit=crop" },
                    { name: "Marta Girma", role: "Global Logistics", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" }
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

export const ProductListingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  
  // Extract categories
  const categories = ["All", ...Array.from(new Set(MOCK_PRODUCTS.map(p => p.category)))];

  const filtered = MOCK_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <div className="text-center md:text-left">
              <h1 className="text-3xl font-serif font-bold text-primary">Marketplace</h1>
              <p className="text-gray-500 mt-1">Discover authentic Ethiopian artifacts</p>
           </div>
           
           {/* Search Bar */}
           <div className="relative w-full md:w-96">
              <input 
                type="text"
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-3 border-none shadow-sm rounded-xl focus:ring-2 focus:ring-primary/20 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <button 
            className="lg:hidden w-full flex items-center justify-center gap-2 bg-white p-4 rounded-xl border border-gray-100 font-bold text-primary shadow-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categories
              </h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category 
                        ? 'bg-primary text-white font-medium shadow-md shadow-primary/20' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Price Range (Mock) */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-primary mb-4 text-sm">Price Range</h3>
                <div className="space-y-3 text-sm text-gray-600">
                    <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" /> 
                        <span>Under $50</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" /> 
                        <span>$50 - $100</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" /> 
                        <span>$100 - $200</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4" /> 
                        <span>Over $200</span>
                    </label>
                </div>
              </div>
              
               {/* Rating (Mock) */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold text-primary mb-4 text-sm">Avg. Customer Review</h3>
                <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-2 cursor-pointer hover:opacity-80 group">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500 group-hover:text-primary transition-colors">& Up</span>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-sm text-gray-500 font-medium">Showing <span className="text-primary font-bold">{filtered.length}</span> results</span>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    Sort by: <span className="font-bold text-primary cursor-pointer hover:underline">Featured</span> <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
            </div>
            
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">No products found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                    <button onClick={() => {setSearchTerm(""); setSelectedCategory("All");}} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">Clear all filters</button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FestivalListingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [festivals, setFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const festivalTypes = ["All", "Religious", "Historical", "Harvest", "New Year"];

  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        const res = await fetch('/api/festivals');
        const data = await res.json();
        if (data.success) {
          setFestivals(data.festivals);
        } else {
          setError(data.message || 'Failed to fetch festivals');
        }
      } catch (err) {
        setError('An error occurred while fetching festivals');
      } finally {
        setLoading(false);
      }
    };
    fetchFestivals();
  }, []);

  const enhancedFestivals = festivals.map((f: any) => {
    let type = "Cultural";
    if (f.name?.includes("Timket") || f.name?.includes("Meskel") || f.name?.includes("Gena") || f.name?.includes("Fasika")) type = "Religious";
    else if (f.name?.includes("Adwa")) type = "Historical";
    else if (f.name?.includes("Irreecha")) type = "Harvest";
    else if (f.name?.includes("Enkutatash")) type = "New Year";
    
    return { 
      ...f, 
      type,
      id: f._id,
      locationName: f.locationName || f.location?.name || '',
      coverImage: f.coverImage || f.gallery?.[0] || 'https://images.unsplash.com/photo-1532566086724-4c4c7713437c?q=80&w=1200&auto=format&fit=crop',
    };
  });

  const filteredFestivals = enhancedFestivals.filter((f: any) => {
    const matchesSearch = f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || f.type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-primary underline">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1532566086724-4c4c7713437c?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover" 
            alt="Ethiopian Festival" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-ethio-bg"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 space-y-6 animate-in zoom-in duration-700">
          <Badge variant="warning" className="mx-auto bg-secondary text-primary border-none uppercase tracking-[0.2em] font-bold">Official Holiday Directory</Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight">
            Experience the Sacred <br/>
            <span className="text-secondary italic">Traditions of Ethiopia</span>
          </h1>
          <p className="text-xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed">
            Join millions in celebrating Ethiopia's ancient religious festivals, historical commemorations, and vibrant cultural holidays.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-24">
        {/* Search and Filter Bar */}
        <div className="bg-white p-6 rounded-[24px] shadow-xl shadow-black/5 border border-gray-100 mb-16 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search festivals or locations..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
              {festivalTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedType === type 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Festival (First one) */}
        {filteredFestivals.length > 0 && !searchTerm && selectedType === "All" && (
            <div className="mb-20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-1 bg-secondary rounded-full"></div>
                    <h2 className="text-3xl font-serif font-bold text-primary">Featured Celebration</h2>
                </div>
                <div className="relative rounded-[40px] overflow-hidden group h-[500px] shadow-2xl">
                    <img src={filteredFestivals[0].coverImage} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={filteredFestivals[0].name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-10 md:p-16 w-full md:w-2/3 text-white space-y-6">
                        <div className="flex gap-4">
                            <Badge className="bg-secondary text-primary border-none">Trending Now</Badge>
                            <Badge className="bg-white/20 backdrop-blur border-none text-white"><MapPin className="w-3 h-3 mr-2" /> {filteredFestivals[0].locationName}</Badge>
                        </div>
                        <h3 className="text-4xl md:text-6xl font-serif font-bold leading-tight">{filteredFestivals[0].name}</h3>
                        <p className="text-gray-300 text-lg line-clamp-2 font-light">{filteredFestivals[0].shortDescription}</p>
                        <div className="pt-4">
                            <Link href={`/festivals/${filteredFestivals[0].id}`}>
                                <Button className="rounded-full px-8 py-6 text-lg font-bold uppercase tracking-widest bg-white text-primary hover:bg-secondary hover:text-primary border-none shadow-xl">
                                    View Details <ArrowRight className="ml-3 w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Festival Grid */}
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold text-primary">
                    {searchTerm || selectedType !== "All" ? `Search Results (${filteredFestivals.length})` : "Upcoming Events"}
                </h2>
            </div>
            
            {filteredFestivals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {filteredFestivals.map(f => (
                        <FestivalCard key={f.id} festival={f} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-white rounded-[32px] border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">No festivals found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                    <button 
                        onClick={() => {setSearchTerm(""); setSelectedType("All");}}
                        className="mt-8 text-secondary font-bold hover:underline uppercase tracking-widest text-sm"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ReviewItem: React.FC<{ review: any }> = ({ review }) => {
  const [isHelpful, setIsHelpful] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const handleReportSubmit = () => {
    setIsReported(true);
    setShowReportModal(false);
  };

  return (
    <div className="border-b border-gray-50 pb-8 last:border-0">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs text-gray-500">
                {review.user.charAt(0)}
            </div>
            <span className="font-bold text-sm text-primary">{review.user}</span>
            {review.verified && <span className="text-[10px] text-green-600 font-bold uppercase tracking-wider ml-2">Verified Purchase</span>}
        </div>
        <div className="flex items-center gap-2 mb-3">
            <div className="flex text-secondary">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                ))}
            </div>
            <span className="text-xs font-bold text-primary">{review.title}</span>
        </div>
        <p className="text-sm text-gray-500 mb-2">Reviewed on {review.date}</p>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.content}</p>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsHelpful(!isHelpful)}
                className={`text-xs font-medium transition-colors ${isHelpful ? 'text-green-600' : 'text-gray-400 hover:text-primary'}`}
            >
                {isHelpful ? 'Thank you for your feedback' : 'Helpful'}
            </button>
            <div className="h-3 w-px bg-gray-200"></div>
            <button 
                onClick={() => {
                    if (!isReported) setShowReportModal(true);
                }}
                className={`text-xs font-medium transition-colors ${isReported ? 'text-red-500 cursor-default' : 'text-gray-400 hover:text-red-500'}`}
                disabled={isReported}
            >
                {isReported ? 'Reported' : 'Report'}
            </button>
        </div>

        {/* Report Modal */}
        {showReportModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-primary">Report this review</h3>
                        <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        <p className="font-bold text-primary">Optional: Why are you reporting this?</p>
                        <div className="space-y-3">
                            {[
                                { value: "off_topic", label: "Off topic", desc: "Not about the product" },
                                { value: "inappropriate", label: "Inappropriate", desc: "Disrespectful, hateful, obscene" },
                                { value: "fake", label: "Fake", desc: "Paid for, inauthentic" },
                                { value: "other", label: "Other", desc: "Something else" }
                            ].map((option) => (
                                <label key={option.value} className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center mt-0.5">
                                        <input 
                                            type="radio" 
                                            name="report_reason" 
                                            value={option.value} 
                                            checked={reportReason === option.value}
                                            onChange={(e) => setReportReason(e.target.value)}
                                            className="peer h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">{option.label}</span>
                                        <span className="block text-xs text-gray-500">{option.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            We’ll check if this review meets our community guidelines. If it doesn’t, we’ll remove it.
                        </p>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={() => setShowReportModal(false)}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleReportSubmit}
                            disabled={!reportReason}
                            className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id;
  const router = useRouter();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const product = MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];
  const [activeImg, setActiveImg] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [culturalStory, setCulturalStory] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'receipt'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  
  useEffect(() => { 
    if (product) {
        setActiveImg(product.images[0]);
        getCulturalStory(product.name).then(setCulturalStory); 
    }
  }, [product]);
  
  const handleAddToCart = () => {
    for(let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated || user?.role !== UserRole.TOURIST) {
      setShowLoginPrompt(true);
      return;
    }
    setShowPaymentModal(true);
    setPaymentStep('select');
    setSelectedMethod(null);
  };

  const processPayment = (method: 'chapa' | 'telebirr') => {
    setSelectedMethod(method);
    setPaymentStep('processing');
    
    // Simulate API call
    setTimeout(() => {
        setTransactionRef("TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase());
        setPaymentStep('receipt');
    }, 2000);
  };

  if (!product) return <div>Product not found</div>;

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-6">
        <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-primary mb-8 group font-bold text-[10px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Return to Catalog
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-ethio-bg border border-gray-100 shadow-sm group relative">
                <img src={activeImg} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
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
                                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-gray-500">({product.rating} / 5.0)</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                    </div>
                    
                    {/* Rating Dropdown */}
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex text-secondary">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                            </div>
                            <div className="text-sm font-bold text-primary">4.3 out of 5</div>
                        </div>
                        <div className="text-xs text-gray-500 mb-6 font-medium">84,466 global ratings</div>
                        
                        <div className="space-y-3">
                            {[
                                { star: 5, percent: 67 },
                                { star: 4, percent: 15 },
                                { star: 3, percent: 9 },
                                { star: 2, percent: 3 },
                                { star: 1, percent: 6 },
                            ].map((rate) => (
                                <div key={rate.star} className="flex items-center gap-4 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer">
                                    <span className="w-12 whitespace-nowrap">{rate.star} star</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary rounded-full" style={{ width: `${rate.percent}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-gray-400">{rate.percent}%</span>
                                </div>
                            ))}
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

            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-8">
                <span className="text-sm text-gray-500">Crafted by</span>
                <Link href="#" className="text-sm font-bold text-primary border-b border-primary/20 hover:border-primary transition-colors">{product.artisanName}</Link>
            </div>

            <div className="text-4xl font-bold text-primary mb-8 flex items-baseline gap-2">
                ${product.price} <span className="text-sm font-light text-gray-400">USD</span>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed font-light mb-10 border-l-4 border-secondary pl-6">
                {product.description}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button size="lg" className="w-full rounded-xl py-4 shadow-lg shadow-primary/10 font-bold uppercase tracking-widest text-xs" leftIcon={ShoppingCart} onClick={handleAddToCart}>
                        Add to Cart
                    </Button>
                    <Button size="lg" variant="outline" className="w-full rounded-xl py-4 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-widest text-xs" onClick={handleBuyNow}>
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
                <h3 className="text-2xl font-serif font-bold text-primary mb-8">Customer Reviews</h3>
                <div className="space-y-8">
                    {[
                        {
                            id: 1,
                            user: "Sarah M.",
                            rating: 5,
                            date: "October 12, 2023",
                            title: "Absolutely stunning craftsmanship!",
                            content: "The detail on this piece is incredible. You can really feel the history and care that went into making it. Shipping was faster than expected too.",
                            verified: true
                        },
                        {
                            id: 2,
                            user: "David K.",
                            rating: 4,
                            date: "September 28, 2023",
                            title: "Beautiful, but smaller than expected",
                            content: "The quality is top-notch, but make sure to check the dimensions. It looked a bit bigger in the photos. Still a lovely addition to my collection.",
                            verified: true
                        },
                        {
                            id: 3,
                            user: "Elena R.",
                            rating: 5,
                            date: "August 15, 2023",
                            title: "A piece of Ethiopia in my home",
                            content: "I visited Ethiopia years ago and this brings back so many memories. Authentic and beautiful. Highly recommend supporting these artisans.",
                            verified: true
                        }
                    ].map((review) => (
                        <ReviewItem key={review.id} review={review} />
                    ))}
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
                                    <span className="font-bold text-primary truncate max-w-[200px]">{product.name}</span>
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
    </div>
  );
};

export const FestivalDetailPage: React.FC = () => {
  const params = useParams();
  const id = Array.isArray((params as any)?.id) ? (params as any).id[0] : (params as any)?.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [festivalData, setFestivalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState<HotelAccommodation | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<{ hotelName: string, room: RoomType } | null>(null);
  const [selectedTransport, setSelectedTransport] = useState<TransportOption | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'receipt'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [transactionRef, setTransactionRef] = useState('');

  const getImageUrl = (path: string | undefined | null) => {
    if (!path || path === '') return 'https://images.unsplash.com/photo-1533174072545-7a4b6dad2cf7?w=800&h=400&fit=crop';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/uploads/')) {
      const baseUrl = window.location.origin;
      return `${baseUrl}${path}`;
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
            image: hotel.image || '',
            address: hotel.address || '',
            starRating: hotel.starRating || 0,
            description: hotel.description || '',
            fullDescription: hotel.fullDescription || '',
            policies: '',
            checkInTime: hotel.checkInTime || '',
            checkOutTime: hotel.checkOutTime || '',
            facilities: hotel.facilities || [],
            roomTypes: [],
            gallery: hotel.gallery || [],
            rooms: (hotel.rooms || []).map((room: any, roomIndex: number) => ({
              id: room._id || room.id || `room-${roomIndex}`,
              _id: room._id,
              name: room.name || '',
              description: room.description || '',
              capacity: room.capacity || 1,
              pricePerNight: room.pricePerNight || 0,
              availabilityCount: room.availability || 0,
              image: room.image || '',
              sqm: room.sqm || 0,
              amenities: room.amenities || [],
              bedType: room.bedType || '',
            })),
          }));

          setFestivalData({
            id: f._id,
            name: f.name,
            slug: f.name?.toLowerCase().replace(/\s+/g, '-') || '',
            startDate: f.startDate,
            endDate: f.endDate,
            locationName: f.location?.name || '',
            address: f.location?.address || '',
            coordinates: f.location?.coordinates || { lat: 0, lng: 0 },
            shortDescription: f.shortDescription,
            fullDescription: f.fullDescription,
            coverImage: f.coverImage || '',
            gallery: f.gallery || [],
            schedule: f.schedule || [],
            mainActivities: '',
            performances: [],
            hotels: transformedHotels,
            transportation: (f.transportation || []).map((transport: any, index: number) => ({
              id: transport._id || transport.id || `transport-${index}`,
              type: transport.type || 'Private Car',
              image: transport.image || '',
              price: transport.price || 0,
              availability: transport.availability || 0,
              description: transport.description || '',
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

  const totalPrice = (festival.baseTicketPrice * ticketCount) + 
                     (selectedRoom ? selectedRoom.room.pricePerNight : 0) + 
                     (selectedTransport ? selectedTransport.price : 0);

  const handleRoomSelect = (hotelName: string, room: RoomType) => {
    setSelectedRoom({ hotelName, room });
    setSelectedHotel(null);
  };

  const handleBooking = () => {
    if (!isAuthenticated || user?.role !== UserRole.TOURIST) {
      setShowLoginPrompt(true);
      return;
    }
    setShowPaymentModal(true);
    setPaymentStep('select');
  };

  const processPayment = (method: 'chapa' | 'telebirr') => {
    setSelectedMethod(method);
    setPaymentStep('processing');
    
    // Simulate API call
    setTimeout(() => {
        setTransactionRef(`TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
        setPaymentStep('receipt');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="relative h-[65vh] min-h-[450px] flex items-end overflow-hidden">
        <img src={festival.coverImage} className="absolute inset-0 w-full h-full object-cover scale-105" alt={festival.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-ethio-dark via-ethio-dark/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pb-16 text-white text-center md:text-left">
            <button onClick={() => router.back()} className="absolute top-[-200px] left-0 text-white/80 hover:text-white flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest backdrop-blur-md bg-white/10 px-4 py-2 rounded-full transition-all hover:bg-white/20">
                <ArrowLeft className="w-4 h-4" /> Back to Events
            </button>
            <Badge variant="warning" className="mb-6 px-6 py-2 uppercase font-bold tracking-widest bg-secondary text-primary border-none shadow-lg text-[10px]">Vetted Heritage Experience</Badge>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight leading-tight">{festival.name}</h1>
            <div className="flex flex-wrap gap-8 justify-center md:justify-start font-bold uppercase tracking-widest text-[9px]">
                <span className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full"><MapPin className="text-secondary w-3.5 h-3.5" /> {festival.locationName}</span>
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
                <p className="text-xl text-gray-500 font-light leading-relaxed mb-12">{festival.fullDescription}</p>
                
                {/* Location Map */}
                <div className="mb-12 rounded-[24px] overflow-hidden border border-gray-100 shadow-sm h-[400px] relative group">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(festival.locationName)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
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
                        {festival.hotels.map((hotel: any) => (
                            <div key={hotel.id} className={`bg-ethio-bg rounded-[24px] overflow-hidden border group shadow-sm hover:shadow-md transition-all cursor-pointer ${selectedRoom?.hotelName === hotel.name ? 'border-secondary ring-2 ring-secondary/20' : 'border-gray-100'}`} onClick={() => setSelectedHotel(hotel)}>
                                <div className="h-48 overflow-hidden relative">
                                    <img src={getImageUrl(hotel.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={hotel.name} />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-primary">
                                        {selectedRoom?.hotelName === hotel.name ? 'Selected' : 'View Rooms'}
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
                                        <h4 className="font-bold text-lg text-primary">{hotel.name}</h4>
                                        <div className="flex text-secondary items-center"><Star className="w-3.5 h-3.5 fill-current" /> <span className="text-xs font-bold ml-1">{hotel.starRating}</span></div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{hotel.description}</p>
                                    {hotel.facilities && hotel.facilities.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {hotel.facilities.slice(0, 4).map((facility: any, idx: number) => (
                                                <span key={idx} className="text-[8px] px-2 py-1 bg-white rounded-full text-gray-500">{facility}</span>
                                            ))}
                                            {hotel.facilities.length > 4 && <span className="text-[8px] text-gray-400">+{hotel.facilities.length - 4} more</span>}
                                        </div>
                                    )}
                                    <Button variant="outline" className={`w-full rounded-xl py-3 font-bold text-[9px] uppercase tracking-widest ${selectedRoom?.hotelName === hotel.name ? 'bg-secondary text-white border-secondary' : 'border-secondary text-secondary hover:bg-secondary hover:text-white'}`}>
                                        {selectedRoom?.hotelName === hotel.name ? 'Room Selected' : 'Select Room & Dates'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    )}
                </div>

                <div className="space-y-8 mt-16">
                    <h3 className="text-2xl font-serif font-bold text-primary flex items-center gap-4"><Car className="text-secondary w-8 h-8" /> Ground Transport Options</h3>
                    <div className="space-y-4">
                        {festival.transportation.map(car => (
                            <div key={car.id} className={`flex flex-col sm:flex-row items-center gap-8 p-6 bg-ethio-bg rounded-[24px] border group transition-all hover:bg-white hover:shadow-md ${selectedTransport?.id === car.id ? 'border-secondary ring-2 ring-secondary/20 bg-white shadow-md' : 'border-gray-100'}`}>
                                <div className="w-full sm:w-44 h-32 rounded-2xl overflow-hidden shadow-sm">
                                    <img src={getImageUrl(car.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={car.type} />
                                </div>
                                <div className="flex-1 text-center sm:text-left space-y-2">
                                    <h4 className="font-bold text-primary text-xl">{car.type}</h4>
                                    <p className="text-[11px] text-gray-400 leading-relaxed font-light">{car.description}</p>
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
                        ))}
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
              {(festival.foodPackages?.length > 0 || festival.culturalServices?.length > 0) && (
                <section className="bg-white p-10 md:p-12 rounded-[32px] shadow-sm border border-gray-100">
                  <h2 className="text-3xl font-serif font-bold text-primary mb-10">Included Services</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {festival.foodPackages?.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                          <span className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </span>
                          Food Packages
                        </h3>
                        <ul className="space-y-3">
                          {festival.foodPackages.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-3 text-gray-600">
                              <Check className="w-4 h-4 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {festival.culturalServices?.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                          <span className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          </span>
                          Cultural Services
                        </h3>
                        <ul className="space-y-3">
                          {festival.culturalServices.map((item: string, idx: number) => (
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
                    <div className="flex justify-between items-center pb-8 border-b border-gray-100">
                        <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Entry Access</span>
                        <span className="text-4xl font-bold text-primary">{festival.currency} {festival.baseTicketPrice}</span>
                    </div>
                    
                    <div className="space-y-6">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Traveler Count</p>
                        <div className="flex items-center justify-between bg-ethio-bg p-4 rounded-2xl border border-gray-100">
                            <span className="font-bold text-primary">Explorer Pass</span>
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
                                <p className="text-xs text-gray-500 mb-2">{selectedRoom.room.name}</p>
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
                                <p className="font-bold text-primary text-sm mb-1">{selectedTransport.type}</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-ethio-dark/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
                <button onClick={() => setSelectedHotel(null)} className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                    <X className="w-5 h-5" />
                </button>
                <div className="p-6 md:p-10 overflow-y-auto scrollbar-hide">
                    <header className="mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Badge variant="info" className="px-4 py-1 uppercase font-bold tracking-widest bg-primary/5 text-primary border-none text-[8px]">Accommodation</Badge>
                            <div className="flex text-secondary">{[...Array(selectedHotel.starRating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary tracking-tight">{selectedHotel.name}</h2>
                        <p className="text-gray-500 mt-2 flex items-center text-sm"><MapPin className="w-4 h-4 mr-2 text-secondary" /> {selectedHotel.address}</p>
                        {selectedHotel.fullDescription && (
                            <p className="text-gray-600 mt-4 text-sm leading-relaxed">{selectedHotel.fullDescription}</p>
                        )}
                        {selectedHotel.facilities && selectedHotel.facilities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {selectedHotel.facilities.map((facility, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">{facility}</span>
                                ))}
                            </div>
                        )}
                        {(selectedHotel.checkInTime || selectedHotel.checkOutTime) && (
                            <div className="flex gap-6 mt-4 text-xs text-gray-500">
                                {selectedHotel.checkInTime && <span>Check-in: <strong className="text-gray-700">{selectedHotel.checkInTime}</strong></span>}
                                {selectedHotel.checkOutTime && <span>Check-out: <strong className="text-gray-700">{selectedHotel.checkOutTime}</strong></span>}
                            </div>
                        )}
                    </header>
                    
                    {selectedHotel.gallery && selectedHotel.gallery.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] pb-3">Hotel Gallery</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {selectedHotel.gallery.map((img, idx) => (
                                    <div key={idx} className="h-20 md:h-24 rounded-xl overflow-hidden">
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] pb-3 border-b border-gray-100">Available Rooms</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(selectedHotel.rooms || selectedHotel.roomTypes || []).map(room => (
                                <div key={room._id || room.name} className="bg-ethio-bg/30 p-5 rounded-2xl hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100">
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src={getImageUrl(room.image)} className="w-full h-full object-cover" alt={room.name} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-lg font-bold text-primary">{room.name}</h4>
                                            <p className="text-xs text-gray-500">{room.bedType || 'Standard'} bed</p>
                                            {room.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{room.description}</p>}
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {room.sqm && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{room.sqm}m²</span>}
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{room.capacity} Pax</span>
                                                {room.availabilityCount > 0 && (
                                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{room.availabilityCount} Rooms Left</span>
                                                )}
                                                {room.amenities?.slice(0, 2).map((am, i) => (
                                                    <span key={i} className="text-[10px] bg-primary/10 px-2 py-0.5 rounded text-primary">{am}</span>
                                                ))}
                                                {(room.amenities?.length || 0) > 2 && <span className="text-[10px] text-gray-400">+{room.amenities.length - 2}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                        <div>
                                            <span className="text-xl font-bold text-primary">{festival.currency} {room.pricePerNight}</span>
                                            <span className="text-xs text-gray-400">/night</span>
                                        </div>
                                        <Button 
                                            size="sm"
                                            className="px-4 py-2 rounded-lg font-bold text-[10px] uppercase"
                                            onClick={() => handleRoomSelect(selectedHotel.name, room)}
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </div>
                            ))}
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
                                    <span className="font-bold text-primary truncate max-w-[200px]">{festival.name}</span>
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
                                        <span className="font-bold text-primary truncate max-w-[150px]">{selectedTransport.type}</span>
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
                                    Download Receipt
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
