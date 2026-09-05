"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CreateCustomerSchema } from "@/lib/validations/customer";
import { getCurrentUser } from "@/lib/auth";

function safeRevalidate() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/quotations", "layout");
    revalidatePath("/quotations/new");
    revalidatePath("/overview");
    revalidatePath("/customers/new");
  } catch {
    // Safe no-op outside Next.js request context
  }
}

export async function getNextCustomerNumber(): Promise<string> {
  const existingCustomers = await prisma.customer.findMany({
    select: { customerNumber: true },
  });

  let maxNum = 0;
  for (const c of existingCustomers) {
    if (!c.customerNumber) continue;
    const match = c.customerNumber.match(/^CUST-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `CUST-${String(nextNum).padStart(5, "0")}`;
}

export async function getNextCustomerNumberAction(): Promise<string> {
  return getNextCustomerNumber();
}

async function resolveAuthenticatedOwner() {
  try {
    const sessionUser = await getCurrentUser();
    if (sessionUser?.email) {
      const user = await prisma.user.findUnique({
        where: { email: sessionUser.email },
      });
      if (user) return user;
    }
  } catch {
    // Session retrieval outside Next request context
  }

  const fallback =
    (await prisma.user.findFirst({
      where: { email: "arjun.mehta@dealflow360.in" },
    })) ?? (await prisma.user.findFirst());

  if (!fallback) {
    throw new Error("Cannot create customer: No active user found in database");
  }
  return fallback;
}

export async function createCustomerAction(input: unknown) {
  try {
    const parsed = CreateCustomerSchema.parse(input);
    const owner = await resolveAuthenticatedOwner();

    // Ensure customerNumber is unique or generate next
    let finalCustomerNumber = parsed.customerNumber;
    const existing = await prisma.customer.findUnique({
      where: { customerNumber: finalCustomerNumber },
    });
    if (existing) {
      finalCustomerNumber = await getNextCustomerNumber();
    }

    const numSuffix = finalCustomerNumber.replace("CUST-", "");
    const finalExternalId = parsed.externalAccountId || `EXT-${numSuffix}`;

    const newCustomer = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          customerNumber: finalCustomerNumber,
          name: parsed.name,
          externalAccountId: finalExternalId,
          industry: parsed.industry === "Others" && parsed.otherIndustryDetails ? `Others - ${parsed.otherIndustryDetails}` : parsed.industry,
          otherIndustryDetails: parsed.otherIndustryDetails || null,
          tier: parsed.tier,
          paymentTerms: parsed.paymentTerms,
          creditLimit: parsed.creditLimit,
          creditAvailable: parsed.creditLimit,
          territory: `${parsed.city}, ${parsed.state}`,
          city: parsed.city,
          state: parsed.state,
          country: parsed.country || "India",
          ownerId: owner.id,
        },
      });

      await tx.contact.create({
        data: {
          customerId: customer.id,
          name: parsed.contactName,
          email: parsed.contactEmail,
          phone: parsed.contactPhone || null,
          title: parsed.contactTitle || "Primary Contact",
          isPrimary: true,
          portalAccess: false,
        },
      });

      return customer;
    });

    safeRevalidate();

    return {
      success: true,
      customer: {
        id: newCustomer.id,
        customerNumber: newCustomer.customerNumber,
        name: newCustomer.name,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { success: false, error: fieldErrors };
    }
    console.error("[createCustomerAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create customer",
    };
  }
}
