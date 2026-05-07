import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Festival from '@/models/festival.model';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Database not connected' }),
        { status: 503, headers: { 'content-type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status'); // Filter by live/upcoming
    const region = url.searchParams.get('region');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const activeUsers = await User.find({
      status: { $ne: 'Suspended' }
    }).select('_id');
    const activeUserIds = activeUsers.map(u => u._id);

     // Build query for verified and published festivals only
     const query: any = {
       organizer: { $in: activeUserIds }
    };

    if (region) {
      query.region = region;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { 'location.name': { $regex: search, $options: 'i' } }
      ];
    }

    const festivals = await Festival.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: 1 }) // Sort by start date ascending
      .limit(limit)
      .lean();

    // Process festivals to add displayStatus and calculate ticket info
    const processedFestivals = festivals.map((festival: any) => {
      const now = new Date();
      const startDate = new Date(festival.startDate);
      const endDate = new Date(festival.endDate);
      
      let displayStatus: 'upcoming' | 'live' | 'ended' = 'upcoming';
      if (now >= startDate && now <= endDate) {
        displayStatus = 'live';
      } else if (now > endDate) {
        displayStatus = 'ended';
      }

      // Extract ticket pricing from pricing object or use defaults
      const baseTicketPrice = festival.pricing?.basePrice || 500;
      const vipTicketPrice = festival.pricing?.vipPrice || 1500;

      return {
        ...festival,
        displayStatus,
        baseTicketPrice,
        locationName: festival.location?.name || '',
        locationAddress: festival.location?.address || '',
        // Ensure we have the fields expected by the FestivalCard component
        gallery: festival.gallery || [],
        shortDescription: festival.shortDescription || '',
        coverImage: festival.coverImage || '',
        name: festival.name || '',
        type: festival.type || 'Cultural/Traditional',
        startDate: festival.startDate,
        endDate: festival.endDate,
        _id: festival._id
      };
    });

    // Filter by status if requested
    let filteredFestivals = processedFestivals;
    if (status) {
      if (status === 'live') {
        filteredFestivals = processedFestivals.filter(f => f.displayStatus === 'live');
      } else if (status === 'upcoming') {
        filteredFestivals = processedFestivals.filter(f => f.displayStatus === 'upcoming');
      } else if (status === 'ended') {
        filteredFestivals = processedFestivals.filter(f => f.displayStatus === 'ended');
      }
    }

    return new NextResponse(
      JSON.stringify({ success: true, festivals: filteredFestivals }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching festivals:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}