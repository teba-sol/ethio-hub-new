type BookingLike = {
  bookingDetails?: {
    room?: {
      hotelId?: string;
      roomId?: string;
      hotelName?: string;
      roomName?: string;
    };
    transport?: {
      transportId?: string;
      type?: string;
    };
  };
};

const toPlainObject = <T>(value: T): T => {
  if (value && typeof (value as any).toObject === 'function') {
    return (value as any).toObject();
  }
  return value;
};

const normalizeId = (value: unknown) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

export function attachAvailabilityToFestival<T extends Record<string, any>>(
  festivalDocument: T,
  confirmedBookings: BookingLike[]
) {
  const festival = toPlainObject(festivalDocument);

  // Use the stored `available` field directly (updated atomically on booking)
  const hotels = (festival.hotels || []).map((hotel: any) => {
    const hotelPlain = toPlainObject(hotel);

    return {
      ...hotelPlain,
      rooms: (hotelPlain.rooms || []).map((room: any) => {
        const roomPlain = toPlainObject(room);
        return {
          ...roomPlain,
          id: String(roomPlain._id || roomPlain.id),
          initialAvailability: Number(roomPlain.availability || 0),
          available: Number(roomPlain.available || roomPlain.availability || 0),
          isSoldOut: (Number(roomPlain.available || roomPlain.availability || 0)) <= 0,
        };
      }),
    };
  });

  const transportation = (festival.transportation || []).map((transport: any) => {
    const transportPlain = toPlainObject(transport);
    return {
      ...transportPlain,
      id: String(transportPlain._id || transportPlain.id),
      initialAvailability: Number(transportPlain.availability || 0),
      available: Number(transportPlain.available || transportPlain.availability || 0),
      isSoldOut: (Number(transportPlain.available || transportPlain.availability || 0)) <= 0,
    };
  });

  return {
    ...festival,
    hotels,
    transportation,
  };
}

export const findRoomAvailability = (
  festivalWithAvailability: any,
  roomDetails?: {
    hotelId?: string;
    roomId?: string;
    hotelName?: string;
    roomName?: string;
  }
) => {
  if (!roomDetails) return null;

  const roomId = normalizeId(roomDetails.roomId);
  const hotelId = normalizeId(roomDetails.hotelId);

  for (const hotel of festivalWithAvailability.hotels || []) {
    const currentHotelId = normalizeId(hotel._id || hotel.id);
    if (hotelId && currentHotelId && hotelId !== currentHotelId) {
      continue;
    }

    for (const room of hotel.rooms || []) {
      const currentRoomId = normalizeId(room._id || room.id);
      const sameById = roomId && currentRoomId && roomId === currentRoomId;
      const sameByName =
        `${hotel.name || ''}|${room.name || ''}`.toLowerCase().trim() ===
        `${hotel.name || ''}|${roomDetails.roomName || ''}`.toLowerCase().trim();

      if (sameById || sameByName) {
        return room;
      }
    }
  }

  return null;
};

export const findTransportAvailability = (
  festivalWithAvailability: any,
  transportDetails?: {
    transportId?: string;
    type?: string;
  }
) => {
  if (!transportDetails) return null;

  const transportId = normalizeId(transportDetails.transportId);

  return (festivalWithAvailability.transportation || []).find((transport: any) => {
    const currentTransportId = normalizeId(transport._id || transport.id);
    const sameById = transportId && currentTransportId && transportId === currentTransportId;
    const sameByName =
      (transport.type || '').toLowerCase().trim() ===
      (transportDetails.type || '').toLowerCase().trim();

    return sameById || sameByName;
  }) || null;
}
