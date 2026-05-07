import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from './UI';
import { useLanguage } from '@/context/LanguageContext';

const videoSources = [
  '/uploads/videos/3967184-uhd_4096_2160_24fps.mp4',
  '/uploads/videos/20719516-uhd_3840_2160_25fps.mp4',
  '/uploads/videos/14742585_1080_1920_24fps.mp4',
];

const posterImage = 'https://res.cloudinary.com/dmhu32ya9/image/upload/w_1920,h_1080,c_fill/v1777798803/ethio-hub/avatars/festivalandproductimage/fzfj0bverugasrobafk0.webp';

export const HeroVideo: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videoSources.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isMobile]);

  useEffect(() => {
    if (videoRef.current && !isMobile) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex, isMobile]);

  const heroTitle = language === 'am' 
    ? 'በኢትዮጵያ የእጅ ጥበብና የባህል ተሞክሮዎች ያግኙ'
    : 'Discover Ethiopia Through Handmade Art & Cultural Experiences';

  const heroSubtitle = language === 'am'
    ? 'እውነተኛ ጥበቦች፣ ያልታረሱ ዝግጅቶች እና የኢትዮጵያ ባህላዊ ውቅር ውበት በአንድ ቦታ።'
    : 'Authentic crafts, unforgettable events, and the beauty of Ethiopian heritage in one place.';

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-ethio-dark">
      {/* Video Background */}
      {!isMobile ? (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={currentVideoIndex}
            className="w-full h-full object-cover opacity-60 scale-105 transition-opacity duration-1000"
            autoPlay
            muted
            loop
            playsInline
            poster={posterImage}
          >
            <source src={videoSources[currentVideoIndex]} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-ethio-dark/60 via-transparent to-ethio-dark/70" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0">
          <img
            src={posterImage}
            alt="Ethiopian Heritage"
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-ethio-dark/60 via-transparent to-ethio-dark/70" />
        </div>
      )}

      {/* Decorative Elements - Ethiopian Pattern Motifs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] z-0" />
      <div className="absolute top-1/4 left-10 w-32 h-32 border border-secondary/20 rounded-full opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-24 h-24 border border-gold/20 rounded-full opacity-30" />

      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-white w-full text-center">
        <div className={`max-w-5xl mx-auto space-y-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-secondary" />
            <span className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-secondary bg-secondary/10 py-2 px-6 rounded-full border border-secondary/20">
              {t('home.unifiedPlatform')}
            </span>
            <div className="w-24 h-px bg-gradient-to-l from-transparent to-secondary" />
          </div>

          {/* Main Title - Large Luxury Typography */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-[1.05] tracking-tight text-white drop-shadow-2xl">
            {heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed font-light max-w-3xl mx-auto text-balance">
            {heroSubtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link href="/festivals">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full px-10 py-5 font-bold uppercase tracking-widest text-sm shadow-2xl shadow-secondary/30 hover:shadow-secondary/50 hover:scale-105 transition-all duration-300"
              >
                {t('home.exploreFestivals')}
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-10 py-5 font-bold uppercase tracking-widest text-sm border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 backdrop-blur-sm transition-all duration-300"
              >
                {t('home.browseArtisans')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-2 text-white/60">
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-secondary rounded-full animate-bounce" />
          </div>
        </div>
      </div>

      {/* Diagonal Inclined Divider - Gold Line */}
      <div className="absolute -bottom-px left-0 right-0 z-20 overflow-hidden">
        <svg
          className="w-full h-16 md:h-24"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 L1440,80 L1440,120 L0,120 Z"
            fill="#D4AF37"
          />
        </svg>
      </div>
    </section>
  );
};
