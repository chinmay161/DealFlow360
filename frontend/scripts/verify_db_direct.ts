import { prisma } from "../src/lib/prisma";

async function verifyDbDirect() {
  console.log("================================================================================");
  console.log(" DIRECT POSTGRESQL DATABASE VERIFICATION");
  console.log("================================================================================\n");

  // 1. Customers & Contacts
  const customers = await prisma.customer.findMany({
    include: { contacts: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total Customers in PostgreSQL: ${customers.length}`);
  for (const c of customers) {
    console.log(`\nCustomer: ${c.name} [${c.customerNumber || "NO_NUM"}] (ID: ${c.id})`);
    console.log(`  Territory: ${c.territory || "N/A"} | Tier: ${c.tier}`);
    for (const cnt of c.contacts) {
      console.log(`  └─ Contact: ${cnt.name}`);
      console.log(`     - Email: ${cnt.email}`);
      console.log(`     - Phone: ${cnt.phone || "N/A"}`);
      console.log(`     - Portal Access (legacy): ${cnt.portalAccess}`);
      console.log(`     - Portal Access (dedicated): ${cnt.portalAccessEnabled}`);
      console.log(`     - Active State: ${cnt.isActive}`);
      console.log(`     - Primary: ${cnt.isPrimary}`);
      console.log(`     - Customer Association: ${cnt.customerId === c.id ? "VALID" : "INVALID"}`);
    }
  }

  // 2. Unique Constraints & Indexes
  console.log("\n--- Indexes on Contact Table in PostgreSQL ---");
  const indexes: any = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE lower(tablename) = 'contact';
  `;
  console.log(JSON.stringify(indexes, null, 2));

  // 3. PortalLoginIntent Table
  console.log("\n--- PortalLoginIntent Table in PostgreSQL ---");
  const intentCount = await prisma.portalLoginIntent.count();
  console.log(`Total PortalLoginIntent records: ${intentCount}`);
  const recentIntents = await prisma.portalLoginIntent.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
  });
  console.log("Recent Intents Sample:", JSON.stringify(recentIntents, null, 2));

  // 4. Seed Customer Apex Infotech check
  console.log("\n--- Seed Customer Apex Infotech Verification ---");
  const apex = await prisma.customer.findFirst({
    where: { name: "Apex Infotech Pvt. Ltd." },
    include: { contacts: true },
  });
  const ananya = apex?.contacts.find((c) => c.email === "ananya.shah@apexinfotech.example");
  console.log(`Apex Customer Found: ${apex ? "YES" : "NO"}`);
  console.log(`Ananya Shah Portal Contact Found: ${ananya ? "YES" : "NO"}`);
  console.log(`  - Portal Access Enabled: ${ananya?.portalAccess && ananya?.portalAccessEnabled ? "YES" : "NO"}`);
  console.log(`  - Active Contact: ${ananya?.isActive ? "YES" : "NO"}`);

  console.log("\n================================================================================");
  console.log(" DIRECT POSTGRESQL DATABASE VERIFICATION COMPLETE");
  console.log("================================================================================");
}

verifyDbDirect()
  .catch((err) => {
    console.error("Direct verification error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
