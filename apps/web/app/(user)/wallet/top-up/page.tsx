"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "../../../../lib/api";
import { useWalletBalance, usePayment } from "../../../../lib/hooks";
import {
  AppShell, StatCard, PageHeader, LoadingState, ErrorState, StatusBadge,
} from "../../../../components/design-system";

type TopUpStep = "idle" | "submitting" | "redirecting" | "processing" | "success" | "failed" | "cancelled" | "pending";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];
const PROCESSING_FEE_RATE = 0.02;

function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

function generateIdempotencyKey(): string {
  return `topup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function TopUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: wallet, loading: walletLoading, error: walletError, refetch: refetchWallet } = useWalletBalance();

  const [step, setStep] = useState<TopUpStep>("idle");
  const [amount, setAmount] = useState<number>(500);
  const [provider, setProvider] = useState<"JAZZCASH" | "EASYPAISA" | "MOCK">("JAZZCASH");
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [formHtml, setFormHtml] = useState<string | null>(null);

  const paymentResult = usePayment(paymentId);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const returnParam = searchParams.get("paymentId");
  const statusParam = searchParams.get("status");

  const fee = Math.round(amount * PROCESSING_FEE_RATE * 100) / 100;
  const total = amount + fee;

  const handleReturnFromGateway = useCallback(async () => {
    if (returnParam) {
      setPaymentId(returnParam);
      setStep("processing");
    }
  }, [returnParam]);

  useEffect(() => {
    if (returnParam || statusParam) {
      handleReturnFromGateway();
    }
  }, [returnParam, statusParam, handleReturnFromGateway]);

  useEffect(() => {
    if (step === "processing" && paymentId) {
      pollRef.current = setInterval(async () => {
        try {
          const payment = await apiRequest<{
            id: string; status: string; amount: string; currency: string;
            provider: string; paidAt: string | null;
          }>(`/api/payments/${paymentId}`);

          setPollCount((c) => c + 1);

          if (payment.status === "SUCCESS") {
            setStep("success");
            if (pollRef.current) clearInterval(pollRef.current);
            refetchWallet();
          } else if (payment.status === "FAILED") {
            setStep("failed");
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (payment.status === "CANCELLED") {
            setStep("cancelled");
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (payment.status === "PENDING") {
            setStep("pending");
          }
        } catch {
          setPollCount((c) => c + 1);
        }
      }, 2000);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [step, paymentId, refetchWallet]);

  useEffect(() => {
    if (pollCount > 60) {
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [pollCount]);

  const handleSubmit = async () => {
    if (amount < 1) return;
    setError(null);
    setStep("submitting");

    try {
      const result = await apiRequest<{
        paymentId: string; status: string; merchantReference: string;
        redirectUrl?: string; formFields?: Record<string, string>;
      }>("/api/payments/top-up", {
        method: "POST",
        body: JSON.stringify({ provider, amount, idempotencyKey }),
      });

      setPaymentId(result.paymentId);

      if (result.formFields) {
        const formAction = provider === "JAZZCASH"
          ? "https://sandbox.jazzcash.com.pk/CustomerPortal/TransactionManagement/merchantform"
          : provider === "EASYPAISA"
            ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
            : "#";
        const fields = Object.entries(result.formFields)
          .map(([name, value]) => `<input type="hidden" name="${name}" value="${value}" />`)
          .join("\n");
        setFormHtml(`<form id="gateway-form" action="${formAction}" method="POST">${fields}</form>`);
        setStep("redirecting");
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }

      if (provider === "MOCK") {
        setStep("processing");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create top-up");
      setStep("idle");
    }
  };

  useEffect(() => {
    if (step === "redirecting" && formRef.current) {
      formRef.current.submit();
    }
  }, [step]);

  const handleSimulate = async (mockStatus: string) => {
    if (!paymentId) return;
    setError(null);

    try {
      await apiRequest("/api/payments/mock/callback", {
        method: "POST",
        body: JSON.stringify({
          _merchantReference: paymentId,
          _mockStatus: mockStatus,
        }),
      });
    } catch {
      // Callback may throw if verification fails, but we still poll
    }
  };

  const handleReset = () => {
    setStep("idle");
    setPaymentId(null);
    setError(null);
    setPollCount(0);
    setFormHtml(null);
    setIdempotencyKey(generateIdempotencyKey());
  };

  if (step === "redirecting") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingState />
          <p className="mt-4 text-gray-600">Redirecting to payment gateway...</p>
          <div dangerouslySetInnerHTML={{ __html: formHtml ?? "" }} />
          <form ref={formRef} dangerouslySetInnerHTML={{ __html: formHtml ?? "" }} style={{ display: "none" }} />
        </div>
      </AppShell>
    );
  }

  if (step === "processing") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-12">
          <PageHeader title="Processing Payment" description="Waiting for payment confirmation..." />
          <div className="mt-8 flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-8 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-lg font-medium text-gray-900">We are processing your payment</p>
            <p className="text-sm text-gray-500">Amount: {formatPKR(total)}</p>
            <p className="text-sm text-gray-500">Polls: {pollCount}/60</p>
            {provider === "MOCK" && (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button onClick={() => handleSimulate("SUCCESS")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Simulate Success</button>
                <button onClick={() => handleSimulate("FAILURE")} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Simulate Failure</button>
                <button onClick={() => handleSimulate("CANCELLATION")} className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700">Simulate Cancellation</button>
                <button onClick={() => handleSimulate("PENDING")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Simulate Pending</button>
                <button onClick={() => handleSimulate("INVALID_SIGNATURE")} className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">Simulate Invalid Signature</button>
                <button onClick={() => handleSimulate("AMOUNT_MISMATCH")} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Simulate Amount Mismatch</button>
              </div>
            )}
            {pollCount >= 60 && (
              <p className="mt-4 text-sm text-red-600">Timed out waiting for payment. Check your payment history.</p>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  if (step === "success") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Payment Successful</h2>
            <p className="mt-2 text-green-700">{formatPKR(total)} has been added to your wallet.</p>
            {paymentResult.data && (
              <div className="mt-4 text-sm text-green-600">
                <p>Reference: {paymentResult.data.merchantReference}</p>
                {paymentResult.data.paidAt && <p>Completed: {new Date(paymentResult.data.paidAt).toLocaleString()}</p>}
              </div>
            )}
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={handleReset} className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700">Top Up Again</button>
              <button onClick={() => router.push("/wallet")} className="rounded-lg border border-green-300 px-6 py-2 text-sm font-medium text-green-700 hover:bg-green-100">Go to Wallet</button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (step === "failed") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-red-900">Payment Failed</h2>
            <p className="mt-2 text-red-700">Your payment could not be processed. Please try again.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={handleReset} className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700">Try Again</button>
              <button onClick={() => router.push("/wallet")} className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Go to Wallet</button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (step === "cancelled") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-900">Payment Cancelled</h2>
            <p className="mt-2 text-yellow-700">You cancelled the payment. No amount has been charged.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={handleReset} className="rounded-lg bg-yellow-600 px-6 py-2 text-sm font-medium text-white hover:bg-yellow-700">Try Again</button>
              <button onClick={() => router.push("/wallet")} className="rounded-lg border border-yellow-300 px-6 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100">Go to Wallet</button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (step === "pending") {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-900">Payment Pending</h2>
            <p className="mt-2 text-blue-700">Your payment is being processed. This may take a few moments.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button onClick={() => setStep("processing")} className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">Check Again</button>
              <button onClick={() => router.push("/wallet")} className="rounded-lg border border-blue-300 px-6 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">Go to Wallet</button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-8">
        <PageHeader title="Top Up Wallet" description="Add funds to your wallet using JazzCash or Easypaisa" />

        <div className="mt-6">
          {walletLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ) : walletError ? (
            <ErrorState message={walletError} />
          ) : wallet ? (
            <StatCard title="Current Balance" value={formatPKR(parseFloat(wallet.balance))} />
          ) : null}
        </div>

        {!wallet?.balance || parseFloat(wallet.balance) === 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            First top-up minimum is PKR 500
          </div>
        ) : null}

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Amount (PKR)</label>
          <div className="mt-1">
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-2xl font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                amount === q
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
            >
              {formatPKR(q)}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => setProvider("JAZZCASH")}
              className={`rounded-lg border-2 p-4 text-center transition-colors ${
                provider === "JAZZCASH"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-lg font-bold text-gray-900">JazzCash</div>
              <div className="text-xs text-gray-500">Mobile wallet</div>
            </button>
            <button
              onClick={() => setProvider("EASYPAISA")}
              className={`rounded-lg border-2 p-4 text-center transition-colors ${
                provider === "EASYPAISA"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-lg font-bold text-gray-900">Easypaisa</div>
              <div className="text-xs text-gray-500">Mobile wallet</div>
            </button>
          </div>
          <div className="mt-2">
            <button
              onClick={() => setProvider("MOCK")}
              className={`w-full rounded-lg border-2 p-3 text-center transition-colors ${
                provider === "MOCK"
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium text-gray-700">Mock Gateway (Testing)</div>
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700">Summary</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Amount</span>
              <span>{formatPKR(amount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Processing Fee (2%)</span>
              <span>{formatPKR(fee)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPKR(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={step === "submitting" || amount < 1}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === "submitting" ? "Processing..." : "Continue"}
          </button>
          <button
            onClick={() => router.push("/transactions")}
            className="w-full rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Payment History
          </button>
        </div>
      </div>
    </AppShell>
  );
}
