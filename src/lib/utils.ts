import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  // narrowSymbol renders ZAR as "R" rather than "ZAR", and leaves the symbol-only
  // currencies ($ EUR GBP R$ INR JPY) unchanged. en-US keeps comma grouping on all
  // of them instead of switching to en-ZA's space separators and trailing decimal comma.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Normalises the transaction progress percentage.
 *
 * The form holds progress as a string while the saved receipt stores a number,
 * and the two receipt renderings read it directly. Without a single clamp they
 * disagree: the tracking bar clamped its fill but printed the raw number, and the
 * detailed receipt passed the raw value straight to Progress, which pushes the
 * indicator off the track for anything over 100. Every reader now goes through
 * here so the label and the bar always agree, on every page.
 */
export function clampProgress(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export function generateTrackingCode(): string {
  const values = new Uint32Array(10);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value % 10).join('');
}

export function generateTransactionId(): string {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

/**
 * A link a recipient can open on any device, no account needed. Sharing the bare
 * code alone leaves the recipient needing to already know this site and to type
 * it in by hand, which is the step that most often goes wrong.
 */
export function buildTrackingLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/track?code=${encodeURIComponent(code.trim().toUpperCase())}`;
}