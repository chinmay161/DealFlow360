import { auth, signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";

export { auth, signIn, signOut };

/**
 * Server-side helper to retrieve the active session.
 */
export async function getSession() {
  return await auth();
}

/**
 * Server-side helper to retrieve the current authenticated user.
 * Returns null if unauthenticated.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Server-side helper that enforces authentication and returns the user.
 * Redirects to /login if unauthenticated.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
