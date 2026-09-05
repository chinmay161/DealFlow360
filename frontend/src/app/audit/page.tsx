import { Metadata } from "next";
import { AppSidebar } from "@/components/AppSidebar";
import { TopHeader } from "@/components/TopHeader";
import { AuditLogViewer } from "@/components/audit/AuditLogViewer";
import { prisma } from "@/lib/prisma";
import { queryAuditLogs } from "@/lib/services/governanceBridge";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DealFlow360 - Immutable Audit Logs",
  description: "Chronological governance and compliance event logs with full payload traceability.",
};

export default async function AuditPage() {
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
    // Non-fatal
  }

  // Load audit logs via bridge or direct database query
  let logs: any[] = [];
  try {
    const bridgeResult = await queryAuditLogs({}, authContext);
    if (bridgeResult && Array.isArray(bridgeResult.items) && bridgeResult.items.length > 0) {
      logs = bridgeResult.items;
    }
  } catch {
    // Fall back to direct Prisma query
  }

  if (logs.length === 0) {
    try {
      logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch {
      logs = [];
    }
  }

  const serializedLogs = logs.map((l: any) => ({
    id: l.id,
    entity: l.entity,
    entityId: l.entityId,
    action: l.action,
    actorId: l.actorId ?? null,
    actorEmail: l.actorEmail ?? null,
    fromState: l.fromState ?? null,
    toState: l.toState ?? null,
    metadata: l.metadata ?? null,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt),
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
                  Immutable Governance Audit Log
                </h1>
                <p className="font-body-sm text-body-sm text-outline mt-0.5">
                  Append-only compliance ledger tracking state transitions, multi-level approvals, discount overrides, and policy edits.
                </p>
              </div>
            </div>

            <AuditLogViewer initialLogs={serializedLogs} />
          </div>
        </main>
      </div>
    </>
  );
}
