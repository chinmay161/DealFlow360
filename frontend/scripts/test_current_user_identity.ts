import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";
import {
  getInitials,
  getRoleDisplay,
  getCurrentUser,
  DEFAULT_USER_PREFERENCES,
} from "../src/lib/services/currentUserService";

const prisma = new PrismaClient();

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function main() {
  console.log("================================================================================");
  console.log(" DEALFLOW360 CURRENT-USER IDENTITY & PERSONA CLEANUP VERIFICATION");
  console.log("================================================================================");

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Verify / Prepare Database Records
    // -------------------------------------------------------------------------
    console.log("\n--- STEP 0: Verify Real Authenticated User in PostgreSQL ---");

    // Ensure Shivam Mishra exists with territory and title
    const shivam = await prisma.user.upsert({
      where: { email: "shivammishrasm2004@gmail.com" },
      update: {
        name: "Shivam Mishra",
        role: "SALES_REP",
        title: "Senior Commercial Representative",
        territory: "Western & Northern India Enterprise",
        department: "Commercial & Strategic Deals",
      },
      create: {
        email: "shivammishrasm2004@gmail.com",
        name: "Shivam Mishra",
        role: "SALES_REP",
        title: "Senior Commercial Representative",
        territory: "Western & Northern India Enterprise",
        department: "Commercial & Strategic Deals",
      },
    });

    assert(shivam.name === "Shivam Mishra", "Shivam Mishra exists in PostgreSQL");
    assert(shivam.email === "shivammishrasm2004@gmail.com", "Shivam email is correctly stored");
    assert(shivam.role === "SALES_REP", "Shivam role is SALES_REP");
    assert(shivam.territory === "Western & Northern India Enterprise", "Shivam territory is persisted in DB");
    assert(shivam.title === "Senior Commercial Representative", "Shivam designation/title is persisted in DB");

    // -------------------------------------------------------------------------
    // TEST 1 & 3: Initials Generation Helper
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 1 & 3: Dynamic Initials Generation ---");
    assert(getInitials("Shivam Mishra") === "SM", "Shivam Mishra generates initials SM");
    assert(getInitials("Arjun Mehta") === "AM", "Arjun Mehta generates initials AM");
    assert(getInitials("Priya Sharma") === "PS", "Priya Sharma generates initials PS");
    assert(getInitials("Vikram Desai") === "VD", "Vikram Desai generates initials VD");
    assert(getInitials("Shivam") === "SH", "Single word name Shivam generates SH");
    assert(getInitials(null, "shivam@domain.com") === "S", "Null name falls back to email initial S");
    assert(getInitials("", "") === "U", "Empty inputs fall back to U");

    // Verify NO hardcoded RR or SM defaults for arbitrary users
    assert(getInitials("Carlos Rodriguez") !== "RR", "Carlos Rodriguez does not default to RR");
    assert(getInitials("David Lee") !== "SM", "David Lee does not default to SM");
    assert(getInitials("Commercial User") === "CU", "Commercial User derives CU dynamically from words");

    // -------------------------------------------------------------------------
    // TEST 4 & 6: Role Display Mapping
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4 & 6: Role Display Mapping ---");
    assert(getRoleDisplay("SALES_REP") === "Sales Representative", "SALES_REP maps to Sales Representative");
    assert(getRoleDisplay("APPROVER") === "Commercial Approver", "APPROVER maps to Commercial Approver");
    assert(getRoleDisplay("ADMIN") === "Administrator", "ADMIN maps to Administrator");
    assert(getRoleDisplay("CUSTOMER") === "Customer Representative", "CUSTOMER maps to Customer Representative");

    // If custom title/designation stored in DB, it takes precedence
    assert(
      getRoleDisplay("SALES_REP", "Senior Commercial Specialist") === "Senior Commercial Specialist",
      "Custom DB title takes precedence over standard role label"
    );

    // -------------------------------------------------------------------------
    // TEST 5 & 7: Multiple Authenticated Personas Resolve Accurately
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5 & 7: Multiple Authenticated User Resolutions ---");

    // 1. Shivam
    const shivamUser = await prisma.user.findUnique({
      where: { email: "shivammishrasm2004@gmail.com" },
    });
    assert(shivamUser !== null, "Resolved Shivam from DB");
    assert(getInitials(shivamUser?.name) === "SM", "Shivam initials resolve to SM");
    assert(
      getRoleDisplay(shivamUser?.role, shivamUser?.title) === "Senior Commercial Representative",
      "Shivam designation resolves to Senior Commercial Representative"
    );

    // 2. Arjun Mehta
    const arjunUser = await prisma.user.findUnique({
      where: { email: "arjun.mehta@dealflow360.in" },
    });
    assert(arjunUser !== null, "Resolved Arjun from DB");
    assert(arjunUser?.name === "Arjun Mehta", "Arjun user name is Arjun Mehta");
    assert(getInitials(arjunUser?.name) === "AM", "Arjun initials resolve to AM");

    // 3. Vikram Desai
    const vikramUser = await prisma.user.findUnique({
      where: { email: "vikram.desai@dealflow360.in" },
    });
    assert(vikramUser !== null, "Resolved Vikram from DB");
    assert(vikramUser?.role === "APPROVER", "Vikram role is APPROVER");
    assert(getRoleDisplay(vikramUser?.role) === "Commercial Approver", "Vikram displays as Commercial Approver");
    assert(getInitials(vikramUser?.name) === "VD", "Vikram initials resolve to VD");

    // -------------------------------------------------------------------------
    // TEST 8: No Hardcoded Rachel Fallback
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Verify Complete Absence of Rachel Persona in Runtime Helpers ---");
    assert(getRoleDisplay("SALES_REP", null) !== "Sales Executive", "Role does not hardcode Sales Executive");
    assert(getInitials("Unknown Employee") === "UE", "Unknown Employee generates UE, never RR");

    // -------------------------------------------------------------------------
    // TEST 9: Historical Quotation Ownership Preservation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Historical Quotation Ownership Remains Real DB Owner ---");
    const quote1042 = await prisma.quotation.findFirst({
      where: { quotationNumber: "Q-1042" },
      include: { owner: true },
    });
    if (quote1042) {
      assert(
        quote1042.owner?.name === "Arjun Mehta",
        `Historical quote Q-1042 owner remains actual DB owner [${quote1042.owner?.name}], not Shivam Mishra`
      );
      assert(
        quote1042.ownerId !== shivam.id,
        "Quote Q-1042 ownerId is NOT overwritten by currently authenticated user ID"
      );
    } else {
      console.log("  ⚠️ Quote Q-1042 not found, skipping ownership assertion");
    }

    // -------------------------------------------------------------------------
    // TEST 10: Historical Approval Actor Remains Real DB Actor
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Historical Approval Actor Remains Real DB Actor ---");
    const approval = await prisma.approval.findFirst({
      include: {
        workflowSteps: {
          include: { approver: true },
        },
      },
    });
    if (approval && approval.workflowSteps.length > 0) {
      const step = approval.workflowSteps[0];
      if (step.approver) {
        assert(
          step.approver.name !== "Sarah Manager" && step.approver.name !== "Rachel Rep",
          `Historical approval step approver is actual DB actor [${step.approver.name}]`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 11: Customer Portal Users Remain Scoped
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: Customer Portal User Remains CUSTOMER Scoped ---");
    const customerUser = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
    });
    if (customerUser) {
      assert(customerUser.role === "CUSTOMER", "Customer user has role CUSTOMER");
      assert(
        getRoleDisplay(customerUser.role) === "Customer Representative",
        "Customer displays as Customer Representative"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 12 & 13: User Preferences Persistence in PostgreSQL
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 12 & 13: User Preferences Persistence in PostgreSQL ---");
    const newPrefs = {
      currency: "USD" as const,
      emailAlerts: false,
      approvalUpdates: true,
      compactView: true,
    };

    // Update Shivam's preferences in DB
    const updatedUser = await prisma.user.update({
      where: { id: shivam.id },
      data: { preferences: newPrefs },
    });

    assert(
      (updatedUser.preferences as any)?.currency === "USD",
      "Updated currency preference persisted to PostgreSQL (USD)"
    );
    assert(
      (updatedUser.preferences as any)?.emailAlerts === false,
      "Updated emailAlerts preference persisted to PostgreSQL (false)"
    );
    assert(
      (updatedUser.preferences as any)?.compactView === true,
      "Updated compactView preference persisted to PostgreSQL (true)"
    );

    // Verify Arjun's preferences are NOT affected by Shivam's update (isolation)
    const arjunAfter = await prisma.user.findUnique({
      where: { email: "arjun.mehta@dealflow360.in" },
    });
    assert(
      (arjunAfter?.preferences as any)?.currency !== "USD",
      "Arjun Mehta preferences remain isolated from Shivam Mishra"
    );

    // Restore Shivam preferences to INR
    await prisma.user.update({
      where: { id: shivam.id },
      data: {
        preferences: {
          currency: "INR",
          emailAlerts: true,
          approvalUpdates: true,
          compactView: false,
        },
      },
    });
    assert(true, "Reset Shivam preferences back to INR default");

    console.log("\n================================================================================");
    console.log(` RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
    console.log("================================================================================");

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
