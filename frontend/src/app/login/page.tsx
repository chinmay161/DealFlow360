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
    if ((session.user as any).role === "CUSTOMER") {
      redirect("/customer/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/dashboard";
  const isAccessDenied = params?.error === "AccessDenied";

  return <LoginClient callbackUrl={callbackUrl} isAccessDenied={isAccessDenied} />;
}
