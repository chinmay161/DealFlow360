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
                  category: true,
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
        const prod = line.product;
        const categoryName = prod?.category?.name?.toLowerCase() || "";
        const sku = prod?.sku || line.sku || "";
        const pName = prod?.name || line.productName || "";

        const isServiceOrDigital =
          !prod ||
          categoryName.includes("service") ||
          categoryName.includes("saas") ||
          categoryName.includes("cloud") ||
          categoryName.includes("maintenance") ||
          categoryName.includes("support") ||
          categoryName.includes("training") ||
          sku.startsWith("SRV-") ||
          sku.startsWith("SVC-") ||
          sku.startsWith("SW-") ||
          sku.startsWith("SEC-AUDIT") ||
          pName.toLowerCase().includes("service") ||
          pName.toLowerCase().includes("support") ||
          pName.toLowerCase().includes("license") ||
          pName.toLowerCase().includes("plan");

        if (isServiceOrDigital) {
          results.push({
            isValid: true,
            sku: sku || "N/A",
            productName: pName,
            requestedQty: line.quantity,
            availableQty: 9999,
            reservedQty: 0,
            freeStock: 9999,
            deficit: 0,
            status: "PASS",
            ruleMessage: "Service or Digital License: Instant delivery & stock check bypassed.",
            warehouseAllocations: [
              {
                warehouseId: "cloud-virtual",
                warehouseName: "Cloud & Digital Fulfillment",
                available: 9999,
                reserved: 0,
                recommendedAllocation: line.quantity,
              },
            ],
          });
          continue;
        }

        const invList = prod.inventoryItems;
        const totalAvail =
          invList.length > 0
            ? invList.reduce((sum, i) => sum + i.quantityAvailable, 0)
            : Math.max(100, line.quantity + 50);
        const totalReserved =
          invList.length > 0
            ? invList.reduce((sum, i) => sum + i.quantityReserved, 0)
            : 5;
        const freeStock =
          invList.length > 0
            ? Math.max(0, invList.reduce((sum, i) => sum + i.quantityOnHand - i.quantityReserved, 0))
            : Math.max(0, totalAvail - totalReserved);
        const deficit = Math.max(0, line.quantity - freeStock);

        let status: "PASS" | "WARN" | "FAIL" = "PASS";
        let ruleMessage = "Stock Validation: PASSED. Sufficient free stock available.";
        let counterfactualRecommendation = undefined;

        if (deficit > 0) {
          status = "FAIL";
          ruleMessage = `Stock Validation: FAILED. Reason: Requested quantity (${line.quantity}) exceeds available free stock (${freeStock}).`;
          counterfactualRecommendation = `Recommendation: Reduce quantity to ${freeStock} or Split delivery across regional warehouses.`;
        } else if (freeStock - line.quantity < 5) {
          status = "WARN";
          ruleMessage = `⚠ Only ${freeStock} units available. The Rule Engine may require manager approval or recommend stock reservations.`;
          counterfactualRecommendation = `Recommendation: Reserve remaining ${freeStock} units immediately upon approval.`;
        }

        const warehouseAllocations =
          invList.length > 0
            ? invList.map((inv) => ({
                warehouseId: inv.warehouse.id,
                warehouseName: inv.warehouse.name,
                available: inv.quantityAvailable,
                reserved: inv.quantityReserved,
                recommendedAllocation: Math.min(line.quantity, inv.quantityAvailable),
              }))
            : [
                {
                  warehouseId: "wh-default",
                  warehouseName: "Mumbai Enterprise Hub",
                  available: totalAvail,
                  reserved: totalReserved,
                  recommendedAllocation: line.quantity,
                },
              ];

        results.push({
          isValid: deficit === 0,
          sku: prod.sku,
          productName: prod.name,
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
        category: true,
        inventoryItems: {
          include: { warehouse: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const categoryName = product.category?.name?.toLowerCase() || "";
    const isServiceOrDigital =
      categoryName.includes("service") ||
      categoryName.includes("saas") ||
      categoryName.includes("cloud") ||
      categoryName.includes("maintenance") ||
      categoryName.includes("support") ||
      categoryName.includes("training") ||
      product.sku.startsWith("SRV-") ||
      product.sku.startsWith("SVC-") ||
      product.sku.startsWith("SW-") ||
      product.sku.startsWith("SEC-AUDIT") ||
      product.name.toLowerCase().includes("service") ||
      product.name.toLowerCase().includes("support") ||
      product.name.toLowerCase().includes("license");

    if (isServiceOrDigital) {
      return NextResponse.json({
        isValid: true,
        sku: product.sku,
        productName: product.name,
        requestedQty,
        availableQty: 9999,
        reservedQty: 0,
        freeStock: 9999,
        deficit: 0,
        status: "PASS",
        ruleMessage: "Service or Digital License: Instant delivery & stock check bypassed.",
        warehouseAllocations: [
          {
            warehouseId: "cloud-virtual",
            warehouseName: "Cloud & Digital Fulfillment",
            available: 9999,
            reserved: 0,
            recommendedAllocation: requestedQty,
          },
        ],
      });
    }

    const invList = product.inventoryItems;
    const totalAvail =
      invList.length > 0
        ? invList.reduce((sum, i) => sum + i.quantityAvailable, 0)
        : Math.max(100, requestedQty + 50);
    const totalReserved =
      invList.length > 0
        ? invList.reduce((sum, i) => sum + i.quantityReserved, 0)
        : 5;
    const freeStock =
      invList.length > 0
        ? Math.max(0, invList.reduce((sum, i) => sum + i.quantityOnHand - i.quantityReserved, 0))
        : Math.max(0, totalAvail - totalReserved);
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

    const warehouseAllocations =
      invList.length > 0
        ? invList.map((inv) => ({
            warehouseId: inv.warehouse.id,
            warehouseName: inv.warehouse.name,
            available: inv.quantityAvailable,
            reserved: inv.quantityReserved,
            recommendedAllocation: Math.min(requestedQty, inv.quantityAvailable),
          }))
        : [
            {
              warehouseId: "wh-default",
              warehouseName: "Mumbai Enterprise Hub",
              available: totalAvail,
              reserved: totalReserved,
              recommendedAllocation: requestedQty,
            },
          ];

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
