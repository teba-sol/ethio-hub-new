"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Download, Package } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function OrderConfirmationPage() {
  const params = useParams()!;
  const searchParams = useSearchParams()!;
  const router = useRouter();
  const orderId = params.id as string;
  const status = searchParams.get('status');  
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiClient.get(`/api/tourist/orders?id=${orderId}`);
        if (res.success && res.orders?.[0]) {
          setOrder(res.orders[0]);
        }
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const isSuccess = status === 'success' || order?.status === 'confirmed';

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isSuccess) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-10 max-w-lg w-full text-center shadow-2xl">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
          <p className="text-gray-500 mb-6">Your payment could not be completed.</p>
          <Link href="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-[32px] p-10 shadow-2xl text-center">
          {/* Success Check */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-serif font-bold text-primary mb-3">
            Order Confirmed!
          </h1>
           
          <p className="text-gray-500 mb-8">
            Your order has been confirmed. A confirmation email has been sent.
          </p>
          
          {/* Order ID */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8 inline-block">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Order ID</p>
            <p className="font-mono font-bold text-primary text-lg">{orderId?.slice(-8).toUpperCase()}</p>
          </div>
          
          {/* Order Summary */}
          {order && (
            <div className="text-left space-y-4 mb-8">
              <h3 className="text-lg font-bold text-primary">Your Order</h3>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Package className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{order.product?.name || 'Product'}</p>
                  <p className="text-sm text-gray-500">Quantity: {order.quantity}</p>
                  <p className="text-sm font-bold text-primary">ETB {order.totalPrice?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="w-full py-4 px-6 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90">
              <Download className="w-5 h-5" />
              Download Receipt
            </button>
            
            <Link 
              href="/dashboard/tourist/orders"
              className="w-full py-4 px-6 border-2 border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              View My Orders
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          
          <Link href="/products" className="block mt-6 text-primary hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
