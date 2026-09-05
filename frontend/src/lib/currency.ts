/**
 * Centralized INR & Indian Number Formatting Module
 * Authoritative currency and number presentation for DealFlow360 India-first enterprise platform.
 */

export interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format a number as an Indian currency string (₹).
 * Defaults to 0 decimal places unless specified.
 * 
 * Examples:
 *   1830000 -> "₹18,30,000"
 *   658800  -> "₹6,58,800"
 *   100000  -> "₹1,00,000"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "INR",
  options: FormatCurrencyOptions = {}
): string {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  const isINR = !currency || currency.toUpperCase() === "INR" || currency === "₹";

  const minDigits = options.minimumFractionDigits ?? 0;
  const maxDigits = options.maximumFractionDigits ?? 0;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: isINR ? "INR" : currency,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(value);
  } catch {
    // Fallback if locale or currency code is unsupported
    const formatted = formatIndianNumber(value, options);
    return isINR ? `₹${formatted}` : `${currency} ${formatted}`;
  }
}

/**
 * Format a number using Indian grouping conventions (en-IN).
 * 
 * Examples:
 *   1830000 -> "18,30,000"
 *   100000  -> "1,00,000"
 *   1000    -> "1,000"
 */
export function formatIndianNumber(
  amount: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  const minDigits = options.minimumFractionDigits ?? 0;
  const maxDigits = options.maximumFractionDigits ?? 0;

  try {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * Format large INR currency values in compact Indian notation (Lakhs and Crores).
 * 
 * Examples:
 *   12800000 -> "₹1.28 Cr"
 *   1830000  -> "₹18.3L"
 *   480000   -> "₹4.8L"
 *   85000    -> "₹85K"
 *   0        -> "₹0"
 */
export function formatCompactINR(amount: number | null | undefined): string {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 10000000) {
    // 1 Crore = 10,000,000
    const cr = abs / 10000000;
    const formatted = cr >= 10 ? cr.toFixed(1) : cr.toFixed(2);
    return `${sign}₹${formatted.replace(/\.0+$/, "")} Cr`;
  }

  if (abs >= 100000) {
    // 1 Lakh = 100,000
    const l = abs / 100000;
    const formatted = l >= 10 ? l.toFixed(1) : l.toFixed(2);
    return `${sign}₹${formatted.replace(/\.0+$/, "")}L`;
  }

  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}₹${k.toFixed(0)}K`;
  }

  return `${sign}₹${abs}`;
}
