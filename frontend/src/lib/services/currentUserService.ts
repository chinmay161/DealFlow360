import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface CurrentUserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  roleDisplay: string;
  title?: string | null;
  department?: string | null;
  territory?: string | null;
  preferences: {
    currency: "INR" | "USD" | "EUR";
    emailAlerts: boolean;
    approvalUpdates: boolean;
    compactView: boolean;
  };
  customerId?: string | null;
  contactId?: string | null;
  initials: string;
}

export const DEFAULT_USER_PREFERENCES: CurrentUserData["preferences"] = {
  currency: "INR",
  emailAlerts: true,
  approvalUpdates: true,
  compactView: false,
};

export { getInitials, getRoleDisplay } from "@/lib/utils/userUtils";
import { getRoleDisplay, getInitials } from "@/lib/utils/userUtils";

/**
 * Authoritative Server-side loader for the currently authenticated user.
 * Reads session -> queries PostgreSQL User record -> returns normalized data.
 */
export async function getCurrentUser(): Promise<CurrentUserData | null> {
  const session = await auth();
  if (!session?.user?.email && !session?.user?.id) {
    return null;
  }

  const email = session.user.email?.toLowerCase().trim();
  const userId = session.user.id;

  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (!dbUser) {
    // If authenticated in session but not yet fully indexed in DB
    const name = session.user.name || (email ? email.split("@")[0] : "Commercial User");
    const role = (session.user as any).role || "SALES_REP";
    return {
      id: userId || "session-user",
      name,
      email: email || "",
      image: session.user.image || null,
      role,
      roleDisplay: getRoleDisplay(role),
      title: null,
      department: "Commercial & Strategic Deals",
      territory: "India Commercial Region",
      preferences: DEFAULT_USER_PREFERENCES,
      customerId: (session.user as any).customerId || null,
      contactId: (session.user as any).contactId || null,
      initials: getInitials(name, email),
    };
  }

  const rawPrefs = dbUser.preferences as Record<string, any> | null;
  const preferences: CurrentUserData["preferences"] = {
    currency: rawPrefs?.currency === "USD" || rawPrefs?.currency === "EUR" ? rawPrefs.currency : "INR",
    emailAlerts: typeof rawPrefs?.emailAlerts === "boolean" ? rawPrefs.emailAlerts : true,
    approvalUpdates: typeof rawPrefs?.approvalUpdates === "boolean" ? rawPrefs.approvalUpdates : true,
    compactView: typeof rawPrefs?.compactView === "boolean" ? rawPrefs.compactView : false,
  };

  const name = dbUser.name || (email ? email.split("@")[0] : "Commercial User");

  return {
    id: dbUser.id,
    name,
    email: dbUser.email,
    image: dbUser.image || dbUser.avatarUrl || null,
    role: dbUser.role,
    roleDisplay: getRoleDisplay(dbUser.role, dbUser.title),
    title: dbUser.title,
    department: dbUser.department || (dbUser.role === "APPROVER" ? "Commercial Approvals" : "Commercial Sales"),
    territory: dbUser.territory || "Enterprise Commercial Region",
    preferences,
    customerId: (session.user as any)?.customerId || null,
    contactId: (session.user as any)?.contactId || null,
    initials: getInitials(name, dbUser.email),
  };
}
