"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams()!;
  const router = useRouter();
  const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref") || "";
  const status = searchParams.get("status") || "";
  const orderId = searchParams.get("orderId") || "";
  const bookingId = searchParams.get("bookingId") || "";
  const isCartCheckout = searchParams.get("cart") === "true";
  const { clearCart } = useCart();
  
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    console.log("[PaymentSuccess] Page loaded with params:", { txRef, status, orderId, bookingId });
    const verifyPayment = async () => {
      if (status === "success" && orderId && txRef) {
        console.log("[PaymentSuccess] Starting verification with:", { orderId, tx_ref: txRef });
        setVerifying(true);
        try {
          const res = await fetch("/api/payment/verify-and-process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, tx_ref: txRef, bookingId }),
          });
          const data = await res.json();
          console.log("[PaymentSuccess] Verification result:", data);
          setVerifyResult(data);
          if (data.success && isCartCheckout) {
            console.log("[PaymentSuccess] Clearing cart after successful cart checkout");
            clearCart();
          }
        } catch (error) {
          console.error("[PaymentSuccess] Verification failed:", error);
          setVerifyResult({ success: false, message: "Verification request failed" });
        } finally {
          setVerifying(false);
        }
      }
    };
    if (status === "success" && orderId) {
      verifyPayment();
    }
  }, [status, orderId, txRef, bookingId, isCartCheckout, clearCart]);

  const isSuccess = status === "success" || verifyResult?.success;
  const displayStatus = verifyResult ? (verifyResult.success ? "success" : "failed") : status;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {verifying ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        ) : isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. 
              {orderId && <span className="block text-sm mt-1">Order ID: {orderId}</span>}
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/dashboard/tourist/bookings" className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                View My Bookings <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                Back to Home
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              {verifyResult?.message || "There was an issue processing your payment."}
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/cart" className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
                Try Again
              </Link>
              <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
