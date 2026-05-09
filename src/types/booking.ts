export interface Booking {
  id: string;
  userId: string;
  festivalId: string;
  hotelId?: string;
  roomId?: string;
  transportId?: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Checked-in';
  totalPrice: number;
  bookingDate: string;
}

export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalPrice: number;
  orderDate: string;
}
