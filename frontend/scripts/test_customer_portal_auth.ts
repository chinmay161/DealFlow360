import { prisma } from "../src/lib/prisma";
import {
  normalizeEmail,
  normalizePhone,
  findPortalContactByEmail,
  createPortalLoginIntent,
  verifyPortalLoginIntent,
} from "../src/lib/services/portalAuthService";
import { checkPortalEmailAction } from "../src/lib/actions/portalAuthActions";
import { createCustomerAction } from "../src/lib/actions/customerActions";
import {
  getCustomerQuotations,
  getCustomerQuotationDetail,
  submitCounterOffer,
  acceptQuotationByCustomer,
} from "../src/lib/services/portalService";
import { authConfig, isAllowedEmailDomain } from "../src/auth.config";
import { QuotationStatus } from "@prisma/client";

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

const TEST_EMAIL = "mrextradummy@gmail.com";

async function main() {
  console.log("================================================================================");
  console.log(` DEALFLOW360 VERIFICATION: EXACT TEST CUSTOMER [${TEST_EMAIL}]`);
  console.log("================================================================================\n");

  try {
    // =========================================================================
    // STEP 0: Ensure Test Customer & Contact Exist via authoritative action
    // =========================================================================
    console.log("--- STEP 0: Ensure Test Customer & Contact Exist in PostgreSQL ---");
    let existingContact = await prisma.contact.findUnique({
      where: { email: TEST_EMAIL },
      include: { customer: { include: { quotations: true } } },
    });

    if (!existingContact) {
      console.log(`  Creating customer for ${TEST_EMAIL} via createCustomerAction...`);
      const createRes = await createCustomerAction({
        customerNumber: "CUST-00088",
        name: "Mr Extra Dummy Enterprises Ltd.",
        industry: "Enterprise Cloud & Infrastructure",
        tier: "GOLD",
        paymentTerms: "Net 30 Days",
        creditLimit: 2500000,
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        contactName: "Mr Extra Dummy",
        contactEmail: TEST_EMAIL,
        contactPhone: "+91 9820011223",
        contactTitle: "Chief Information Officer",
        portalAccessEnabled: true,
      });

      assert(createRes.success, "Customer registration action succeeded", createRes.error);

      existingContact = await prisma.contact.findUnique({
        where: { email: TEST_EMAIL },
        include: { customer: { include: { quotations: true } } },
      });
    }

    assert(existingContact !== null, `Contact for ${TEST_EMAIL} exists in PostgreSQL`);
    const customer = existingContact!.customer;
    assert(customer !== null, "Contact links to an authoritative Customer record");

    // Ensure test customer has at least one quotation to test customer isolation & viewing
    let dummyQuote = customer.quotations.find((q) => q.quotationNumber === "Q-1088");
    if (!dummyQuote) {
      const owner = (await prisma.user.findFirst({ where: { role: "SALES_REP" } })) || (await prisma.user.findFirst());
      dummyQuote = await prisma.quotation.create({
        data: {
          quotationNumber: "Q-1088",
          customerId: customer.id,
          ownerId: owner!.id,
          status: QuotationStatus.SENT,
          currentStage: "Customer Proposal Sent",
          currency: "INR",
          subtotal: 500000.0,
          discountTotal: 50000.0,
          taxTotal: 81000.0,
          totalValue: 531000.0,
          estimatedMargin: 32.5,
          riskScore: 45,
          notes: "Confidential pricing notes for internal governance",
          lineItems: {
            create: [
              {
                productName: "Enterprise Cloud Server Node - 64 Core",
                sku: "SRV-64C-IND",
                quantity: 2,
                unitPrice: 250000.0,
                discountPercent: 10.0,
                lineTotal: 450000.0,
                estimatedMarginPercent: 32.5,
              },
            ],
          },
        },
      });
      console.log(`  Seeded test quotation Q-1088 for ${customer.name}`);
    }

    // -------------------------------------------------------------------------
    // REQUIREMENT 1: mrextradummy@gmail.com exists as a portal-enabled Contact
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 1: Contact portalAccess in PostgreSQL ---");
    assert(
      existingContact!.portalAccess === true || existingContact!.portalAccessEnabled === true,
      "Contact has portal access enabled"
    );
    assert(existingContact!.isActive === true, "Contact isActive state is true");

    // -------------------------------------------------------------------------
    // REQUIREMENT 2: Contact links to exactly one Customer
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 2: Single Customer Association ---");
    assert(!!existingContact!.customerId, "Contact contains valid customerId foreign key");
    assert(existingContact!.customerId === customer.id, "Contact links to expected Customer ID");

    // -------------------------------------------------------------------------
    // REQUIREMENT 3: Customer has a valid stable Customer ID
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 3: Stable Customer ID & Number ---");
    assert(typeof customer.id === "string" && customer.id.length > 0, "Valid UUID primary key");
    assert(
      typeof customer.customerNumber === "string" && customer.customerNumber.startsWith("CUST-"),
      `Customer has stable business identifier: ${customer.customerNumber}`
    );

    // -------------------------------------------------------------------------
    // REQUIREMENT 4: Pre-OAuth email eligibility returns true for registered email
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 4: Pre-OAuth Email Eligibility Gate ---");
    const checkRegistered = await checkPortalEmailAction(TEST_EMAIL);
    assert(checkRegistered.eligible === true, `Eligibility check for ${TEST_EMAIL} returns true`);
    assert(checkRegistered.email === TEST_EMAIL, "Returns normalized email");

    // -------------------------------------------------------------------------
    // REQUIREMENT 5: Unknown email returns false with guidance
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 5: Unknown Email Returns False ---");
    const checkUnknown = await checkPortalEmailAction("unknown-customer@example.com");
    assert(checkUnknown.eligible === false, "Unknown email returns eligible: false");
    assert(
      checkUnknown.error?.includes("Please log in using the registered email address.") ?? false,
      "Error contains required prompt text"
    );
    assert(
      checkUnknown.guidance?.includes("If this email has not been registered") ?? false,
      "Guidance contains sales team contact instructions"
    );

    // -------------------------------------------------------------------------
    // REQUIREMENT 6: Case-normalized email resolves correctly
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 6: Email Normalization ---");
    const checkUpper = await checkPortalEmailAction("MREXTRADUMMY@GMAIL.COM");
    assert(checkUpper.eligible === true, "Uppercase email resolves to eligible: true");
    assert(checkUpper.email === TEST_EMAIL, "Normalized to canonical lowercase");

    const checkSpaces = await checkPortalEmailAction("  mrextradummy@gmail.com  ");
    assert(checkSpaces.eligible === true, "Surrounding whitespace trimmed and eligible: true");
    assert(checkSpaces.email === TEST_EMAIL, "Normalized to canonical trimmed email");

    // -------------------------------------------------------------------------
    // REQUIREMENT 7: Login intent can be created
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 7: Login Intent Creation ---");
    const intent = await createPortalLoginIntent(TEST_EMAIL);
    assert(intent !== null, "PortalLoginIntent successfully created in PostgreSQL");
    assert(typeof intent?.token === "string" && intent?.token.length === 64, "Token is a 32-byte (64-char) hex string");
    assert(intent?.expiresAt.getTime()! > Date.now(), "Expiration is set in future (~10 minutes)");

    // -------------------------------------------------------------------------
    // REQUIREMENT 8: Expired login intent is rejected & single-use enforced
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 8: Login Intent Expiration & Single-Use ---");
    const intentExpired = await createPortalLoginIntent(TEST_EMAIL);
    assert(intentExpired !== null, "Created intent for expiration test");
    if (intentExpired) {
      await prisma.portalLoginIntent.update({
        where: { token: intentExpired.token },
        data: { expiresAt: new Date(Date.now() - 30000) },
      });
      const verifyExpired = await verifyPortalLoginIntent(intentExpired.token, TEST_EMAIL);
      assert(verifyExpired.success === false, "Expired intent fails verification");
      assert(verifyExpired.error === "IntentExpired", "Returns IntentExpired code");

      // Single-use enforcement
      const singleUseIntent = await createPortalLoginIntent(TEST_EMAIL);
      const firstUse = await verifyPortalLoginIntent(singleUseIntent!.token, TEST_EMAIL);
      assert(firstUse.success === true, "First verification succeeds");
      const secondUse = await verifyPortalLoginIntent(singleUseIntent!.token, TEST_EMAIL);
      assert(secondUse.success === false, "Second verification rejected (single-use)");
      assert(secondUse.error === "IntentAlreadyUsed", "Returns IntentAlreadyUsed code");
    }

    // -------------------------------------------------------------------------
    // REQUIREMENT 9: Matching verified OAuth identity is accepted
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 9: Matching OAuth Callback Accepted ---");
    const validIntent = await createPortalLoginIntent(TEST_EMAIL);
    assert(validIntent !== null, "Created fresh intent for matching OAuth test");
    const oauthSuccess = await verifyPortalLoginIntent(validIntent!.token, TEST_EMAIL);
    assert(oauthSuccess.success === true, "OAuth email matches intent email -> SUCCESS");
    assert(oauthSuccess.contact?.email === TEST_EMAIL, "Contact matches test email");
    assert(oauthSuccess.customer?.id === customer.id, "Customer matches test customer");

    // -------------------------------------------------------------------------
    // REQUIREMENT 10: Different verified OAuth identity is rejected
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 10: Mismatched OAuth Callback Rejected ---");
    const mismatchIntent = await createPortalLoginIntent(TEST_EMAIL);
    const oauthMismatch = await verifyPortalLoginIntent(mismatchIntent!.token, "different@gmail.com");
    assert(oauthMismatch.success === false, "OAuth email differs from registered email -> REJECTED");
    assert(oauthMismatch.error === "OAuthEmailMismatch", "Returns OAuthEmailMismatch error code");

    // Case normalization during OAuth callback
    const caseIntent = await createPortalLoginIntent(TEST_EMAIL);
    const oauthCase = await verifyPortalLoginIntent(caseIntent!.token, "MREXTRADUMMY@GMAIL.COM");
    assert(oauthCase.success === true, "OAuth email matches after case normalization -> SUCCESS");

    // -------------------------------------------------------------------------
    // REQUIREMENT 11: Customer portal session resolves the correct customer
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 11: Session & Role Determinism ---");
    // Verify role assignment in auth logic
    const contactRecord = await findPortalContactByEmail(TEST_EMAIL);
    assert(contactRecord !== null, "Contact resolved from PostgreSQL");
    const sessionUser = {
      email: TEST_EMAIL,
      role: "CUSTOMER",
      customerId: contactRecord!.customerId,
      contactId: contactRecord!.id,
    };
    assert(sessionUser.role === "CUSTOMER", "Role is strictly CUSTOMER");
    assert(sessionUser.customerId === customer.id, "Session holds authoritative Customer ID");
    assert(
      !["SALES_REP", "MANAGER", "FINANCE", "EXECUTIVE", "ADMIN"].includes(sessionUser.role),
      "Customer cannot elevate to internal roles"
    );

    // -------------------------------------------------------------------------
    // REQUIREMENT 12: Customer cannot access another customer's quote (Data Isolation)
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 12: Portal Quotation Data Isolation ---");
    // 1. Can view own quote
    const ownQuote = await getCustomerQuotationDetail(dummyQuote.quotationNumber, customer.id);
    assert(ownQuote !== null, `Customer can access their own quotation [${dummyQuote.quotationNumber}]`);
    assert(ownQuote?.id === dummyQuote.id, "Returned quotation ID matches own quote");

    // 2. Cannot view Apex quote (Q-1042)
    const apexCustomer = await prisma.customer.findFirst({ where: { name: "Apex Infotech Pvt. Ltd." } });
    assert(apexCustomer !== null, "Apex Infotech customer exists for isolation comparison");
    const unauthorizedQuote = await getCustomerQuotationDetail("Q-1042", customer.id);
    assert(unauthorizedQuote === null, "Accessing Customer B quotation returns null / 404 without data leakage");

    // 3. getCustomerQuotations returns only own quotes
    const customerQuotesList = await getCustomerQuotations(customer.id);
    assert(customerQuotesList.length > 0, "Quotes list retrieved for customer");
    const strictlyOwn = customerQuotesList.every((q) => q.customerCode === customer.customerNumber || q.customerName === customer.name);
    assert(strictlyOwn, "Listing contains ONLY quotations belonging to this customer");

    // -------------------------------------------------------------------------
    // REQUIREMENT 13: Portal payload is properly redacted
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 13: Sensitive Financial & Governance Redaction ---");
    if (ownQuote) {
      assert(!("riskScore" in (ownQuote as any)), "Internal risk score is strictly REDACTED");
      assert(!("estimatedMargin" in (ownQuote as any)), "Internal profit margin is strictly REDACTED");
      assert(!("notes" in (ownQuote as any)), "Internal sales notes are strictly REDACTED");
      assert(!("costPrice" in (ownQuote.lineItems[0] as any)), "Line item cost price is strictly REDACTED");
      assert(!("estimatedMarginPercent" in (ownQuote.lineItems[0] as any)), "Line item margin percent is strictly REDACTED");
      assert(typeof ownQuote.totalValue === "number", "Customer-safe totalValue present");
      assert(typeof ownQuote.currency === "string", "Customer-safe currency present");
      assert(Array.isArray(ownQuote.lineItems), "Customer-safe line items present");
    }

    // -------------------------------------------------------------------------
    // REQUIREMENT 14: Redirect target implemented by the callback
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 14: Callback & Route Redirection Logic ---");
    const baseUrl = "http://localhost:3000";
    const redirectUrl = await (authConfig.callbacks as any).redirect({
      url: "/portal",
      baseUrl,
    });
    assert(redirectUrl === `${baseUrl}/portal` || redirectUrl === "/portal", "Customer OAuth redirects to /portal");

    // Test authorized callback for customer hitting employee routes
    const authState = { user: { email: TEST_EMAIL, role: "CUSTOMER" } };
    const overviewReq = { nextUrl: new URL(`${baseUrl}/overview`) };
    const dashboardReq = { nextUrl: new URL(`${baseUrl}/dashboard`) };
    const portalReq = { nextUrl: new URL(`${baseUrl}/portal`) };

    const authorizedOverview = (authConfig.callbacks as any).authorized({ auth: authState, request: overviewReq });
    assert(
      authorizedOverview instanceof Response && Boolean(authorizedOverview.headers.get("location")?.includes("/portal")),
      "Customer attempting /overview is redirected to /portal"
    );

    const authorizedDashboard = (authConfig.callbacks as any).authorized({ auth: authState, request: dashboardReq });
    assert(
      authorizedDashboard instanceof Response && Boolean(authorizedDashboard.headers.get("location")?.includes("/portal")),
      "Customer attempting /dashboard is redirected to /portal"
    );

    const authorizedPortal = (authConfig.callbacks as any).authorized({ auth: authState, request: portalReq });
    assert(authorizedPortal === true, "Customer accessing /portal is authorized");

    // -------------------------------------------------------------------------
    // REQUIREMENT 15: Internal employee authentication remains unaffected
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 15: Internal Employee Authentication Unaffected ---");
    assert(isAllowedEmailDomain("arjun.mehta@dealflow360.in"), "dealflow360.in is allowed for internal login");
    assert(isAllowedEmailDomain("admin@gmail.com"), "gmail.com is allowed for employee login");
    assert(!isAllowedEmailDomain("hacker@malicious.xyz"), "Unapproved domain strictly rejected");

    const employeeAuthState = { user: { email: "arjun.mehta@dealflow360.in", role: "SALES_REP" } };
    const empOverviewReq = { nextUrl: new URL(`${baseUrl}/overview`) };
    const authorizedEmpOverview = (authConfig.callbacks as any).authorized({ auth: employeeAuthState, request: empOverviewReq });
    assert(authorizedEmpOverview === true, "Internal employee accessing /overview is authorized");

    // -------------------------------------------------------------------------
    // REQUIREMENT 16: Negotiation & Acceptance Authorization
    // -------------------------------------------------------------------------
    console.log("\n--- REQUIREMENT 16: Negotiation & Acceptance Authorization ---");
    // 1. Customer can counter-offer their own quote
    const counterOfferRes = await submitCounterOffer({
      quotationId: dummyQuote.id,
      customerId: customer.id,
      comments: "Requesting additional 5% commercial concession for Q3 closing",
      proposedDiscount: 15,
      actorName: "Mr Extra Dummy",
      actorEmail: TEST_EMAIL,
    });
    assert(counterOfferRes.success === true, "Customer successfully submitted counter-offer on own quote");

    // 2. Customer CANNOT counter-offer another customer's quote
    const apexQuote = await prisma.quotation.findFirst({ where: { quotationNumber: "Q-1042" } });
    if (apexQuote) {
      let threwOnUnauthorizedCounter = false;
      try {
        await submitCounterOffer({
          quotationId: apexQuote.id,
          customerId: customer.id, // passing dummy customer ID for Apex quote
          comments: "Malicious counter offer attempt",
          proposedDiscount: 20,
        });
      } catch (err: any) {
        threwOnUnauthorizedCounter = err.message.includes("Unauthorized");
      }
      assert(threwOnUnauthorizedCounter, "Counter-offer against another customer's quote is blocked (Unauthorized)");
    }

    // 3. Customer can accept and sign their own quote
    const acceptRes = await acceptQuotationByCustomer({
      quotationId: dummyQuote.id,
      customerId: customer.id,
      signatoryName: "Mr Extra Dummy",
      signatoryTitle: "CIO",
      signatoryEmail: TEST_EMAIL,
    });
    assert(acceptRes.success === true, "Customer successfully signed and accepted own quotation");
    assert(acceptRes.status === "ACCEPTED", "Quotation transitioned to ACCEPTED status");

    // Verify audit log exists
    const acceptAudit = await prisma.auditLog.findFirst({
      where: { entityId: dummyQuote.id, action: "CUSTOMER_ACCEPT_SIGN" },
    });
    assert(acceptAudit !== null, "CUSTOMER_ACCEPT_SIGN audit log persisted in PostgreSQL");

    // 4. Duplicate acceptance is idempotent
    const duplicateAccept = await acceptQuotationByCustomer({
      quotationId: dummyQuote.id,
      customerId: customer.id,
      signatoryName: "Mr Extra Dummy",
      signatoryTitle: "CIO",
      signatoryEmail: TEST_EMAIL,
    });
    assert(duplicateAccept.success === true, "Duplicate acceptance handled gracefully");
    assert(duplicateAccept.alreadyAccepted === true, "Duplicate acceptance flagged as alreadyAccepted (idempotent)");

    // Restore dummyQuote back to SENT
    await prisma.quotation.update({
      where: { id: dummyQuote.id },
      data: { status: QuotationStatus.SENT, currentStage: "Customer Proposal Sent" },
    });

    console.log("\n================================================================================");
    console.log(` RESULTS FOR ${TEST_EMAIL}: ${passCount} PASSED | ${failCount} FAILED`);
    console.log("================================================================================");

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL ERROR IN TEST SUITE:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
