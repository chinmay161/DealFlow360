import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StockValidationResult } from "@/features/inventory/types/inventory.types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quotationId = searchParams.get("quotationId")?.trim();
    const productId = searchParams.get("productId")?.trim();
    const requestedQty = Math.max(1, parseInt(searchParams.get("quantity") || "1", 10));

    // If quotationId provided, validate all items in that quotation
    if (quotationId) {
      const quotation = await prisma.quotation.findFirst({
        where: {
          OR: [{ id: quotationId }, { quotationNumber: quotationId }],
        },
        include: {
          lineItems: {
            include: {
              product: {
                include: {
                  inventoryItems: {
                    include: { warehouse: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!quotation) {
        return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      }

      const results: StockValidationResult[] = [];

      for (const line of quotation.lineItems) {
        if (!line.product) {
          results.push({
            isValid: true,
            sku: line.sku || "N/A",
            productName: line.productName,
            requestedQty: line.quantity,
            availableQty: 9999,
            reservedQty: 0,
            freeStock: 9999,
            deficit: 0,
            status: "PASS",
            ruleMessage: "Service or Non-Physical SKU: Stock check bypassed.",
          });
          continue;
        }

        const invList = line.product.inventoryItems;
        const totalAvail = invList.reduce((sum, i) => sum + i.quantityAvailable, 0);
        const totalReserved = invList.reduce((sum, i) => sum + i.quantityReserved, 0);
        const freeStock = Math.max(0, invList.reduce((sum, i) => sum + i.quantityOnHand - i.quantityReserved, 0));
        const deficit = Math.max(0, line.quantity - freeStock);

        let status: "PASS" | "WARN" | "FAIL" = "PASS";
        let ruleMessage = "Stock Validation: PASSED. Sufficient free stock available.";
        let counterfactualRecommendation = undefined;

        if (deficit > 0) {
          status = "FAIL";
          ruleMessage = `Stock Validation: FAILED. Reason: Requested quantity (${line.quantity}) exceeds available free stock (${freeStock}).`;
          counterfactualRecommendation = `Recommendation: Reduce quantity to ${freeStock} or Split delivery across Mumbai (WH-BOM) & Bengaluru (WH-BLR).`;
        } else if (freeStock - line.quantity < 5) {
          status = "WARN";
          ruleMessage = `⚠ Only ${freeStock} units available. The Rule Engine may require manager approval or recommend stock reservations.`;
          counterfactualRecommendation = `Recommendation: Reserve remaining ${freeStock} units immediately upon approval.`;
        }

        const warehouseAllocations = invList.map((inv) => ({
          warehouseId: inv.warehouse.id,
          warehouseName: inv.warehouse.name,
          available: inv.quantityAvailable,
          reserved: inv.quantityReserved,
          recommendedAllocation: Math.min(line.quantity, inv.quantityAvailable),
        }));

        results.push({
          isValid: deficit === 0,
          sku: line.product.sku,
          productName: line.product.name,
          requestedQty: line.quantity,
          availableQty: totalAvail,
          reservedQty: totalReserved,
          freeStock,
          deficit,
          status,
          ruleMessage,
          counterfactualRecommendation,
          warehouseAllocations,
        });
      }

      return NextResponse.json({
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        items: results,
      });
    }

    // Single product validation
    if (!productId) {
      return NextResponse.json({ error: "quotationId or productId is required" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { sku: productId }],
      },
      include: {
        inventoryItems: {
          include: { warehouse: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const invList = product.inventoryItems;
    const totalAvail = invList.reduce((sum, i) => sum + i.quantityAvailable, 0);
    const totalReserved = invList.reduce((sum, i) => sum + i.quantityReserved, 0);
    const freeStock = Math.max(0, invList.reduce((sum, i) => sum + i.quantityOnHand - i.quantityReserved, 0));
    const deficit = Math.max(0, requestedQty - freeStock);

    let status: "PASS" | "WARN" | "FAIL" = "PASS";
    let ruleMessage = "Stock Validation: PASSED. Free stock sufficient.";
    let counterfactualRecommendation = undefined;

    if (deficit > 0) {
      status = "FAIL";
      ruleMessage = `Stock Validation: FAILED. Reason: Requested quantity exceeds available inventory.`;
      counterfactualRecommendation = `Recommendation: Reduce quantity to ${freeStock} or Split delivery into multiple shipments.`;
    } else if (freeStock - requestedQty < 5) {
      status = "WARN";
      ruleMessage = `⚠ Only ${freeStock} units available. The Rule Engine may require approval or recommend quantity adjustments.`;
      counterfactualRecommendation = `Recommendation: Cap order quantity at ${freeStock} or plan multi-hub dispatch.`;
    }

    const warehouseAllocations = invList.map((inv) => ({
      warehouseId: inv.warehouse.id,
      warehouseName: inv.warehouse.name,
      available: inv.quantityAvailable,
      reserved: inv.quantityReserved,
      recommendedAllocation: Math.min(requestedQty, inv.quantityAvailable),
    }));

    const result: StockValidationResult = {
      isValid: deficit === 0,
      sku: product.sku,
      productName: product.name,
      requestedQty,
      availableQty: totalAvail,
      reservedQty: totalReserved,
      freeStock,
      deficit,
      status,
      ruleMessage,
      counterfactualRecommendation,
      warehouseAllocations,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/inventory/quote-stock] Error:", error);
    return NextResponse.json({ error: "Failed to validate quote stock" }, { status: 500 });
  }
}
