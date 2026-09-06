import { prisma } from "../src/lib/prisma";
import { evaluateQuotationRules } from "../src/lib/services/governanceBridge";

async function fixApprovalStateInconsistency() {
  console.log("Fixing database records for Q-1060, Q-1059, Q-1058...");

  // Fix Q-1060: High risk (70), discount 24% > limit 15%, margin 14.47% < 25% -> IN_REVIEW, Finance Review, PENDING approval
  const q1060 = await prisma.quotation.findUnique({ where: { quotationNumber: "Q-1060" } });
  if (q1060) {
    await prisma.quotation.update({
      where: { id: q1060.id },
      data: {
        status: "IN_REVIEW",
        currentStage: "Finance Review",
      },
    });

    await prisma.approval.updateMany({
      where: { quotationId: q1060.id },
      data: {
        status: "PENDING",
      },
    });

    await evaluateQuotationRules(q1060.id);
    console.log("Updated Q-1060 -> status: IN_REVIEW, stage: Finance Review, approval: PENDING");
  }

  // Fix Q-1059: Medium risk (40), discount 18% > limit 15%, margin 20.73% < 25% -> IN_REVIEW, Manager Approval, PENDING approval
  const q1059 = await prisma.quotation.findUnique({ where: { quotationNumber: "Q-1059" } });
  if (q1059) {
    await prisma.quotation.update({
      where: { id: q1059.id },
      data: {
        status: "IN_REVIEW",
        currentStage: "Manager Approval",
      },
    });

    await prisma.approval.updateMany({
      where: { quotationId: q1059.id },
      data: {
        status: "PENDING",
      },
    });

    await evaluateQuotationRules(q1059.id);
    console.log("Updated Q-1059 -> status: IN_REVIEW, stage: Manager Approval, approval: PENDING");
  }

  // Fix Q-1058: Low risk (15), discount 5% <= limit 15%, margin 31.58% >= 25% -> APPROVED, stage: Approved
  const q1058 = await prisma.quotation.findUnique({ where: { quotationNumber: "Q-1058" } });
  if (q1058) {
    await prisma.quotation.update({
      where: { id: q1058.id },
      data: {
        status: "APPROVED",
        currentStage: "Approved",
      },
    });

    await evaluateQuotationRules(q1058.id);
    console.log("Updated Q-1058 -> status: APPROVED, stage: Approved");
  }

  console.log("DB records corrected successfully.");
}

fixApprovalStateInconsistency()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
