// src/lib/festivalNormalization.ts

const isMissing = (value: any) => value === undefined || value === null || value === '';

const textValue = (...values: any[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return value ? value.trim() : '';
};

export const normalizeSchedule = (schedule: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(schedule) ? schedule : [];
  const normalized = items
    .map((item: any, index: number) => {
      const titleEn = textValue(item?.title_en, item?.title);
      const titleAm = textValue(item?.title_am, item?.title);
      const activitiesEn = textValue(item?.activities_en, item?.activities);
      const activitiesAm = textValue(item?.activities_am, item?.activities);
      
      if (!isDraft && (!titleEn || !titleAm)) return null;

      const fallbackTitle = `Draft day ${index + 1}`;
      return {
        day: Number(item?.day) || index + 1,
        title_en: titleEn || titleAm || fallbackTitle,
        title_am: titleAm || titleEn || fallbackTitle,
        activities_en: activitiesEn || activitiesAm || '',
        activities_am: activitiesAm || activitiesEn || '',
        performers: Array.isArray(item?.performers) ? item.performers : [],
      };
    })
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  return isDraft ? [{
    day: 1,
    title_en: 'Draft day 1',
    title_am: 'Draft day 1',
    activities_en: '',
    activities_am: '',
    performers: [],
  }] : [];
};

export const normalizeHotels = (hotels: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(hotels) ? hotels : [];

  return items
    .map((hotel: any, index: number) => {
      const nameEn = textValue(hotel?.name_en, hotel?.name);
      const nameAm = textValue(hotel?.name_am, hotel?.name);
      const hasHotelDetails = nameEn || nameAm || hotel?.address || hotel?.image || (Array.isArray(hotel?.rooms) && hotel.rooms.length > 0);
      if (isDraft && !hasHotelDetails) return null;

      const fallbackName = `Draft hotel ${index + 1}`;
      const rooms = (Array.isArray(hotel?.rooms) ? hotel.rooms : [])
        .map((room: any, roomIndex: number) => {
          const roomNameEn = textValue(room?.name_en, room?.name);
          const roomNameAm = textValue(room?.name_am, room?.name);
          const hasRoomDetails = roomNameEn || roomNameAm || room?.image || room?.availability || room?.pricePerNight;
          if (isDraft && !hasRoomDetails) return null;

          const fallbackRoomName = `Draft room ${roomIndex + 1}`;
          const availability = Number(room?.availability) || (isDraft ? 1 : 0);
          
          return {
            ...room,
            name_en: roomNameEn || roomNameAm || fallbackRoomName,
            name_am: roomNameAm || roomNameEn || fallbackRoomName,
            description_en: room?.description_en || room?.description || '',
            description_am: room?.description_am || room?.description || '',
            availability: availability,
            available: availability,
          };
        })
        .filter(Boolean);

      return {
        ...hotel,
        name_en: nameEn || nameAm || fallbackName,
        name_am: nameAm || nameEn || fallbackName,
        description_en: hotel?.description_en || hotel?.description || '',
        description_am: hotel?.description_am || hotel?.description || '',
        fullDescription_en: hotel?.fullDescription_en || hotel?.fullDescription || '',
        fullDescription_am: hotel?.fullDescription_am || hotel?.fullDescription || '',
        facilities: Array.isArray(hotel?.facilities) ? hotel.facilities : [],
        foodAndDrink: Array.isArray(hotel?.foodAndDrink) ? hotel.foodAndDrink : [],
        hotelRules: Array.isArray(hotel?.hotelRules) ? hotel.hotelRules : [],
        propertyType: hotel?.propertyType || 'Hotel',
        checkInTime: hotel?.checkInTime || '14:00',
        checkOutTime: hotel?.checkOutTime || '12:00',
        rooms,
      };
    })
    .filter(Boolean);
};

export const normalizeTransportation = (transportation: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(transportation) ? transportation : [];

  return items
    .map((transport: any, index: number) => {
      const typeEn = textValue(transport?.type_en, transport?.type);
      const typeAm = textValue(transport?.type_am, transport?.type);
      const hasDetails = typeEn || typeAm || transport?.image || transport?.availability || transport?.price;
      if (isDraft && !hasDetails) return null;

      const fallbackType = `Draft transport ${index + 1}`;
      const availability = Number(transport?.availability) || (isDraft ? 1 : 0);

      return {
        ...transport,
        type_en: typeEn || typeAm || fallbackType,
        type_am: typeAm || typeEn || fallbackType,
        description_en: transport?.description_en || transport?.description || '',
        description_am: transport?.description_am || transport?.description || '',
        availability: availability,
        available: availability,
      };
    })
    .filter(Boolean);
};

export const normalizeServices = (services: any = {}, isDraft: boolean) => {
  const foodPackages = Array.isArray(services?.foodPackages) ? services.foodPackages : [];

  const culturalEn = Array.isArray(services?.culturalServices_en) ? services.culturalServices_en : [];
  const culturalAm = Array.isArray(services?.culturalServices_am) ? services.culturalServices_am : [];
  const assistanceEn = Array.isArray(services?.specialAssistance_en) ? services.specialAssistance_en : [];
  const assistanceAm = Array.isArray(services?.specialAssistance_am) ? services.specialAssistance_am : [];
  const extrasEn = Array.isArray(services?.extras_en) ? services.extras_en : [];
  const extrasAm = Array.isArray(services?.extras_am) ? services.extras_am : [];

  return {
    foodPackages: foodPackages
      .map((pkg: any, index: number) => {
        const nameEn = textValue(pkg?.name_en, pkg?.name, pkg?.customName);
        const nameAm = textValue(pkg?.name_am, pkg?.nameAm, pkg?.name_amharic, pkg?.name);
        const descriptionEn = textValue(pkg?.description_en, pkg?.description);
        const descriptionAm = textValue(pkg?.description_am, pkg?.descriptionAm, pkg?.description);
        const hasDetails = nameEn || nameAm || descriptionEn || descriptionAm || Number(pkg?.pricePerPerson) > 0;
        if (isDraft && !hasDetails) return null;
        if (!isDraft && !hasDetails) return null;

        const fallbackName = `Food package ${index + 1}`;
        return {
          ...pkg,
          name_en: nameEn || nameAm || fallbackName,
          name_am: nameAm || nameEn || fallbackName,
          description_en: descriptionEn || descriptionAm || '',
          description_am: descriptionAm || descriptionEn || '',
          pricePerPerson: Number(pkg?.pricePerPerson) || 0,
          items: Array.isArray(pkg?.items) ? pkg.items : [],
        };
      })
      .filter(Boolean),
    culturalServices_en: culturalEn,
    culturalServices_am: culturalAm,
    specialAssistance_en: assistanceEn,
    specialAssistance_am: assistanceAm,
    extras_en: extrasEn,
    extras_am: extrasAm,
  };
};

export const normalizePolicies = (policies: any = {}) => {
  const cancellationEn = textValue(policies?.cancellation_en, policies?.cancellation);
  const cancellationAm = textValue(policies?.cancellation_am, policies?.cancellation);
  const termsEn = textValue(policies?.terms_en, policies?.terms);
  const termsAm = textValue(policies?.terms_am, policies?.terms);
  const safetyEn = textValue(policies?.safety_en, policies?.safety);
  const safetyAm = textValue(policies?.safety_am, policies?.safety);

  return {
    cancellation_en: cancellationEn || cancellationAm || '',
    cancellation_am: cancellationAm || cancellationEn || '',
    terms_en: termsEn || termsAm || '',
    terms_am: termsAm || termsEn || '',
    safety_en: safetyEn || safetyAm || '',
    safety_am: safetyAm || safetyEn || '',
    ageRestriction: policies?.ageRestriction || '',
  };
};

export const normalizeTicketTypes = (ticketTypes: any[] = [], isDraft: boolean) => {
  const items = Array.isArray(ticketTypes) ? ticketTypes : [];

  return items
    .map((ticket: any) => {
      const nameEn = textValue(ticket?.name_en, ticket?.name);
      const nameAm = textValue(ticket?.name_am, ticket?.name);
      const hasTicketDetails = nameEn || nameAm || ticket?.price || ticket?.quantity;

      if (isDraft && !hasTicketDetails) return null;

      const price = Number(ticket?.price) || 0;
      const quantity = Number(ticket?.quantity) || 0;

      return {
        ...ticket,
        name_en: nameEn || nameAm || 'General Admission',
        name_am: nameAm || nameEn || 'ጠቅላላ መግቢያ',
        price: price,
        quantity: quantity,
        available: Number(ticket?.available) || quantity,
        perks: Array.isArray(ticket?.perks) ? ticket.perks : [],
      };
    })
    .filter(Boolean);
};

export const validateCreateAvailability = (hotels: any, transportation: any) => {
  const issues: string[] = [];

  if (Array.isArray(hotels)) {
    hotels.forEach((hotel: any, hotelIndex: number) => {
      const hotelLabel = String(hotel?.name || '').trim() || `Hotel ${hotelIndex + 1}`;
      const rooms = Array.isArray(hotel?.rooms) ? hotel.rooms : [];

      rooms.forEach((room: any, roomIndex: number) => {
        const roomLabel = String(room?.name || '').trim() || `Room ${roomIndex + 1}`;
        const availability = Number(room?.availability);

        if (isMissing(room?.availability) || Number.isNaN(availability)) {
          issues.push(`${hotelLabel} - ${roomLabel}: room availability must be numeric.`);
        } else if (availability < 0) {
          issues.push(`${hotelLabel} - ${roomLabel}: room availability must be at least 0.`);
        }
      });
    });
  }

  if (Array.isArray(transportation)) {
    transportation.forEach((transport: any, transportIndex: number) => {
      const transportLabel = String(transport?.type || '').trim() || `Transport ${transportIndex + 1}`;
      const availability = Number(transport?.availability);

      if (isMissing(transport?.availability) || Number.isNaN(availability)) {
        issues.push(`${transportLabel}: car availability must be numeric.`);
      } else if (availability < 0) {
        issues.push(`${transportLabel}: car availability must be at least 0.`);
      }
    });
  }

  return issues;
};
