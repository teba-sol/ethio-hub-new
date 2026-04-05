import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import ArtisanProfile from '@/models/artisan/artisanProfile.model';
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

    const query: any = {
      role: 'artisan',
      artisanStatus: { $in: statusFilter },
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch users and profiles in parallel for speed
    const [users, profiles] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean(),
      ArtisanProfile.find({}).lean(),
    ]);

    const profileMap = new Map();
    profiles.forEach((p: any) => {
      profileMap.set(p.userId.toString(), p);
    });

    const requests = users.map((user: any) => {
      const profile = profileMap.get(user._id.toString());
      return {
        id: user._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        userPhone: profile?.phone || '',
        userRole: 'Artisan' as const,
        profileCompletion: profile ? calculateProfileCompletion(profile) : 0,
        registrationDate: formatDate(user.createdAt),
        submittedAt: profile ? formatDate(profile.createdAt) : '',
        status: mapArtisanStatus(user.artisanStatus),
        documents: profile ? buildDocuments(profile) : [],
        artisanProfile: profile || null,
        rejectionReason: user.rejectionReason || '',
        userAvatar: profile?.profileImage || user.profileImage || null,
        businessName: profile?.businessName || '',
        category: profile?.category || '',
        region: profile?.region || '',
        city: profile?.city || '',
      };
    });

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

function calculateProfileCompletion(profile: any): number {
  const fields = [
    'phone', 'gender', 'businessName', 'category', 'experience', 'bio',
    'country', 'region', 'city', 'address', 'bankName', 'accountName',
    'accountNumber', 'profileImage', 'idDocument', 'workshopPhoto',
    'craftProcessPhoto',
  ];
  const filled = fields.filter((f) => profile[f] && profile[f] !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapArtisanStatus(status: string): string {
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

function buildDocuments(profile: any): any[] {
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
