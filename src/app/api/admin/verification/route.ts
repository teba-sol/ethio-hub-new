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

    let statusFilter: string[] = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Modification Requested'];

    if (status && status !== 'All') {
      const statusMap: Record<string, string> = {
        'Pending': 'Pending',
        'Under Review': 'Under Review',
        'Approved': 'Approved',
        'Rejected': 'Rejected',
        'Modification Requested': 'Modification Requested',
      };
      if (statusMap[status]) {
        statusFilter = [statusMap[status]];
      }
    }

    const requests: any[] = [];

    // Parallelize artisan and organizer data fetching
    const [artisanData, organizerData, deliveryData] = await Promise.all([
      // Artisan block
      (async () => {
        if (role === 'all' || role === 'artisan') {
          const artisanQuery: any = {
            role: 'artisan',
            artisanStatus: { $in: statusFilter },
          };

          if (search) {
            artisanQuery.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

          const artisanUsers = await User.find(artisanQuery)
            .select('-password')
            .sort({ createdAt: -1 })
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
        }
        return [];
      })(),

      // Organizer block
      (async () => {
        if (role === 'all' || role === 'organizer') {
          const organizerQuery: any = {
            role: 'organizer',
            organizerStatus: { $in: statusFilter },
          };

          if (search) {
            organizerQuery.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

          const organizerUsers = await User.find(organizerQuery)
            .select('-password')
            .sort({ createdAt: -1 })
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
        }
        return [];
      })(),

      // Delivery block
      (async () => {
        if (role === 'all' || role === 'delivery') {
          const deliveryQuery: any = {
            role: 'delivery',
            deliveryStatus: { $in: statusFilter },
          };

          if (search) {
            deliveryQuery.$or = [
              { name: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
            ];
          }

          const deliveryUsers = await User.find(deliveryQuery)
            .select('-password')
            .sort({ createdAt: -1 })
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
        }
        return [];
      })()
    ]);

    requests.push(...artisanData, ...organizerData, ...deliveryData);

    requests.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

    return new NextResponse(
      JSON.stringify({ success: true, requests }),
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
  const filled = fields.filter((f) => profile[f] && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function calculateOrganizerProfileCompletion(profile: any): number {
  const fields = [
    'companyName', 'phone', 'bio', 'country', 'region', 'city', 'address',
    'payoutMethod', 'bankName', 'accountHolderName', 'accountNumber',
    'logo', 'businessLicense',
  ];
  const filled = fields.filter((f) => profile[f] && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function calculateDeliveryProfileCompletion(user: any): number {
  const profile = user.deliveryProfile || {};
  const fields = [
    'phone', 'vehicleType', 'licensePlate', 'idDocument'
  ];
  const profileFilled = fields.filter((f) => profile[f] && profile[f] !== '').length;
  const avatarFilled = user.profileImage ? 1 : 0;
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
  if (profile.idDocument) {
    docs.push({
      id: 'id_document',
      name: 'ID Document',
      type: 'image',
      url: profile.idDocument,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile.workshopPhoto) {
    docs.push({
      id: 'workshop_photo',
      name: 'Workshop Photo',
      type: 'image',
      url: profile.workshopPhoto,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile.craftProcessPhoto) {
    docs.push({
      id: 'craft_process',
      name: 'Craft Process Photo',
      type: 'image',
      url: profile.craftProcessPhoto,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile.productSamplePhotos && profile.productSamplePhotos.length > 0) {
    profile.productSamplePhotos.forEach((photo: string, index: number) => {
      docs.push({
        id: `product_sample_${index}`,
        name: `Product Sample ${index + 1}`,
        type: 'image',
        url: photo,
        uploadedAt: formatDate(profile.createdAt),
      });
    });
  }
  return docs;
}

function buildOrganizerDocuments(profile: any): any[] {
  const docs: any[] = [];
  if (profile.businessLicense) {
    docs.push({
      id: 'business_license',
      name: 'Business License',
      type: 'image',
      url: profile.businessLicense,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  if (profile.logo) {
    docs.push({
      id: 'company_logo',
      name: 'Company Logo',
      type: 'image',
      url: profile.logo,
      uploadedAt: formatDate(profile.createdAt),
    });
  }
  return docs;
}

function buildDeliveryDocuments(user: any): any[] {
  const docs: any[] = [];
  const profile = user.deliveryProfile || {};
  if (profile.idDocument) {
    docs.push({
      id: 'id_document',
      name: 'National ID / Passport',
      type: 'image',
      url: profile.idDocument,
      uploadedAt: formatDate(user.updatedAt),
    });
  }
  return docs;
}