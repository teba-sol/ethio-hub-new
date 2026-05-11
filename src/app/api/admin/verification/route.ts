import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import ArtisanProfile from '@/models/artisan/artisanProfile.model';
import OrganizerProfile from '@/models/organizer/organizerProfile.model';
import { jwtVerify } from 'jose';

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

    const token = request.cookies.get('sessionToken')?.value;
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const adminRole = payload.role as string;

    if (adminRole !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Admin access required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const role = url.searchParams.get('role') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let statusFilter: string[] | null = null;

    if (status && status !== 'All') {
      const statusMap: Record<string, string> = {
        'Not Submitted': 'Not Submitted',
        'Pending': 'Pending',
        'Under Review': 'Under Review',
        'Approved': 'Approved',
        'Rejected': 'Rejected',
        'Modification Requested': 'Modification Requested',
      };
      if (statusMap[status]) {
        statusFilter = [statusMap[status]];
      }
    } else {
      // By default, exclude "Not Submitted" to show only actionable requests
      statusFilter = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Modification Requested'];
    }

    const [artisanData, organizerData, deliveryData] = await Promise.all([
      // Artisan block
      (async () => {
        try {
          if (role !== 'all' && role !== 'artisan') return [];

          const artisanQuery: any = { role: 'artisan' };
          if (statusFilter) {
            artisanQuery.artisanStatus = { $in: statusFilter };
          }
          if (search) {
            artisanQuery.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

          const artisanUsers = await User.find(artisanQuery)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

          if (artisanUsers.length > 0) {
            const userIds = artisanUsers.map(u => u._id);
            const artisanProfiles = await ArtisanProfile.find({ userId: { $in: userIds } }).lean();

            const artisanProfileMap = new Map();
            artisanProfiles.forEach((p: any) => {
              artisanProfileMap.set(p.userId.toString(), p);
            });

            return artisanUsers.map((user: any) => {
              const profile = artisanProfileMap.get(user._id.toString());
              return {
                id: user._id.toString(),
                userId: user._id.toString(),
                userName: user.name,
                userEmail: user.email,
                userPhone: profile?.phone || '',
                userRole: 'Artisan',
                profileCompletion: profile ? calculateArtisanProfileCompletion(profile) : 0,
                registrationDate: formatDate(user.createdAt),
                submittedAt: profile ? formatDate(profile.createdAt) : '',
                status: mapStatus(user.artisanStatus),
                documents: profile ? buildArtisanDocuments(profile) : [],
                profile: profile || null,
                rejectionReason: user.rejectionReason || '',
                userAvatar: profile?.profileImage || user.profileImage || null,
                businessName: profile?.businessName || '',
                category: profile?.category || '',
                region: profile?.region || '',
                city: profile?.city || '',
              };
            });
          }
          return [];
        } catch (error) {
          console.error("Artisan fetch error:", error);
          return [];
        }
      })(),

      // Organizer block
      (async () => {
        try {
          if (role !== 'all' && role !== 'organizer') return [];

          const organizerQuery: any = { role: 'organizer' };
          if (statusFilter) {
            organizerQuery.organizerStatus = { $in: statusFilter };
          }
          if (search) {
            organizerQuery.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

          const organizerUsers = await User.find(organizerQuery)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

          if (organizerUsers.length > 0) {
            const userIds = organizerUsers.map(u => u._id);
            const organizerProfiles = await OrganizerProfile.find({ userId: { $in: userIds } }).lean();

            const organizerProfileMap = new Map();
            organizerProfiles.forEach((p: any) => {
              organizerProfileMap.set(p.userId.toString(), p);
            });

            return organizerUsers.map((user: any) => {
              const profile = organizerProfileMap.get(user._id.toString());
              return {
                id: user._id.toString(),
                userId: user._id.toString(),
                userName: user.name,
                userEmail: user.email,
                userPhone: profile?.phone || '',
                userRole: 'Organizer',
                profileCompletion: profile ? calculateOrganizerProfileCompletion(profile) : 0,
                registrationDate: formatDate(user.createdAt),
                submittedAt: profile ? formatDate(profile.createdAt) : '',
                status: mapStatus(user.organizerStatus),
                documents: profile ? buildOrganizerDocuments(profile) : [],
                profile: profile || null,
                rejectionReason: user.rejectionReason || '',
                userAvatar: profile?.logo || user.profileImage || null,
                companyName: profile?.companyName || '',
                region: profile?.region || '',
                city: profile?.city || '',
              };
            });
          }
          return [];
        } catch (error) {
          console.error("Organizer fetch error:", error);
          return [];
        }
      })(),

      // Delivery block
      (async () => {
        try {
          if (role !== 'all' && role !== 'delivery') return [];

          const deliveryQuery: any = { role: 'delivery' };
          if (statusFilter) {
            deliveryQuery.deliveryStatus = { $in: statusFilter };
          }
          if (search) {
            deliveryQuery.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

          const deliveryUsers = await User.find(deliveryQuery)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

          return deliveryUsers.map((user: any) => {
            return {
              id: user._id.toString(),
              userId: user._id.toString(),
              userName: user.name,
              userEmail: user.email,
              userPhone: user.deliveryProfile?.phone || user.phone || '',
              userRole: 'Delivery Guy',
              profileCompletion: calculateDeliveryProfileCompletion(user),
              registrationDate: formatDate(user.createdAt),
              submittedAt: formatDate(user.updatedAt),
              status: mapStatus(user.deliveryStatus),
              documents: buildDeliveryDocuments(user),
              profile: user.deliveryProfile || null,
              rejectionReason: user.rejectionReason || '',
              userAvatar: user.profileImage || null,
              vehicleType: user.deliveryProfile?.vehicleType || '',
              licensePlate: user.deliveryProfile?.licensePlate || '',
            };
          });
        } catch (error) {
          console.error("Delivery fetch error:", error);
          return [];
        }
      })()
    ]);

    const requests = [...artisanData, ...organizerData, ...deliveryData];
    requests.sort((a, b) => new Date(b.registrationDate || 0).getTime() - new Date(a.registrationDate || 0).getTime());

    // We only take the top 'limit' items for the current page
    const paginatedRequests = requests.slice(0, limit);

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        requests: paginatedRequests,
        pagination: {
          page,
          limit,
          hasMore: artisanData.length === limit || organizerData.length === limit || deliveryData.length === limit
        }
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching verification requests:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

function calculateArtisanProfileCompletion(profile: any): number {
  const fields = [
    'phone', 'gender', 'businessName', 'category', 'experience', 'bio',
    'country', 'region', 'city', 'address', 'bankName', 'accountName',
    'accountNumber', 'profileImage', 'idDocument', 'workshopPhoto',
    'craftProcessPhoto',
  ];
  const filled = fields.filter((f) => profile?.[f] && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function calculateOrganizerProfileCompletion(profile: any): number {
  const fields = [
    'companyName', 'contactPersonName', 'phone', 'organizerType', 'bio', 'experienceYears',
    'country', 'region', 'city', 'address', 'payoutMethod',
    'logo', 'businessLicense', 'tourismLicense', 'eventPhotos'
  ];
  const filled = fields.filter((f) => profile?.[f] && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function calculateDeliveryProfileCompletion(user: any): number {
  const profile = user?.deliveryProfile || {};
  const fields = [
    'phone', 'vehicleType', 'licensePlate', 'idDocument'
  ];
  const profileFilled = fields.filter((f) => profile?.[f] && profile[f] !== '').length;
  const avatarFilled = user?.profileImage ? 1 : 0;
  return Math.round(((profileFilled + avatarFilled) / (fields.length + 1)) * 100);
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'Not Submitted': 'not_submitted',
    'Pending': 'submitted',
    'Under Review': 'under_review',
    'Approved': 'approved',
    'Rejected': 'rejected',
    'Modification Requested': 'modification_requested',
  };
  return map[status] || 'not_submitted';
}

function buildArtisanDocuments(profile: any): any[] {
  const docs: any[] = [];
  if (profile?.idDocument) {
    docs.push({
      id: 'id_document',
      name: 'ID Document',
      type: 'image',
      url: profile.idDocument,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile?.workshopPhoto) {
    docs.push({
      id: 'workshop_photo',
      name: 'Workshop Photo',
      type: 'image',
      url: profile.workshopPhoto,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile?.craftProcessPhoto) {
    docs.push({
      id: 'craft_process',
      name: 'Craft Process Photo',
      type: 'image',
      url: profile.craftProcessPhoto,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile?.productSamplePhotos) {
    let photos = profile.productSamplePhotos;
    if (typeof photos === 'string') {
      try { photos = JSON.parse(photos); } catch (e) { photos = [photos]; }
    }
    if (Array.isArray(photos)) {
      photos.forEach((photo: string, index: number) => {
        docs.push({
          id: `product_sample_${index}`,
          name: `Product Sample ${index + 1}`,
          type: 'image',
          url: photo,
          uploadedAt: formatDate(profile.createdAt),
        });
      });
    }
  }
  return docs;
}

function buildOrganizerDocuments(profile: any): any[] {
  const docs: any[] = [];
  const uploadedAt = formatDate(profile.createdAt);

  if (profile?.businessLicense) {
    docs.push({
      id: 'business_license',
      name: 'Business License',
      type: 'image',
      url: profile.businessLicense,
      uploadedAt,
    });
  }
  if (profile?.tourismLicense) {
    docs.push({
      id: 'tourism_license',
      name: 'Tourism License',
      type: 'image',
      url: profile.tourismLicense,
      uploadedAt,
    });
  }
  if (profile?.taxCert) {
    docs.push({
      id: 'tax_cert',
      name: 'Tax Certificate',
      type: 'image',
      url: profile.taxCert,
      uploadedAt,
    });
  }
  if (profile?.logo) {
    docs.push({
      id: 'company_logo',
      name: 'Company Logo',
      type: 'image',
      url: profile.logo,
      uploadedAt,
    });
  }
  if (profile?.eventPhotos) {
    docs.push({
      id: 'event_photos',
      name: 'Past Event Photos',
      type: 'image',
      url: profile.eventPhotos,
      uploadedAt,
    });
  }
  if (profile?.eventPoster) {
    docs.push({
      id: 'event_poster',
      name: 'Past Event Poster',
      type: 'image',
      url: profile.eventPoster,
      uploadedAt,
    });
  }
  if (profile?.eventVideos) {
    docs.push({
      id: 'event_videos',
      name: 'Past Event Video',
      type: 'video',
      url: profile.eventVideos,
      uploadedAt,
    });
  }
  return docs;
}

function buildDeliveryDocuments(user: any): any[] {
  const docs: any[] = [];
  const profile = user?.deliveryProfile || {};
  if (profile?.idDocument) {
    docs.push({
      id: 'id_document',
      name: 'National ID / Passport',
      type: 'image',
      url: profile.idDocument,
      uploadedAt: formatDate(user.updatedAt),
    });
  }
  if (user?.profileImage) {
    docs.push({
      id: 'profile_photo',
      name: 'Profile Photo',
      type: 'image',
      url: user.profileImage,
      uploadedAt: formatDate(user.updatedAt),
    });
  }
  return docs;
}