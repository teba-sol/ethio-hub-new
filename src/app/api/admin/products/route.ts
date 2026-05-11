import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/artisan/product.model';
import User from '@/models/User';
import Order from '@/models/order.model';

export const dynamic = 'force-dynamic';

async function getAdminUser(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'ethio-hub-secret-key-2025');
    const { payload } = await jwtVerify(token, secret);
    const user = await User.findById((payload as any).userId).select('-password');
    return user;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.cookies.get('sessionToken')?.value;
    const user = await getAdminUser(token);
    if (!user || user.role !== 'admin') {
      return new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const verificationStatus = searchParams.get('verificationStatus');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: any = {};
    
    if (verificationStatus && ['Pending', 'Approved', 'Rejected'].includes(verificationStatus)) {
      query.verificationStatus = verificationStatus;
    }

    if (status && status !== 'All') {
      const statusMap: Record<string, string> = {
        'Active': 'Published',
        'Out of Stock': 'Out of Stock',
        'Disabled': 'Disabled',
      };
      if (statusMap[status]) {
        query.$or = [
          { status: statusMap[status] },
          ...(status === 'Disabled' ? [{ status: { $nin: ['Published', 'Out of Stock'] } }] : []),
        ];
      }
    }
    
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = query.$or || [];
      query.$or.push(
        { name: { $regex: escapedSearch, $options: 'i' } },
        { name_en: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
      );
    }

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('artisanId', 'name email artisanProfile.businessName artisanProfile.region artisanProfile.city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    if (products.length === 0) {
      return new NextResponse(JSON.stringify({
        success: true,
        products: [],
        stats: { total: 0, totalSold: 0, totalRevenue: 0, totalCommission: 0 },
        pagination: { page, limit, total: 0, hasMore: false }
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }

    const productIds = products.map((p: any) => p._id);

    // Match criteria for "successful" orders
    const validOrderMatch = {
      status: { $nin: ['Cancelled', 'Returned'] },
      $or: [
        { paymentStatus: { $in: ['paid', 'Paid'] } },
        { status: { $in: ['Paid', 'Ready for Pickup', 'Assigned', 'Shipped', 'Delivered'] } }
      ]
    };

    const [orderAgg, totalStats] = await Promise.all([
      // Stats for products on the current page
      Order.aggregate([
        { $match: { ...validOrderMatch, product: { $in: productIds } } },
        { $group: {
          _id: '$product',
          sold: { $sum: '$quantity' },
          revenue: { $sum: '$totalPrice' },
          commission: { $sum: '$adminCommission' },
          orderCount: { $sum: 1 },
        }}
      ]),
      // Global stats across ALL products matching the current search/filter
      Product.aggregate([
        { $match: query },
        { $project: { _id: 1 } },
        { $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'product',
          as: 'orders'
        }},
        { $unwind: '$orders' },
        { $match: { 
          'orders.status': { $nin: ['Cancelled', 'Returned'] },
          $or: [
            { 'orders.paymentStatus': { $in: ['paid', 'Paid'] } },
            { 'orders.status': { $in: ['Paid', 'Ready for Pickup', 'Assigned', 'Shipped', 'Delivered'] } }
          ]
        }},
        { $group: {
          _id: null,
          totalSold: { $sum: '$orders.quantity' },
          totalRevenue: { $sum: '$orders.totalPrice' },
          totalCommission: { $sum: '$orders.adminCommission' },
        }}
      ]),
    ]);

    const orderMap: Record<string, any> = {};
    orderAgg.forEach((o: any) => {
      orderMap[o._id.toString()] = o;
    });

    const enrichedProducts = products.map((p: any) => {
      const o = orderMap[p._id.toString()] || { sold: 0, revenue: 0, commission: 0, orderCount: 0 };
      const artisanProfile = p.artisanId?.artisanProfile;
      return {
        _id: p._id.toString(),
        name: p.name_en || p.name || 'Untitled',
        description: p.description_en || p.description || '',
        images: p.images || [],
        artisan: artisanProfile?.businessName || p.artisanId?.name || 'Unknown Artisan',
        artisanEmail: p.artisanId?.email || '',
        artisanRegion: artisanProfile?.region || '',
        artisanCity: artisanProfile?.city || '',
        category: p.category || 'General',
        status: p.status === 'Published' ? 'Active' : p.status === 'Out of Stock' ? 'Out of Stock' : 'Disabled',
        verificationStatus: p.verificationStatus,
        price: p.price || 0,
        discountPrice: p.discountPrice || null,
        totalStock: p.stock || 0,
        sold: o.sold,
        revenue: o.revenue,
        commissionRate: p.commissionRate || 10,
        totalCommission: o.commission,
        artisanEarnings: o.revenue - o.commission,
        refundAmount: 0,
        materials: p.material ? [p.material] : [],
        dimensions: p.dimensions || '',
        weight: p.weight || '',
        shippingInfo: p.shippingFee ? `Shipping: ${p.shippingFee}` : '',
        deliveryTime: p.deliveryTime || '',
        orderCount: o.orderCount,
        createdAt: p.createdAt,
        region: p.region || '',
        rating: p.rating || 0,
        numReviews: p.numReviews || 0,
      };
    });

    const stats = totalStats[0] || { totalSold: 0, totalRevenue: 0, totalCommission: 0 };

    return new NextResponse(JSON.stringify({
      success: true,
      products: enrichedProducts,
      stats: {
        total: totalCount,
        totalSold: stats.totalSold,
        totalRevenue: stats.totalRevenue,
        totalCommission: stats.totalCommission,
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: skip + limit < totalCount,
      }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return new NextResponse(JSON.stringify({ success: false, message: 'Failed to fetch products', error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const token = req.cookies.get('sessionToken')?.value;
    const user = await getAdminUser(token);
    if (!user || user.role !== 'admin') {
      return new NextResponse(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } });
    }

    const body = await req.json();
    const { productId, action } = body;

    if (!productId || !action) {
      return new NextResponse(JSON.stringify({ success: false, message: 'productId and action are required' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    let update: any = {};
    if (action === 'approve') {
      update = { verificationStatus: 'Approved', status: 'Published' };
    } else if (action === 'reject') {
      update = { verificationStatus: 'Rejected' };
    } else if (action === 'drop') {
      update = { status: 'Dropped by Admin', verificationStatus: 'Rejected' };
    } else if (action === 'archive') {
      update = { status: 'Archived' };
    } else {
      return new NextResponse(JSON.stringify({ success: false, message: 'Invalid action' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const product = await Product.findByIdAndUpdate(productId, update, { new: true });
    if (!product) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Product not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
    }

    return new NextResponse(JSON.stringify({ success: true, message: `Product ${action}d successfully`, product }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return new NextResponse(JSON.stringify({ success: false, message: 'Failed to update product' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
