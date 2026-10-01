/**
 * Client for the shared receipt API so a 10-digit code resolves on any device,
 * not just the browser that created the receipt.
 *
 * Every call degrades to localStorage when the API is unavailable, so the app
 * stays fully usable without a KV store attached.
 */

import type { ReceiptData } from "@/types/receipt";

const API_PATH = "/api/receipt";

/** True once the API has told us it is not configured, so we stop retrying. */
let storeUnavailable = false;

export function isSharedStoreAvailable() {
  return !storeUnavailable;
}

/**
 * Images are stored as base64 data URLs, which can be hundreds of kilobytes.
 * Strip them from the shared copy so a save stays well under the KV value
 * limit; the originating browser keeps the full-size local copy.
 */
function toSharedPayload(receipt: ReceiptData) {
  return {
    ...receipt,
    logoUrl: "",
    bankLogoUrl: "",
    receiptImageUrl: "",
    sharedWithoutImages: true,
  };
}

export async function publishReceipt(receipt: ReceiptData): Promise<boolean> {
  if (storeUnavailable) return false;

  try {
    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: receipt.trackingCode, receipt: toSharedPayload(receipt) }),
    });

    if (res.status === 503) {
      storeUnavailable = true;
      return false;
    }
    return res.ok;
  } catch {
    // Network failure is not proof the store is gone, so leave the flag alone
    // and let the next attempt try again.
    return false;
  }
}

/**
 * True when the API has no record of this code. Used by the startup backfill to
 * avoid re-uploading every local receipt on every page load.
 */
export async function sharedReceiptExists(code: string): Promise<boolean> {
  if (storeUnavailable) return false;

  try {
    const res = await fetch(`${API_PATH}?code=${encodeURIComponent(code)}`, {
      method: "HEAD",
    });
    if (res.status === 503) {
      storeUnavailable = true;
      return false;
    }
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Publish any locally-stored receipt the shared store does not have yet.
 *
 * Receipts created before the shared store existed were only ever written to
 * this browser's localStorage, so they were unreachable from any other device.
 * Re-uploading them on startup makes their codes resolve everywhere. Idempotent:
 * blobs are written at a deterministic path per code, and codes already present
 * in the shared store are skipped.
 */
export async function backfillReceipts(receipts: ReceiptData[]): Promise<number> {
  if (storeUnavailable || receipts.length === 0) return 0;

  let uploaded = 0;
  for (const receipt of receipts) {
    const code = receipt.trackingCode?.trim();
    if (!/^\d{10}$/.test(code ?? "")) continue;

    // Sequential on purpose: a burst of parallel writes is the one thing that
    // can trip the store's rate limiting while the app is loading.
    if (await sharedReceiptExists(code)) continue;
    if (await publishReceipt(receipt)) uploaded += 1;
  }
  return uploaded;
}

/**
 * Resolve a code. Falls back to null when the API has no record so the caller
 * can fall back to the local copy without showing an error.
 */
export async function fetchSharedReceipt(code: string): Promise<ReceiptData | null> {
  if (storeUnavailable) return null;

  try {
    const res = await fetch(`${API_PATH}?code=${encodeURIComponent(code)}`);
    if (res.status === 503) {
      storeUnavailable = true;
      return null;
    }
    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = (await res.json()) as { receipt?: ReceiptData };
    return data.receipt ?? null;
  } catch {
    return null;
  }
}
