import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Package, Music, Coffee } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface RegionData {
  id: string;
  name: string;
  nameAm: string;
  crafts: string[];
  events: string[];
  description: string;
  descriptionAm: string;
  color: string;
}

const regions: RegionData[] = [
  {
    id: 'addis-ababa',
    name: 'Addis Ababa',
    nameAm: 'አዲስ አበባ',
    crafts: ['Handwoven textiles', 'Contemporary art', 'Jewelry', 'Leather goods'],
    events: ['Meskel Festival', 'Ethiopian New Year', 'Art exhibitions'],
    description: 'The vibrant capital city and hub of Ethiopian craftsmanship',
    descriptionAm: 'የኢትዮጵያ የጥበብ ማዕከል የሆነው የአዲስ አበባ ከተማ',
    color: '#D4AF37',
  },
  {
    id: 'sidama',
    name: 'Sidama',
    nameAm: 'ስዳማ',
    crafts: ['Coffee ceremony sets', 'Baskets', 'Woven cloths', 'Pottery'],
    events: ['Irreecha', 'Coffee ceremonies', 'Traditional dances'],
    description: 'Famous for premium coffee and intricate basket weaving',
    descriptionAm: 'ለታወቀው ቅንጭፍና የተለያዩ የጥበብ ሥራዎች የሚታወቅ',
    color: '#0f4c3a',
  },
  {
    id: 'oromia',
    name: 'Oromia',
    nameAm: 'ኦሮሚያ',
    crafts: ['Gabi shawls', 'Oromo leather', 'Wood carvings', 'Jewelry'],
    events: ['Irreecha Festival', 'Traditional sports', 'Cultural gatherings'],
    description: 'Rich heritage of Oromo traditions and handwoven textiles',
    descriptionAm: 'የኦሮሞ ባህል እና የእጅ ጥበብ ባህላዊ ሀብት',
    color: '#c65d3b',
  },
  {
    id: 'amhara',
    name: 'Amhara',
    nameAm: 'አማራ',
    crafts: ['Church artifacts', 'Cross jewelry', 'Woven cloths', 'Pottery'],
    events: ['Timket', 'Ethiopian Christmas', 'Meskel'],
    description: 'Ancient religious traditions and intricate artwork',
    descriptionAm: 'ያስገነዘቡ የሃይማኖት ባህሎችና ዝርዝር የጥበብ ሥራዎች',
    color: '#0f4c3a',
  },
  {
    id: 'tigray',
    name: 'Tigray',
    nameAm: 'ትግራይ',
    crafts: ['Silver crosses', 'Weavings', 'Pottery', 'Stone art'],
    events: ['Timket', 'Ethiopian Easter', 'Historical tours'],
    description: 'Ancient Axumite heritage and traditional crafts',
    descriptionAm: 'የአክሱም ዓለም ባህልና የተራዘመ የጥበብ ቅርስ',
    color: '#c89b2c',
  },
  {
    id: 'harari',
    name: 'Harar',
    nameAm: 'ሐረር',
    crafts: ['Harari baskets', 'Mensive weaving', 'Silver jewelry', 'Coffee sets'],
    events: ['Ashura', 'Holiday celebrations', 'Cultural festivals'],
    description: 'UNESCO heritage city known for unique weaving traditions',
    descriptionAm: 'ለዩኔስኮ የሚጠቀስ ከተማ ለተለየ የጥበብ ሥራዎች የሚታወቅ',
    color: '#D4AF37',
  },
  {
    id: 'snnpr',
    name: 'SNNPR',
    nameAm: 'ደቡብ ብሔር ሕዝቦች',
    crafts: ['Dorze baskets', 'Coffee utensils', 'Wood carvings', 'Beadwork'],
    events: ['Cultural dances', 'Harvest festivals', 'Coffee ceremonies'],
    description: 'Diverse ethnic groups with unique weaving and pottery',
    descriptionAm: 'ተለያዩ ወራጀቶች ልዩ የጥበብ ሥራዎች',
    color: '#c65d3b',
  },
  {
    id: 'afar',
    name: 'Afar',
    nameAm: 'አፋር',
    crafts: ['Salt containers', 'Leather goods', 'Traditional jewelry', 'Weavings'],
    events: ['Afar New Year', 'Camel trading festivals', 'Cultural exhibitions'],
    description: 'Ancient salt trade traditions and nomadic crafts',
    descriptionAm: 'ጥንታዊ የጨው ንግድ ባህልና የተሻለ የጥበብ ሥራዎች',
    color: '#0f4c3a',
  },
];

