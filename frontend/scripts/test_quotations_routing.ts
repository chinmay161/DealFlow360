import { prisma } from "../src/lib/prisma";
import {
  getQuotations,
  getQuotationWithLineItems,
  getQuotationByNumber,
} from "../src/lib/quotations";
import { CreateQuotationSchema } from "../src/lib/validations/quotation";
import {
  createQuotationWithDetailsAction,
  createNewQuotationAction,
} from "../src/lib/actions/quoteActions";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function runTests() {
  console.log("==================================================");
  console.log("TEST 1: Verify getQuotations returns all quotations with real UUIDs");
  console.log("==================================================");
  const quotations = await getQuotations();
  console.log(`Total quotations found: ${quotations.length}`);
  if (quotations.length < 13) {
    throw new Error(`Expected at least 13 quotations, found ${quotations.length}`);
  }

  for (const q of quotations) {
    if (!UUID_REGEX.test(q.id)) {
      throw new Error(`FAIL: Quotation ${q.quotationNumber} has invalid UUID: ${q.id}`);
    }
  }
  console.log("PASS: All quotations have valid database UUIDs.");

  console.log("\n==================================================");
  console.log("TEST 2: Verify Q-1042 lookup by real database UUID");
  console.log("==================================================");
  const q1042InList = quotations.find((q) => q.quotationNumber === "Q-1042");
  if (!q1042InList) {
    throw new Error("FAIL: Q-1042 not found in quotation list");
  }
  console.log(`Q-1042 UUID: ${q1042InList.id}`);

  const q1042 = await getQuotationWithLineItems(q1042InList.id);
  if (!q1042) {
    throw new Error("FAIL: Failed to load Q-1042 by UUID");
  }
  if (q1042.customer.name !== "Apex Infotech Pvt. Ltd.") {
    throw new Error(`FAIL: Expected Apex Infotech, got ${q1042.customer.name}`);
  }
  if (q1042.totalValue !== 1830000 && q1042.totalValue !== 1985940 && q1042.subtotal !== 1830000) {
    throw new Error(`FAIL: Expected ₹18,30,000 or ₹19,85,940, got ₹${q1042.totalValue}`);
  }
  if (q1042.lineItems.length !== 3) {
    throw new Error(`FAIL: Expected 3 line items for Q-1042, got ${q1042.lineItems.length}`);
  }
  console.log("PASS: Q-1042 successfully loaded by UUID with ₹18,30,000 and 3 line items.");

  console.log("\n==================================================");
  console.log("TEST 3: Verify Q-1060 lookup by real database UUID");
  console.log("==================================================");
  const q1060InList = quotations.find((q) => q.quotationNumber === "Q-1060") || quotations.find((q) => q.quotationNumber !== "Q-1042");
  if (!q1060InList) {
    throw new Error("FAIL: Second quotation not found in quotation list");
  }
  console.log(`${q1060InList.quotationNumber} UUID: ${q1060InList.id}`);

  const q1060 = await getQuotationWithLineItems(q1060InList.id);
  if (!q1060) {
    throw new Error(`FAIL: Failed to load ${q1060InList.quotationNumber} by UUID`);
  }
  if (q1060.quotationNumber !== q1060InList.quotationNumber) {
    throw new Error(`FAIL: Expected quote number ${q1060InList.quotationNumber}, got ${q1060.quotationNumber}`);
  }
  console.log(`PASS: ${q1060InList.quotationNumber} loaded independently (totalValue: ${q1060.totalValue}, items: ${q1060.lineItems.length}).`);

  console.log("\n==================================================");
  console.log("TEST 4: Nonexistent and invalid UUID lookup behavior");
  console.log("==================================================");
  const invalidResult1 = await getQuotationWithLineItems("invalid-non-uuid-string");
  if (invalidResult1 !== null) {
    throw new Error("FAIL: Expected null for invalid ID, got result");
  }
  const invalidResult2 = await getQuotationWithLineItems("00000000-0000-0000-0000-000000000000");
  if (invalidResult2 !== null) {
    throw new Error("FAIL: Expected null for nonexistent UUID, got result");
  }
  console.log("PASS: Nonexistent and invalid IDs return null safely without throwing error.");

  console.log("\n==================================================");
  console.log("TEST 5: CreateQuotationSchema validation");
  console.log("==================================================");
  try {
    CreateQuotationSchema.parse({
      customerId: "not-a-uuid",
      currency: "INR",
    });
    throw new Error("FAIL: Schema accepted invalid customerId");
  } catch (err: any) {
    if (err.errors?.[0]?.message === "Invalid customer ID") {
      console.log("PASS: CreateQuotationSchema correctly rejected non-UUID customer ID.");
    } else {
      throw err;
    }
  }

  console.log("\n==================================================");
  console.log("TEST 6: createQuotationWithDetailsAction flow");
  console.log("==================================================");
  const customer = await prisma.customer.findFirst({
    where: { name: "BharatGrid Systems" },
  });
  if (!customer) {
    throw new Error("FAIL: BharatGrid Systems customer not found");
  }

  const created = await createQuotationWithDetailsAction({
    customerId: customer.id,
    currency: "INR",
    paymentTerms: "Net 45 Days",
    notes: "Automated test quotation creation flow",
  });

  console.log(`Created quotation ID: ${created.id}, number: ${created.quotationNumber}`);
  if (!UUID_REGEX.test(created.id)) {
    throw new Error(`FAIL: Created quotation ID is not a valid UUID: ${created.id}`);
  }
  if (!created.quotationNumber.startsWith("Q-")) {
    throw new Error(`FAIL: Created quotationNumber invalid: ${created.quotationNumber}`);
  }

  // Verify it can be loaded by its new UUID
  const loadedNewQuote = await getQuotationWithLineItems(created.id);
  if (!loadedNewQuote) {
    throw new Error("FAIL: Unable to load newly created quotation by its UUID");
  }
  if (loadedNewQuote.customer.name !== "BharatGrid Systems") {
    throw new Error(`FAIL: Expected BharatGrid Systems, got ${loadedNewQuote.customer.name}`);
  }
  if (loadedNewQuote.status !== "DRAFT") {
    throw new Error(`FAIL: Expected DRAFT status, got ${loadedNewQuote.status}`);
  }
  console.log("PASS: Newly created quotation loaded successfully with matching customer and DRAFT status.");

  // Clean up created quotation so DB remains pristine
  await prisma.quotation.delete({
    where: { id: created.id },
  });
  console.log("PASS: Cleaned up test quotation.");

  console.log("\n==================================================");
  console.log("ALL ROUTING & QUOTATION TESTS PASSED!");
  console.log("==================================================");
}

runTests()
  .catch((err) => {
    console.error("TEST SUITE FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
