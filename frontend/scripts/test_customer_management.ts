import { prisma } from "../src/lib/prisma";
import { getNextCustomerNumber, createCustomerAction } from "../src/lib/actions/customerActions";
import { getCustomersAction } from "../src/lib/actions/lookupActions";
import { getQuotations, getQuotationByNumber } from "../src/lib/quotations";

async function main() {
  console.log("==================================================================");
  console.log("DEALFLOW360 CUSTOMER MANAGEMENT VERIFICATION SUITE");
  console.log("==================================================================");

  // 1. Verify Top 5 Retained Indian Accounts
  console.log("\n[TEST 1] Verifying Top 5 Retained Indian Accounts...");
  const customers = await prisma.customer.findMany({
    orderBy: { customerNumber: "asc" },
    include: { contacts: true },
  });

  console.log(`Found ${customers.length} customers in database:`);
  for (const c of customers) {
    console.log(`  • ${c.customerNumber}: ${c.name} (${c.city}, ${c.state}) [Tier: ${c.tier}]`);
  }

  if (customers.length !== 5) {
    throw new Error(`Expected exactly 5 customers, but found ${customers.length}`);
  }

  const expectedNumbers = ["CUST-00001", "CUST-00002", "CUST-00003", "CUST-00004", "CUST-00005"];
  const actualNumbers = customers.map((c) => c.customerNumber);
  for (const exp of expectedNumbers) {
    if (!actualNumbers.includes(exp)) {
      throw new Error(`Expected customer number ${exp} was not found in database!`);
    }
  }
  console.log("✅ Top 5 Accounts verified with sequential CUST-00001 through CUST-00005.");

  // 2. Verify Apex Infotech and Canonical Q-1042 Data
  console.log("\n[TEST 2] Verifying Apex Infotech & Q-1042 Canonical Quotation...");
  const apex = customers.find((c) => c.customerNumber === "CUST-00001");
  if (!apex || !apex.name.includes("Apex Infotech")) {
    throw new Error("Apex Infotech (CUST-00001) not found!");
  }

  const q1042 = await getQuotationByNumber("Q-1042");
  if (!q1042) {
    throw new Error("Q-1042 quotation not found!");
  }

  console.log(`  Quotation: ${q1042.quotationNumber}`);
  console.log(`  Customer: ${q1042.customer.name} (Customer ID: ${q1042.customer.customerNumber})`);
  console.log(`  Risk Score: ${q1042.riskScore}`);
  console.log(`  Line Items Count: ${q1042.lineItems.length}`);
  console.log(`  Total Value: ₹${q1042.totalValue.toLocaleString("en-IN")}`);

  if (q1042.customer.customerNumber !== "CUST-00001") {
    throw new Error(`Expected Q-1042 customerNumber to be CUST-00001, got ${q1042.customer.customerNumber}`);
  }
  if (q1042.lineItems.length !== 3) {
    throw new Error(`Expected Q-1042 to have 3 line items, got ${q1042.lineItems.length}`);
  }
  if (q1042.riskScore !== 72) {
    throw new Error(`Expected Q-1042 risk score 72, got ${q1042.riskScore}`);
  }
  console.log("✅ Q-1042 data, line items, and risk score remain completely intact.");

  // 3. Test getNextCustomerNumber()
  console.log("\n[TEST 3] Testing getNextCustomerNumber()...");
  const nextNumber = await getNextCustomerNumber();
  console.log(`  Next generated customer number: ${nextNumber}`);
  if (nextNumber !== "CUST-00006") {
    throw new Error(`Expected next customer number to be CUST-00006, got ${nextNumber}`);
  }
  console.log("✅ Server-side Customer ID generator returned CUST-00006.");

  // 4. Test Customer Creation Flow via createCustomerAction
  console.log("\n[TEST 4] Testing createCustomerAction()...");
  const createResult = await createCustomerAction({
    customerNumber: nextNumber,
    name: "Tata Advanced Systems Ltd.",
    industry: "Government & Defence Technologies",
    tier: "GOLD",
    paymentTerms: "Net 45 Days",
    creditLimit: 25000000,
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    contactName: "Rajesh Nair",
    contactEmail: "r.nair@tataadvanced.example",
    contactPhone: "+91 9820044551",
    contactTitle: "VP Defence Procurement",
  });

  console.log("  Creation action response:", createResult);
  if (!createResult.success || !createResult.customer) {
    throw new Error(`createCustomerAction failed: ${createResult.error}`);
  }

  if (createResult.customer.customerNumber !== "CUST-00006") {
    throw new Error(`Expected created customer to have CUST-00006, got ${createResult.customer.customerNumber}`);
  }

  const createdId = createResult.customer.id;
  const subsequentNumber = await getNextCustomerNumber();
  console.log(`  Next customer number after creation: ${subsequentNumber}`);
  if (subsequentNumber !== "CUST-00007") {
    throw new Error(`Expected next customer number to be CUST-00007, got ${subsequentNumber}`);
  }
  console.log("✅ Customer created with primary contact and sequence advanced to CUST-00007.");

  // 5. Test lookupActions and Quotations queries with new customer
  console.log("\n[TEST 5] Testing getCustomersAction() & getQuotations()...");
  const lookupCustomers = await getCustomersAction();
  console.log(`  getCustomersAction returned ${lookupCustomers.length} customers.`);
  const foundNew = lookupCustomers.find((c) => c.id === createdId);
  if (!foundNew || foundNew.customerNumber !== "CUST-00006") {
    throw new Error("Created customer not found in lookup list!");
  }
  console.log(`  Found new customer in lookup: ${foundNew.name} (${foundNew.customerNumber}, ${foundNew.city}, ${foundNew.state})`);

  const allQuotes = await getQuotations();
  console.log(`  getQuotations returned ${allQuotes.length} quotations.`);
  for (const q of allQuotes) {
    if (!q.customer.customerNumber) {
      throw new Error(`Quotation ${q.quotationNumber} is missing customerNumber!`);
    }
  }
  console.log("✅ All quotations contain populated customerNumber.");

  // 6. Clean up test customer so seed state is preserved
  console.log("\n[TEST 6] Cleaning up test customer...");
  await prisma.contact.deleteMany({ where: { customerId: createdId } });
  await prisma.customer.delete({ where: { id: createdId } });

  const finalCount = await prisma.customer.count();
  console.log(`  Final customer count in DB: ${finalCount}`);
  if (finalCount !== 5) {
    throw new Error(`Expected exactly 5 customers after cleanup, got ${finalCount}`);
  }
  console.log("✅ Test customer cleaned up. Seed state restored to exactly 5 accounts.");

  console.log("\n==================================================================");
  console.log("🎉 ALL CUSTOMER MANAGEMENT TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

main()
  .catch((err) => {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
