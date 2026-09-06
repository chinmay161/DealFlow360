import React from "react";
import { LoginClient } from "./LoginClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) {
    const userRole = (session.user as any).role;
    if (userRole === "CUSTOMER") {
      redirect("/customer/dashboard");
    } else if (userRole === "MANAGER") {
      redirect("/manager/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/";
  const isAccessDenied = params?.error === "AccessDenied";

  return <LoginClient callbackUrl={callbackUrl} isAccessDenied={isAccessDenied} />;
}
