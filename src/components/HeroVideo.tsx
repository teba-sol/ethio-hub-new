import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from './UI';
import { useLanguage } from '@/context/LanguageContext';

// Local video files from public/uploads/videos
const videoSources = [
  '/uploads/videos/13530688_1440_2560_30fps.mp4',
  '/uploads/videos/15185809_4096_2160_25fps.mp4',
  '/uploads/videos/3967245-uhd_4096_2160_24fps.mp4',
];

const posterImage = '/uploads/avatars/festivalandproductimage/festivalimage1.webp';

export const HeroVideo: React.FC = () => {
  const { t } = useLanguage();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    }, 10000);
    return () => clearInterval(interval);
  }, [isMobile]);

  useEffect(() => {
    if (videoRef.current && !isMobile) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex, isMobile]);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-ethio-dark">
      {/* Video Background */}
      {!isMobile ? (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            key={currentVideoIndex}
            className="w-full h-full object-cover opacity-70 scale-105"
            autoPlay
            muted
            loop
            playsInline
            poster={posterImage}
          >
            <source src={videoSources[currentVideoIndex]} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-ethio-dark/50 via-ethio-dark/30 to-ethio-dark" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0">
          <img
            src={posterImage}
            alt="Ethiopian Heritage"
            className="w-full h-full object-cover opacity-70 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ethio-dark/50 via-ethio-dark/30 to-ethio-dark" />
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] z-0" />

      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-white w-full text-center">
        <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in duration-700">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-1 bg-secondary rounded-full" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-secondary bg-secondary/10 py-1 px-4 rounded-full">
              {t('home.unifiedPlatform')}
            </span>
            <div className="w-16 h-1 bg-secondary rounded-full" />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold leading-[1.1] tracking-tight">
            {t('home.discoverHeart')} <br />
            <span className="text-secondary italic font-light">{t('home.ethiopianHeritage')}</span>
          </h1>
          <p className="text-gray-200 text-xl leading-relaxed font-light max-w-3xl mx-auto">
            {t('home.experienceSoul')} {t('home.fromVibrant')} {t('home.secureSpot')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link href="/festivals">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full px-10 py-5 font-bold uppercase tracking-widest text-sm shadow-2xl shadow-secondary/30"
              >
                Explore Festivals
              </Button>
            </Link>
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-10 py-5 font-bold uppercase tracking-widest text-sm border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                Browse Artisans
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Video Cycle Indicators */}
      {!isMobile && videoSources.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {videoSources.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentVideoIndex ? 'bg-secondary w-8' : 'bg-white/30'
              }`}
              aria-label={`Switch to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
