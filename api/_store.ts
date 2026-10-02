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

/**
 * Every save lands on its own pathname under a per-code folder.
 *
 * Public blob reads are always served from the CDN, and the store clamps the
 * object cache to 60s no matter what is requested. With one fixed pathname per
 * code that meant an edit could be read back as the previous version for up to
 * a minute, which is exactly the "receipt never updates" symptom. A pathname
 * nobody has requested before cannot be a cache hit, so each version reads back
 * immediately, and the newest version is resolved through the metadata API
 * rather than by guessing a URL.
 *
 * The legacy flat pathname is still read as a fallback so receipts written
 * before this layout existed keep resolving.
 */
const dirFor = (code: string) => `receipts/${code.toUpperCase()}/`;
const legacyPathFor = (code: string) => `receipts/${code.toUpperCase()}.json`;

/** Versions kept per code. Enough to survive a read racing a prune. */
const KEEP_VERSIONS = 3;

let versionCounter = 0;

function newVersionPath(code: string) {
  // Uniqueness must not depend on clock resolution alone; two edits inside the
  // same millisecond would otherwise collide and silently drop the first.
  versionCounter = (versionCounter + 1) % 100000;
  return `${dirFor(code)}${Date.now()}-${versionCounter}-${Math.random().toString(36).slice(2, 8)}.json`;
}

/**
 * Base64 image data URLs can be large. Cap what we persist so a save cannot fail
 * on size, and flag it so the UI can say images were dropped rather than the
 * receipt simply arriving without them. Blobs handle several megabytes, so this
 * is generous enough to keep typical bank logos inline.
 */
const MAX_SERIALIZED_BYTES = 2_500_000;

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
  const pathname = newVersionPath(code);

  await client.put(pathname, JSON.stringify(payload), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  } as Parameters<typeof client.put>[2]);

  // Retire superseded versions only after the new one is safely stored, so a
  // failed write leaves the previous receipt intact and still resolvable.
  await pruneOldVersions(client, code, pathname);

  return { stored: true as const, trimmed };
}

/**
 * Newest-first list of the stored versions for a code. Uses the authenticated
 * metadata API, which is not CDN-cached, so this always reflects the latest
 * write.
 */
async function listVersions(client: NonNullable<typeof blob>, code: string) {
  const { blobs } = await client.list({
    prefix: dirFor(code),
    limit: 100,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  } as Parameters<typeof client.list>[0]);

  return blobs
    .filter((b) => b.pathname.endsWith(".json"))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map((b) => b.pathname);
}

async function pruneOldVersions(
  client: NonNullable<typeof blob>,
  code: string,
  keepPathname: string
) {
  try {
    const versions = await listVersions(client, code);
    const stale = versions.filter((p) => p !== keepPathname).slice(KEEP_VERSIONS - 1);
    if (stale.length === 0) return;

    await client.del(stale, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    } as Parameters<typeof client.del>[1]);
  } catch {
    // Leaving an extra version behind is harmless; failing the save is not.
  }
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
    // Every version has to go, otherwise a later read falls back to a
    // superseded copy and the deleted receipt reappears.
    const versions = await listVersions(client, code);
    if (versions.length > 0) {
      await client.del(versions, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      } as Parameters<typeof client.del>[1]);
    }

    await client.del(legacyPathFor(code), {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    } as Parameters<typeof client.del>[1]);
    return true;
  } catch {
    // Already absent counts as deleted.
    return true;
  }
}

/**
 * Existence check used by the startup backfill. Metadata only, so it does not
 * pull a receipt body (which may carry megabytes of inline image) just to answer
 * "is this code already stored?".
 */
export async function receiptExistsInStore(code: string): Promise<boolean> {
  const client = await getBlob();
  if (!client) return false;

  try {
    const versions = await listVersions(client, code);
    if (versions.length > 0) return true;

    // Fall back to the pre-versioning flat pathname.
    await client.head(legacyPathFor(code), {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    } as Parameters<typeof client.head>[1]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read the newest stored version of a receipt.
 *
 * Versions are written to unique pathnames precisely so this cannot be served
 * from a stale CDN entry, and the newest one is found through the authenticated
 * metadata API. Each version is tried in turn: if a prune removed it between the
 * listing and the fetch, the next one still yields a usable receipt.
 */
export async function readReceiptFromStore<T>(code: string): Promise<T | null> {
  const client = await getBlob();
  if (!client) return null;

  try {
    const versions = await listVersions(client, code);
    for (const pathname of versions) {
      const parsed = await readBlob<T>(client, pathname);
      if (parsed) return parsed;
    }

    return await readBlob<T>(client, legacyPathFor(code));
  } catch {
    // A missing blob throws; treat it as "no receipt" rather than a 500.
    return null;
  }
}

async function readBlob<T>(client: NonNullable<typeof blob>, pathname: string) {
  try {
    const result = await client.get(pathname, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    } as Parameters<typeof client.get>[1]);
    if (!result) return null;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
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

