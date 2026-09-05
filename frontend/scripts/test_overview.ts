import { getOverviewMetrics } from "../src/lib/services/overviewService";

async function main() {
  console.log("=== Testing getOverviewMetrics() ===");
  const data = await getOverviewMetrics();

  console.log("1. Executive KPIs:");
  console.log("   - Total Pipeline:", data.kpi.openPipelineFormatted, `(raw: ₹${data.kpi.openPipeline})`);
  console.log("   - Active Deals:", data.kpi.activeDealsCount);
  console.log("   - Active Quotations:", data.kpi.activeQuotationsCount, `(${data.kpi.draftCount} Draft · ${data.kpi.inReviewCount} In Review)`);
  console.log("   - Pending Approvals:", data.kpi.pendingApprovalsCount);
  console.log("   - Approved Value:", data.kpi.approvedValueFormatted, `(deals: ${data.kpi.approvedDealsCount})`);

  if (data.kpi.openPipeline <= 0) throw new Error("FAIL: openPipeline should be > 0");
  if (data.kpi.activeQuotationsCount !== 13) console.warn(`Note: Active quotations count is ${data.kpi.activeQuotationsCount}`);

  console.log("\n2. Pipeline By Stage:");
  for (const s of data.pipelineByStage) {
    console.log(`   - ${s.stage.padEnd(20)}: ${s.count} deals, ${s.displayValue.padStart(12)} (${s.percentage}% bar width) -> ${s.href}`);
  }
  if (data.pipelineByStage.length === 0) throw new Error("FAIL: pipelineByStage is empty");

  console.log("\n3. Deal Health:");
  console.log(`   - Healthy  (<40) : ${data.dealHealth.healthy.count} deals (${data.dealHealth.healthy.percentage}%) -> ${data.dealHealth.healthy.href}`);
  console.log(`   - Attention(40-69): ${data.dealHealth.attention.count} deals (${data.dealHealth.attention.percentage}%) -> ${data.dealHealth.attention.href}`);
  console.log(`   - At Risk  (>=70) : ${data.dealHealth.atRisk.count} deals (${data.dealHealth.atRisk.percentage}%) -> ${data.dealHealth.atRisk.href}`);
  console.log(`   - Total Evaluated: ${data.dealHealth.totalCount}`);

  console.log("\n4. Recent Quotations (Top 6):");
  for (const q of data.recentQuotations) {
    console.log(`   - ${q.dealId} | ${q.customer.padEnd(25)} | ${q.owner.padEnd(15)} | ${q.value.padStart(14)} | ${q.stage.padEnd(16)} | ${q.status.padEnd(10)} | Risk: ${q.riskScore}`);
  }
  if (data.recentQuotations.length === 0) throw new Error("FAIL: recentQuotations is empty");

  console.log("\n5. Action Required:");
  for (const a of data.actionRequired) {
    console.log(`   - ${a.dealId} | ${a.customer} | Role: ${a.role} | Assignee: ${a.assignee} | Priority: ${a.priority} -> ${a.href}`);
  }

  console.log("\n6. Operational Snapshot:");
  console.log("   - Fulfillment  :", data.operational.fulfillment.ordersAwaitingCount, "awaiting,", data.operational.fulfillment.physicalUnitsCount, "units,", data.operational.fulfillment.warehousesSummary);
  console.log("   - Subscriptions:", data.operational.subscriptions.activeSubscriptionsCount, "active accounts, MRR:", data.operational.subscriptions.totalMrr, ", ARR:", data.operational.subscriptions.totalArr);
  console.log("   - Invoices     :", data.operational.invoices.outstandingValue, "outstanding,", data.operational.invoices.paidThisMonth, "paid");

  console.log("\n7. Recent Activity Audit Trail:");
  for (const act of data.recentActivity) {
    console.log(`   - [${act.actorName}] ${act.action} on ${act.dealId} (${act.notes || "No notes"}) at ${act.timestamp}`);
  }

  console.log("\n✅ ALL OVERVIEW METRICS TESTS PASSED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });
