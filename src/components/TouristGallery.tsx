import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Camera, Smile } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  altAm: string;
  category: string;
  categoryAm: string;
}

const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798809/ethio-hub/avatars/festivalandproductimage/qdrfjcmefptoteutrlen.avif',
    alt: 'Timket Festival Celebration',
    altAm: 'የጥምቀት በዓል ዝግጅት',
    category: 'Festival',
    categoryAm: 'በዓል',
  },
  {
    id: 2,
    src: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798803/ethio-hub/avatars/festivalandproductimage/fzfj0bverugasrobafk0.webp',
    alt: 'Sacred Meskel Fire Ceremony',
    altAm: 'የመስቀል ደመራ ስነስርዓት',
    category: 'Ceremony',
    categoryAm: 'ስነስርዓት',
  },
  {
    id: 3,
    src: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798817/ethio-hub/avatars/festivalandproductimage/keu3yplue7d67f4zkb2x.webp',
    alt: 'Lalibela Rock-Hewn Churches',
    altAm: 'የላሊበላ አብያተ ክርስቲያናት',
    category: 'Heritage',
    categoryAm: 'ቅርስ',
  },
  {
    id: 4,
    src: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798811/ethio-hub/avatars/festivalandproductimage/q9lycufuumoflweo7cyy.webp',
    alt: 'Irreecha Thanksgiving Festival',
    altAm: 'የኢሬቻ የምስጋና በዓል',
    category: 'Culture',
    categoryAm: 'ባህል',
  },
  {
    id: 5,
    src: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798814/ethio-hub/avatars/festivalandproductimage/kpwld69hcxz4djeskl7r.webp',
    alt: 'Traditional Ethiopian Coffee Ceremony',
    altAm: 'ባህላዊ የቡና ስነስርዓት',
    category: 'Ceremony',
    categoryAm: 'ስነስርዓት',
  },
  {
    id: 6,
    src: 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_1000,c_fill/v1777798818/ethio-hub/avatars/festivalandproductimage/uxp6xscbdioiancfgrng.webp',
    alt: 'Handcrafted Heritage Jewelry',
    altAm: 'የእጅ ስራ ጌጣጌጥ',
    category: 'Crafts',
    categoryAm: 'ጥበብ',
  }
];

export const TouristGallery: React.FC = () => {
  const { language, t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative py-16 md:py-24 bg-ethio-dark overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      <div className="absolute top-20 left-10 w-40 h-40 bg-secondary/10 rounded-full blur-[60px]" />
      <div className="absolute bottom-20 right-10 w-60 h-60 bg-primary/20 rounded-full blur-[80px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 rounded-full bg-secondary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-secondary mb-4">
            <Camera className="h-4 w-4" />
            {language === 'am' ? 'የቱሪስት ተሞክሮዎች' : 'Tourist Experiences'}
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">
            {language === 'am' ? 'በኢትዮጵያ ያገኙት ተሞክሮ' : 'Experiences in Ethiopia'}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            {language === 'am' 
              ? 'ቱሪስቶች በኢትዮጵያ ሲጎበኙ የሚያገኙትን ልዩ ተሞክሮዎች ይመርምሩ።'
              : 'Discover the unforgettable moments tourists experience when visiting Ethiopia. From cultural ceremonies to ancient heritage sites.'}
          </p>
        </div>

        {/* Gallery Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            {['All', 'Ceremonies', 'Heritage', 'Food', 'Crafts'].map((filter, idx) => (
              <button
                key={idx}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  idx === 0
                    ? 'bg-secondary text-primary'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Gallery */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className="flex-shrink-0 w-72 md:w-80 group cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-gray-800">
                <img
                  src={image.src}
                  alt={language === 'am' ? image.altAm : image.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary/90 text-primary px-3 py-1.5 rounded-full">
                    {language === 'am' ? image.categoryAm : image.category}
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-medium text-sm line-clamp-2">
                    {language === 'am' ? image.altAm : image.alt}
                  </p>
                  <div className="flex items-center gap-2 mt-3 text-white/60 text-xs">
                    <Smile className="w-4 h-4" />
                    <span>{language === 'am' ? 'ቱሪስት ተሞክሮ' : 'Tourist experience'}</span>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-[24px] border-2 transition-all duration-300 ${
                  activeIndex === index ? 'border-secondary opacity-100' : 'border-transparent opacity-0 group-hover:opacity-50'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-secondary font-bold uppercase tracking-wider text-sm hover:gap-4 transition-all duration-300"
          >
            {language === 'am' ? 'ሁሉንም ይመልከቱ' : 'View Full Gallery'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-white/10">
          {[
            { value: '50K+', label: language === 'am' ? 'የተደሰቱ ቱሪስቶች' : 'Happy Tourists' },
            { value: '4.9', label: language === 'am' ? 'አማካይ ደረጃ' : 'Average Rating' },
            { value: '150+', label: language === 'am' ? 'የተለያዩ ተሞክሮዎች' : 'Unique Experiences' },
            { value: '98%', label: language === 'am' ? 'የሚመለሱ' : 'Return Visitors' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl md:text-4xl font-serif font-bold text-secondary">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};