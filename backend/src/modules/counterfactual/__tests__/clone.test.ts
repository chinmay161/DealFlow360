import { describe, it, expect } from "vitest";
import { cloneRuleContext, applyModificationsToContext } from "../utils/clone.js";
import { InvalidSimulationError } from "../utils/errors.js";
import { mockDiscountViolatingContext } from "./helpers.js";

describe("cloneRuleContext", () => {
  it("creates a deep clone of quotation and lines without mutating base", () => {
    const base = mockDiscountViolatingContext();
    const cloned = cloneRuleContext(base);

    expect(cloned).not.toBe(base);
    expect(cloned.quotation).not.toBe(base.quotation);
    expect(cloned.lines).not.toBe(base.lines);
    expect(cloned.lines[0]).not.toBe(base.lines[0]);
    expect(cloned.lines[0].product).not.toBe(base.lines[0].product);

    // Identical values
    expect(cloned.lines[0].discountPct).toBe(base.lines[0].discountPct);
    expect(cloned.quotation.grandTotal).toBe(base.quotation.grandTotal);
  });
});

describe("applyModificationsToContext", () => {
  it("applies discountPct modification and recomputes all aggregates", () => {
    const base = mockDiscountViolatingContext();
    const originalDiscount = base.lines[0].discountPct;

    const modified = applyModificationsToContext(base, [
      {
        lineId: base.lines[0].id,
        field: "discountPct",
        value: 0.10,
      },
    ]);

    expect(modified.lines[0].discountPct).toBe(0.10);
    expect(base.lines[0].discountPct).toBe(originalDiscount); // base untouched
    expect(modified.blendedDiscountPct).toBeLessThan(base.blendedDiscountPct);
    expect(modified.quotation.grandTotal).toBeGreaterThan(base.quotation.grandTotal);
  });

  it("applies unitPrice modification correctly", () => {
    const base = mockDiscountViolatingContext();
    const originalPrice = base.lines[0].unitPrice;

    const modified = applyModificationsToContext(base, [
      {
        lineNumber: base.lines[0].lineNumber,
        field: "unitPrice",
        value: 60000,
      },
    ]);

    expect(modified.lines[0].unitPrice).toBe(60000);
    expect(base.lines[0].unitPrice).toBe(originalPrice);
    expect(modified.quotation.subtotal).toBeGreaterThan(base.quotation.subtotal);
  });

  it("applies absolute discount modification correctly", () => {
    const base = mockDiscountViolatingContext();

    const modified = applyModificationsToContext(base, [
      {
        sku: base.lines[0].product.sku,
        field: "discount",
        value: 2500,
      },
    ]);

    expect(modified.lines[0].discount).toBe(2500);
    expect(modified.lines[0].discountPct).toBe(2500 / modified.lines[0].unitPrice);
  });

  it("throws InvalidSimulationError when line is not found", () => {
    const base = mockDiscountViolatingContext();

    expect(() =>
      applyModificationsToContext(base, [
        {
          lineId: "non-existent-line",
          field: "discountPct",
          value: 0.05,
        },
      ]),
    ).toThrow(InvalidSimulationError);
  });

  it("throws InvalidSimulationError on negative price or invalid values", () => {
    const base = mockDiscountViolatingContext();

    expect(() =>
      applyModificationsToContext(base, [
        {
          lineId: base.lines[0].id,
          field: "unitPrice",
          value: -100,
        },
      ]),
    ).toThrow(InvalidSimulationError);

    expect(() =>
      applyModificationsToContext(base, [
        {
          lineId: base.lines[0].id,
          field: "discountPct",
          value: 1.5, // > 1
        },
      ]),
    ).toThrow(InvalidSimulationError);
  });
});
