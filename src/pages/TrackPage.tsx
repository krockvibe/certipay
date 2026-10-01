import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search, AlertCircle, Loader2, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { useReceipts } from "@/context/ReceiptContext";
import { TrackingReceiptPreview } from "@/components/receipt/TrackingReceiptPreview";
import { formatCurrency, formatDate } from "@/lib/utils";

export function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getReceiptByCode } = useReceipts();
  const { toasts, toast, dismiss } = useToast();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize from URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      handleSearch(urlCode.toUpperCase());
    }
  }, [searchParams]);

  const handleSearch = useCallback(async (searchCode: string) => {
    const trimmed = searchCode.trim();
    if (!/^\d{10}$/.test(trimmed)) {
      setError("Enter the 10-digit receipt code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReceipt(null);

    try {
      const found = getReceiptByCode(trimmed.toUpperCase());
      if (!found) {
        setError("No receipt found with that code.");
        return;
      }
      // Simulate network delay for better UX
      await new Promise(r => setTimeout(r, 400));
      setReceipt(found);
      setSearchParams({ code: trimmed.toUpperCase() }, { replace: true });
      toast({
        title: "Receipt Found",
        description: `Tracking ${found.trackingCode}`,
        variant: "success",
      });
    } catch (e: any) {
      setError(e.message || "Failed to find receipt");
    } finally {
      setIsLoading(false);
    }
  }, [getReceiptByCode, setSearchParams, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(code);
  };

  const handleNewSearch = () => {
    setCode("");
    setReceipt(null);
    setError(null);
    setSearchParams({}, { replace: true });
  };

  const copyCode = useCallback((trackingCode: string) => {
    navigator.clipboard.writeText(trackingCode);
    toast({
      title: "Copied!",
      description: "Tracking code copied to clipboard",
      variant: "success",
    });
  }, [toast]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        {/* Brand Header */}
        <header className="px-4 py-2 flex items-center justify-center max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-[#078BC5] grid place-items-center text-white">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#07111F]">CertiPay</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center pt-8">
          {/* STATE 1 & 2 & 3 & 4: Empty, Invalid, Not Found, Loading */}
          {!receipt && !isLoading && (
            <section className="w-full max-w-md text-center">
              <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-[#07111F] mb-2">
                Track your transfer
              </h1>
              <p className="text-sm text-[#526B83] mb-8">
                Enter the 10-digit receipt code your sender shared with you.
              </p>

              {/* Tracking Form */}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <div className="flex-1 min-w-0">
                  <input
                    id="receiptCode"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="off"
                    placeholder="e.g. 1234567890"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-[#DCE3E9] bg-white px-4 py-3 font-medium text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#078BC5] transition-colors"
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-label="10-digit receipt code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !/^\d{10}$/.test(code)}
                  className="rounded-xl bg-[#078BC5] py-3 px-6 text-white text-sm font-medium flex items-center gap-2 transition-colors hover:shadow-lg"
                >
                  <span className="hidden sm:inline">
                    <Search className="h-4 w-4" />
                  </span>
                  <span>Track</span>
                </button>
              </form>

              {error && (
                <p className="mt-4 text-sm text-[#D94B4B] text-center flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </section>
          )}

          {/* STATE 4: Loading */}
          {isLoading && !receipt && (
            <section className="w-full max-w-md pt-8">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-[#526B83]">
                  Searching receipt…
                </p>
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-[#526B83]">Verifying</span>
                </div>
              </div>
            </section>
          )}

          {/* STATE 5: Receipt Found */}
          {receipt && (
            <section className="w-full max-w-md pt-8">
              <div className="flex justify-center">
                <TrackingReceiptPreview data={receipt} isDemo={false} />
              </div>

              {/* Track Another Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => { setReceipt(null); setCode(""); }}
                  className="text-xs text-[#526B83] underline hover:text-[#078BC5] transition-colors"
                >
                  Track another receipt
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      <ToastViewport className="fixed bottom-4 right-4 z-50">
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant}>
            <div className="grid gap-1">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose onClick={() => dismiss(t.id)} />
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}