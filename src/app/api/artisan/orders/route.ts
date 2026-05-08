import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import Product from '@/models/artisan/product.model'; // Added to fix MissingSchemaError
import User from '@/models/User';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    
    if (!token) {
      return null;
    }
    
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = (payload as any).userId;
    const user = await User.findById(userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = { artisan: user._id };
    
    // For artisan view, map Paid to Pending if needed, 
    // or just filter by what's requested
    if (status && status !== 'All') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate({
        path: 'product',
        model: 'ArtisanProduct',
        select: 'name images sku price description deliveryTime'
      })
      .populate('tourist', 'name email profilePicture')
      .sort({ createdAt: -1 });

    // Auto-update status based on Delivery Time
    const now = new Date();
    const updatedOrders = await Promise.all(orders.map(async (order: any) => {
      // If it's Pending, Shipped, Paid, Ready for Pickup, or Assigned, check if it should be Delivered
      // Note: Orders shouldn't be delivered if not paid
      if (['Pending', 'Shipped', 'Paid', 'Ready for Pickup', 'Assigned'].includes(order.status) && order.product?.deliveryTime) {
        // Simple logic: if deliveryTime is "X-Y days", take Y. If "X days", take X.
        const timeStr = order.product.deliveryTime.toLowerCase();
        let days = 0;
        
        if (timeStr.includes('week')) {
          const match = timeStr.match(/(\d+)/);
          if (match) days = parseInt(match[1]) * 7;
        } else {
          const match = timeStr.match(/(\d+)/g);
          if (match) {
            days = parseInt(match[match.length - 1]); // Take the upper bound or single value
          }
        }

        if (days > 0) {
          const deliveryDate = new Date(order.createdAt);
          deliveryDate.setDate(deliveryDate.getDate() + days);
          
          if (now > deliveryDate && order.status !== 'Delivered') {
            order.status = 'Delivered';
            await Order.findByIdAndUpdate(order._id, { status: 'Delivered' });
          }
        }
      }
      return order;
    }));

    // Calculate statistics for the artisan
    const [totalOrders, pendingOrders, deliveredOrders, returnedOrders] = await Promise.all([
      Order.countDocuments({ artisan: user._id }),
      Order.countDocuments({ artisan: user._id, status: { $in: ['Pending', 'Paid', 'Ready for Pickup', 'Assigned', 'Shipped'] } }),
      Order.countDocuments({ artisan: user._id, status: 'Delivered' }),
      Order.countDocuments({ artisan: user._id, status: 'Returned' })
    ]);

    return NextResponse.json({
      success: true,
      orders: updatedOrders,
      stats: {
        totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
        returns: returnedOrders
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}


