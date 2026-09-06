import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const ALLOWED_DOMAINS = ["gmail.com", "ves.ac.in", "odoo.com", "dealflow360.in"] as const;

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
          return `${baseUrl}/`;
        }
        // Never redirect back to login upon successful authentication
        if (url === "/login" || url.startsWith("/login?")) {
          return `${baseUrl}/`;
        }
        return `${baseUrl}${url}`;
      }

      // If full URL on same origin
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl) {
          if (parsedUrl.pathname === "/login") {
            return `${baseUrl}/`;
          }
          return url;
        }
      } catch {
        return `${baseUrl}/`;
      }

      // Default safe landing destination
      return `${baseUrl}/`;
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
          const userRole = (auth?.user as any)?.role;
          if (userRole === "CUSTOMER") {
            return Response.redirect(new URL("/portal", nextUrl));
          }
          if (userRole === "MANAGER") {
            return Response.redirect(new URL("/manager/dashboard", nextUrl));
          }
          return Response.redirect(new URL("/overview", nextUrl));
        }
        return true;
      }

      // Customer Portal entry route (/portal) is publicly accessible for unauthenticated users (shows login gate)
      if (pathname === "/portal" && !isLoggedIn) {
        return true;
      }

      // If customer logs in or attempts to access internal sales routes, redirect to customer portal
      if (isLoggedIn && (auth?.user as any)?.role === "CUSTOMER") {
        if (
          pathname === "/dashboard" ||
          pathname === "/overview" ||
          pathname === "/" ||
          pathname === "/customer" ||
          pathname.startsWith("/customer/") ||
          pathname.startsWith("/customers") ||
          pathname.startsWith("/approvals") ||
          pathname.startsWith("/audit") ||
          pathname.startsWith("/configuration") ||
          pathname.startsWith("/fulfillment") ||
          pathname.startsWith("/inventory") ||
          pathname.startsWith("/invoices") ||
          pathname.startsWith("/reports") ||
          pathname.startsWith("/subscriptions")
        ) {
          return Response.redirect(new URL("/portal", nextUrl));
        }
        if (pathname === "/quotations" || (pathname.startsWith("/quotations/") && pathname !== "/quotations/new")) {
          return Response.redirect(new URL("/portal/quotations", nextUrl));
        }
      }

      // Protect /portal subroutes (e.g. /portal/quotations) from unauthorized users
      if (pathname.startsWith("/portal/quotations")) {
        if (!isLoggedIn || (auth?.user as any)?.role !== "CUSTOMER") {
          return Response.redirect(new URL("/portal", nextUrl));
        }
        return true;
      }

      // If manager accesses root or sales dashboard, redirect to manager dashboard
      if (isLoggedIn && (auth?.user as any)?.role === "MANAGER") {
        if (pathname === "/" || pathname === "/dashboard") {
          return Response.redirect(new URL("/manager/dashboard", nextUrl));
        }
      }

      // Protected routes: Overview (/ and /overview), Dashboard (/dashboard), Quotations (/quotations), etc.
      return isLoggedIn;
    },
  },
};
