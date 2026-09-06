import { prisma } from "../src/lib/prisma";
import { getQuotations, getQuotationWithLineItems } from "../src/lib/quotations";
import { getAuthoritativeCustomerForSession } from "../src/lib/services/portalAuthService";
import { getCustomerQuotations, getCustomerQuotationDetail } from "../src/lib/services/portalService";
import { Decimal } from "@prisma/client/runtime/library";

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, title: string, details?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${title}${details ? ` (${details})` : ""}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${title}${details ? ` (${details})` : ""}`);
  }
}

const TEST_CUSTOMER_EMAIL = "mrextradummy@gmail.com";
const TEST_CUSTOMER_NUMBER = "CUST-00088";
const TEST_COMPANY_NAME = "Mr Extra Dummy Enterprises Ltd.";

const ASSIGNED_REP_EMAIL = "shivammishrasm2004@gmail.com";
const UNRELATED_REP_EMAIL = "rohan.sharma@dealflow360.in";

async function main() {
  console.log("================================================================================");
  console.log(" DEALFLOW360: CUSTOMER -> SALES REPRESENTATIVE SYNCHRONIZATION VERIFICATION");
  console.log("================================================================================\n");

  let createdQuoteId: string | null = null;
  let createdQuoteNumber: string | null = null;

  try {
    // ---------------------------------------------------------------------------
    // STEP 1: Fixture Verification & User Resolution
    // ---------------------------------------------------------------------------
    console.log("--- STEP 1: Fixture Verification & User Resolution ---");

    const customerContact = await prisma.contact.findUnique({
      where: { email: TEST_CUSTOMER_EMAIL },
      include: { customer: true },
    });
    assert(customerContact !== null, "Customer contact exists in PostgreSQL");
    assert(customerContact?.customer?.customerNumber === TEST_CUSTOMER_NUMBER, "Customer number is CUST-00088");
    assert(customerContact?.customer?.name === TEST_COMPANY_NAME, "Customer company name matches");

    const customerOrg = customerContact!.customer!;

    const assignedRep = await prisma.user.findUnique({
      where: { email: ASSIGNED_REP_EMAIL },
    });
    assert(assignedRep !== null, `Assigned sales rep (${ASSIGNED_REP_EMAIL}) exists in PostgreSQL`);
    assert(assignedRep?.role === "SALES_REP", "Assigned sales rep role is SALES_REP");

    const unrelatedRep = await prisma.user.findUnique({
      where: { email: UNRELATED_REP_EMAIL },
    });
    assert(unrelatedRep !== null, `Unrelated sales rep (${UNRELATED_REP_EMAIL}) exists in PostgreSQL`);
    assert(unrelatedRep?.role === "SALES_REP", "Unrelated sales rep role is SALES_REP");

    const otherCustomer = await prisma.customer.findFirst({
      where: { customerNumber: { not: TEST_CUSTOMER_NUMBER } },
    });
    assert(otherCustomer !== null, "Second customer exists for cross-tenant isolation testing");

    // Verify Customer.ownerId points to Shivam Mishra
    assert(
      customerOrg.ownerId === assignedRep!.id,
      "Customer organization ownerId points to assigned sales rep in PostgreSQL",
      `Expected ${assignedRep!.id}, got ${customerOrg.ownerId}`
    );

    // ---------------------------------------------------------------------------
    // STEP 2: Session Resolution for mrextradummy@gmail.com
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 2: Customer Session Resolution ---");

    const customerSession = {
      id: "customer-session-user-id",
      email: TEST_CUSTOMER_EMAIL,
      role: "CUSTOMER",
      customerId: customerOrg.id,
      contactId: customerContact!.id,
    };

    const authoritativeCustomer = await getAuthoritativeCustomerForSession(customerSession);
    assert(authoritativeCustomer !== null, "Authoritative customer resolved from session");
    assert(authoritativeCustomer?.id === customerOrg.id, "Resolved customer ID matches CUST-00088 UUID");
    assert(authoritativeCustomer?.ownerId === assignedRep!.id, "Resolved customer ownerId matches assigned sales rep");

    // ---------------------------------------------------------------------------
    // STEP 3: Customer Creates Quotation
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 3: Customer Quotation Creation ---");

    // Get next sequential quotation number
    const existingQuotes = await prisma.quotation.findMany({
      select: { quotationNumber: true },
    });
    let maxNum = 1000;
    for (const q of existingQuotes) {
      const match = q.quotationNumber.match(/^Q-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextQuotationNumber = `Q-${maxNum + 1}`;

    const lineItemUnitPrice = 45000;
    const lineItemQty = 2;
    const lineItemDiscount = 5;
    const lineItemSubtotal = lineItemQty * lineItemUnitPrice;
    const lineItemDiscountVal = lineItemSubtotal * (lineItemDiscount / 100);
    const lineItemNet = lineItemSubtotal - lineItemDiscountVal;
    const lineItemTax = lineItemNet * 0.18;
    const lineItemTotal = lineItemNet + lineItemTax;

    const newQuotation = await prisma.quotation.create({
      data: {
        quotationNumber: nextQuotationNumber,
        customerId: customerOrg.id,
        ownerId: authoritativeCustomer!.ownerId!,
        status: "DRAFT",
        currentStage: "Draft Creation",
        currency: "INR",
        subtotal: new Decimal(lineItemSubtotal.toFixed(2)),
        discountTotal: new Decimal(lineItemDiscountVal.toFixed(2)),
        taxTotal: new Decimal(lineItemTax.toFixed(2)),
        totalValue: new Decimal(lineItemTotal.toFixed(2)),
        estimatedMargin: new Decimal("35.00"),
        riskScore: 15,
        lineItems: {
          create: [
            {
              productName: "Enterprise Cloud Node A1",
              sku: "CLOUD-NODE-A1",
              quantity: lineItemQty,
              unitPrice: new Decimal(lineItemUnitPrice.toFixed(2)),
              discountPercent: new Decimal(lineItemDiscount.toFixed(2)),
              discountLimitPercent: new Decimal("15.00"),
              estimatedMarginPercent: new Decimal("35.00"),
              lineTotal: new Decimal(lineItemNet.toFixed(2)),
              governanceStatus: "AUTO_APPROVED",
            },
          ],
        },
      },
      include: {
        customer: true,
        owner: true,
        lineItems: true,
      },
    });

    createdQuoteId = newQuotation.id;
    createdQuoteNumber = newQuotation.quotationNumber;

    assert(newQuotation.id !== undefined, "Quotation successfully persisted to PostgreSQL");
    assert(newQuotation.quotationNumber === nextQuotationNumber, `Sequential quotation number assigned (${nextQuotationNumber})`);
    assert(newQuotation.customerId === customerOrg.id, "Quotation customerId matches CUST-00088 UUID");
    assert(newQuotation.ownerId === assignedRep!.id, "Quotation ownerId matches assigned sales representative");
    assert(newQuotation.status === "DRAFT", "Initial quotation status is DRAFT");

    // Persist AuditLog
    await prisma.auditLog.create({
      data: {
        entity: "Quotation",
        entityId: newQuotation.id,
        action: "QUOTATION_CREATED",
        actorId: customerContact!.id,
        actorEmail: TEST_CUSTOMER_EMAIL,
        fromState: null,
        toState: "DRAFT",
        metadata: {
          role: "CUSTOMER",
          customerId: customerOrg.id,
          quotationNumber: newQuotation.quotationNumber,
          creatorName: customerContact!.name,
        },
      },
    });

    // ---------------------------------------------------------------------------
    // STEP 4: Single Quotation Record Assertion (No Duplicates)
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 4: Exactly ONE Database Record (No Duplicates) ---");

    const matchingRecords = await prisma.quotation.findMany({
      where: { quotationNumber: createdQuoteNumber },
    });
    assert(
      matchingRecords.length === 1,
      "Exactly ONE quotation record in PostgreSQL (no mirroring / duplicate copies)",
      `Found: ${matchingRecords.length}`
    );
    assert(matchingRecords[0].id === createdQuoteId, "Matching record has authoritative UUID");

    // ---------------------------------------------------------------------------
    // STEP 5: Internal Sales Representative Visibility (Shivam Mishra)
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 5: Sales Representative Visibility (Shivam Mishra) ---");

    const shivamQuotes = await getQuotations({
      id: assignedRep!.id,
      role: "SALES_REP",
    });

    const foundInShivamWorkspace = shivamQuotes.some((q) => q.id === createdQuoteId);
    assert(
      foundInShivamWorkspace,
      `Quotation ${createdQuoteNumber} is VISIBLE to assigned sales rep (${ASSIGNED_REP_EMAIL}) in getQuotations`
    );

    // Also verify by quotation detail lookup
    const shivamDetail = await getQuotationWithLineItems(createdQuoteId);
    assert(shivamDetail !== null, "Sales rep can load full quotation detail with line items");
    assert(shivamDetail?.customer.id === customerOrg.id, "Loaded quotation detail references customer CUST-00088");
    assert(shivamDetail?.owner.id === assignedRep!.id, "Loaded quotation detail owner is Shivam Mishra");
    assert(shivamDetail?.lineItems.length === 1, "Loaded quotation has line items attached");
    assert(shivamDetail?.estimatedMargin === 35, "Sales rep sees internal estimated margin (35%)");
    assert(shivamDetail?.riskScore === 15, "Sales rep sees internal risk score (15)");

    // ---------------------------------------------------------------------------
    // STEP 6: Rep-Level Account Isolation (Rohan Sharma)
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 6: Rep-Level Account Isolation (Rohan Sharma) ---");

    const rohanQuotes = await getQuotations({
      id: unrelatedRep!.id,
      role: "SALES_REP",
      scopeToOwner: true,
    });

    const foundInRohanWorkspace = rohanQuotes.some((q) => q.id === createdQuoteId);
    assert(
      !foundInRohanWorkspace,
      `Quotation ${createdQuoteNumber} is STRICTLY INVISIBLE to unrelated sales rep (${UNRELATED_REP_EMAIL})`
    );

    // ---------------------------------------------------------------------------
    // STEP 7: Customer-to-Customer Isolation
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 7: Customer-to-Customer Isolation ---");

    const otherCustomerQuotes = await getQuotations({
      customerId: otherCustomer!.id,
      role: "CUSTOMER",
    });

    const foundInOtherCustomer = otherCustomerQuotes.some((q) => q.id === createdQuoteId);
    assert(
      !foundInOtherCustomer,
      `Quotation ${createdQuoteNumber} is STRICTLY INVISIBLE to other customer accounts`
    );

    // ---------------------------------------------------------------------------
    // STEP 8: Global Search Scoping
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 8: Global Search Scoping ---");

    // Search query by quotation number
    const shivamSearchQuotes = await prisma.quotation.findMany({
      where: {
        AND: [
          { quotationNumber: { contains: createdQuoteNumber, mode: "insensitive" } },
          {
            OR: [
              { ownerId: assignedRep!.id },
              { customer: { ownerId: assignedRep!.id } },
            ],
          },
        ],
      },
    });
    assert(shivamSearchQuotes.length === 1, "Sales rep search by quotation number finds the quote");

    // Search query by customer company name
    const shivamSearchByName = await prisma.quotation.findMany({
      where: {
        AND: [
          { customer: { name: { contains: "Extra Dummy", mode: "insensitive" } } },
          {
            OR: [
              { ownerId: assignedRep!.id },
              { customer: { ownerId: assignedRep!.id } },
            ],
          },
        ],
      },
    });
    assert(shivamSearchByName.some((q) => q.id === createdQuoteId), "Sales rep search by customer name finds the quote");

    // Unrelated sales rep search returns nothing for this quote
    const rohanSearchQuotes = await prisma.quotation.findMany({
      where: {
        AND: [
          { quotationNumber: { contains: createdQuoteNumber, mode: "insensitive" } },
          {
            OR: [
              { ownerId: unrelatedRep!.id },
              { customer: { ownerId: unrelatedRep!.id } },
            ],
          },
        ],
      },
    });
    assert(rohanSearchQuotes.length === 0, "Unrelated sales rep search returns 0 results for this quotation");

    // ---------------------------------------------------------------------------
    // STEP 9: Dashboard Metrics & Activity Feed
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 9: Dashboard Metrics & Activity Feed ---");

    const shivamDashboardQuotes = await prisma.quotation.findMany({
      where: {
        OR: [
          { ownerId: assignedRep!.id },
          { customer: { ownerId: assignedRep!.id } },
        ],
      },
      include: {
        customer: { select: { name: true, tier: true } },
        owner: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    assert(
      shivamDashboardQuotes.some((q) => q.id === createdQuoteId),
      "Dashboard metrics query for sales rep includes customer quotation"
    );

    const draftQuotesForShivam = shivamDashboardQuotes.filter((q) => q.status === "DRAFT");
    assert(
      draftQuotesForShivam.some((q) => q.id === createdQuoteId),
      "Dashboard draft metric counts the customer draft quotation"
    );

    // ---------------------------------------------------------------------------
    // STEP 10: Notification Feed
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 10: Notification Feed ---");

    const repNotifications = await prisma.quotation.findMany({
      where: {
        OR: [
          { ownerId: assignedRep!.id },
          { customer: { ownerId: assignedRep!.id } },
        ],
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { customer: { select: { name: true } } },
    });

    const containsCreatedQuote = repNotifications.some((q) => q.id === createdQuoteId);
    assert(containsCreatedQuote, "Notification query returns recent customer quotation draft");

    // ---------------------------------------------------------------------------
    // STEP 11: Customer Portal View & Sensitive Pricing Redaction
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 11: Customer Portal View & Sensitive Pricing Redaction ---");

    const portalQuotes = await getCustomerQuotations(customerOrg.id);
    const inPortal = portalQuotes.some((q) => q.id === createdQuoteId);
    assert(inPortal, "Customer portal list displays the created quotation");

    const portalDetail = await getCustomerQuotationDetail(createdQuoteId, customerOrg.id);
    assert(portalDetail !== null, "Customer portal detail loads successfully for authorized customer");
    assert(portalDetail?.totalValue === Number(lineItemTotal.toFixed(2)), "Customer portal shows correct totalValue");
    assert((portalDetail as any)?.estimatedMargin === undefined, "Internal estimated margin is REDACTED for customer");
    assert((portalDetail as any)?.riskScore === undefined, "Internal risk score is REDACTED for customer");

    // ---------------------------------------------------------------------------
    // STEP 12: Lifecycle Transition (DRAFT -> PENDING_APPROVAL)
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 12: Lifecycle Transition & Approval Consistency ---");

    const updatedQuotation = await prisma.quotation.update({
      where: { id: createdQuoteId },
      data: {
        status: "PENDING_APPROVAL",
        currentStage: "Commercial Review",
      },
    });

    assert(updatedQuotation.status === "PENDING_APPROVAL", "Quotation transitioned to PENDING_APPROVAL");

    // Check sales rep view reflects updated status immediately on same record
    const updatedDetailForRep = await getQuotationWithLineItems(createdQuoteId);
    assert(updatedDetailForRep?.status === "PENDING_APPROVAL", "Sales rep sees updated PENDING_APPROVAL status immediately");
    assert(updatedDetailForRep?.currentStage === "Commercial Review", "Sales rep sees updated Commercial Review stage");

    // Verify still exactly one record
    const postTransitionCount = await prisma.quotation.count({
      where: { id: createdQuoteId },
    });
    assert(postTransitionCount === 1, "Exactly one quotation record exists after status transition");

    // ---------------------------------------------------------------------------
    // STEP 13: AuditLog Attribution
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 13: AuditLog Attribution in PostgreSQL ---");

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: createdQuoteId },
    });
    assert(auditLogs.length > 0, "AuditLog entries exist for quotation in PostgreSQL");
    const creationLog = auditLogs.find((l) => l.action === "QUOTATION_CREATED");
    assert(creationLog !== undefined, "AuditLog contains QUOTATION_CREATED action");
    assert(creationLog?.actorEmail === TEST_CUSTOMER_EMAIL, `AuditLog actorEmail is ${TEST_CUSTOMER_EMAIL}`);
    assert((creationLog?.metadata as any)?.role === "CUSTOMER", "AuditLog metadata records role as CUSTOMER");

    // ---------------------------------------------------------------------------
    // STEP 14: Canonical Quotation Q-1042 Integrity
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 14: Canonical Q-1042 Integrity ---");

    const canonicalQuote = await prisma.quotation.findUnique({
      where: { quotationNumber: "Q-1042" },
      include: { customer: true, owner: true, lineItems: true },
    });
    assert(canonicalQuote !== null, "Canonical quotation Q-1042 exists in PostgreSQL");
    assert(canonicalQuote?.customer.name === "Apex Infotech Pvt. Ltd.", "Q-1042 customer is Apex Infotech Pvt. Ltd.");
    assert(canonicalQuote?.owner.email === "arjun.mehta@dealflow360.in", "Q-1042 owner is Arjun Mehta");
    assert(canonicalQuote?.lineItems.length === 3, "Q-1042 has exactly 3 line items");
    assert(Number(canonicalQuote?.totalValue) === 1985940, "Q-1042 totalValue matches PostgreSQL record (₹19,85,940 with GST)");

    // ---------------------------------------------------------------------------
    // STEP 15: Clean Cleanup
    // ---------------------------------------------------------------------------
    console.log("\n--- STEP 15: Safe Deletion & Clean-up ---");

    await prisma.quoteLineItem.deleteMany({
      where: { quotationId: createdQuoteId },
    });
    await prisma.auditLog.deleteMany({
      where: { entityId: createdQuoteId },
    });
    await prisma.quotation.delete({
      where: { id: createdQuoteId },
    });

    const existsAfterDelete = await prisma.quotation.findUnique({
      where: { id: createdQuoteId },
    });
    assert(existsAfterDelete === null, "Test quotation safely cleaned up from PostgreSQL");

  } catch (error) {
    console.error("Test execution failed with error:", error);
    failCount++;
  } finally {
    console.log("\n================================================================================");
    console.log(` RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
    console.log("================================================================================\n");

    if (failCount > 0) {
      process.exit(1);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
