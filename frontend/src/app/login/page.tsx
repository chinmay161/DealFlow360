import React from "react";
import { LoginClient } from "./LoginClient";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/overview";
  const isAccessDenied = params?.error === "AccessDenied";

  return <LoginClient callbackUrl={callbackUrl} isAccessDenied={isAccessDenied} />;
}
