import { format, parseISO } from "date-fns";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

export const formatINR = (n: number) => inr.format(n || 0);
export const formatNumber = (n: number) => num.format(n || 0);
export const formatPercent = (n: number, digits = 1) => `${(n || 0).toFixed(digits)}%`;

export function formatDate(iso?: string, pattern = "dd MMM yyyy"): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatDateTime(iso?: string): string {
  return formatDate(iso, "dd MMM yyyy, hh:mm a");
}

/** Compact Indian notation: ₹12.4 L, ₹1.2 Cr */
export function formatINRCompact(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return formatINR(n);
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  return n < 20
    ? (ONES[n] ?? "")
    : `${TENS[Math.floor(n / 10)] ?? ""}${n % 10 ? ` ${ONES[n % 10] ?? ""}` : ""}`;
}

/** Indian numbering system: Crore, Lakh, Thousand, Hundred */
export function amountInWords(amount: number): string {
  let n = Math.floor(amount);
  if (n === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const units: [number, string][] = [[1e7, "Crore"], [1e5, "Lakh"], [1e3, "Thousand"], [100, "Hundred"]];
  for (const [value, label] of units) {
    if (n >= value) {
      parts.push(`${twoDigits(Math.floor(n / value))} ${label}`);
      n %= value;
    }
  }
  if (n) parts.push(twoDigits(n));
  return `Rupees ${parts.join(" ")} Only`;
}

export const initials = (name: string) =>
  name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.)\s/, "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
