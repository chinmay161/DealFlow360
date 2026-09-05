/**
 * TraceFormatter
 *
 * Transforms raw numeric values into human-readable strings.
 *
 * Instead of `computedValue: 0.1823` the human trace returns `"18.23%"`.
 * Instead of `1500.25` it returns `"₹1,500.25"` or `"$1,500.25"`.
 *
 * Formatting is contextual — discount/margin rules get percentage
 * formatting, financial rules get currency formatting.
 */

import type {
  DecisionTraceResponse,
  DecisionTraceRuleEntry,
} from "../interfaces/interfaces.js";

// ─── Currency Map ────────────────────────────────────────────────────────────

const CURRENCY_CONFIG: Record<string, { locale: string; currency: string }> = {
  INR: { locale: "en-IN", currency: "INR" },
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "de-DE", currency: "EUR" },
  GBP: { locale: "en-GB", currency: "GBP" },
};

// ─── Rules that deal with percentages ────────────────────────────────────────

const PERCENTAGE_RULES = new Set([
  "discount-ceiling",
  "category-discount",
  "customer-tier",
  "margin",
  "blended-risk",
]);

// ─── Rules whose computedValue represents money ─────────────────────────────

const CURRENCY_RULES = new Set<string>([
  // Extend as new financial rules are added
]);

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Format an entire DecisionTraceResponse for human readability.
 * Returns a new object — does not mutate the input.
 */
export function formatTrace(
  response: DecisionTraceResponse,
  currency: string = "INR",
): DecisionTraceResponse {
  return {
    ...response,
    rules: response.rules.map((entry) => formatRuleEntry(entry, currency)),
  };
}

/**
 * Format a single rule entry's computed value and threshold
 * based on the rule type.
 */
export function formatRuleEntry(
  entry: DecisionTraceRuleEntry,
  currency: string = "INR",
): DecisionTraceRuleEntry {
  const ruleId = entry.ruleId;

  if (PERCENTAGE_RULES.has(ruleId)) {
    return {
      ...entry,
      computedValue: formatPercentage(
        typeof entry.computedValue === "number" ? entry.computedValue : 0,
      ),
      threshold: formatPercentage(
        typeof entry.threshold === "number" ? entry.threshold : 0,
      ),
    };
  }

  if (CURRENCY_RULES.has(ruleId)) {
    return {
      ...entry,
      computedValue: formatCurrency(
        typeof entry.computedValue === "number" ? entry.computedValue : 0,
        currency,
      ),
      threshold: formatCurrency(
        typeof entry.threshold === "number" ? entry.threshold : 0,
        currency,
      ),
    };
  }

  // Default: return as-is (raw format)
  return entry;
}

// ─── Formatting Primitives ───────────────────────────────────────────────────

/**
 * Convert a decimal fraction to a percentage string.
 * 0.1823 → "18.23%"
 */
export function formatPercentage(value: number): string {
  const pct = value * 100;
  return `${formatDecimal(pct, 2)}%`;
}

/**
 * Format a numeric value as currency.
 * 1500.25, "INR" → "₹1,500.25"
 * 1500.25, "USD" → "$1,500.25"
 */
export function formatCurrency(value: number, currency: string = "INR"): string {
  const config = CURRENCY_CONFIG[currency.toUpperCase()] ?? CURRENCY_CONFIG.USD;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Fallback if Intl is unavailable or currency is unsupported
    return `${value.toFixed(2)}`;
  }
}

/**
 * Format a number to a fixed number of decimal places.
 */
export function formatDecimal(value: number, precision: number = 2): string {
  return value.toFixed(precision);
}
