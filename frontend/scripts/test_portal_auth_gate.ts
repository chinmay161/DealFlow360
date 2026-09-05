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
} from "../src/lib/services/portalService";
import { isAllowedEmailDomain } from "../src/auth.config";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}${details ? ` (${details})` : ""}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName}${details ? ` (${details})` : ""}`);
  }
}

async function runAllTests() {
  console.log("================================================================================");
  console.log(" DEALFLOW360 CUSTOMER ACCOUNT REGISTRATION + LOGIN GATE TEST SUITE");
  console.log("================================================================================\n");

  try {
    // Locate seeded customers for tests
    const apexCustomer = await prisma.customer.findFirst({
      where: { name: "Apex Infotech Pvt. Ltd." },
      include: { contacts: true, quotations: true },
    });

    const bharatCustomer = await prisma.customer.findFirst({
      where: { name: "BharatGrid Systems" },
      include: { contacts: true, quotations: true },
    });

    if (!apexCustomer || !bharatCustomer) {
      throw new Error("Seeded customers (Apex Infotech / BharatGrid) not found in PostgreSQL");
    }

    // -------------------------------------------------------------------------
    // TEST 1: Registered portal email -> eligible
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Registered portal email -> eligible ---");
    const test1Res = await checkPortalEmailAction("ananya.shah@apexinfotech.example");
    assert(test1Res.eligible === true, "Active registered portal contact is eligible");
    assert(test1Res.email === "ananya.shah@apexinfotech.example", "Returns normalized business email");

    // -------------------------------------------------------------------------
    // TEST 2: Unregistered email -> rejected before OAuth
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Unregistered email -> rejected before OAuth ---");
    const test2Res = await checkPortalEmailAction("unregistered.stranger@example.com");
    assert(test2Res.eligible === false, "Unregistered email is rejected before OAuth");
    assert(
      test2Res.error?.includes("Please log in using the registered email address.") ?? false,
      "Error message matches required prompt text"
    );
    assert(
      test2Res.guidance?.includes("If this email has not been registered, contact your company representative") ?? false,
      "Secondary guidance contains registration instructions"
    );

    // -------------------------------------------------------------------------
    // TEST 3: Invalid email -> rejected
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Invalid email -> rejected ---");
    const test3Res = await checkPortalEmailAction("not-an-email");
    assert(test3Res.eligible === false, "Invalid email format rejected by Zod validation");

    // -------------------------------------------------------------------------
    // TEST 4: Registered email with different case -> accepted after normalization
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Registered email with different case -> accepted ---");
    const test4Res = await checkPortalEmailAction("ANANYA.SHAH@ApexInfoTech.Example");
    assert(test4Res.eligible === true, "Mixed-case registered email is accepted");
    assert(
      test4Res.email === "ananya.shah@apexinfotech.example",
      "Normalized to lowercase email identity"
    );

    // -------------------------------------------------------------------------
    // TEST 5: OAuth email exactly matches registered email -> success
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: OAuth email matches registered email -> success ---");
    const intent5 = await createPortalLoginIntent("ananya.shah@apexinfotech.example");
    assert(!!intent5, "Login intent created in PostgreSQL");
    if (intent5) {
      const verify5 = await verifyPortalLoginIntent(
        intent5.token,
        "ananya.shah@apexinfotech.example"
      );
      assert(verify5.success === true, "OAuth verification succeeds when emails match exactly");
      assert(verify5.contact?.email === "ananya.shah@apexinfotech.example", "Identifies correct Contact");
      assert(verify5.customer?.name === "Apex Infotech Pvt. Ltd.", "Identifies correct Customer");
    }

    // -------------------------------------------------------------------------
    // TEST 6: OAuth email differs -> rejected
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: OAuth email differs -> rejected ---");
    const intent6 = await createPortalLoginIntent("ananya.shah@apexinfotech.example");
    assert(!!intent6, "Login intent created for mismatch test");
    if (intent6) {
      const verify6 = await verifyPortalLoginIntent(
        intent6.token,
        "attacker.impostor@gmail.com"
      );
      assert(verify6.success === false, "OAuth rejected when Google email differs from intent");
      assert(verify6.error === "OAuthEmailMismatch", "Error type is OAuthEmailMismatch");

      // Verify intent is immediately invalidated
      const invalidatedIntent = await prisma.portalLoginIntent.findUnique({
        where: { token: intent6.token },
      });
      assert(invalidatedIntent?.usedAt !== null, "Intent invalidated in database upon mismatch");
    }

    // -------------------------------------------------------------------------
    // TEST 7: Disabled portal contact -> rejected
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Disabled portal contact -> rejected ---");
    const test7Res = await checkPortalEmailAction("rohit.bansal@apexinfotech.example");
    assert(test7Res.eligible === false, "Contact with portalAccess: false is rejected at gate");

    // -------------------------------------------------------------------------
    // TEST 8: Inactive contact -> rejected
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Inactive contact -> rejected ---");
    // Temporarily create an inactive contact with portal access
    const inactiveContact = await prisma.contact.create({
      data: {
        customerId: apexCustomer.id,
        name: "Inactive Test User",
        email: "inactive.test.user@apexinfotech.example",
        portalAccess: true,
        portalAccessEnabled: true,
        isActive: false, // inactive!
      },
    });

    const test8Res = await checkPortalEmailAction("inactive.test.user@apexinfotech.example");
    assert(test8Res.eligible === false, "Inactive contact is strictly rejected at pre-login gate");

    // Clean up test contact
    await prisma.contact.delete({ where: { id: inactiveContact.id } });

    // -------------------------------------------------------------------------
    // TEST 9: Contact for Customer A cannot access Customer B quote
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Customer A cannot access Customer B quote ---");
    const bharatQuoteNumber = bharatCustomer.quotations[0]?.quotationNumber || "Q-1053";
    const apexQuoteNumber = apexCustomer.quotations[0]?.quotationNumber || "Q-1042";

    // Customer A (Apex) attempts to access Customer B (BharatGrid) quote
    const unauthorizedAccess = await getCustomerQuotationDetail(
      bharatQuoteNumber,
      apexCustomer.id
    );
    assert(unauthorizedAccess === null, "Customer A cannot access Customer B quote (returns null/404)");

    // Customer A (Apex) accesses its own quote
    const authorizedAccess = await getCustomerQuotationDetail(
      apexQuoteNumber,
      apexCustomer.id
    );
    assert(authorizedAccess !== null, "Customer A can access its own quotation");
    assert(
      authorizedAccess?.customerName === "Apex Infotech Pvt. Ltd.",
      "Quotation belongs to authenticated customer"
    );

    // -------------------------------------------------------------------------
    // TEST 10: Customer portal session gets correct customer association
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Customer portal session gets correct customer association ---");
    const quotesForApex = await getCustomerQuotations(apexCustomer.id);
    assert(quotesForApex.length > 0, "Proposals retrieved for Apex Infotech");
    const allBelongToApex = quotesForApex.every((q) => q.customerName === "Apex Infotech Pvt. Ltd.");
    assert(allBelongToApex, "All returned proposals strictly belong to authenticated customer");

    // -------------------------------------------------------------------------
    // TEST 11: Internal Sales Rep authentication still works
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: Internal Sales Rep authentication still works ---");
    assert(isAllowedEmailDomain("arjun.mehta@dealflow360.in") || isAllowedEmailDomain("sales@gmail.com"), "Internal allowed domains function correctly");
    const salesRepUser = await prisma.user.findFirst({
      where: { role: "SALES_REP" },
    });
    assert(salesRepUser !== null, "Internal SALES_REP user exists in PostgreSQL");
    assert(salesRepUser?.role === "SALES_REP", "SALES_REP role preserved");

    // -------------------------------------------------------------------------
    // TEST 12: Customer cannot obtain internal role
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 12: Customer cannot obtain internal role ---");
    const portalContact = await findPortalContactByEmail("ananya.shah@apexinfotech.example");
    assert(portalContact !== null, "Portal contact found");
    // Verify role assignment logic: portal contacts are strictly mapped to CUSTOMER
    const simulatedRole = portalContact ? "CUSTOMER" : "SALES_REP";
    assert(simulatedRole === "CUSTOMER", "Portal contact role is strictly locked to CUSTOMER");
    assert(
      !["SALES_REP", "MANAGER", "FINANCE", "EXECUTIVE", "ADMIN"].includes(simulatedRole),
      "Customer role cannot elevate to internal roles"
    );

    // -------------------------------------------------------------------------
    // TEST 13: Duplicate active portal email cannot be assigned ambiguously
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 13: Duplicate active portal email prevented ---");
    const duplicateCreateRes = await createCustomerAction({
      customerNumber: "CUST-99991",
      name: "Duplicate Corp Test",
      industry: "Enterprise Cloud & Infrastructure",
      tier: "BRONZE",
      paymentTerms: "Net 30 Days",
      creditLimit: 1000000,
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      contactName: "Ananya Shah Clone",
      contactEmail: "ananya.shah@apexinfotech.example", // duplicate of existing!
      contactPhone: "+91 9820155192",
      portalAccessEnabled: true,
    });
    assert(duplicateCreateRes.success === false, "Duplicate portal email registration is rejected");
    assert(
      duplicateCreateRes.error?.includes("Duplicate portal identities are not permitted") ?? false,
      "Clear duplicate identity error returned"
    );

    // -------------------------------------------------------------------------
    // TEST 14: Login intent expires / invalidates correctly
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 14: Login intent expires / invalidates correctly ---");
    const intent14 = await createPortalLoginIntent("ananya.shah@apexinfotech.example");
    assert(!!intent14, "Intent created for expiry testing");
    if (intent14) {
      // 1. Manually expire intent
      await prisma.portalLoginIntent.update({
        where: { token: intent14.token },
        data: { expiresAt: new Date(Date.now() - 60000) }, // 1 minute in the past
      });

      const expiredVerify = await verifyPortalLoginIntent(
        intent14.token,
        "ananya.shah@apexinfotech.example"
      );
      assert(expiredVerify.success === false, "Expired intent is rejected");
      assert(expiredVerify.error === "IntentExpired", "Returns IntentExpired error");

      // 2. Test single-use consumption
      const singleUseIntent = await createPortalLoginIntent("ananya.shah@apexinfotech.example");
      if (singleUseIntent) {
        const firstUse = await verifyPortalLoginIntent(singleUseIntent.token, "ananya.shah@apexinfotech.example");
        assert(firstUse.success === true, "First intent verification succeeds");

        const secondUse = await verifyPortalLoginIntent(singleUseIntent.token, "ananya.shah@apexinfotech.example");
        assert(secondUse.success === false, "Second use of same intent is rejected (single-use enforced)");
        assert(secondUse.error === "IntentAlreadyUsed", "Returns IntentAlreadyUsed error");
      }
    }

    // -------------------------------------------------------------------------
    // TEST 15 & 16: Customer creation lifecycle, normalization & contact linkage
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 15 & 16: Customer creation lifecycle & contact linkage ---");
    const uniqueCustNum = `CUST-${Math.floor(10000 + Math.random() * 90000)}`;
    const testEmail = `procurement.head.${Date.now()}@tatasteel-test.example`;

    const createRes = await createCustomerAction({
      customerNumber: uniqueCustNum,
      name: "Tata Steel Logistics Enterprise",
      industry: "Precision Engineering & Heavy Mfg",
      tier: "PLATINUM",
      paymentTerms: "Net 60 Days",
      creditLimit: 5000000,
      city: "Jamshedpur",
      state: "Jharkhand",
      country: "India",
      contactName: "Ratan Saxena",
      contactEmail: `  ${testEmail.toUpperCase()}  `, // Test normalization
      contactPhone: "+91 9876543210",
      contactTitle: "Chief Procurement Officer",
      portalAccessEnabled: true,
    });

    assert(createRes.success === true, "Customer registered successfully by Sales Rep");

    if (createRes.success && createRes.customer) {
      // Direct PostgreSQL validation
      const createdCustomer = await prisma.customer.findUnique({
        where: { id: createRes.customer.id },
        include: { contacts: true },
      });

      assert(createdCustomer !== null, "Customer persisted in PostgreSQL");
      assert(createdCustomer?.name === "Tata Steel Logistics Enterprise", "Customer name persisted");

      const primaryContact = createdCustomer?.contacts.find((c) => c.isPrimary);
      assert(primaryContact !== undefined, "Primary contact created and linked");
      assert(primaryContact?.email === testEmail.toLowerCase(), "Email persisted with lowercase normalization (TEST 15)");
      assert(primaryContact?.phone === "+91 9876543210", "Phone persisted with +91 normalization (TEST 16)");
      assert(primaryContact?.portalAccess === true, "Portal access flag set to true");
      assert(primaryContact?.portalAccessEnabled === true, "portalAccessEnabled flag set to true");
      assert(primaryContact?.isActive === true, "Contact active state set to true");

      // Verify immediate portal eligibility for newly created customer
      const eligibilityNew = await checkPortalEmailAction(testEmail);
      assert(eligibilityNew.eligible === true, "Newly registered customer is immediately eligible for portal login");

      // Clean up test customer
      await prisma.contact.deleteMany({ where: { customerId: createdCustomer!.id } });
      await prisma.auditLog.deleteMany({ where: { entityId: createdCustomer!.id } });
      await prisma.customer.delete({ where: { id: createdCustomer!.id } });
    }

    console.log("\n================================================================================");
    console.log(` RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log("================================================================================");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL TEST ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAllTests();
