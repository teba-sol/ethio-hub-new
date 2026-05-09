import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Package, Music, Coffee, Star } from 'lucide-react';
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
    crafts: ['Shiro Meda Textiles', 'Contemporary Jewelry', 'Leather Art', 'Modern Ceramics'],
    events: ['Meskel (Square)', 'Timkat (Jan Meda)', 'Great Ethiopian Run', 'African Union Summits'],
    description: 'The heartbeat of Ethiopia where ancient traditions blend with modern luxury and Pan-African diplomacy.',
    descriptionAm: 'ጥንታዊ ወጎች ከዘመናዊ የቅንጦት ኑሮ ጋር የሚገናኙባት የኢትዮጵያ የልብ ትርታ።',
    color: '#D4AF37',
  },
  {
    id: 'oromia',
    name: 'Oromia',
    nameAm: 'ኦሮሚያ',
    crafts: ['Leather Craftsmanship', 'Jimma Woodwork', 'Coffee Artifacts', 'Oromo Jewelry'],
    events: ['Irreecha (Bishoftu)', 'Gadaa Ceremonies', 'Horse Racing Festivals', 'Harvest Festivals'],
    description: 'Home to the Irreecha thanksgiving and the ancient Gadaa system, Oromia is a cradle of democratic heritage.',
    descriptionAm: 'የምስጋናው የኢሬቻ በዓል እና የጥንታዊው የገዳ ስርዓት መገኛ የሆነው ኦሮሚያ።',
    color: '#c65d3b',
  },
  {
    id: 'amhara',
    name: 'Amhara',
    nameAm: 'አማራ',
    crafts: ['Religious Bookbinding', 'Lalibela Stone Art', 'Fine Weaving', 'Metal Crosses'],
    events: ['Timkat (Gondar)', 'Genna (Lalibela)', 'Shadey/Ashenda', 'Meskel'],
    description: 'A land of monolithic wonders and medieval castles, where history is carved into every stone.',
    descriptionAm: 'ታሪክ በእያንዳንዱ ድንጋይ ላይ የተቀረጸበት የድንቅ አብያተ ክርስቲያናት እና የጥንታዊ ቤተ-መንግስታት ምድር።',
    color: '#0f4c3a',
  },
  {
    id: 'tigray',
    name: 'Tigray',
    nameAm: 'ትግራይ',
    crafts: ['Axumite Silver Crosses', 'Traditional Pottery', 'Intricate Weaving', 'Parchment Art'],
    events: ['Ashenda Festival', 'Axum Tsion', 'Timkat', 'Romanat Falls Festival'],
    description: 'The ancient Axumite Empire legacy lives on through sacred art and the vibrant Ashenda celebration.',
    descriptionAm: 'ጥንታዊው የአክሱም ስርወ-መንግስት አሻራ በቅዱስ ጥበባት እና በአሸንዳ በዓል ህያው ሆኖ ይኖራል።',
    color: '#c89b2c',
  },
  {
    id: 'sidama',
    name: 'Sidama',
    nameAm: 'ሲዳማ',
    crafts: ['Bamboo Basketry', 'Sidama Pottery', 'Tubba Skin Clothing', 'Enset Products'],
    events: ['Fichee-Chambalaalla', 'Coffee Harvest', 'Sidama Cultural Week', 'Bamboo Festivals'],
    description: 'Celebrated for the UNESCO-recognized Fichee-Chambalaalla New Year and the world\'s finest coffee.',
    descriptionAm: 'በዩኔስኮ በተመዘገበው የፊቼ ጨምበላላ የአዲስ አመት በዓል እና በአለም ምርጥ ቡና የሚታወቅ።',
    color: '#0f4c3a',
  },
  {
    id: 'harari',
    name: 'Harar',
    nameAm: 'ሐረር',
    crafts: ['Harari Baskets (Mesob)', 'Silver Jewelry', 'Bookbinding', 'Adere Textiles'],
    events: ['Shuwalid Festival', 'Ashura', 'Hyena Feeding Ritual', 'Cultural Pilgrimages'],
    description: 'The walled city of Jugol is a living museum of Islamic heritage and world-class basketry.',
    descriptionAm: 'የጀጎል ግንብ የኢስላማዊ ቅርስ እና የአለም ደረጃ የቅርጫት ጥበብ ህያው ሙዚየም ነው።',
    color: '#D4AF37',
  },
  {
    id: 'snnpr',
    name: 'SNNPR',
    nameAm: 'ደቡብ ብሔር ሕዝቦች',
    crafts: ['Dorze Weaving', 'Konso Terraces', 'Beadwork', 'Wood Carvings'],
    events: ['Meskel (Gurage)', 'Hamer Bull Jumping', 'Omotic Dance Festivals', 'Tribal Gatherings'],
    description: 'A mosaic of over 50 ethnic groups, each offering a unique tapestry of crafts and ancient rituals.',
    descriptionAm: 'ከ50 በላይ ብሔረሰቦች የሚገኙባት፣ እያንዳንዳቸው ልዩ ጥበብ እና ጥንታዊ ስነ-ስርዓት የሚታዩባት ምድር።',
    color: '#c65d3b',
  },
  {
    id: 'afar',
    name: 'Afar',
    nameAm: 'አፋር',
    crafts: ['Afar Leatherwork', 'Salt Carving', 'Weaponry (Jile)', 'Woven Mats'],
    events: ['Afar Cultural Festival', 'Nomadic Gatherings', 'Asaita Pilgrimages', 'Desert Festivals'],
    description: 'Resilient nomadic traditions in the Danakil Depression, where life revolves around salt and sacred rites.',
    descriptionAm: 'ህይወት በጨው እና በቅዱስ ስነ-ስርዓቶች ዙሪያ በሚሽከረከርበት በዳናኪል በረሃ የሚገኝ የዘላን ባህል መገኛ።',
    color: '#0f4c3a',
  },
];

