import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar as CalIcon, MapPin, Calendar } from 'lucide-react';
import { Button } from './UI';
import { Festival } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getLocalizedText } from '../utils/getLocalizedText';

export const FestivalCard: React.FC<{ festival: Festival }> = ({ festival }) => {
  const { user } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();

  const name = getLocalizedText(festival, 'name', language);
  const shortDesc = getLocalizedText(festival, 'shortDescription', language);

  // Handle location name which might be a nested object or flat fields
  let locationName = getLocalizedText(festival as any, 'locationName' as any, language);
  if (!locationName && (festival as any).location) {
    const location = (festival as any).location;
    if (typeof location === 'object' && location.name) {
      if (typeof location.name === 'object') {
        locationName = location.name[language] || location.name.en || '';
      } else {
        locationName = location.name;
      }
    } else {
      locationName = location.name_en || location.name_am || location.name || '';
    }
  }

  return (
    <article className="group relative h-[420px] rounded-3xl overflow-hidden shadow-md border border-white/10">
      <Link href={`/event/${festival.id}`}>
        {festival.coverImage ? (
          <img 
            src={festival.coverImage} 
            alt={name} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Calendar className="w-20 h-20 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ethio-dark via-ethio-dark/20 to-transparent" />
      </Link>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex items-center space-x-3 text-[10px] text-secondary font-bold uppercase tracking-widest mb-2">
          <CalIcon className="w-3.5 h-3.5" />
          <span>{new Date(festival.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span className="opacity-30">•</span>
          <MapPin className="w-3.5 h-3.5" />
          <span>{locationName.split(',')[0]}</span>
        </div>
        <h3 className="text-2xl font-serif font-bold mb-2 tracking-tight group-hover:text-secondary transition-colors duration-300">{name}</h3>
        <p className="text-gray-300 text-[11px] line-clamp-2 mb-6 font-light max-w-sm opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 leading-relaxed">
          {shortDesc}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-secondary">${festival.baseTicketPrice}</span>
            <span className="text-[9px] text-gray-400 uppercase tracking-widest">Starting At</span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="px-6 rounded-full font-black text-[10px] uppercase tracking-[0.1em] shadow-lg shadow-secondary/10 hover:shadow-secondary/30 transition-all"
            onClick={(e) => {
              e.preventDefault();
              router.push(`/event/${festival.id}`);
            }}
          >
            Explore
          </Button>
        </div>
      </div>
    </article>
  );
};
