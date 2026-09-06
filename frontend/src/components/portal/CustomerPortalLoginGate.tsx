"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { checkPortalEmailAction } from "@/lib/actions/portalAuthActions";

interface CustomerPortalLoginGateProps {
  initialError?: string | null;
}

export const CustomerPortalLoginGate: React.FC<CustomerPortalLoginGateProps> = ({
  initialError,
}) => {
  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (initialError === "OAuthEmailMismatch") {
      return "This Google account does not match the registered customer email. Please sign in with the registered email address.";
    }
    if (initialError === "AccessDenied") {
      return "Access denied. Please ensure your customer account is active and authorized.";
    }
    return null;
  });
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isChecking) return;

    setIsChecking(true);
    setErrorMessage(null);
    setGuidanceMessage(null);

    try {
      const res = await checkPortalEmailAction(email.trim());

      if (res.eligible && res.email) {
        setIsEligible(true);
        setVerifiedEmail(res.email);
      } else {
        setIsEligible(false);
        setErrorMessage(
          res.error || "Please log in using the registered email address."
        );
        setGuidanceMessage(
          res.guidance ||
            "If this email has not been registered, contact your company representative or DealFlow360 sales team with your company name, mobile number, and business email to register."
        );
      }
    } catch (err) {
      console.error("Eligibility check error:", err);
      setErrorMessage("Please log in using the registered email address.");
      setGuidanceMessage(
        "If this email has not been registered, contact your company representative or DealFlow360 sales team with your company name, mobile number, and business email to register."
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartGoogleOAuth = () => {
    signIn(
      "google",
      {
        callbackUrl: "/portal",
      },
      {
        login_hint: verifiedEmail,
      }
    );
  };

  const handleReset = () => {
    setIsEligible(false);
    setVerifiedEmail("");
    setErrorMessage(null);
    setGuidanceMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white shadow-sm font-bold text-lg">
            DF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Portal
          </h1>
          <p className="text-xs text-slate-500">
            Sign in using the email address registered with your DealFlow360 account.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* Error & Guidance Notice */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5 animate-in fade-in duration-200">
              <div className="font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              {guidanceMessage && (
                <p className="text-red-700 text-[11px] leading-relaxed pl-3 border-l border-red-300">
                  {guidanceMessage}
                </p>
              )}
            </div>
          )}

          {!isEligible ? (
            /* STEP 1: Email Eligibility Gate */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="portalEmail"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Registered Business Email
                </label>
                <input
                  id="portalEmail"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. buyer@company.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  DealFlow360 verifies your registration before initiating authentication.
                </p>
              </div>

              <button
                type="submit"
                disabled={isChecking || !email.trim()}
                className="w-full h-11 rounded-xl bg-primary hover:bg-[#1E3A8A] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isChecking ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Registration...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Google OAuth Initiation */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[11px] text-emerald-700 uppercase tracking-wider">
                    Authorized Customer Identity
                  </div>
                  <div className="font-bold text-xs mt-0.5 font-mono">{verifiedEmail}</div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Change
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Your registered customer email has been verified. Complete authentication using your corporate Google account.
              </p>

              <button
                type="button"
                onClick={handleStartGoogleOAuth}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {/* Google "G" Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500">
          Protected by DealFlow360 Zero-Trust Identity Gateway.
        </p>
      </div>
    </div>
  );
};
