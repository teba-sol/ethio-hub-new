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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id: orderId } = await params;
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await req.json();

    const validStatuses = ['Pending', 'Paid', 'Ready for Pickup', 'Assigned', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const order = await Order.findOne({ _id: orderId, artisan: user._id });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.isLocked) {
      return NextResponse.json({ message: 'Order is locked due to failed delivery attempts' }, { status: 400 });
    }

    const currentStatus = order.status;
    let updateData: any = { status };

    let timelineNote = `Order status updated to ${status}`;

    if (status === 'Ready for Pickup' && currentStatus === 'Paid') {
      timelineNote = 'Package is ready for pickup.';

      order.timeline.push({
        status: 'Ready for Pickup',
        date: new Date(),
        note: 'Package is ready for pickup, waiting for delivery assignment.',
      });
    } else if (status === 'Shipped' && currentStatus === 'Ready for Pickup') {
      if (!order.assignedDeliveryGuy) {
        return NextResponse.json({ message: 'Order must be assigned to a delivery person first' }, { status: 400 });
      }
      timelineNote = 'Driver has picked up the package and is on the way.';
      order.timeline.push({
        status: 'Shipped',
        date: new Date(),
        note: 'Package is in transit.',
      });
    } else if (status === 'Delivered') {
      timelineNote = 'Package delivered successfully.';
      order.timeline.push({
        status: 'Delivered',
        date: new Date(),
        note: 'Delivery confirmed by customer.',
      });
    } else {
      order.timeline.push({
        status,
        date: new Date(),
        note: timelineNote,
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, artisan: user._id },
      { 
        $set: updateData,
        $push: { timeline: order.timeline[order.timeline.length - 1] }
      },
      { new: true }
    ).populate('product', 'name images sku price')
     .populate('tourist', 'name email profilePicture');

    return NextResponse.json({
      success: true,
      message: 'Order status updated',
      order: updatedOrder,
      verificationCode: status === 'Ready for Pickup' ? updateData.verificationCode : undefined
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'artisan') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const order = await Order.findOne({ _id: id, artisan: user._id })
      .populate('product', 'name images sku price description')
      .populate('tourist', 'name email phone profilePicture touristProfile')
      .populate('assignedDeliveryGuy', 'name phone deliveryProfile');

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { message: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
