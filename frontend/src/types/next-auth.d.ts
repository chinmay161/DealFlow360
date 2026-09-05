import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      customerId?: string;
      contactId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    customerId?: string;
    contactId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    customerId?: string;
    contactId?: string;
  }
}

