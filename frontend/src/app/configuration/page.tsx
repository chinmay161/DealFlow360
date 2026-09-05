import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { ConfigurationWorkspace } from "@/components/configuration/ConfigurationWorkspace";
import { getDiscountPolicies, getApprovalRules } from "@/lib/services/governanceBridge";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Governance & Rule Configuration",
  description: "Configure commercial discount policies, multi-tier approval thresholds, and automated guardrails.",
};

export default async function ConfigurationPage() {
  let authContext = {
    userId: "admin-system",
    role: "ADMIN",
    email: "admin@dealflow360.in",
  };

  try {
    const user = await getCurrentUser();
    if (user) {
      authContext = {
        userId: user.id || "admin-system",
        role: "ADMIN",
        email: user.email || "admin@dealflow360.in",
      };
    }
  } catch {
    // Non-fatal fallback
  }

  const [policies, rules] = await Promise.all([
    getDiscountPolicies(authContext),
    getApprovalRules(authContext),
  ]);

  return (
    <>
      <AppSidebar />
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-space-xl py-space-lg space-y-space-base pb-16">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                  Governance &amp; Policy Configuration
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  Manage commercial pricing guardrails, tier discount ceilings, and multi-tier approval stages.
                </p>
              </div>
            </div>

            <ConfigurationWorkspace initialPolicies={policies} initialRules={rules} />
          </div>
        </main>
      </div>
    </>
  );
}
