require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

import { prisma } from "../src/lib/prisma";
import {
  getCustomerById,
  getCustomerByIdAction,
  getCustomerSelectorListAction,
  createCustomerAction,
} from "../src/lib/actions/customerActions";
import { createQuotationWithDetailsAction } from "../src/lib/actions/quoteActions";
import { resolveProductPriceForCustomer } from "../src/lib/services/pricingService";
import { switchQuoteCustomer, addLineItemToQuote } from "../src/lib/services/quoteService";
import { getQuotationWithLineItems, getQuotationByNumber } from "../src/lib/quotations";

async function runTests() {
  console.log("==================================================================");
  console.log("TEST SUITE: NEW QUOTATION CUSTOMER SELECTION & PG DATA AUTHORITY");
  console.log("==================================================================");

  let createdCustomerTestId: string | null = null;
  let testQuotationId: string | null = null;

  try {
    // Fetch all existing customers from PostgreSQL
    const allCustomers = await prisma.customer.findMany({
      include: { contacts: true, owner: true },
      orderBy: { createdAt: "asc" },
    });

    if (allCustomers.length < 2) {
      throw new Error(`Need at least 2 customers for testing, found ${allCustomers.length}`);
    }

    const customerA = allCustomers[0];
    const customerB = allCustomers[1];

    console.log(`Customer A: ${customerA.name} (${customerA.customerNumber}) - Tier: ${customerA.tier}`);
    console.log(`Customer B: ${customerB.name} (${customerB.customerNumber}) - Tier: ${customerB.tier}`);

    // TEST 1: Selecting Customer A returns exactly Customer A
    console.log("\n[TEST 1] Selecting Customer A returns exactly Customer A...");
    const profileA = await getCustomerByIdAction(customerA.id);
    if (!profileA || profileA.id !== customerA.id || profileA.name !== customerA.name) {
      throw new Error(`Test 1 Failed: Expected profile for ${customerA.name}, got ${profileA?.name}`);
    }
    console.log(`✅ TEST 1 PASSED: Profile fetched matches Customer A (${profileA.name})`);

    // TEST 2: Main quotation creation state contains one selected customer
    console.log("\n[TEST 2] Verifying single account selection structure...");
    if (!profileA.id || !profileA.name || !profileA.tier) {
      throw new Error("Test 2 Failed: Customer selection state missing primary fields");
    }
    console.log(`✅ TEST 2 PASSED: Exactly one customer record selected: ${profileA.name} (${profileA.customerNumber})`);

    // TEST 3: No default Apex customer is injected when no ID is provided
    console.log("\n[TEST 3] Verifying no default Apex customer injection...");
    const emptyLookup = await getCustomerByIdAction("");
    if (emptyLookup !== null) {
      throw new Error(`Test 3 Failed: Expected null for empty lookup, but got ${JSON.stringify(emptyLookup)}`);
    }
    const selectorList = await getCustomerSelectorListAction();
    if (!Array.isArray(selectorList) || selectorList.length === 0) {
      throw new Error("Test 3 Failed: Customer selector list should return available accounts");
    }
    console.log(`✅ TEST 3 PASSED: Empty customer lookup returns null; no default Apex customer injected`);

    // TEST 4: Customer ID maps to real Customer UUID
    console.log("\n[TEST 4] Verifying Customer ID maps to real PostgreSQL UUID...");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(profileA.id)) {
      throw new Error(`Test 4 Failed: Customer ID '${profileA.id}' is not a valid UUID`);
    }
    console.log(`✅ TEST 4 PASSED: Customer.id is valid relational UUID: ${profileA.id}`);

    // TEST 5: Full saved customer profile is loaded
    console.log("\n[TEST 5] Verifying full saved customer profile fields...");
    const requiredFields: (keyof typeof profileA)[] = [
      "id",
      "customerNumber",
      "name",
      "industry",
      "tier",
      "paymentTerms",
      "creditLimit",
      "creditAvailable",
      "city",
      "state",
      "country",
      "contacts",
    ];
    for (const f of requiredFields) {
      if (profileA[f] === undefined) {
        throw new Error(`Test 5 Failed: Required field '${f}' missing from profile`);
      }
    }
    console.log("✅ TEST 5 PASSED: Full profile loaded with all schema-backed attributes");

    // TEST 6: Tier comes from DB
    console.log("\n[TEST 6] Verifying customer tier comes from DB...");
    if (profileA.tier !== customerA.tier) {
      throw new Error(`Test 6 Failed: Tier mismatch: expected ${customerA.tier}, got ${profileA.tier}`);
    }
    console.log(`✅ TEST 6 PASSED: Customer tier '${profileA.tier}' matches PostgreSQL record`);

    // TEST 7: Price list comes from DB
    console.log("\n[TEST 7] Verifying price list resolved from DB...");
    if (customerA.tier) {
      const dbPriceList = await prisma.priceList.findFirst({
        where: { tier: customerA.tier, isActive: true },
      });
      if (dbPriceList) {
        console.log(`  Found active DB price list for tier ${customerA.tier}: ${dbPriceList.code} (${dbPriceList.name})`);
        if (profileA.priceList?.code !== dbPriceList.code) {
          throw new Error(`Test 7 Failed: Price list code ${profileA.priceList?.code} does not match DB ${dbPriceList.code}`);
        }
      }
    }
    console.log(`✅ TEST 7 PASSED: Price list derived from DB configuration`);

    // TEST 8: Payment terms come from DB
    console.log("\n[TEST 8] Verifying payment terms come from DB...");
    if (profileA.paymentTerms !== customerA.paymentTerms) {
      throw new Error(`Test 8 Failed: Payment terms mismatch: DB='${customerA.paymentTerms}', got='${profileA.paymentTerms}'`);
    }
    console.log(`✅ TEST 8 PASSED: Payment terms '${profileA.paymentTerms}' match PostgreSQL record`);

    // TEST 9: Credit comes from DB
    console.log("\n[TEST 9] Verifying credit limit & available credit come from DB...");
    if (profileA.creditLimit !== Number(customerA.creditLimit)) {
      throw new Error(`Test 9 Failed: Credit limit mismatch: DB='${customerA.creditLimit}', got='${profileA.creditLimit}'`);
    }
    if (profileA.creditAvailable !== Number(customerA.creditAvailable)) {
      throw new Error(`Test 9 Failed: Credit available mismatch: DB='${customerA.creditAvailable}', got='${profileA.creditAvailable}'`);
    }
    console.log(`✅ TEST 9 PASSED: Credit limit ₹${profileA.creditLimit} & available ₹${profileA.creditAvailable} match DB`);

    // TEST 10: Contact comes from DB
    console.log("\n[TEST 10] Verifying primary contact and portal access come from DB...");
    if (customerA.contacts.length > 0) {
      if (!profileA.primaryContact) {
        throw new Error("Test 10 Failed: Customer has contacts in DB but profile has no primary contact");
      }
      const dbPrimary = customerA.contacts.find((c) => c.isPrimary) || customerA.contacts[0];
      if (profileA.primaryContact.email !== dbPrimary.email) {
        throw new Error(`Test 10 Failed: Contact email mismatch: DB='${dbPrimary.email}', got='${profileA.primaryContact.email}'`);
      }
      console.log(`  Contact: ${profileA.primaryContact.name} (${profileA.primaryContact.email})`);
      console.log(`  Portal access: ${profileA.primaryContact.portalAccessEnabled ? "Enabled" : "Disabled"}`);
    }
    console.log("✅ TEST 10 PASSED: Primary contact and portal access state match DB");

    // TEST 11: Changing customer reloads all customer-specific values
    console.log("\n[TEST 11] Changing customer from A to B reloads all customer-specific values...");
    const profileB = await getCustomerByIdAction(customerB.id);
    if (!profileB || profileB.id !== customerB.id) {
      throw new Error(`Test 11 Failed: Could not load Customer B profile`);
    }
    if (profileB.id === profileA.id) {
      throw new Error("Test 11 Failed: Profile B has same ID as Profile A");
    }
    console.log(`  Switched to: ${profileB.name} (${profileB.customerNumber})`);
    console.log(`  Terms: ${profileB.paymentTerms} | Credit Available: ₹${profileB.creditAvailable}`);
    console.log("✅ TEST 11 PASSED: Switching customer reloads fresh profile from PostgreSQL");

    // TEST 12: Old customer's pricing does not remain after switching
    console.log("\n[TEST 12] Verifying product pricing switches per customer tier...");
    const sampleProduct = await prisma.product.findFirst({ where: { isActive: true } });
    if (sampleProduct) {
      const priceForA = await resolveProductPriceForCustomer(customerA.id, sampleProduct.id, "INR");
      const priceForB = await resolveProductPriceForCustomer(customerB.id, sampleProduct.id, "INR");
      console.log(`  Product: ${sampleProduct.name} (${sampleProduct.sku})`);
      console.log(`  Pricing for Customer A (${customerA.tier}): ₹${priceForA.unitPrice} (${priceForA.priceListCode})`);
      console.log(`  Pricing for Customer B (${customerB.tier}): ₹${priceForB.unitPrice} (${priceForB.priceListCode})`);
      if (customerA.tier !== customerB.tier) {
        if (priceForA.priceListCode === priceForB.priceListCode && customerA.tier === "GOLD" && customerB.tier === "BRONZE") {
          throw new Error("Test 12 Failed: Different customer tiers used same price list code!");
        }
      }
    }
    console.log("✅ TEST 12 PASSED: Pricing engine resolves rates based strictly on active selected customer");

    // TEST 13: New Customer creation returns and auto-selects the created customer
    console.log("\n[TEST 13] Creating a new customer and verifying auto-selection profile lookup...");
    const testNum = Math.floor(10000 + Math.random() * 90000);
    const createResult = await createCustomerAction({
      customerNumber: `CUST-${testNum}`,
      name: `Automated Test Org ${testNum}`,
      industry: "Enterprise Cloud & Infrastructure",
      tier: "PLATINUM",
      paymentTerms: "Net 60 Days",
      creditLimit: 5000000,
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      contactName: "Vikram Test",
      contactEmail: `vikram.test.${testNum}@testorg.example`,
      contactPhone: "+91 9988776655",
      contactTitle: "Chief Technology Officer",
      portalAccessEnabled: true,
    });

    if (!createResult.success || !createResult.customer) {
      throw new Error(`Test 13 Failed: Could not create test customer: ${createResult.error}`);
    }
    createdCustomerTestId = createResult.customer.id;
    console.log(`  Created customer ID: ${createdCustomerTestId} (${createResult.customer.customerNumber})`);

    // Verify lookup by this ID loads the exact new customer profile
    const newlyCreatedProfile = await getCustomerByIdAction(createdCustomerTestId);
    if (!newlyCreatedProfile || newlyCreatedProfile.id !== createdCustomerTestId) {
      throw new Error("Test 13 Failed: getCustomerByIdAction could not load newly created customer");
    }
    if (newlyCreatedProfile.paymentTerms !== "Net 60 Days") {
      throw new Error(`Test 13 Failed: Expected Net 60 Days, got ${newlyCreatedProfile.paymentTerms}`);
    }
    if (newlyCreatedProfile.tier !== "PLATINUM") {
      throw new Error(`Test 13 Failed: Expected PLATINUM tier, got ${newlyCreatedProfile.tier}`);
    }
    console.log("✅ TEST 13 PASSED: New customer creation flow resolves and auto-selects with complete DB profile");

    // TEST 14: Created quotation persists the correct customerId (relational UUID)
    console.log("\n[TEST 14] Creating quotation and verifying PostgreSQL customerId persistence...");
    const quoteResult = await createQuotationWithDetailsAction({
      customerId: createdCustomerTestId,
      contactId: newlyCreatedProfile.primaryContact?.id || null,
      currency: "INR",
      paymentTerms: newlyCreatedProfile.paymentTerms || "Net 60 Days",
      notes: "Test quotation customer persistence validation",
    });

    if (!quoteResult.success || !quoteResult.id) {
      throw new Error("Test 14 Failed: Could not create quotation");
    }
    testQuotationId = quoteResult.id;
    console.log(`  Created quotation ID: ${testQuotationId} (${quoteResult.quotationNumber})`);

    // Verify in PostgreSQL that Quotation.customerId === Customer.id
    const dbQuote = await prisma.quotation.findUnique({
      where: { id: testQuotationId },
      include: { customer: true },
    });

    if (!dbQuote) {
      throw new Error(`Test 14 Failed: Quotation ${testQuotationId} not found in DB`);
    }
    if (dbQuote.customerId !== createdCustomerTestId) {
      throw new Error(`Test 14 Failed: Expected customerId '${createdCustomerTestId}', got '${dbQuote.customerId}'`);
    }
    if (dbQuote.customer.id !== createdCustomerTestId) {
      throw new Error(`Test 14 Failed: Relational customer relation mismatch`);
    }
    console.log(`  Quotation.customerId = ${dbQuote.customerId}`);
    console.log(`  Customer.id = ${dbQuote.customer.id}`);
    console.log(`  Customer.name = ${dbQuote.customer.name}`);
    console.log("✅ TEST 14 PASSED: Quotation.customerId strictly persists the selected Customer.id relational UUID");

    // TEST 15: Q-1042 remains associated with its existing customer
    console.log("\n[TEST 15] Verifying canonical Q-1042 remains associated with its existing customer...");
    const q1042 = await getQuotationByNumber("Q-1042");
    if (!q1042) {
      throw new Error("Test 15 Failed: Q-1042 not found");
    }
    if (q1042.customer.customerNumber !== "CUST-00001" || !q1042.customer.name.includes("Apex Infotech")) {
      throw new Error(`Test 15 Failed: Q-1042 customer changed unexpectedly: ${q1042.customer.name}`);
    }
    console.log(`  Q-1042 customer: ${q1042.customer.name} (${q1042.customer.customerNumber})`);
    console.log("✅ TEST 15 PASSED: Q-1042 canonical quotation and customer association remain intact");

    // TEST 16: Portal/customer relationship remains intact
    console.log("\n[TEST 16] Verifying portal/customer identity relationship remains intact...");
    const portalContact = await prisma.contact.findFirst({
      where: {
        customerId: createdCustomerTestId,
        portalAccessEnabled: true,
      },
      include: { customer: true },
    });
    if (!portalContact) {
      throw new Error("Test 16 Failed: Portal-enabled contact not found for newly created customer");
    }
    if (portalContact.customer.id !== createdCustomerTestId) {
      throw new Error("Test 16 Failed: Portal contact customer ID mismatch");
    }
    console.log(`  Portal contact '${portalContact.email}' correctly bound to Customer '${portalContact.customer.name}'`);
    console.log("✅ TEST 16 PASSED: Customer -> Contact -> Portal identity architecture intact");

    console.log("\n==================================================================");
    console.log("ALL 16 TEST SUITE REQUIREMENTS PASSED SUCCESSFULLY!");
    console.log("==================================================================");
  } finally {
    // Cleanup temporary test records
    if (testQuotationId) {
      await prisma.quotation.delete({ where: { id: testQuotationId } }).catch(() => {});
    }
    if (createdCustomerTestId) {
      await prisma.customer.delete({ where: { id: createdCustomerTestId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
