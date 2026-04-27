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

const buildRoomNameKey = (hotelName?: string, roomName?: string) =>
  `${hotelName || ''}|${roomName || ''}`.toLowerCase().trim();

const buildTransportNameKey = (transportType?: string) =>
  (transportType || '').toLowerCase().trim();

const incrementCounter = (counter: Record<string, number>, key: string) => {
  if (!key) return;
  counter[key] = (counter[key] || 0) + 1;
};

export function attachAvailabilityToFestival<T extends Record<string, any>>(
  festivalDocument: T,
  confirmedBookings: BookingLike[]
) {
  const festival = toPlainObject(festivalDocument);

  const roomBookingsById: Record<string, number> = {};
  const roomBookingsByName: Record<string, number> = {};
  const transportBookingsById: Record<string, number> = {};
  const transportBookingsByName: Record<string, number> = {};

  confirmedBookings.forEach((booking) => {
    const room = booking.bookingDetails?.room;
    const transport = booking.bookingDetails?.transport;

    if (room) {
      incrementCounter(roomBookingsById, normalizeId(room.roomId));
      incrementCounter(roomBookingsByName, buildRoomNameKey(room.hotelName, room.roomName));
    }

    if (transport) {
      incrementCounter(transportBookingsById, normalizeId(transport.transportId));
      incrementCounter(transportBookingsByName, buildTransportNameKey(transport.type));
    }
  });

  const hotels = (festival.hotels || []).map((hotel: any) => {
    const hotelPlain = toPlainObject(hotel);

    return {
      ...hotelPlain,
      rooms: (hotelPlain.rooms || []).map((room: any) => {
        const roomPlain = toPlainObject(room);
        const roomId = normalizeId(roomPlain._id || roomPlain.id);
        const roomNameKey = buildRoomNameKey(hotelPlain.name, roomPlain.name);
        const initialAvailability = Number(roomPlain.availability || 0);
        const bookedCount = roomBookingsById[roomId] || roomBookingsByName[roomNameKey] || 0;
        const remaining = Math.max(0, initialAvailability - bookedCount);

        return {
          ...roomPlain,
          id: roomId || roomPlain.id,
          initialAvailability,
          bookedCount,
          remaining,
          isSoldOut: remaining <= 0,
        };
      }),
    };
  });

  const transportation = (festival.transportation || []).map((transport: any) => {
    const transportPlain = toPlainObject(transport);
    const transportId = normalizeId(transportPlain._id || transportPlain.id);
    const transportNameKey = buildTransportNameKey(transportPlain.type);
    const initialAvailability = Number(transportPlain.availability || 0);
    const bookedCount = transportBookingsById[transportId] || transportBookingsByName[transportNameKey] || 0;
    const remaining = Math.max(0, initialAvailability - bookedCount);

    return {
      ...transportPlain,
      id: transportId || transportPlain.id,
      initialAvailability,
      bookedCount,
      remaining,
      isSoldOut: remaining <= 0,
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
        buildRoomNameKey(hotel.name, room.name) ===
        buildRoomNameKey(roomDetails.hotelName, roomDetails.roomName);

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
      buildTransportNameKey(transport.type) === buildTransportNameKey(transportDetails.type);

    return sameById || sameByName;
  }) || null;
};