export const EthiopiaMap: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeRegion, setActiveRegion] = useState<RegionData | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [regionProducts, setRegionProducts] = useState<any[]>([]);
  const [regionFestivals, setRegionFestivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeRegion) {
      fetchRegionData(activeRegion.id);
    }
  }, [activeRegion]);

  const fetchRegionData = async (regionId: string) => {
    try {
      setLoading(true);
      // Fetch products for this region
      const prodRes = await fetch(`/api/public/products?region=${regionId}&limit=3`);
      const prodData = await prodRes.json();
      setRegionProducts(prodData.products || []);

      // Fetch festivals for this region
      const festRes = await fetch(`/api/festivals?region=${regionId}&limit=2`);
      const festData = await festRes.json();
      setRegionFestivals(festData.festivals || []);
    } catch (error) {
      console.error('Error fetching region data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary dark:text-white mb-4">
            {language === 'am' ? 'በክልል የጥበብ ሥራዎችን ያግኙ' : 'Discover Crafts by Region'}
          </h2>
          <p className="text-gray-500 dark:text-gray-300 max-w-2xl mx-auto text-lg">
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
            <div className="bg-white dark:bg-ethio-dark rounded-[24px] p-6 shadow-xl border border-gray-100 dark:border-white/10 min-h-[400px]">
              {!activeRegion ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-primary dark:text-white mb-2">
                    {language === 'am' ? 'ክልል ይምረጡ' : 'Select a Region'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-300 text-sm">
                    {language === 'am' 
                      ? 'ከላይ ያለውን ካርታ ጠቅ በማድረግ ክልሉን ይምረጡ'
                      : 'Click on a region on the map to explore its crafts and events'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Region Image */}
                  <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg group/img">
                    <img 
                      src={`https://res.cloudinary.com/dmhu32ya9/image/upload/f_auto,q_auto,w_800,h_500,c_fill/ethio-hub/regions/${activeRegion.id}.jpg`} 
                      alt={activeRegion.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4">
                       <h3 className="font-serif text-2xl font-bold text-white drop-shadow-md">
                        {language === 'am' ? activeRegion.nameAm : activeRegion.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveRegion(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed font-light">
                    {language === 'am' ? activeRegion.descriptionAm : activeRegion.description}
                  </p>

                  {/* Crafts Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <Package className="w-4 h-4 text-secondary" />
                       <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        {language === 'am' ? 'ባህላዊ ጥበቦች' : 'Signature Crafts'}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeRegion.crafts.map((craft, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white transition-all cursor-default"
                        >
                          {craft}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Festivals & Events */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Music className="w-4 h-4 text-secondary" />
                       <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        {language === 'am' ? 'ታዋቂ በዓላት' : 'Cultural Events'}
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {regionFestivals.length > 0 ? (
                        regionFestivals.map((fest, idx) => (
                          <Link 
                            key={idx}
                            href={`/event/${fest.id || fest._id}`}
                            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:shadow-lg hover:shadow-black/5 border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                              <img src={fest.coverImage || (fest.gallery?.[0])} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-primary dark:text-white truncate group-hover:text-secondary transition-colors">
                                {language === 'am' ? (fest.name_am || fest.name) : (fest.name_en || fest.name)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="w-3 h-3 text-secondary fill-secondary" />
                                <span className="text-[10px] text-gray-400 font-medium">Featured Festival</span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))
                      ) : (
                        activeRegion.events.map((event, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-secondary shadow-sm">
                              {getEventIcon(event)}
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{event}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/products?region=${activeRegion.id}`}
                    className="flex items-center justify-center gap-3 w-full bg-primary text-white py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-secondary hover:shadow-xl hover:shadow-secondary/20 transition-all group"
                  >
                    {language === 'am' ? 'ጥበቦችን ይግዙ' : 'Shop Regional Crafts'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary border border-gray-200 dark:border-white/10'
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