"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Smartphone, Lock, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';

export default function ProductCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const productId = params?.id as string;  
  const { user, isAuthenticated } = useAuth();  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(() => {
    const qty = searchParams.get('quantity');
    return qty ? parseInt(qty) : 1;
  });
  const [selectedMethod, setSelectedMethod] = useState<'chapa' | 'telebirr' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'tourist') {
      router.push('/login');
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/public/products/${productId}`);
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, isAuthenticated, user]);

  const totalPrice = product ? (product.discountPrice || product.price) * quantity : 0;

  const handlePayment = async () => {
    if (!selectedMethod || !product) return;
    
    setProcessing(true);
    
    try {
      if (selectedMethod === 'chapa') {
        // Initialize Chapa payment directly (order is created in the API)
        const response = await fetch('/api/chapa/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product._id || product.id,
            quantity,
          }),
        });
        
        const data = await response.json();
        if (data.success && data.checkout_url) {
          // Redirect to Chapa checkout (not open in new tab)
          window.location.href = data.checkout_url;
        } else {
          alert(data.message || 'Failed to initialize payment');
        }
      } else {
        // Telebirr - create order and simulate payment
        const orderResponse = await apiClient.post('/api/tourist/orders', {
          productId: product._id || product.id,
          quantity,
          totalPrice,
          currency: 'ETB',
          contactInfo: {
            fullName: user?.name || 'Guest',
            email: user?.email || 'guest@email.com',
            phone: '0912345678',
          },
        });

        if (orderResponse.success) {
          const orderId = orderResponse.order?._id;
          router.push(`/confirmation/order/${orderId}?status=success`);
        } else {
          alert('Failed to create order');
        }
      }
    } catch (e) {
      console.error('Payment error:', e);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ethio-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <button onClick={() => router.back()} className="text-primary hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ethio-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Product</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif font-bold text-primary mb-4">
          Complete Your Purchase
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            <div className="flex gap-4 mb-6">
              <img 
                src={product.images?.[0] || '/placeholder-product.jpg'} 
                alt={product.name}
                className="w-20 h-20 object-cover rounded-xl"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{product.name}</h4>
                <p className="text-sm text-gray-500">Quantity: {quantity}</p>
                <p className="text-sm text-gray-500">
                  {product.discountPrice ? (
                    <>
                      <span className="line-through">ETB {product.price}</span>
                      <span className="ml-2 text-primary font-bold">ETB {product.discountPrice}</span>
                    </>
                  ) : (
                    <span className="font-bold text-primary">ETB {product.price}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-gray-500">Quantity:</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="border-t pt-4 flex justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">ETB {totalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold mb-4">Payment Method</h3>
            
            <div className="space-y-4">
              <button
                onClick={() => setSelectedMethod('chapa')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  selectedMethod === 'chapa' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Chapa</p>
                  <p className="text-sm text-gray-500">Pay with card, telebirr, bank</p>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedMethod('telebirr')}
                className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                  selectedMethod === 'telebirr' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Telebirr</p>
                  <p className="text-sm text-gray-500">Pay with Telebirr</p>
                </div>
              </button>
            </div>
            
            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || processing}
              className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                selectedMethod && !processing
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ETB {totalPrice.toLocaleString()}
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Secure encrypted payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
