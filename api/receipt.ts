import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readReceiptFromStore,
  saveReceiptToStore,
  deleteReceiptFromStore,
  isStoreConfigured,
  methodNotAllowed,
  setBlobBaseUrl,
} from "./_store.js";

const CODE_RE = /^\d{10}$/;

/**
 * GET  /api/receipt?code=1234567890  -> the receipt for that code
 * POST /api/receipt  { code, receipt } -> upsert a receipt under that code
 *
 * Lets a 10-digit code resolve on any device rather than only the browser that
 * created the receipt.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (process.env.BLOB_BASE_URL) {
    setBlobBaseUrl(process.env.BLOB_BASE_URL);
  }

  if (!isStoreConfigured()) {
    return res.status(503).json({
      error: "store_unavailable",
      message: "Shared receipt store is not configured. Codes resolve in this browser only.",
    });
  }

  // HEAD answers "does this code exist?" without transferring the receipt body.
  // The client uses it to decide which local receipts still need uploading.
  if (req.method === "HEAD") {
    const code = String(req.query.code ?? "").trim();
    if (!CODE_RE.test(code)) {
      return res.status(400).json({ error: "invalid_code" });
    }
    const receipt = await readReceiptFromStore(code);
    res.setHeader("Cache-Control", "no-store");
    return res.status(receipt ? 200 : 404).end();
  }

  if (req.method === "GET") {
    const code = String(req.query.code ?? "").trim();
    if (!CODE_RE.test(code)) {
      return res.status(400).json({ error: "invalid_code" });
    }

    const receipt = await readReceiptFromStore(code);
    if (!receipt) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.status(200).json({ code: code.toUpperCase(), receipt });
  }

  if (req.method === "POST") {
    const { code, receipt } = (req.body ?? {}) as { code?: string; receipt?: unknown };
    const normalized = String(code ?? "").trim();

    if (!CODE_RE.test(normalized)) {
      return res.status(400).json({ error: "invalid_code" });
    }
    if (!receipt || typeof receipt !== "object") {
      return res.status(400).json({ error: "invalid_receipt" });
    }

    const result = await saveReceiptToStore(normalized, receipt);
    if (!result.stored) {
      return res.status(503).json({ error: "store_unavailable" });
    }
    return res.status(200).json({ ok: true, code: normalized.toUpperCase() });
  }

  if (req.method === "DELETE") {
    const code = String(req.query.code ?? "").trim();
    if (!CODE_RE.test(code)) {
      return res.status(400).json({ error: "invalid_code" });
    }
    // Deleting locally is not enough: anyone sharing this code must stop
    // resolving it, so remove the shared copy as well.
    const deleted = await deleteReceiptFromStore(code);
    if (!deleted) {
      return res.status(503).json({ error: "store_unavailable" });
    }
    return res.status(200).json({ ok: true, code: code.toUpperCase() });
  }

  return methodNotAllowed(res);
}
