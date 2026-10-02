/**
 * Client for the shared receipt API so a 10-digit code resolves on any device,
 * not just the browser that created the receipt.
 *
 * Every call degrades to localStorage when the API is unavailable, so the app
 * stays fully usable without a KV store attached.
 */

import type { ReceiptData } from "@/types/receipt";

const API_PATH = "/api/receipt";

/**
 * Availability is tracked as a cooldown instead of a one-way flag. A single 503
 * used to disable publishing for the rest of the session, so one transient blip
 * silently stranded every later create and edit in localStorage. The queue below
 * now re-drives them, which only works if we are willing to probe again.
 */
const UNAVAILABLE_COOLDOWN_MS = 60_000;
let unavailableUntil = 0;

function isCoolingDown() {
  return Date.now() < unavailableUntil;
}

function markUnavailable() {
  unavailableUntil = Date.now() + UNAVAILABLE_COOLDOWN_MS;
}

/**
 * Codes whose last publish attempt failed. Persisted so a failure survives a page
 * reload, and so the retry pass can pick the work back up on the next load or as
 * soon as the device is online again. Without this a receipt created on a flaky
 * connection stayed local forever and its code never resolved elsewhere.
 */
const PENDING_SYNC_KEY = "certipay-pending-sync";

function readPendingCodes(): string[] {
  try {
    const raw = localStorage.getItem(PENDING_SYNC_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
}

function writePendingCodes(codes: string[]) {
  try {
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(codes));
  } catch {
    // A full or blocked storage must not break the sync path itself.
  }
}

export function queueSync(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!/^\d{10}$/.test(normalized)) return;
  const pending = readPendingCodes();
  if (pending.includes(normalized)) return;
  writePendingCodes([...pending, normalized]);
}

export function clearSync(code: string) {
  const normalized = code.trim().toUpperCase();
  const pending = readPendingCodes();
  if (!pending.includes(normalized)) return;
  writePendingCodes(pending.filter((c) => c !== normalized));
}

/**
 * Images are base64 data URLs, which can be hundreds of kilobytes. They are sent
 * through so a receipt opened on another device shows the same bank logo, and
 * the API drops them server-side only if the payload would get too large. The
 * originating browser always keeps the full-size local copy regardless.
 */
function toSharedPayload(receipt: ReceiptData) {
  return { ...receipt };
}

export async function publishReceipt(receipt: ReceiptData): Promise<boolean> {
  if (isCoolingDown()) return false;

  try {
    const res = await fetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: receipt.trackingCode, receipt: toSharedPayload(receipt) }),
    });

    if (res.status === 503) {
      markUnavailable();
      return false;
    }
    // Anything short of an explicit success is treated as unsynced and queued,
    // so a transient error cannot quietly drop the change.
    if (!res.ok) return false;

    if (typeof receipt.trackingCode === "string") clearSync(receipt.trackingCode);
    return true;
  } catch {
    // Network failure is not proof the store is gone, so leave the cooldown
    // alone and let the next attempt try again.
    return false;
  }
}

/**
 * True when the API has no record of this code. Used by the startup backfill to
 * avoid re-uploading every local receipt on every page load.
 */
export async function sharedReceiptExists(code: string): Promise<boolean> {
  if (isCoolingDown()) return false;

  try {
    const res = await fetch(`${API_PATH}?code=${encodeURIComponent(code)}`, {
      method: "HEAD",
    });
    if (res.status === 503) {
      markUnavailable();
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
/**
 * Remove a receipt from the shared store. Without this, deleting locally left the
 * code resolving on every other device that had already shared it.
 */
export async function unpublishReceipt(code: string): Promise<boolean> {
  if (isCoolingDown()) return false;

  try {
    const res = await fetch(`${API_PATH}?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    // 404 means it was never published, which is the state we wanted anyway.
    if (res.ok || res.status === 404) {
      clearSync(code);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function backfillReceipts(receipts: ReceiptData[]): Promise<number> {
  if (isCoolingDown() || receipts.length === 0) return 0;

  let uploaded = 0;
  for (const receipt of receipts) {
    const code = receipt.trackingCode?.trim();
    if (!/^\d{10}$/.test(code ?? "")) continue;

    // Sequential on purpose: a burst of parallel writes is the one thing that
    // can trip the store's rate limiting while the app is loading.
    if (await sharedReceiptExists(code)) {
      // Already present, but the queued copy may be newer than the store.
      if (readPendingCodes().includes(code.toUpperCase())) {
        if (await publishReceipt(receipt)) uploaded += 1;
      }
      continue;
    }
    if (await publishReceipt(receipt)) uploaded += 1;
  }
  return uploaded;
}

/**
 * Re-drive every receipt whose last publish failed, using the caller's current
 * copy so the newest edit wins rather than a stale snapshot. Codes still missing
 * locally are dropped from the queue: there is nothing left to publish, and the
 * receipt is gone from this device by definition.
 */
export async function flushPendingSync(
  lookup: (code: string) => ReceiptData | undefined
): Promise<number> {
  if (isCoolingDown()) return 0;

  const pending = readPendingCodes();
  if (pending.length === 0) return 0;

  let synced = 0;
  const stillPending: string[] = [];

  for (const code of pending) {
    const receipt = lookup(code);
    if (!receipt) continue;
    if (await publishReceipt(receipt)) synced += 1;
    else stillPending.push(code);
  }

  if (stillPending.length !== pending.length) writePendingCodes(stillPending);
  return synced;
}

/**
 * Resolve a code. Falls back to null when the API has no record so the caller
 * can fall back to the local copy without showing an error.
 */
export async function fetchSharedReceipt(code: string): Promise<ReceiptData | null> {
  if (isCoolingDown()) return null;

  try {
    const res = await fetch(`${API_PATH}?code=${encodeURIComponent(code)}`);
    if (res.status === 503) {
      markUnavailable();
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
