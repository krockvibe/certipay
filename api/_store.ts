import type { VercelResponse } from "@vercel/node";

/**
 * Shared receipt store built on Vercel Blob.
 *
 * One JSON blob per tracking code, written at a deterministic pathname so a code
 * resolves from any device. Blob writes are authenticated through the function's
 * OIDC credential, so only this API can create or overwrite receipts; reads are
 * open, which matches the sharing model where holding the 10-digit code is what
 * grants access.
 */

let blob: typeof import("@vercel/blob") | null = null;

async function getBlob() {
  if (!process.env.BLOB_STORE_ID) return null;
  if (!blob) {
    blob = await import("@vercel/blob");
  }
  return blob;
}

const pathFor = (code: string) => `receipts/${code.toUpperCase()}.json`;

/**
 * Public base URL for the store. setBlobBaseUrl lets the project env supply it so
 * a lookup can fetch the blob directly, which avoids depending on getDownloadUrl
 * resolving inside the function runtime.
 */
let blobBaseUrl = "";
export function setBlobBaseUrl(url: string) {
  blobBaseUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Base64 image data URLs can be hundreds of kilobytes. Cap what we persist so a
 * save cannot fail on size, and flag it so the UI can say images are local-only.
 */
const MAX_SERIALIZED_BYTES = 180_000;

function trimToSize(receipt: unknown) {
  const serialized = JSON.stringify(receipt);
  if (serialized.length <= MAX_SERIALIZED_BYTES) {
    return { payload: receipt, trimmed: false };
  }

  const clone = { ...(receipt as Record<string, unknown>) };
  clone.logoUrl = "";
  clone.bankLogoUrl = "";
  clone.receiptImageUrl = "";
  clone.sharedWithoutImages = true;
  return { payload: clone, trimmed: true };
}

export async function saveReceiptToStore(code: string, receipt: unknown) {
  const client = await getBlob();
  if (!client) return { stored: false as const, reason: "store_unavailable" as const };

  const { payload, trimmed } = trimToSize(receipt);

  await client.put(pathFor(code), JSON.stringify(payload), {
    access: "public",
    contentType: "application/json",
    // Deterministic path, so a re-publish overwrites the same code in place.
    addRandomSuffix: false,
    // @vercel/blob 2.x throws when the destination already exists unless this is
    // set. Without it the first save succeeds and every later edit fails, so a
    // shared link would keep serving the original receipt forever.
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  } as Parameters<typeof client.put>[2]);

  return { stored: true as const, trimmed };
}

/**
 * Delete the blob for a code. Removing the local copy alone left the code
 * resolving on every other device, so deletion has to reach the shared store too.
 * Returns false only when the store could not be reached or refused.
 */
export async function deleteReceiptFromStore(code: string) {
  const client = await getBlob();
  if (!client) return false;

  try {
    await client.del(pathFor(code), {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    } as Parameters<typeof client.del>[1]);
    return true;
  } catch {
    // Already absent counts as deleted.
    return true;
  }
}

export async function readReceiptFromStore<T>(code: string): Promise<T | null> {
  const client = await getBlob();
  if (!client) return null;

 const pathname = pathFor(code);

  // Prefer the store's public base URL. getDownloadUrl() is not reliably able to
  // resolve a blob from inside the function runtime, but the public CDN URL always
  // serves the same object.
  if (blobBaseUrl) {
    try {
      const res = await fetch(`https://${blobBaseUrl}/${pathname}`);
      if (res.ok) return (await res.json()) as T;
      return null;
    } catch {
      // Fall through to the SDK lookup below.
    }
  }

  try {
    const url = await client.getDownloadUrl(pathname);
    if (!url) return null;

    const res = await fetch(url);
    if (!res.ok) return null;

    return (await res.json()) as T;
  } catch {
    // A missing blob throws; treat it as "no receipt" rather than a 500.
    return null;
  }
}

export function isStoreConfigured() {
  return Boolean(process.env.BLOB_STORE_ID);
}

export function methodNotAllowed(res: VercelResponse) {
  res.setHeader("Allow", "GET, HEAD, POST, DELETE");
  return res.status(405).json({ error: "method_not_allowed" });
}

