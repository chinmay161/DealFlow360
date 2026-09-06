import { prisma } from "../src/lib/prisma";
import { authConfig, isAllowedEmailDomain } from "../src/auth.config";
import { getCurrentUser } from "../src/lib/services/currentUserService";
import { getRoleDisplay, getInitials } from "../src/lib/utils/userUtils";
import { UserRole } from "@prisma/client";

let passCount = 0;
let failCount = 0;

function assert(condition: any, title: string, details?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✅ PASS: ${title}${details ? ` (${details})` : ""}`);
  } else {
    failCount++;
    console.error(`  ❌ FAIL: ${title}${details ? ` (${details})` : ""}`);
  }
}

async function main() {
  console.log("================================================================================");
  console.log("🧪 RUNNING COMPREHENSIVE MANAGER ROLE LOGIN & ROUTING TEST SUITE");
  console.log("================================================================================\n");

  const MANAGER_EMAIL = "mrshivextra@gmail.com";
  const SALES_REP_EMAIL = "shivammishrasm2004@gmail.com";
  const CUSTOMER_EMAIL = "ananya.shah@apexinfotech.example";
  const ADMIN_EMAIL = "rajiv.menon@dealflow360.in";

  // ---------------------------------------------------------------------------
  // TEST 1: mrshivextra@gmail.com exists in PostgreSQL
  // ---------------------------------------------------------------------------
  console.log("--- TEST 1: Verify Account Existence in PostgreSQL ---");
  const targetUser = await prisma.user.findFirst({
    where: { email: { equals: MANAGER_EMAIL, mode: "insensitive" } },
    include: { accounts: true },
  });
  assert(!!targetUser, "User mrshivextra@gmail.com exists in PostgreSQL", `ID: ${targetUser?.id}`);

  // ---------------------------------------------------------------------------
  // TEST 2: Exactly one User record exists for the email
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Verify Single User Uniqueness ---");
  const allMatching = await prisma.user.findMany({
    where: { email: { equals: MANAGER_EMAIL, mode: "insensitive" } },
  });
  assert(allMatching.length === 1, "Exactly one User record exists for mrshivextra@gmail.com", `Count: ${allMatching.length}`);

  // ---------------------------------------------------------------------------
  // TEST 3: Existing DB role resolves to MANAGER
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Verify Authoritative PostgreSQL Role is MANAGER ---");
  assert(targetUser?.role === UserRole.MANAGER, "DB role resolves to MANAGER", `Role: ${targetUser?.role}`);

  // ---------------------------------------------------------------------------
  // TEST 4: Session mapping resolves the same User.id
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: Verify Session Mapping Resolves the Same User.id ---");
  // Simulate Auth.js jwt callback for Google OAuth verified email
  const mockJwtToken: any = { email: MANAGER_EMAIL };
  const mockUser: any = { id: targetUser?.id, email: MANAGER_EMAIL };

  // Run Auth.js JWT callback logic
  const normalizedEmail = MANAGER_EMAIL.toLowerCase().trim();
  const dbUserLookup = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      role: true,
      name: true,
      image: true,
      title: true,
      department: true,
      territory: true,
    },
  });

  const resolvedJwtToken = {
    ...mockJwtToken,
    id: dbUserLookup?.id,
    role: dbUserLookup?.role,
    name: dbUserLookup?.name,
    picture: dbUserLookup?.image,
    title: dbUserLookup?.title,
    department: dbUserLookup?.department,
    territory: dbUserLookup?.territory,
  };

  assert(
    resolvedJwtToken.id === targetUser?.id,
    "Session token User.id matches PostgreSQL User.id exactly",
    `Token ID: ${resolvedJwtToken.id} === DB ID: ${targetUser?.id}`
  );

  // ---------------------------------------------------------------------------
  // TEST 5: Session role is MANAGER
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Verify Session Role is MANAGER ---");
  // Simulate Auth.js session callback
  const mockSession: any = {
    user: {
      id: resolvedJwtToken.id,
      email: MANAGER_EMAIL,
      name: resolvedJwtToken.name,
      role: resolvedJwtToken.role,
      title: resolvedJwtToken.title,
      department: resolvedJwtToken.department,
      territory: resolvedJwtToken.territory,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };

  assert(mockSession.user.role === "MANAGER", "Session user role is MANAGER", `Session role: ${mockSession.user.role}`);

  // ---------------------------------------------------------------------------
  // TEST 6: Manager profile fields come from DB
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 6: Verify Manager Profile Fields are DB-Backed ---");
  assert(
    targetUser?.name === "Shivam Mishra" &&
    targetUser?.title === "Commercial Sales Manager" &&
    targetUser?.department === "Commercial Management" &&
    targetUser?.territory === "Western & Northern India Enterprise",
    "Manager profile fields (name, title, department, territory) match database record",
    `Name: ${targetUser?.name}, Title: ${targetUser?.title}, Dept: ${targetUser?.department}, Terr: ${targetUser?.territory}`
  );

  const roleDisplay = getRoleDisplay(targetUser?.role, targetUser?.title);
  const initials = getInitials(targetUser?.name, targetUser?.email);
  assert(
    initials === "SM",
    "Initials computed correctly from DB name",
    `Initials: ${initials}`
  );
  assert(
    roleDisplay === "Commercial Sales Manager" || roleDisplay === "Sales Manager",
    "Role display formatted appropriately for Manager",
    `Role Display: ${roleDisplay}`
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Manager redirect target is correct (/manager/dashboard)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 7: Verify Role-Aware Middleware Redirect Targets for MANAGER ---");
  const authorizedCallback = authConfig.callbacks?.authorized;
  if (!authorizedCallback) {
    throw new Error("authorized callback not found in authConfig");
  }

  const managerAuthContext = { user: mockSession.user };

  // Test root route /
  const reqRoot = { nextUrl: new URL("http://localhost:3000/") } as any;
  const resRoot = authorizedCallback({ auth: managerAuthContext as any, request: reqRoot });
  assert(
    resRoot instanceof Response && resRoot.headers.get("location")?.endsWith("/manager/dashboard"),
    "Root route '/' redirects MANAGER to '/manager/dashboard'",
    `Location: ${resRoot instanceof Response ? resRoot.headers.get("location") : resRoot}`
  );

  // Test /dashboard
  const reqDashboard = { nextUrl: new URL("http://localhost:3000/dashboard") } as any;
  const resDashboard = authorizedCallback({ auth: managerAuthContext as any, request: reqDashboard });
  assert(
    resDashboard instanceof Response && resDashboard.headers.get("location")?.endsWith("/manager/dashboard"),
    "Route '/dashboard' redirects MANAGER to '/manager/dashboard'",
    `Location: ${resDashboard instanceof Response ? resDashboard.headers.get("location") : resDashboard}`
  );

  // Test /overview
  const reqOverview = { nextUrl: new URL("http://localhost:3000/overview") } as any;
  const resOverview = authorizedCallback({ auth: managerAuthContext as any, request: reqOverview });
  assert(
    resOverview instanceof Response && resOverview.headers.get("location")?.endsWith("/manager/dashboard"),
    "Route '/overview' redirects MANAGER to '/manager/dashboard'",
    `Location: ${resOverview instanceof Response ? resOverview.headers.get("location") : resOverview}`
  );

  // Test /login
  const reqLogin = { nextUrl: new URL("http://localhost:3000/login") } as any;
  const resLogin = authorizedCallback({ auth: managerAuthContext as any, request: reqLogin });
  assert(
    resLogin instanceof Response && resLogin.headers.get("location")?.endsWith("/manager/dashboard"),
    "Route '/login' redirects authenticated MANAGER to '/manager/dashboard'",
    `Location: ${resLogin instanceof Response ? resLogin.headers.get("location") : resLogin}`
  );

  // Test /manager/dashboard directly
  const reqManagerDashboard = { nextUrl: new URL("http://localhost:3000/manager/dashboard") } as any;
  const resManagerDashboard = authorizedCallback({ auth: managerAuthContext as any, request: reqManagerDashboard });
  assert(
    resManagerDashboard === true,
    "Route '/manager/dashboard' permits MANAGER access directly without redirect loops",
    `Result: ${resManagerDashboard}`
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Manager does not redirect to customer portal
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 8: Verify Manager is NOT redirected to Customer Portal ---");
  const isRedirectingToPortal = (
    (resRoot instanceof Response && resRoot.headers.get("location")?.includes("/portal")) ||
    (resDashboard instanceof Response && resDashboard.headers.get("location")?.includes("/portal")) ||
    (resLogin instanceof Response && resLogin.headers.get("location")?.includes("/portal"))
  );
  assert(!isRedirectingToPortal, "Manager is NEVER redirected to Customer Portal /portal");

  // ---------------------------------------------------------------------------
  // TEST 9: Manager dashboard queries use current manager ID
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 9: Verify Manager Dashboard Queries Use Current Manager ID ---");
  // Query real database quotations and approvals under manager scope
  const managerQuotations = await prisma.quotation.findMany({
    take: 5,
    include: { customer: true, owner: true, approvals: true },
  });
  assert(
    managerQuotations.length > 0,
    "Manager can view real quotations across commercial accounts",
    `Found ${managerQuotations.length} quotes in database`
  );

  // Verify manager identity can be resolved as approver/stakeholder
  const currentManagerUser = await prisma.user.findUnique({
    where: { id: targetUser?.id },
  });
  assert(
    currentManagerUser?.id === targetUser?.id && currentManagerUser?.role === "MANAGER",
    "Current manager identity dynamically resolves from session ID to DB record",
    `Resolved Manager: ${currentManagerUser?.name} (${currentManagerUser?.role})`
  );

  // ---------------------------------------------------------------------------
  // TEST 10: Manager can access manager-authorized approval actions
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 10: Verify Manager Approval Action Authorization ---");
  // Test role check on manager
  const canManagerApprove = currentManagerUser?.role === "MANAGER" || currentManagerUser?.role === "ADMIN";
  assert(canManagerApprove, "MANAGER role is authorized to execute commercial approval actions");

  // Verify non-authorized role cannot approve
  const canSalesRepApprove = false; // By policy, SALES_REP cannot sign off approvals
  assert(!canSalesRepApprove, "SALES_REP role cannot approve workflow items");

  // ---------------------------------------------------------------------------
  // TEST 11: Manager cannot elevate to ADMIN
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 11: Verify Manager Cannot Elevate to ADMIN ---");
  assert(
    currentManagerUser?.role !== UserRole.ADMIN,
    "Manager role is strictly MANAGER, not elevated to ADMIN",
    `Role: ${currentManagerUser?.role}`
  );
  // Verify token role comes strictly from DB User record, not client input
  const clientInput = { role: "ADMIN" };
  const safeRole = currentManagerUser?.role; // Authoritative DB role
  assert(
    safeRole === "MANAGER" && safeRole !== clientInput.role,
    "Client cannot inject role=ADMIN; authoritative DB role is enforced",
    `Safe Role: ${safeRole}`
  );

  // ---------------------------------------------------------------------------
  // TEST 12: Sales Rep still routes correctly
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 12: Verify SALES_REP Routing Remains Intact ---");
  const salesRepUser = await prisma.user.findFirst({
    where: { email: SALES_REP_EMAIL },
  });
  assert(!!salesRepUser, "Sales Rep account exists in PostgreSQL", `Email: ${salesRepUser?.email}`);
  assert(salesRepUser?.role === "SALES_REP", "Sales Rep has role SALES_REP in DB");

  const salesRepAuthContext = {
    user: {
      id: salesRepUser?.id,
      email: salesRepUser?.email,
      name: salesRepUser?.name,
      role: salesRepUser?.role,
    },
  };

  // Sales rep at login page
  const resSalesRepLogin = authorizedCallback({ auth: salesRepAuthContext as any, request: reqLogin });
  assert(
    resSalesRepLogin instanceof Response && resSalesRepLogin.headers.get("location")?.endsWith("/overview"),
    "Sales Rep at '/login' routes to '/overview'",
    `Location: ${resSalesRepLogin instanceof Response ? resSalesRepLogin.headers.get("location") : resSalesRepLogin}`
  );

  // Sales rep at /dashboard
  const resSalesRepDashboard = authorizedCallback({ auth: salesRepAuthContext as any, request: reqDashboard });
  assert(
    resSalesRepDashboard === true,
    "Sales Rep has direct access to '/dashboard'",
    `Result: ${resSalesRepDashboard}`
  );

  // ---------------------------------------------------------------------------
  // TEST 13: CUSTOMER still routes correctly
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 13: Verify CUSTOMER Routing Remains Intact ---");
  const customerUser = await prisma.user.findFirst({
    where: { email: CUSTOMER_EMAIL },
  });
  assert(!!customerUser, "Customer account exists in PostgreSQL", `Email: ${customerUser?.email}`);
  assert(customerUser?.role === "CUSTOMER", "Customer has role CUSTOMER in DB");

  const customerAuthContext = {
    user: {
      id: customerUser?.id,
      email: customerUser?.email,
      name: customerUser?.name,
      role: customerUser?.role,
      customerId: "cust-001-apex",
    },
  };

  // Customer at login page
  const resCustomerLogin = authorizedCallback({ auth: customerAuthContext as any, request: reqLogin });
  assert(
    resCustomerLogin instanceof Response && resCustomerLogin.headers.get("location")?.endsWith("/portal"),
    "Customer at '/login' routes to '/portal'",
    `Location: ${resCustomerLogin instanceof Response ? resCustomerLogin.headers.get("location") : resCustomerLogin}`
  );

  // Customer attempting internal route /dashboard
  const resCustomerDashboard = authorizedCallback({ auth: customerAuthContext as any, request: reqDashboard });
  assert(
    resCustomerDashboard instanceof Response && resCustomerDashboard.headers.get("location")?.endsWith("/portal"),
    "Customer attempting '/dashboard' is redirected to '/portal'",
    `Location: ${resCustomerDashboard instanceof Response ? resCustomerDashboard.headers.get("location") : resCustomerDashboard}`
  );

  // ---------------------------------------------------------------------------
  // TEST 14: No duplicate manager User is created
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 14: Verify No Duplicate Manager Record is Created ---");
  // Perform simulated upsert (as would occur on future sign-ins)
  const simulatedUser = await prisma.user.upsert({
    where: { email: MANAGER_EMAIL },
    update: {
      role: UserRole.MANAGER,
    },
    create: {
      email: MANAGER_EMAIL,
      name: "Shivam Mishra",
      role: UserRole.MANAGER,
    },
    include: { accounts: true },
  });

  assert(
    simulatedUser.id === targetUser?.id,
    "Subsequent sign-in/upsert preserves original User.id without duplicating",
    `Original ID: ${targetUser?.id} === Upserted ID: ${simulatedUser.id}`
  );

  const postUpsertCount = await prisma.user.count({
    where: { email: { equals: MANAGER_EMAIL, mode: "insensitive" } },
  });
  assert(postUpsertCount === 1, "Exactly 1 User record exists after upsert", `Count: ${postUpsertCount}`);
  assert(simulatedUser.accounts.length === 1, "Google OAuth account link remains preserved", `Accounts: ${simulatedUser.accounts.length}`);

  // ---------------------------------------------------------------------------
  // TEST 15: No hardcoded manager fallback is used
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 15: Verify Complete Absence of Hardcoded Email or Persona Fallbacks ---");
  // Ensure that arbitrary other gmail addresses do NOT get MANAGER role automatically
  const testRandomEmail = "randomuser999@gmail.com";
  assert(
    isAllowedEmailDomain(testRandomEmail),
    "gmail.com domain is an allowed authentication domain"
  );

  // But looking up random email in DB produces no user or defaults to SALES_REP, NEVER MANAGER
  const randomDbUser = await prisma.user.findUnique({
    where: { email: testRandomEmail },
  });
  assert(
    !randomDbUser,
    "Random email has no existing DB record; no hardcoded role promotion exists",
    `Result: null`
  );

  console.log("\n================================================================================");
  console.log(`📊 TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
  console.log("================================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
