"use client";

import React, { useState } from "react";
import { signOut } from "next-auth/react";
import { clearPortalLoginIntentAction } from "@/lib/actions/portalAuthActions";

export const PortalLogoutButton: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await clearPortalLoginIntentAction();
    } catch {}
    await signOut({ callbackUrl: "/portal" });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoggingOut}
      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isLoggingOut ? "Signing Out..." : "Sign Out"}
    </button>
  );
};
