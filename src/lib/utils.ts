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

export function generateTrackingCode(): string {
  const values = new Uint32Array(10);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value % 10).join('');
}

export function generateTransactionId(): string {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}