"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TestPaymentContent() {
  const searchParams = useSearchParams();
  const [txRef, setTxRef] = useState(searchParams.get("tx_ref") || "");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const verifyPayment = async () => {
    if (!txRef) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/payment/chapa/verify?tx_ref=${txRef}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const simulateCallback = async () => {
    if (!txRef) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/payment/chapa/callback?tx_ref=${txRef}&status=success`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Test Payment Verification</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Transaction Reference (tx_ref)</label>
            <input
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="TXN-..."
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={verifyPayment}
              disabled={loading || !txRef}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Payment"}
            </button>
            <button
              onClick={simulateCallback}
              disabled={loading || !txRef}
              className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Processing..." : "Simulate Callback"}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
            <h3 className="font-bold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make a payment via Chapa (use test card: 4242 4242 4242 4242)</li>
              <li>Copy the `tx_ref` from the URL or Chapa receipt</li>
              <li>Click "Verify Payment" to trigger verification (uses Chapa API)</li>
              <li>Or click "Simulate Callback" to simulate Chapa's callback</li>
              <li>Check your database - wallets and transactions should be updated</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <TestPaymentContent />
    </Suspense>
  );
}
