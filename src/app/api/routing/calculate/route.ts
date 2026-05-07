import { NextRequest, NextResponse } from 'next/server';

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '1bbeff7fa5e64053b535fe3e6ca58ddb';

interface RoutingResult {
  distanceKm: number;
  distanceText: string;
  shippingFee: number;
  success: boolean;
  error?: string;
}

function calculateShippingFee(distanceKm: number): number {
  if (distanceKm < 5) {
    return 100;
  } else if (distanceKm <= 15) {
    return 250;
  } else {
    return 450;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artisanId, artisanLat, artisanLon, userLocation } = body;

    let startLat = artisanLat;
    let startLon = artisanLon;
    const endLat = userLocation?.latitude;
    const endLon = userLocation?.longitude;

    // If artisanId is provided, fetch their location from profile
    if (artisanId && (!startLat || !startLon)) {
      try {
        const ArtisanProfile = (await import('@/models/artisan/artisanProfile.model')).default;
        const profile = await ArtisanProfile.findOne({ userId: artisanId });
        if (profile && profile.latitude && profile.longitude) {
          startLat = profile.latitude;
          startLon = profile.longitude;
        } else {
          // Fallback to a default Addis Ababa coordinate if not found
          startLat = 9.032;
          startLon = 38.746;
        }
      } catch (err) {
        console.error('Error fetching artisan profile:', err);
        startLat = 9.032;
        startLon = 38.746;
      }
    }

    if (!startLat || !startLon || !endLat || !endLon) {
      return NextResponse.json(
        { success: false, message: 'All coordinates are required' },
        { status: 400 }
      );
    }

    const apiUrl = `https://api.geoapify.com/v1/routing?waypoints=${startLat},${startLon}|${endLat},${endLon}&mode=drive&details=distance`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': GEOAPIFY_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Geoapify API error:', response.status);
      return NextResponse.json(
        { success: false, message: 'Failed to calculate route' },
        { status: response.status }
      );
    }

    const data = await response.json();

    let distanceKm = 0;

    if (data.features && data.features.length > 0) {
      const route = data.features[0];
      if (route.properties && route.properties.distance) {
        distanceKm = route.properties.distance / 1000;
      }
    }

    if (distanceKm === 0) {
      const latDiff = Math.abs(Number(endLat) - Number(startLat));
      const lonDiff = Math.abs(Number(endLon) - Number(startLon));
      const avgLat = (Number(endLat) + Number(startLat)) / 2;
      const latKm = latDiff * 111;
      const lonKm = lonDiff * 111 * Math.cos(avgLat * Math.PI / 180);
      distanceKm = Math.sqrt(latKm * latKm + lonKm * lonKm);
    }

    distanceKm = Math.round(distanceKm * 100) / 100;

    const shippingFee = calculateShippingFee(distanceKm);

    const result: RoutingResult = {
      distanceKm,
      distanceText: `${distanceKm.toFixed(1)} km`,
      shippingFee,
      success: true,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Routing API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
