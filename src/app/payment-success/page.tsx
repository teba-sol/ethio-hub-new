import { Suspense } from "react";
import PaymentSuccessContent from "./content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful - EthioHub",
};

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
