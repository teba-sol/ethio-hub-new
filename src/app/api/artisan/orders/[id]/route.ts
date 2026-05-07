import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/mongodb';
import Order from '@/models/order.model';
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();
    const orderId = params.id;

    if (!['Pending', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, artisan: user._id },
      { 
        $set: { status },
        $push: { 
          timeline: { 
            status, 
            date: new Date(),
            note: `Order status updated to ${status}`
          } 
        }
      },
      { new: true }
    ).populate('product', 'name images sku price')
     .populate('tourist', 'name email profilePicture');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
