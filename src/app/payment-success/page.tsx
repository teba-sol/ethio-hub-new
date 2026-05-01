"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function PaymentSuccessPage() {
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
            body: JSON.stringify({ orderId, tx_ref: txRef }),
          });
          console.log("[PaymentSuccess] Verify response status:", res.status);
          
          // Check if response is JSON
          const text = await res.text();
          console.log("[PaymentSuccess] Response text:", text.substring(0, 200));
          
          let data;
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error("[PaymentSuccess] Failed to parse JSON:", parseError);
            setVerifyResult({ success: false, message: `Server error (status ${res.status}). Check server logs.` });
            setVerifying(false);
            return;
          }
          
          setVerifyResult(data);
          if (data.success && isCartCheckout) {
            clearCart();
          }
          console.log("[PaymentSuccess] Payment verify and process result:", data);
        } catch (e: any) {
          console.error("[PaymentSuccess] Verification error:", e);
          setVerifyResult({ success: false, message: e.message });
        } finally {
          setVerifying(false);
        }
      } else {
        console.log("[PaymentSuccess] Not verifying - missing params:", { status, orderId, txRef });
      }
    };
    verifyPayment();
  }, [orderId, txRef, status, isCartCheckout]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-4xl shadow-2xl p-10 max-w-lg w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-4xl font-serif font-bold text-primary mb-3">
          Payment Confirmed!
        </h1>

        <p className="text-gray-500 mb-6">
          Your payment has been successfully processed.
        </p>

        {verifying && (
          <div className="mb-6">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Verifying payment with Chapa...</p>
          </div>
        )}

        {verifyResult && !verifying && (
          <div className={`mb-6 p-4 rounded-xl ${verifyResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            {verifyResult.success ? (
              <div className="text-green-700">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
                <p className="font-bold">Payment Verified!</p>
                <p className="text-sm">Database updated successfully.</p>
              </div>
            ) : (
              <div className="text-red-700">
                <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-bold">Verification Failed</p>
                <p className="text-sm">{verifyResult.message || "Unknown error"}</p>
              </div>
            )}
          </div>
        )}

        {txRef && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Transaction Reference</p>
            <p className="font-mono font-bold text-gray-800 text-sm">{txRef}</p>
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/"
            className="w-full py-4 px-6 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90"
          >
            Back to Home
            <ArrowRight className="w-5 h-5" />
          </Link>

          {orderId && (
            <Link
              href="/dashboard/tourist/orders"
              className="w-full py-4 px-6 border-2 border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              View My Orders
            </Link>
          )}

          {bookingId && (
            <Link
              href="/dashboard/tourist/bookings"
              className="w-full py-4 px-6 border-2 border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              View My Bookings
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