export const EthiopiaMap: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeRegion, setActiveRegion] = useState<RegionData | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const getEventIcon = (event: string) => {
    if (event.toLowerCase().includes('coffee')) return <Coffee className="w-3 h-3" />;
    if (event.toLowerCase().includes('festival') || event.toLowerCase().includes('timket') || event.toLowerCase().includes('meskel') || event.toLowerCase().includes('irreecha')) return <Music className="w-3 h-3" />;
    return <Package className="w-3 h-3" />;
  };

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-ethio-bg via-white to-primary/5 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f4c3a" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary mb-4">
            <MapPin className="h-4 w-4" />
            {language === 'am' ? 'ኢትዮጵያን ይመርምሩ' : 'Explore Ethiopia'}
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary mb-4">
            {language === 'am' ? 'በክልል የጥበብ ሥራዎችን ያግኙ' : 'Discover Crafts by Region'}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            {language === 'am' 
              ? 'ኢትዮጵያ በእያንዳንዱ ክልል ልዩ የሆነ የጥበብ ባህል አላት። ክልሉን ጠቅ ለማድረግ እና ልዩ ሥራዎቹን ለመድረስ።'
              : 'Each region of Ethiopia has its own unique craft heritage. Click on a region to explore its traditional crafts and cultural events.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Interactive Map */}
          <div className="lg:col-span-2 relative">
            {/* Ethiopian Map SVG */}
            <svg viewBox="0 0 400 450" className="w-full h-auto drop-shadow-2xl">
              {/* Simplified Ethiopia Regions */}
              
              {/* Tigray */}
              <path
                d="M120 40 L180 30 L200 60 L190 100 L150 110 L100 80 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'tigray' || activeRegion?.id === 'tigray'
                    ? 'fill-primary scale-105'
                    : 'fill-gray-300 hover:fill-primary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'tigray') || null)}
                onMouseEnter={() => setHoveredRegion('tigray')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Afar */}
              <path
                d="M200 60 L280 50 L320 100 L300 150 L220 140 L190 100 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'afar' || activeRegion?.id === 'afar'
                    ? 'fill-primary scale-105'
                    : 'fill-gray-300 hover:fill-primary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'afar') || null)}
                onMouseEnter={() => setHoveredRegion('afar')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Amhara */}
              <path
                d="M100 80 L150 110 L190 100 L200 160 L160 200 L100 180 L80 130 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'amhara' || activeRegion?.id === 'amhara'
                    ? 'fill-primary scale-105'
                    : 'fill-gray-300 hover:fill-primary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'amhara') || null)}
                onMouseEnter={() => setHoveredRegion('amhara')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Oromia */}
              <path
                d="M80 130 L100 180 L160 200 L220 220 L260 280 L200 320 L100 280 L60 200 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'oromia' || activeRegion?.id === 'oromia'
                    ? 'fill-primary scale-105'
                    : 'fill-gray-300 hover:fill-primary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'oromia') || null)}
                onMouseEnter={() => setHoveredRegion('oromia')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* SNNPR */}
              <path
                d="M160 200 L220 220 L260 280 L240 340 L180 350 L140 300 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'snnpr' || activeRegion?.id === 'snnpr'
                    ? 'fill-primary scale-105'
                    : 'fill-gray-300 hover:fill-primary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'snnpr') || null)}
                onMouseEnter={() => setHoveredRegion('snnpr')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Harari */}
              <path
                d="M260 180 L290 170 L300 200 L280 220 L250 210 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'harari' || activeRegion?.id === 'harari'
                    ? 'fill-secondary scale-105'
                    : 'fill-gray-300 hover:fill-secondary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'harari') || null)}
                onMouseEnter={() => setHoveredRegion('harari')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Sidama */}
              <path
                d="M220 220 L260 280 L280 340 L240 340 L220 300 Z"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'sidama' || activeRegion?.id === 'sidama'
                    ? 'fill-primary scale-105'
                    : 'fill-gray-300 hover:fill-primary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'sidama') || null)}
                onMouseEnter={() => setHoveredRegion('sidama')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Addis Ababa */}
              <circle
                cx="160"
                cy="220"
                r="20"
                className={`cursor-pointer transition-all duration-300 ${
                  hoveredRegion === 'addis-ababa' || activeRegion?.id === 'addis-ababa'
                    ? 'fill-secondary scale-110'
                    : 'fill-gray-300 hover:fill-secondary/50'
                }`}
                onClick={() => setActiveRegion(regions.find(r => r.id === 'addis-ababa') || null)}
                onMouseEnter={() => setHoveredRegion('addis-ababa')}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              
              {/* Region Labels */}
              <text x="140" y="70" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>Tigray</text>
              <text x="250" y="90" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>Afar</text>
              <text x="120" y="150" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>Amhara</text>
              <text x="140" y="260" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>Oromia</text>
              <text x="190" y="280" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>SNNPR</text>
              <text x="275" y="190" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>Harar</text>
              <text x="225" y="270" className="text-[8px] fill-gray-700 font-medium" style={{ pointerEvents: 'none' }}>Sidama</text>
              <text x="150" y="225" className="text-[10px] fill-white font-bold" style={{ pointerEvents: 'none' }}>AA</text>
            </svg>
          </div>

          {/* Region Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[24px] p-6 shadow-xl border border-gray-100 min-h-[400px]">
              {!activeRegion ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-primary mb-2">
                    {language === 'am' ? 'ክልል ይምረጡ' : 'Select a Region'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {language === 'am' 
                      ? 'ከላይ ያለውን ካርታ ጠቅ በማድረግ ክልሉን ይምረጡ'
                      : 'Click on a region on the map to explore its crafts and events'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Region Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {language === 'am' ? 'ክልል' : 'Region'}
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
                        {language === 'am' ? activeRegion.nameAm : activeRegion.name}
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: activeRegion.color }}
                        />
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveRegion(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed">
                    {language === 'am' ? activeRegion.descriptionAm : activeRegion.description}
                  </p>

                  {/* Crafts */}
                  <div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3">
                      {language === 'am' ? 'ጥበቦች' : 'Traditional Crafts'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeRegion.crafts.map((craft, idx) => (
                        <span 
                          key={idx}
                          className="text-[11px] font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full"
                        >
                          {craft}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Events */}
                  <div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3">
                      {language === 'am' ? 'ዝግጅቶች' : 'Events & Festivals'}
                    </h4>
                    <div className="space-y-2">
                      {activeRegion.events.map((event, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
                        >
                          <span className="text-secondary">{getEventIcon(event)}</span>
                          {event}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/products?region=${activeRegion.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors"
                  >
                    {language === 'am' ? 'ጥበቦችን ይመልከቱ' : 'View Crafts'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Region Quick Links */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {regions.slice(0, 6).map((region) => (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeRegion?.id === region.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-primary/10 hover:text-primary border border-gray-200'
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};