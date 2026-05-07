import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
import User from '@/models/User';
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: orderId } = await params;
    
    const deliveryGuy = await getAuthenticatedUser(req);
    if (!deliveryGuy || deliveryGuy.role !== 'delivery') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.assignedDeliveryGuy?.toString() !== deliveryGuy._id.toString()) {
      return NextResponse.json({ message: 'This order is not assigned to you' }, { status: 403 });
    }

    if (order.status !== 'Assigned') {
      return NextResponse.json({ message: 'Order is not in Assigned status' }, { status: 400 });
    }

    // Generate verification code when delivery guy accepts
    const verificationCode = Math.random().toString(10).substring(2, 10).toUpperCase().padStart(8, '0').substring(0, 8);
    order.verificationCode = verificationCode;

    order.status = 'Shipped';
    order.timeline.push({
      status: 'Shipped',
      date: new Date(),
      note: `Order accepted by delivery person: ${deliveryGuy.name}. Verification Code: ${verificationCode}. Expected arrival: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString()}`,
    });

    await order.save();

    // Notify Tourist
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
          // deliveryGuyAvatar removed - not in DeliveryCodeEmailInput type
          expectedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString(),
        });
      } catch (emailErr) {
        console.error('Email sending failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      order: {
        _id: order._id,
        status: order.status,
      },
    });
  } catch (error: any) {
    console.error('Error accepting order:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
