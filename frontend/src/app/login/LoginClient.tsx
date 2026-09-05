"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LoginClientProps {
  callbackUrl: string;
  isAccessDenied: boolean;
}

export function LoginClient({ callbackUrl, isAccessDenied }: LoginClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", {
        callbackUrl,
        prompt: "select_account",
      });
    } catch (err) {
      console.error("Sign in failed:", err);
      setIsLoading(false);
    }
  };

  const handleResetError = () => {
    router.replace("/login");
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F7FA] text-[#1C2B3A] flex flex-col justify-between items-center relative overflow-hidden select-none font-sans px-4 py-8 sm:py-10">
      {/* ========================================================================= */}
      {/* BACKGROUND: Clean, minimal enterprise grid and soft ambient glow only      */}
      {/* No side cards, workflow nodes, diagrams, metrics, or floating blocks      */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle geometric dot/line grid */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.45]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="clean-enterprise-grid"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 44 0 L 0 0 0 44"
                fill="none"
                stroke="#E2E6EC"
                strokeWidth="0.85"
              />
              <circle cx="0" cy="0" r="1.1" fill="#CBD2DE" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#clean-enterprise-grid)" />
        </svg>

        {/* Soft white/blue ambient depth gradients (minimal and clean) */}
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[700px] h-[550px] bg-[#163B7A]/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[50%] -translate-x-1/2 w-[600px] h-[400px] bg-[#2E5DA8]/[0.015] rounded-full blur-3xl" />
      </div>

      {/* Spacing placeholder for balanced vertical centering */}
      <div className="w-full flex-shrink-0" />

      {/* ========================================================================= */}
      {/* CENTER WORKSPACE: Brand Header + Single Authentication Card                */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full flex flex-col items-center justify-center my-auto">
        {/* TOP BRANDING: Centered horizontally above the authentication card */}
        <div className="flex flex-col items-center justify-center gap-1.5 mb-7 text-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#163B7A] flex items-center justify-center text-white shadow-sm border border-[#163B7A]/20">
              <span className="material-symbols-outlined text-[19px]" data-icon="token">
                token
              </span>
            </div>
            <span className="text-[21px] font-bold tracking-tight text-[#163B7A]">
              DealFlow360
            </span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#667085]">
            Enterprise Commerce
          </span>
        </div>

        {/* AUTHENTICATION CARD: Single centered focal element */}
        <div className="w-full max-w-[480px] bg-white border border-[#E2E6EC] rounded-[16px] shadow-[0_12px_40px_-8px_rgba(22,59,122,0.07),0_4px_12px_-2px_rgba(0,0,0,0.02)] p-8 sm:p-10">
          {isAccessDenied ? (
            /* =================================================================== */
            /* ACCESS RESTRICTED ERROR STATE                                       */
            /* =================================================================== */
            <div className="flex flex-col items-center text-center">
              {/* Alert Crest */}
              <div className="w-11 h-11 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[23px]" data-icon="gpp_bad">
                  gpp_bad
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-[22px] font-bold text-[#163B7A] tracking-[-0.015em] leading-tight">
                Access Restricted
              </h2>

              <p className="text-[13px] font-medium text-[#DC2626] mt-2 leading-relaxed">
                This Google account is not authorized to access DealFlow360.
              </p>

              {/* Minimal Information Box */}
              <div className="w-full bg-[#F8F9FA] border border-[#E2E6EC] rounded-[10px] p-3.5 my-5 text-center">
                <div className="text-[12px] font-semibold text-[#1C2B3A]">
                  Authorized access only
                </div>
                <div className="text-[11.5px] text-[#667085] mt-1">
                  Access is restricted to approved organization accounts.
                </div>
              </div>

              {/* Primary Action: Try another account */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-[52px] flex items-center justify-center gap-2.5 px-4 rounded-[10px] bg-[#163B7A] text-white font-semibold text-[14.5px] hover:bg-[#112F62] transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="material-symbols-outlined animate-spin text-lg">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]" data-icon="switch_account">
                    switch_account
                  </span>
                )}
                <span>
                  {isLoading ? "Opening Account Selector..." : "Try another account"}
                </span>
              </button>

              {/* Secondary Action: Back to sign in */}
              <button
                type="button"
                onClick={handleResetError}
                className="mt-3.5 text-[12px] text-[#667085] hover:text-[#163B7A] font-medium transition-colors cursor-pointer"
              >
                Back to sign in
              </button>

              {/* Security info row */}
              <div className="mt-5 pt-4 border-t border-[#F0F2F5] w-full flex items-center justify-center gap-1.5 text-[11.5px] text-[#667085]">
                <span className="material-symbols-outlined text-[15px] text-[#667085]">
                  lock
                </span>
                <span>Secure authentication powered by Google OAuth</span>
              </div>
            </div>
          ) : (
            /* =================================================================== */
            /* NORMAL SIGN-IN STATE                                                */
            /* =================================================================== */
            <div className="flex flex-col">
              {/* Top: Small DealFlow360 logo icon inside a subtle rounded square */}
              <div className="w-11 h-11 rounded-[12px] bg-[#163B7A]/[0.07] border border-[#163B7A]/15 flex items-center justify-center text-[#163B7A] mb-5">
                <span className="material-symbols-outlined text-[22px]" data-icon="token">
                  token
                </span>
              </div>

              {/* Heading: “Welcome to DealFlow360” */}
              <h1 className="text-[23px] sm:text-[24px] font-bold text-[#163B7A] tracking-[-0.015em] leading-tight">
                Welcome to DealFlow360
              </h1>

              {/* Subheading */}
              <p className="text-[13px] text-[#667085] mt-2 leading-relaxed">
                Sign in to access your deals, quotations, approvals, and commercial intelligence.
              </p>

              {/* AUTHENTICATION: ONLY ONE Login Option (Continue with Google) */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full h-[54px] flex items-center justify-center gap-3 px-4 rounded-[10px] border border-[#D6DAE1] bg-white text-[#163B7A] font-semibold text-[14.5px] hover:bg-[#F9FAFB] hover:border-[#B5BCC8] hover:shadow-sm active:scale-[0.99] transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[#163B7A] text-[20px]">
                      progress_activity
                    </span>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>
                    {isLoading ? "Connecting to Google..." : "Continue with Google"}
                  </span>
                </button>
              </div>

              {/* Below button: Subtle divider */}
              <div className="my-6 border-t border-[#E2E6EC]" />

              {/* Below divider: Lock/shield icon with security note */}
              <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-[#667085] mb-4">
                <span className="material-symbols-outlined text-[15px] text-[#667085]">
                  lock
                </span>
                <span>Secure authentication powered by Google OAuth</span>
              </div>

              {/* Subtle information panel */}
              <div className="bg-[#F8F9FA] border border-[#E2E6EC] rounded-[10px] p-3.5 text-center">
                <div className="text-[12px] font-semibold text-[#1C2B3A]">
                  Authorized access only
                </div>
                <div className="text-[11.5px] text-[#667085] mt-0.5">
                  Access is restricted to approved organization accounts.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER: Bottom-center minimal copyright text                               */}
      {/* ========================================================================= */}
      <footer className="relative z-20 w-full pt-4 pb-2 text-center text-[12px] text-[#8C95A6]">
        <span>© 2026 DealFlow360 · Enterprise Commerce Platform</span>
      </footer>
    </div>
  );
}
