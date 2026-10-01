import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Shared receipt store for the tracking API.
 *
 * Primary backing is Vercel KV so a 10-digit code resolves on any device. When
 * the KV env vars are absent (local dev, or a Vercel project without a store
 * attached) we report that explicitly and the client falls back to its own
 * localStorage copy, which keeps the app usable instead of failing outright.
 */

const HAS_KV =
  Boolean(process.env.KV_REST_API_URL) && Boolean(process.env.KV_REST_API_TOKEN);

let kv: { get<T>(key: string): Promise<T | null>; set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown> } | null = null;

async function getKv() {
  if (!HAS_KV) return null;
  if (!kv) {
    const mod = await import("@vercel/kv");
    kv = mod.kv as unknown as typeof kv;
  }
  return kv;
}

const keyFor = (code: string) => `receipt:${code.toUpperCase()}`;

// Receipts carry base64 image data URLs, so keep the TTL generous.
const TTL_SECONDS = 60 * 60 * 24 * 365;

export async function saveReceiptToStore(code: string, receipt: unknown) {
  const client = await getKv();
  if (!client) return { stored: false as const, reason: "kv_unavailable" as const };
  await client.set(keyFor(code), receipt, { ex: TTL_SECONDS });
  return { stored: true as const };
}

export async function readReceiptFromStore<T>(code: string): Promise<T | null> {
  const client = await getKv();
  if (!client) return null;
  return (await client.get<T>(keyFor(code))) ?? null;
}

export function isKvConfigured() {
  return HAS_KV;
}

export function methodNotAllowed(res: VercelResponse) {
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "method_not_allowed" });
}
