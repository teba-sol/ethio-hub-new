import { useContentLanguage } from '@/hooks/useContentLanguage';
import { BilingualInput } from '@/components/BilingualInput';

type Event = {
  name_en?: string;
  name_am?: string;
  shortDescription_en?: string;
  shortDescription_am?: string;
  fullDescription_en?: string;
  fullDescription_am?: string;
  location?: { name_en?: string; name_am?: string; address?: string };
  schedule?: Array<{ day?: number; title_en?: string; title_am?: string; activities?: string }>;
  policies?: { 
    cancellation_en?: string; 
    cancellation_am?: string; 
    terms_en?: string; 
    terms_am?: string; 
    safety_en?: string; 
    safety_am?: string 
  };
  hotels?: Array<{ 
    name_en?: string; 
    name_am?: string; 
    description_en?: string; 
    description_am?: string 
  }>;
  transportation?: Array<{ 
    type_en?: string; 
    type_am?: string; 
    description_en?: string; 
    description_am?: string 
  }>;
};

export const EventDisplay = ({ event }: { event: Event }) => {
  const { language, getLocalizedField } = useContentLanguage();

  return (
    <div className="space-y-8">
      {/* Event Name */}
      <h1 className="text-3xl font-serif font-bold text-primary">
        {getLocalizedField(event, 'name')}
      </h1>

      {/* Short Description */}
      <p className="text-gray-600">
        {getLocalizedField(event, 'shortDescription')}
      </p>

      {/* Full Description */}
      <div className="prose">
        <h3>About This Event</h3>
        <p>{getLocalizedField(event, 'fullDescription')}</p>
      </div>

      {/* Location */}
      {event.location && (
        <div>
          <h4>Location</h4>
          <p>{getLocalizedField(event.location, 'name')}</p>
          {event.location.address && <p className="text-sm text-gray-500">{event.location.address}</p>}
        </div>
      )}

      {/* Schedule */}
      {event.schedule?.map((day, idx) => (
        <div key={idx} className="border border-gray-100 rounded-2xl p-6">
          <h5>Day {day.day || idx + 1}: {getLocalizedField(day, 'title')}</h5>
          {day.activities && <p>{day.activities}</p>}
        </div>
      ))}

      {/* Policies */}
      {event.policies && (
        <div className="space-y-4">
          <h3>Policies</h3>
          {event.policies.cancellation_en && (
            <div>
              <h4>Cancellation Policy</h4>
              <p>{getLocalizedField(event.policies, 'cancellation')}</p>
            </div>
          )}
          {event.policies.terms_en && (
            <div>
              <h4>Terms & Conditions</h4>
              <p>{getLocalizedField(event.policies, 'terms')}</p>
            </div>
          )}
          {event.policies.safety_en && (
            <div>
              <h4>Safety Rules</h4>
              <p>{getLocalizedField(event.policies, 'safety')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
