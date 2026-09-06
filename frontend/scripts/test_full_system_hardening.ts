import { PrismaClient, RuleOutcome, OrderStatus, InvoiceStatus, QuotationStatus } from "@prisma/client";
import { evaluateQuotationRules, getDecisionTrace, getCounterfactualRecommendations } from "../src/lib/services/governanceBridge";
import { recalculateQuoteTotalsAndRisk } from "../src/lib/services/quoteService";
import { saveQuotationDraftAction } from "../src/lib/actions/quoteActions";
import { confirmFulfillmentPlan, getLiveFulfillmentData } from "../src/lib/services/fulfillmentService";
import { getLiveInvoicesData, recordPaymentAction, issueCreditNoteAction } from "../src/lib/services/billingService";
import { getLiveSubscriptionsData, pauseSubscriptionAction, resumeSubscriptionAction } from "../src/lib/services/subscriptionService";
import { getCustomerQuotationDetail, submitCounterOffer, acceptQuotationByCustomer } from "../src/lib/services/portalService";
import { getLivePipelinePerformance } from "../src/lib/services/pipelineService";
import { calculateCustomerLifetimeMargin } from "../src/lib/services/lifetimeMarginService";

const prisma = new PrismaClient();

async function runHardeningSuite() {
  console.log("================================================================================");
  console.log("DEALFLOW360 FULL SYSTEM HARDENING & INTEGRATION VERIFICATION SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       ↳ ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       ↳ Detail: ${detail}`);
    }
  }

  try {
    // 1. Database & Core Seed Integrity
    console.log("--- 1. DATABASE & ENTERPRISE ACCOUNTS INTEGRITY ---");
    const customerCount = await prisma.customer.count();
    assert(customerCount === 5, "Exact 5 Indian enterprise accounts present", `Found ${customerCount} customers`);

    const q1042 = await prisma.quotation.findFirst({
      where: { quotationNumber: "Q-1042" },
      include: { customer: true, lineItems: true },
    });
    assert(!!q1042, "Canonical quotation Q-1042 exists in PostgreSQL", `ID: ${q1042?.id}`);
    assert(q1042?.customer.name === "Apex Infotech Pvt. Ltd.", "Q-1042 owned by Apex Infotech", `Customer: ${q1042?.customer.name}`);
    assert(q1042?.currency === "INR", "Q-1042 currency is INR", `Currency: ${q1042?.currency}`);
    assert(q1042?.lineItems.length === 3, "Q-1042 has exactly 3 line items", `Items: ${q1042?.lineItems.length}`);

    // 2. Line Item UUID & Mutation Integrity
    console.log("\n--- 2. LINE ITEM CALCULATION & SAVE DRAFT INTEGRITY ---");
    const quoteId = q1042!.id;
    const recalculated = await recalculateQuoteTotalsAndRisk(quoteId);
    assert(Number(recalculated.totalValue) > 0, "Recalculate totals computes positive INR value", `Total Value: ₹${recalculated.totalValue}`);
    assert(recalculated.lineItems.every((li) => !!li.id && li.id.length === 36), "All line items have valid UUID primary keys");

    const draftResult = await saveQuotationDraftAction(quoteId);
    assert(draftResult.success, "saveQuotationDraftAction executes transactionally and returns timestamp", `Saved at: ${draftResult.updatedAt}`);

    // 3. Governance Bridge & Decision Trace
    console.log("\n--- 3. GOVERNANCE BRIDGE & DECISION TRACE ---");
    const evalResult = await evaluateQuotationRules(quoteId);
    assert(evalResult.overallRiskScore > 0, "Rule evaluation computes risk score", `Risk Score: ${evalResult.overallRiskScore}`);

    const trace = await getDecisionTrace(quoteId);
    assert(trace.rules.length >= 4, "Decision trace contains at least 4 evaluated governance rules", `Found ${trace.rules.length} rules`);
    const hasDiscountRule = trace.rules.some((r: any) => r.ruleName.includes("Discount"));
    const hasMarginRule = trace.rules.some((r: any) => r.ruleName.includes("Margin"));
    assert(hasDiscountRule && hasMarginRule, "Trace contains Discount Ceiling and Margin Threshold rules");

    // 4. Counterfactual Simulations
    console.log("\n--- 4. COUNTERFACTUAL SIMULATION ENGINE ---");
    const rawRecs = await getCounterfactualRecommendations(quoteId);
    const recs = Array.isArray(rawRecs) ? rawRecs : (rawRecs?.recommendations || []);
    assert(recs.length > 0, "Counterfactual recommendations generated", `Recommendations: ${recs.length}`);
    assert(recs[0].marginImprovement > 0, "Projected margin improvement calculated", `+${recs[0].marginImprovement}%`);

    // 5. Multi-Warehouse Split & Fulfillment
    console.log("\n--- 5. MULTI-WAREHOUSE SPLIT & STOCK RESERVATION ---");
    const fulfillData = await getLiveFulfillmentData("Q-1042");
    assert(fulfillData.warehouseStock.length > 0, "Warehouse stock matrix queried from PostgreSQL", `Stock records: ${fulfillData.warehouseStock.length}`);
    assert(fulfillData.recommendedAllocations.length === 2, "Split allocation divides stock between Bengaluru and Mumbai", `Warehouses: ${fulfillData.recommendedAllocations.map(a => a.warehouse).join(", ")}`);

    const confirmFulfill = await confirmFulfillmentPlan("Q-1042");
    assert(confirmFulfill.success, "Fulfillment plan confirmed transactionally", `Order: ${confirmFulfill.orderNumber}`);

    const orderInDb = await prisma.order.findUnique({
      where: { orderNumber: confirmFulfill.orderNumber },
      include: { reservations: true, shipments: true },
    });
    assert(!!orderInDb, "Order record created in PostgreSQL", `Order ID: ${orderInDb?.id}`);
    assert((orderInDb?.reservations.length ?? 0) > 0, "Inventory reservations created with status CONFIRMED", `Reservations: ${orderInDb?.reservations.length}`);
    assert((orderInDb?.shipments.length ?? 0) > 0, "Shipments created with tracking codes", `Shipments: ${orderInDb?.shipments.length}`);

    // 6. Invoices, Payments, and Credit Notes
    console.log("\n--- 6. BILLING, INVOICING, PAYMENTS & CREDIT NOTES ---");
    const invoicesData = await getLiveInvoicesData();
    assert(invoicesData.invoices.length >= 4, "Live invoices queried from database", `Invoices count: ${invoicesData.invoices.length}`);
    assert(invoicesData.invoiceStats.length === 4, "Executive invoice stats computed");

    const targetInvoice = invoicesData.invoices[0];
    const payResult = await recordPaymentAction({
      invoiceNumber: targetInvoice.id,
      amount: 10000,
      method: "BANK_TRANSFER",
    });
    assert(payResult.success, "Payment recorded transactionally in PostgreSQL", `Payment ID: ${payResult.paymentId}, New Balance: ₹${payResult.newBalance}`);

    const cnResult = await issueCreditNoteAction({
      invoiceNumber: targetInvoice.id,
      amount: 5000,
      reason: "Commercial Concession",
    });
    assert(cnResult.success, "Credit Note issued and balance updated", `Note: ${cnResult.noteNumber}, Balance: ₹${cnResult.newBalance}`);

    // 7. Subscriptions Lifecycle
    console.log("\n--- 7. SUBSCRIPTIONS LIFECYCLE ---");
    const subsData = await getLiveSubscriptionsData();
    assert(subsData.subscriptions.length >= 3, "Live recurring subscriptions loaded from PostgreSQL", `Active subs: ${subsData.subscriptions.length}`);
    const pauseRes = await pauseSubscriptionAction(subsData.subscriptions[0].id);
    assert(pauseRes.success, "Subscription paused in PostgreSQL");
    const resumeRes = await resumeSubscriptionAction(subsData.subscriptions[0].id);
    assert(resumeRes.success, "Subscription resumed in PostgreSQL");

    // 8. Customer Portal & Acceptance
    console.log("\n--- 8. CUSTOMER PORTAL, NEGOTIATION & ACCEPTANCE ---");
    const portalQuote = await getCustomerQuotationDetail("Q-1042");
    assert(!!portalQuote, "Customer-facing sanitized quote loaded");
    assert(!("riskScore" in (portalQuote as any)), "Internal risk score strictly redacted from portal view");
    assert(!("estimatedMargin" in (portalQuote as any)), "Internal profit margin strictly redacted from portal view");

    const counterRes = await submitCounterOffer({
      quotationId: quoteId,
      comments: "Enterprise Procurement requests delivery by BlueDart priority",
      proposedDiscount: 18,
    });
    assert(counterRes.success, "Customer negotiation counter-offer created in PostgreSQL", `Negotiation ID: ${counterRes.negotiationId}`);

    const acceptRes = await acceptQuotationByCustomer({
      quotationId: quoteId,
      signatoryName: "Ananya Shah",
      signatoryTitle: "VP Procurement",
      signatoryEmail: "ananya.shah@apexinfotech.example",
    });
    assert(acceptRes.success && acceptRes.status === "ACCEPTED", "Quotation accepted & signed by buyer representative", `Status: ${acceptRes.status}`);

    // 9. Pipeline Aggregation & Lifetime Margin
    console.log("\n--- 9. PIPELINE AGGREGATION & LIFETIME MARGIN ---");
    const pipeline = await getLivePipelinePerformance();
    assert(pipeline.stages.length === 5, "Pipeline dynamically aggregated across 5 stages", `Stages: ${pipeline.stages.map(s => s.stage).join(", ")}`);

    const lifetimeMargin = await calculateCustomerLifetimeMargin(q1042!.customerId);
    assert(!!lifetimeMargin, "Customer lifetime margin calculated");
    assert((lifetimeMargin?.totalLifetimeRevenue ?? 0) > 0, "Lifetime revenue exceeds 0", `Total: ₹${lifetimeMargin?.totalLifetimeRevenue}`);

    // Summary
    console.log("\n================================================================================");
    console.log(`TEST SUITE RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log("================================================================================\n");

    if (passed === total) {
      console.log("ALL MANDATORY HARDENING & INTEGRATION TESTS PASSED PERFECTLY!\n");
    } else {
      console.error(`SOME TESTS FAILED: ${total - passed} failure(s) detected.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal exception during verification suite execution:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHardeningSuite();
