import { deriveFulfillmentLifecycleSteps } from "../src/features/inventory/components/ShipmentTimeline";
import { getQuotationWithLineItems } from "../src/lib/quotations";
import { prisma } from "../src/lib/prisma";

async function runTests() {
  console.log("==================================================================");
  console.log("🧪 TESTING FULFILLMENT & CONSIGNMENT LIFECYCLE BUSINESS RULES");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      if (detail) console.error(`  Detail: ${detail}`);
      failed++;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Brand-New Unsubmitted Quotation (DRAFT)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 1: Brand-New Unsubmitted Quotation (DRAFT) ---");
  const draftSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "DRAFT",
    hasApprovals: false,
    hasReservation: false,
    shipmentStatus: null,
  });

  assert(draftSteps.length === 8, "Timeline has exactly 8 stages");
  assert(draftSteps[0].stage === "Draft" && draftSteps[0].status === "current", "Draft stage is active (current)");
  assert(draftSteps[1].stage === "Pending Approval" && draftSteps[1].status === "pending", "Pending Approval is pending");
  assert(draftSteps[2].stage === "Approved" && draftSteps[2].status === "pending", "Approved is pending");
  assert(draftSteps[3].stage === "Inventory Reserved" && draftSteps[3].status === "pending", "Inventory Reserved is pending");
  assert(draftSteps[4].stage === "Packed" && draftSteps[4].status === "pending", "Packed is pending");
  assert(draftSteps[5].stage === "Dispatched" && draftSteps[5].status === "pending", "Dispatched is pending");
  assert(draftSteps[6].stage === "In Transit" && draftSteps[6].status === "pending", "In Transit is pending");
  assert(draftSteps[7].stage === "Delivered" && draftSteps[7].status === "pending", "Delivered is pending");

  const anyFulfillmentCompletedDraft = draftSteps.slice(3).some((s) => s.status === "completed");
  assert(!anyFulfillmentCompletedDraft, "No fulfillment stages shown as completed in draft");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Brand-New Submitted Quotation (PENDING_APPROVAL)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 2: Brand-New Submitted Quotation (PENDING_APPROVAL) ---");
  const submittedSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "PENDING_APPROVAL",
    hasApprovals: true,
    hasReservation: false,
    shipmentStatus: null,
  });

  assert(submittedSteps[0].stage === "Draft" && submittedSteps[0].status === "completed", "Draft is completed once submitted");
  assert(submittedSteps[1].stage === "Pending Approval" && submittedSteps[1].status === "current", "Pending Approval is active (current)");
  assert(submittedSteps[2].stage === "Approved" && submittedSteps[2].status === "pending", "Approved is pending");
  assert(submittedSteps[3].stage === "Inventory Reserved" && submittedSteps[3].status === "pending", "Inventory Reserved remains pending");
  assert(submittedSteps[4].stage === "Packed" && submittedSteps[4].status === "pending", "Packed remains pending");
  assert(submittedSteps[5].stage === "Dispatched" && submittedSteps[5].status === "pending", "Dispatched remains pending");
  assert(submittedSteps[6].stage === "In Transit" && submittedSteps[6].status === "pending", "In Transit remains pending");
  assert(submittedSteps[7].stage === "Delivered" && submittedSteps[7].status === "pending", "Delivered remains pending");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Approved Quotation (Awaiting Inventory Reservation)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 3: Approved Quotation (Awaiting Inventory Reservation) ---");
  const approvedSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "APPROVED",
    hasApprovals: true,
    hasReservation: false,
    shipmentStatus: null,
  });

  assert(approvedSteps[0].status === "completed", "Draft is completed");
  assert(approvedSteps[1].status === "completed", "Pending Approval is completed");
  assert(approvedSteps[2].status === "completed", "Approved is completed");
  assert(approvedSteps[3].stage === "Inventory Reserved" && approvedSteps[3].status === "current", "Inventory Reserved becomes active (current) upon approval");
  assert(approvedSteps[4].stage === "Packed" && approvedSteps[4].status === "pending", "Packed remains pending until reservation exists");
  assert(approvedSteps[5].stage === "Dispatched" && approvedSteps[5].status === "pending", "Dispatched remains pending");
  assert(approvedSteps[6].stage === "In Transit" && approvedSteps[6].status === "pending", "In Transit remains pending");
  assert(approvedSteps[7].stage === "Delivered" && approvedSteps[7].status === "pending", "Delivered remains pending");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Reservation Exists (Awaiting Packing)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 4: Reservation Exists (Awaiting Packing) ---");
  const reservedSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "APPROVED",
    hasApprovals: true,
    hasReservation: true,
    shipmentStatus: null,
  });

  assert(reservedSteps[3].stage === "Inventory Reserved" && reservedSteps[3].status === "completed", "Inventory Reserved is completed");
  assert(reservedSteps[4].stage === "Packed" && reservedSteps[4].status === "current", "Packed becomes active (current) once reservation exists");
  assert(reservedSteps[5].stage === "Dispatched" && reservedSteps[5].status === "pending", "Dispatched remains pending until packing is completed");
  assert(reservedSteps[6].stage === "In Transit" && reservedSteps[6].status === "pending", "In Transit remains pending");
  assert(reservedSteps[7].stage === "Delivered" && reservedSteps[7].status === "pending", "Delivered remains pending");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Packing Completed (Shipment PACKED)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 5: Packing Completed (Shipment PACKED) ---");
  const packedSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "APPROVED",
    hasApprovals: true,
    hasReservation: true,
    shipmentStatus: "PACKED",
  });

  assert(packedSteps[4].stage === "Packed" && packedSteps[4].status === "completed", "Packed is completed");
  assert(packedSteps[5].stage === "Dispatched" && packedSteps[5].status === "current", "Dispatched becomes active (current) once packing is completed");
  assert(packedSteps[6].stage === "In Transit" && packedSteps[6].status === "pending", "In Transit remains pending until dispatched");
  assert(packedSteps[7].stage === "Delivered" && packedSteps[7].status === "pending", "Delivered remains pending");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Dispatched (Shipment SHIPPED)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 6: Dispatched (Shipment SHIPPED) ---");
  const dispatchedSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "APPROVED",
    hasApprovals: true,
    hasReservation: true,
    shipmentStatus: "SHIPPED",
  });

  assert(dispatchedSteps[5].stage === "Dispatched" && dispatchedSteps[5].status === "completed", "Dispatched is completed");
  assert(dispatchedSteps[6].stage === "In Transit" && dispatchedSteps[6].status === "current", "In Transit becomes active (current) once dispatched");
  assert(dispatchedSteps[7].stage === "Delivered" && dispatchedSteps[7].status === "pending", "Delivered remains pending");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: In Transit Corridor
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 7: In Transit (Shipment IN_TRANSIT) ---");
  const transitSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "APPROVED",
    hasApprovals: true,
    hasReservation: true,
    shipmentStatus: "IN_TRANSIT",
  });

  assert(transitSteps[5].status === "completed", "Dispatched is completed");
  assert(transitSteps[6].status === "current", "In Transit is current");
  assert(transitSteps[7].status === "pending", "Delivered is pending");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Delivered (Shipment DELIVERED)
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 8: Delivered (Shipment DELIVERED) ---");
  const deliveredSteps = deriveFulfillmentLifecycleSteps({
    quotationStatus: "APPROVED",
    hasApprovals: true,
    hasReservation: true,
    shipmentStatus: "DELIVERED",
  });

  assert(deliveredSteps[6].stage === "In Transit" && deliveredSteps[6].status === "completed", "In Transit is completed");
  assert(deliveredSteps[7].stage === "Delivered" && deliveredSteps[7].status === "completed", "Delivered is completed");

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: Real Database Integration Test with getQuotationWithLineItems
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n--- TEST SUITE 9: Database Integration Test with Real Quotation ---");
  try {
    // Find or create an unapproved quotation in DB
    const customer = await prisma.customer.findFirst();
    const user = await prisma.user.findFirst();

    if (customer && user) {
      // Create a test draft quotation
      const testQuoteNumber = `Q-TEST-${Date.now().toString().slice(-4)}`;
      const newQuote = await prisma.quotation.create({
        data: {
          quotationNumber: testQuoteNumber,
          customerId: customer.id,
          ownerId: user.id,
          status: "DRAFT",
          currentStage: "Drafting",
          subtotal: 100000,
          totalValue: 100000,
          estimatedMargin: 30,
        },
      });

      // Fetch using getQuotationWithLineItems
      const fetched = await getQuotationWithLineItems(newQuote.id);
      assert(fetched !== null, `Fetched newly created quotation ${testQuoteNumber}`);
      assert(fetched?.status === "DRAFT", "Fetched quotation status is DRAFT");
      assert(!fetched?.reservations || fetched.reservations.length === 0, "No reservations exist for brand new quotation");
      assert(!fetched?.orders || fetched.orders.length === 0, "No orders/shipments exist for brand new quotation");

      // Verify lifecycle on fetched quotation
      const realSteps = deriveFulfillmentLifecycleSteps({
        quotationStatus: fetched!.status,
        hasApprovals: fetched!.approvals.length > 0,
        hasReservation: (fetched!.reservations?.length || 0) > 0,
        shipmentStatus: fetched!.orders?.[0]?.shipments?.[0]?.status || null,
        createdAt: fetched!.createdAt,
      });

      assert(realSteps[0].status === "current", "Brand-new DB quotation has Draft active");
      assert(realSteps[1].status === "pending", "Brand-new DB quotation has Pending Approval pending");
      assert(realSteps[2].status === "pending", "Brand-new DB quotation has Approved pending");
      assert(realSteps[3].status === "pending", "Brand-new DB quotation has Inventory Reserved pending");
      assert(realSteps[4].status === "pending", "Brand-new DB quotation has Packed pending");
      assert(realSteps[5].status === "pending", "Brand-new DB quotation has Dispatched pending");
      assert(realSteps[6].status === "pending", "Brand-new DB quotation has In Transit pending");
      assert(realSteps[7].status === "pending", "Brand-new DB quotation has Delivered pending");

      // Clean up test quotation
      await prisma.quotation.delete({ where: { id: newQuote.id } });
      console.log(`Cleaned up test quotation ${testQuoteNumber}.`);
    } else {
      console.log("Skipping DB test: no customer or user found in DB.");
    }
  } catch (err) {
    console.error("Database test error:", err);
    failed++;
  }

  console.log("\n==================================================================");
  console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test runner failed:", err);
    process.exit(1);
  });
