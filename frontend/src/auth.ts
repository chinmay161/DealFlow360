import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token && session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        } else if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.role) {
          session.user.role = token.role as string;
        } else {
          session.user.role = "SALES_REP";
        }
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "SALES_REP";
      }
      return token;
    },
  },
});
