"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()!;
  const router = useRouter();
  const orderId = searchParams.get("orderId") || "";
  const isCartCheckout = searchParams.get("cart") === "true";
  const { clearCart } = useCart();

  useEffect(() => {
    if (isCartCheckout) {
      clearCart();
    }
    
    const timer = setTimeout(() => {
      router.push("/products");
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId, isCartCheckout, clearCart, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] border border-gray-100 shadow-2xl p-10 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-primary">Order Confirmed</h1>
      </div>
    </div>
  );
}