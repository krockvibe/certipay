import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, AlertCircle, Loader2, DollarSign } from "lucide-react";
import { fetchSharedReceipt } from "@/lib/receiptApi";
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useToast } from "@/hooks/useToast";
import { useReceipts } from "@/context/ReceiptContext";
import { TrackingReceiptPreview } from "@/components/receipt/TrackingReceiptPreview";
import type { ReceiptData } from "@/types/receipt";

export function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getReceiptByCode, receipts, revision, isLoading: isHydrating } = useReceipts();
  const { toasts, toast, dismiss } = useToast();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackedCode, setTrackedCode] = useState<string | null>(null);
  const [remoteReceipt, setRemoteReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Prefer the context copy so an edit made on the dashboard or create page is
   * reflected here without re-searching. remoteReceipt covers receipts that were
   * fetched from the shared store and are not owned by this browser.
   */
  const localReceipt = trackedCode ? getReceiptByCode(trackedCode) : undefined;
  const receipt = localReceipt ?? remoteReceipt;

  const handleSearch = useCallback(async (searchCode: string) => {
    const trimmed = searchCode.trim();
    if (!/^\d{10}$/.test(trimmed)) {
      setError("Enter the 10-digit receipt code.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setRemoteReceipt(null);

    const normalized = trimmed.toUpperCase();

    try {
      // Local first so an already-loaded receipt renders instantly.
      let found = getReceiptByCode(normalized);

      // Fall back to the shared API so a code created on another device, or
      // another browser, still resolves.
      if (!found) {
        found = (await fetchSharedReceipt(normalized)) ?? undefined;
        // Cache it so edits made locally take over the render from here on.
        if (found) setRemoteReceipt(found);
      }

      if (!found) {
        setTrackedCode(null);
        setError("No receipt found with that code.");
        return;
      }

      await new Promise(r => setTimeout(r, 200));
      setTrackedCode(normalized);
      setSearchParams({ code: normalized }, { replace: true });
      toast({
        title: "Receipt Found",
        description: `Tracking ${found.trackingCode}`,
        variant: "success",
      });
    } catch {
      setError("Could not look up that code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [getReceiptByCode, setSearchParams, toast]);

  // Keep a receipt fetched from the shared store in sync when the same code is
  // edited locally, so this page follows the edit instead of the stale copy.
  useEffect(() => {
    if (!trackedCode) return;
    const updated = receipts.find((r) => r.trackingCode === trackedCode);
    if (updated) setRemoteReceipt(updated);
  }, [revision, trackedCode, receipts]);

  // Pick up edits made on another device when the user comes back to this tab.
  // Re-fetching on focus only, rather than polling, keeps it cheap.
  useEffect(() => {
    if (!trackedCode) return;
    const refresh = async () => {
      const fresh = await fetchSharedReceipt(trackedCode);
      if (!fresh) return;
      setRemoteReceipt((current) =>
        !current || fresh.updatedAt > current.updatedAt ? fresh : current,
      );
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [trackedCode]);

  // Initialize from the ?code= query param, which is what a shared tracking link
  // carries. Declared after handleSearch so the callback is initialized before the
  // effect that references it.
  const urlCode = searchParams.get("code")?.trim().toUpperCase() ?? "";
  const handledCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (isHydrating) return;
    if (!urlCode) return;
    // Searching rewrites ?code=, so without this guard the write would re-trigger
    // the effect and loop.
    if (handledCodeRef.current === urlCode) return;

    handledCodeRef.current = urlCode;
    setCode(urlCode);
    // Waits for the localStorage copy to load before searching, otherwise the
    // lookup runs against an empty store and reports a false "not found".
    void handleSearch(urlCode);
    // handleSearch is stable for the inputs it reads; re-running it on every
    // render would re-trigger the search and loop via setSearchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrating, urlCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(code);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        {/* Brand Header */}
        <header className="px-4 py-2 flex items-center max-w-3xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-[#078BC5] grid place-items-center text-white">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#07111F]">CertiPay</span>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center pt-6 sm:pt-8">
          {/* STATE 1 & 2 & 3 & 4: Empty, Invalid, Not Found, Loading */}
          {!receipt && !isLoading && (
            <section className="w-full max-w-md px-5 text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-[#07111F] mb-2">
                Track your transfer
              </h1>
              <p className="text-sm text-[#526B83] mb-6 sm:mb-8">
                Enter the 10-digit receipt code your sender shared with you.
              </p>

              {/* Tracking Form. Stacks and centres on mobile, side-by-side from sm up. */}
              <form
                onSubmit={handleSubmit}
                className="mx-auto flex w-full max-w-xs flex-col items-center gap-3 sm:max-w-md sm:flex-row sm:gap-2"
              >
                <div className="w-full min-w-0 sm:flex-1">
                  <input
                    id="receiptCode"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="off"
                    placeholder="0000000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full rounded-xl border border-[#DCE3E9] bg-white px-3 py-2.5 text-center text-base font-medium tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-[#078BC5] transition-colors sm:px-4 sm:py-3 sm:text-lg sm:tracking-widest"
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-label="10-digit receipt code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !/^\d{10}$/.test(code)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#078BC5] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:shadow-lg disabled:opacity-50 sm:w-auto sm:py-3"
                >
                  <Search className="h-4 w-4" />
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
                <TrackingReceiptPreview data={receipt} />
              </div>

              {/* Track Another Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    // Drop the stale ?code= so a refresh does not re-run the
                    // previous search, and reset the error from that attempt.
                    setTrackedCode(null);
                    setRemoteReceipt(null);
                    setCode("");
                    setError(null);
                    handledCodeRef.current = null;
                    setSearchParams({}, { replace: true });
                  }}
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