import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const ALLOWED_DOMAINS = ["gmail.com", "ves.ac.in", "odoo.com"] as const;

/**
 * Strict server-side verification of allowed email domains.
 * Compares the normalized, extracted domain against the explicit allowlist.
 * Partial matching (e.g. notgmail.com matching gmail.com) is strictly rejected.
 */
export function isAllowedEmailDomain(email?: string | null): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");
  if (atIndex === -1 || atIndex === normalizedEmail.length - 1) return false;
  const domain = normalizedEmail.slice(atIndex + 1);
  return ALLOWED_DOMAINS.includes(domain as (typeof ALLOWED_DOMAINS)[number]);
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (user?.email || profile?.email)?.toString();
        if (!isAllowedEmailDomain(email)) {
          return "/login?error=AccessDenied";
        }
        return true;
      }
      return false;
    },
    async redirect({ url, baseUrl }) {
      // If internal relative path
      if (url.startsWith("/")) {
        // Prevent open redirect attack (e.g. //attacker.com)
        if (url.startsWith("//")) {
          return `${baseUrl}/dashboard`;
        }
        // Never redirect back to login upon successful authentication
        if (url === "/login" || url.startsWith("/login?")) {
          return `${baseUrl}/dashboard`;
        }
        return `${baseUrl}${url}`;
      }

      // If full URL on same origin
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl) {
          if (parsedUrl.pathname === "/login") {
            return `${baseUrl}/dashboard`;
          }
          return url;
        }
      } catch {
        return `${baseUrl}/dashboard`;
      }

      // Default safe landing destination
      return `${baseUrl}/dashboard`;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Allow authentication API routes, health check, and proxied backend APIs
      const isPublicApi =
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/api/v1");
      if (isPublicApi) {
        return true;
      }

      // Handle login page
      const isLoginPage = pathname === "/login";
      if (isLoginPage) {
        if (isLoggedIn) {
          if ((auth?.user as any)?.role === "CUSTOMER") {
            return Response.redirect(new URL("/customer/dashboard", nextUrl));
          }
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // If customer logs in or attempts to access salesman dashboard or root, redirect to customer dashboard
      if (isLoggedIn && (auth?.user as any)?.role === "CUSTOMER") {
        if (pathname === "/dashboard" || pathname === "/") {
          return Response.redirect(new URL("/customer/dashboard", nextUrl));
        }
      }

      // Protected routes: Quotations (/ and /quotations), Dashboard (/dashboard), Approvals (/approvals), etc.
      return isLoggedIn;
    },
  },
};
