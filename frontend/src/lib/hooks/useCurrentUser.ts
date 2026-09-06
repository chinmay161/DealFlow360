"use client";

import { useSession } from "next-auth/react";
import { getInitials, getRoleDisplay } from "@/lib/utils/userUtils";

export interface ClientUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  roleDisplay: string;
  title?: string | null;
  department?: string | null;
  territory?: string | null;
  customerId?: string | null;
  contactId?: string | null;
  initials: string;
}

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const rawUser = session?.user;
  const name = rawUser?.name || (rawUser?.email ? rawUser.email.split("@")[0] : undefined);
  const email = rawUser?.email;
  const role = (rawUser as any)?.role || "SALES_REP";
  const title = (rawUser as any)?.title || null;
  const department = (rawUser as any)?.department || null;
  const territory = (rawUser as any)?.territory || null;
  const initials = getInitials(name, email);
  const roleDisplay = getRoleDisplay(role, title);

  const user: ClientUser | null = rawUser
    ? {
        id: rawUser.id,
        name: name || "Commercial User",
        email: email || "",
        image: rawUser.image || null,
        role,
        roleDisplay,
        title,
        department,
        territory,
        customerId: (rawUser as any)?.customerId || null,
        contactId: (rawUser as any)?.contactId || null,
        initials,
      }
    : null;

  return {
    user,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    initials,
    roleDisplay,
  };
}
