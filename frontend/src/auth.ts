import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authConfig, isAllowedEmailDomain } from "./auth.config";
import {
  normalizeEmail,
  verifyPortalLoginIntent,
} from "@/lib/services/portalAuthService";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (user?.email || profile?.email)?.toString();
        if (!email) return "/login?error=AccessDenied";

        const normalizedEmail = normalizeEmail(email);

        // Check if there is a pending customer portal login intent
        let portalToken: string | undefined;
        try {
          const cookieStore = await cookies();
          portalToken = cookieStore.get("portal_login_intent")?.value;
        } catch {
          // Cookies not accessible in some environments
        }

        if (portalToken) {
          // Verify portal login intent against PostgreSQL
          const verifyResult = await verifyPortalLoginIntent(
            portalToken,
            normalizedEmail
          );

          // Always consume/clear the cookie
          try {
            const cookieStore = await cookies();
            cookieStore.delete("portal_login_intent");
          } catch {}

          if (!verifyResult.success || !verifyResult.contact) {
            if (verifyResult.error === "OAuthEmailMismatch") {
              return "/portal?error=OAuthEmailMismatch";
            }
            return "/portal?error=AccessDenied";
          }

          // Ensure User record has CUSTOMER role and is linked to the Contact
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });
            if (dbUser) {
              if (dbUser.role !== "CUSTOMER") {
                await prisma.user.update({
                  where: { id: dbUser.id },
                  data: { role: "CUSTOMER" },
                });
              }
              await prisma.contact.update({
                where: { id: verifyResult.contact.id },
                data: { userId: dbUser.id },
              });
            }
          } catch (err) {
            console.error("Failed to link customer user:", err);
          }

          return true;
        }

        // Internal employee sign-in path
        if (!isAllowedEmailDomain(normalizedEmail)) {
          return "/login?error=AccessDenied";
        }

        // Prevent customer from signing in through internal employee portal
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { role: true },
        });

        if (dbUser?.role === "CUSTOMER") {
          return "/portal?error=CustomerPortalOnly";
        }

        return true;
      }
      return false;
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        } else if (token.sub) {
          session.user.id = token.sub;
        }
        session.user.role = (token.role as string) || "SALES_REP";
        if (token.customerId) {
          session.user.customerId = token.customerId as string;
        }
        if (token.contactId) {
          session.user.contactId = token.contactId as string;
        }
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (token.email) {
        const normalized = normalizeEmail(token.email);

        // 1. Authoritative check: Is this an active customer portal contact?
        const contact = await prisma.contact.findFirst({
          where: {
            email: normalized,
            isActive: true,
            OR: [{ portalAccess: true }, { portalAccessEnabled: true }],
          },
          include: { customer: true },
        });

        if (contact && contact.customer) {
          // Lock role strictly to CUSTOMER - cannot elevate to employee roles
          token.role = "CUSTOMER";
          token.customerId = contact.customerId;
          token.contactId = contact.id;
          if (user?.id) token.id = user.id;
          return token;
        }

        // 2. Otherwise internal employee lookup
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: normalized },
            select: { role: true, id: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          } else {
            token.role = "SALES_REP";
          }
        } catch {
          token.role = "SALES_REP";
        }
      } else if (user) {
        token.id = user.id;
        token.role = user.role ?? "SALES_REP";
      }
      return token;
    },
  },
});
