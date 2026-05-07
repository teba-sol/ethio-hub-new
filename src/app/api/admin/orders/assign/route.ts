import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';
import Wallet from '@/models/wallet.model';
import { sendDeliveryCodeEmail } from '@/lib/email';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET as string;

async function getAuthenticatedUser(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sessionToken')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const user = await User.findById((payload as any).userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deliveryGuyId } = body;

    if (!deliveryGuyId) {
      return NextResponse.json({ message: 'Delivery Guy ID is required' }, { status: 400 });
    }

    const deliveryGuy = await User.findById(deliveryGuyId);
    if (!deliveryGuy || deliveryGuy.role !== 'delivery') {
      return NextResponse.json({ message: 'Invalid delivery guy' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'Ready for Pickup') {
      return NextResponse.json({ message: 'Order must be in Ready for Pickup status' }, { status: 400 });
    }

    order.assignedDeliveryGuy = deliveryGuyId;
    order.deliveryGuyInfo = {
      name: deliveryGuy.name,
      phone: deliveryGuy.phone || deliveryGuy.deliveryProfile?.phone || '',
    };
    order.status = 'Shipped';
    order.timeline.push({
      status: 'Shipped',
      date: new Date(),
      note: `Assigned to delivery person: ${deliveryGuy.name}. Driver is on the way.`,
    });

    await order.save();

    const tourist = await User.findById(order.tourist);
    const product = await (await import('@/models/artisan/product.model')).default.findById(order.product);

    if (tourist && product) {
      try {
        await sendDeliveryCodeEmail({
          to: tourist.email,
          name: tourist.name,
          orderId: order._id.toString(),
          verificationCode: order.verificationCode || '00000000',
          productName: product.name,
          deliveryGuyName: deliveryGuy.name,
          deliveryGuyPhone: deliveryGuy.phone || deliveryGuy.deliveryProfile?.phone || '',
        });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery guy assigned successfully',
      order: {
        _id: order._id,
        status: order.status,
        deliveryGuyInfo: order.deliveryGuyInfo,
      },
    });
  } catch (error: any) {
    console.error('Error assigning delivery guy:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const admin = await getAuthenticatedUser(req);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('tourist', 'name email phone touristProfile')
      .populate('artisan', 'name email phone')
      .populate('product', 'name images price')
      .populate('assignedDeliveryGuy', 'name phone deliveryProfile')
      .sort({ createdAt: -1 })
      .lean();

    const deliveryGuys = await User.find({ role: 'delivery', status: 'Active' })
      .select('_id name phone deliveryProfile')
      .lean();

    return NextResponse.json({
      success: true,
      orders,
      deliveryGuys,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
