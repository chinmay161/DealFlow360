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
  let user: any = null;
  try {
    user = await getCurrentUser();
  } catch {
    // Non-fatal fallback
  }

  const userRole = (user?.role || "SALES_REP").toUpperCase();
  const canManagePolicies = userRole === "MANAGER" || userRole === "ADMIN";

  const authContext = {
    userId: user?.id || "rep-user",
    role: userRole,
    email: user?.email || "user@dealflow360.in",
  };

  const [policies, rules] = await Promise.all([
    getDiscountPolicies(authContext),
    getApprovalRules(authContext),
  ]);

  const sanitizedPolicies = (policies || []).map((p: any) => ({
    id: String(p.id),
    name: String(p.name),
    description: p.description ? String(p.description) : null,
    type: String(p.type || "PERCENTAGE"),
    value: Number(p.value ?? 0),
    minOrderAmt: p.minOrderAmt != null ? Number(p.minOrderAmt) : null,
    maxDiscount: p.maxDiscount != null ? Number(p.maxDiscount) : null,
    tier: p.tier ? String(p.tier) : null,
    isActive: Boolean(p.isActive),
  }));

  const sanitizedRules = (rules || []).map((r: any) => ({
    id: String(r.id),
    name: String(r.name),
    description: r.description ? String(r.description) : null,
    stage: Number(r.stage || 1),
    threshold: Number(r.threshold ?? 0),
    approverRole: String(r.approverRole || "MANAGER"),
    isActive: Boolean(r.isActive),
  }));

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

            <ConfigurationWorkspace
              initialPolicies={sanitizedPolicies}
              initialRules={sanitizedRules}
              canManagePolicies={canManagePolicies}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
    </>
  );
}
