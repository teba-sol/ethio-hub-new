import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from './UI';
import { useLanguage } from '@/context/LanguageContext';
import { Play, ArrowRight, Sparkles } from 'lucide-react';

const videoSources = [
  {
    cloudinary: 'https://res.cloudinary.com/dmhu32ya9/video/upload/f_auto:video,q_auto/ethio-hub/hero-videos/dnrxyisv6b9idtmqycct',
    local: '/uploads/videos/3967184-uhd_4096_2160_24fps.mp4'
  },
  {
    cloudinary: 'https://res.cloudinary.com/dmhu32ya9/video/upload/f_auto:video,q_auto/ethio-hub/hero-videos/20719516-uhd_3840_2160_25fps.mp4',
    local: '/uploads/videos/20719516-uhd_3840_2160_25fps.mp4'
  },
  {
    cloudinary: 'https://res.cloudinary.com/dmhu32ya9/video/upload/f_auto:video,q_auto/ethio-hub/hero-videos/14742585_1080_1920_24fps.mp4',
    local: '/uploads/videos/14742585_1080_1920_24fps.mp4'
  }
];

const posterImage = 'https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_1920,h_1080,c_fill/v1777798803/ethio-hub/avatars/festivalandproductimage/fzfj0bverugasrobafk0.webp';
const localPoster = '/uploads/festivals/hero-poster.jpg';


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
    }, 8000);
    return () => clearInterval(interval);
  }, [isMobile]);

  useEffect(() => {
    if (videoRef.current && !isMobile) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex, isMobile]);

  const heroTitle = language === 'am' 
    ? 'የኢትዮጵያን ጥበብና ባህል በአዲስ መልክ ያግኙ'
    : 'Discover Ethiopia Through a Modern Lens of Heritage';

  const heroSubtitle = language === 'am'
    ? 'እውነተኛ ጥበቦች፣ የማይረሱ በዓላት እና የኢትዮጵያ አስደናቂ ታሪክ በአንድ የተራቀቀ መድረክ።'
    : 'Where ancient traditions meet modern luxury. Experience authentic crafts, sacred festivals, and the timeless beauty of Ethiopia.';

  return (
    <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-ethio-dark">
      {/* Optimized Video/Image Background */}
      <div className="absolute inset-0 z-0">
        {!isMobile ? (
          <>
            <video
              ref={videoRef}
              key={currentVideoIndex}
              className="w-full h-full object-cover opacity-50 scale-105 transition-opacity duration-1500"
              autoPlay
              muted
              loop
              playsInline
              poster={posterImage}
            >
              {/* Using local fallback primarily until Cloudinary upload is complete */}
              <source src={videoSources[currentVideoIndex].cloudinary} type="video/mp4" />
              <source src={videoSources[currentVideoIndex].local} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-ethio-dark via-ethio-dark/40 to-transparent" />
          </>
        ) : (
          <img
            src={posterImage}
            alt="Ethiopian Heritage"
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ethio-dark" />
      </div>

      {/* Modern Glassmorphism Decorative Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-20 md:pt-28 lg:pt-32 pb-12">
        <div className={`max-w-4xl transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-left-4 duration-1000">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-secondary">
              {t('home.unifiedPlatform')}
            </span>
          </div>

          {/* Premium Typography */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.1] mb-6 tracking-tight">
            {heroTitle.split(' ').map((word, i) => (
              <span key={i} className="inline-block mr-4 hover:text-secondary transition-colors duration-300">
                {word}
              </span>
            ))}
          </h1>

          <p className="text-base md:text-lg text-gray-300 font-light leading-relaxed max-w-2xl mb-10 text-balance border-l-2 border-secondary/30 pl-6">
            {heroSubtitle}
          </p>

          {/* Luxury Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-5">
            <Link href="/festivals">
              <Button
                variant="secondary"
                className="group h-16 px-10 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-secondary/20 hover:shadow-secondary/40 hover:-translate-y-1 transition-all duration-300"
              >
                <span>{t('home.exploreFestivals')}</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="outline"
                className="h-16 px-10 rounded-full font-bold uppercase tracking-widest text-xs border-white/20 text-white backdrop-blur-md hover:bg-white hover:text-primary transition-all duration-300"
              >
                {t('home.browseArtisans')}
              </Button>
            </Link>
          </div>

          {/* Social Proof / Stats Lite */}
          <div className="mt-12 flex items-center gap-6 opacity-60">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-ethio-dark bg-gray-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-xs font-medium tracking-wide text-white/80">
              <span className="text-secondary font-bold">4.9/5</span> from 2,000+ happy travelers
            </p>
          </div>
        </div>
      </div>

      {/* Floating Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <div className="w-px h-12 bg-gradient-to-b from-secondary to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 vertical-text font-bold">Scroll</span>
      </div>
    </section>
  );
};
