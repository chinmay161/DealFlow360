/**
 * Centralized INR & Indian Number Formatting Module
 * Authoritative currency and number presentation for DealFlow360 India-first enterprise platform.
 */

export interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Standard baseline exchange rates against INR (Base currency in DB)
 * 1 USD = ₹87.50
 * 1 EUR = ₹95.00
 */
export const EXCHANGE_RATES_FROM_INR: Record<string, number> = {
  INR: 1,
  USD: 1 / 87.50,
  EUR: 1 / 95.00,
};

export const EXCHANGE_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 87.50,
  EUR: 95.00,
};

/**
 * Convert an amount from base INR to target currency (INR, USD, EUR).
 */
export function convertFromINR(
  amountInINR: number | null | undefined,
  targetCurrency: string = "INR"
): number {
  const value = typeof amountInINR === "number" && !Number.isNaN(amountInINR) ? amountInINR : 0;
  const curr = (targetCurrency || "INR").toUpperCase();
  const rate = EXCHANGE_RATES_FROM_INR[curr] ?? 1;
  const converted = value * rate;
  return Math.round(converted * 100) / 100;
}

/**
 * Convert an amount in a given currency to base INR.
 */
export function convertToINR(
  amountInCurrency: number | null | undefined,
  fromCurrency: string = "INR"
): number {
  const value = typeof amountInCurrency === "number" && !Number.isNaN(amountInCurrency) ? amountInCurrency : 0;
  const curr = (fromCurrency || "INR").toUpperCase();
  const rate = EXCHANGE_RATES_TO_INR[curr] ?? 1;
  const converted = value * rate;
  return Math.round(converted * 100) / 100;
}

/**
 * Get currency symbol for a currency code.
 */
export function getCurrencySymbol(currency: string = "INR"): string {
  const c = (currency || "INR").toUpperCase();
  if (c === "INR" || c === "₹") return "₹";
  if (c === "USD" || c === "$") return "$";
  if (c === "EUR" || c === "€") return "€";
  return c;
}

/**
 * Format a number as a localized currency string.
 * Supports INR (₹), USD ($), EUR (€), etc.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "INR",
  options: FormatCurrencyOptions = {}
): string {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  const curr = (currency || "INR").toUpperCase();
  const isINR = curr === "INR" || curr === "₹";
  const isUSD = curr === "USD" || curr === "$";
  const isEUR = curr === "EUR" || curr === "€";

  const minDigits = options.minimumFractionDigits ?? (isINR ? 0 : 2);
  const maxDigits = options.maximumFractionDigits ?? (isINR ? 0 : 2);

  try {
    if (isINR) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      }).format(value);
    }
    if (isUSD) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      }).format(value);
    }
    if (isEUR) {
      return new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
      }).format(value);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(value);
  } catch {
    const sym = getCurrencySymbol(curr);
    return `${sym}${value.toFixed(minDigits)}`;
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
