"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CreateCustomerSchema } from "@/lib/validations/customer";
import { getCurrentUser } from "@/lib/auth";
import { normalizeEmail, normalizePhone, findExistingContactByEmail, getAuthoritativeCustomerForSession } from "@/lib/services/portalAuthService";

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

export async function getAccountOwnersAction() {
  const sessionUser = await getCurrentUser();
  if (sessionUser?.role === "CUSTOMER") {
    return [];
  }

  const owners = await prisma.user.findMany({
    where: {
      role: { in: ["SALES_REP", "MANAGER", "ADMIN"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      territory: true,
    },
    orderBy: { name: "asc" },
  });

  return owners;
}

export async function updateCustomerOwnerAction(customerId: string, newOwnerId: string) {
  const sessionUser = await getCurrentUser();
  if (sessionUser?.role === "CUSTOMER") {
    return {
      success: false,
      error: "Unauthorized: Customer portal users cannot reassign customer account ownership.",
    };
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!customer) {
    return { success: false, error: "Customer not found in database." };
  }

  const newOwner = await prisma.user.findUnique({
    where: { id: newOwnerId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!newOwner) {
    return { success: false, error: "Selected new account owner does not exist in database." };
  }

  const AUTHORIZED_OWNER_ROLES = ["SALES_REP", "MANAGER", "ADMIN"];
  if (!AUTHORIZED_OWNER_ROLES.includes(newOwner.role)) {
    return {
      success: false,
      error: `Invalid Account Owner: Users with role '${newOwner.role}' are not authorized to own customer accounts.`,
    };
  }

  const previousOwner = customer.owner;

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: { ownerId: newOwner.id },
    });

    await tx.auditLog.create({
      data: {
        entity: "Customer",
        entityId: customer.id,
        action: "CUSTOMER_OWNER_CHANGED",
        actorId: sessionUser?.id || null,
        actorEmail: sessionUser?.email || null,
        fromState: previousOwner?.id || null,
        toState: newOwner.id,
        metadata: {
          customerNumber: customer.customerNumber,
          customerName: customer.name,
          previousOwner: previousOwner
            ? { id: previousOwner.id, name: previousOwner.name, email: previousOwner.email, role: previousOwner.role }
            : null,
          newOwner: { id: newOwner.id, name: newOwner.name, email: newOwner.email, role: newOwner.role },
        },
      },
    });
  });

  safeRevalidate();
  return { success: true, newOwner };
}

export async function createCustomerAction(input: unknown) {
  try {
    const sessionUser = await getCurrentUser();
    if (sessionUser?.role === "CUSTOMER") {
      return {
        success: false,
        error: "Unauthorized: Customer users cannot register new customer organizations",
      };
    }

    const parsed = CreateCustomerSchema.parse(input);

    // Validate that selected owner exists and is authorized
    const owner = await prisma.user.findUnique({
      where: { id: parsed.ownerId },
    });

    if (!owner) {
      return {
        success: false,
        error: "Invalid Account Owner: Selected representative does not exist in database.",
      };
    }

    const AUTHORIZED_OWNER_ROLES = ["SALES_REP", "MANAGER", "ADMIN"];
    if (!AUTHORIZED_OWNER_ROLES.includes(owner.role)) {
      return {
        success: false,
        error: `Invalid Account Owner: Users with role '${owner.role}' are not authorized to own customer accounts.`,
      };
    }

    const normalizedEmail = normalizeEmail(parsed.contactEmail);
    const normalizedPhone = normalizePhone(parsed.contactPhone);

    // Prevent duplicate portal contact identities
    const existingContact = await findExistingContactByEmail(normalizedEmail);
    if (existingContact) {
      return {
        success: false,
        error: `A contact with email '${parsed.contactEmail}' is already registered with account '${existingContact.customer.name}'. Duplicate portal identities are not permitted.`,
      };
    }

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
          email: normalizedEmail,
          phone: normalizedPhone,
          title: parsed.contactTitle || "Primary Contact",
          isPrimary: true,
          portalAccess: parsed.portalAccessEnabled ?? true,
          portalAccessEnabled: parsed.portalAccessEnabled ?? true,
          isActive: true,
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "Customer",
          entityId: customer.id,
          action: "CUSTOMER_REGISTRATION",
          actorId: sessionUser?.id || owner.id,
          actorEmail: sessionUser?.email || owner.email,
          metadata: {
            customerNumber: customer.customerNumber,
            customerName: customer.name,
            contactEmail: normalizedEmail,
            portalAccessEnabled: parsed.portalAccessEnabled ?? true,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          entity: "Customer",
          entityId: customer.id,
          action: "CUSTOMER_OWNER_ASSIGNED",
          actorId: sessionUser?.id || owner.id,
          actorEmail: sessionUser?.email || owner.email,
          fromState: null,
          toState: owner.id,
          metadata: {
            customerNumber: customer.customerNumber,
            customerName: customer.name,
            ownerId: owner.id,
            ownerName: owner.name,
            ownerEmail: owner.email,
            ownerRole: owner.role,
          },
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

  export interface CompleteCustomerContact {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    title: string | null;
    isPrimary: boolean;
    portalAccessEnabled: boolean;
    isActive: boolean;
  }

  export interface CompleteCustomerProfile {
    id: string;
    customerNumber: string | null;
    name: string;
    externalAccountId: string | null;
    industry: string | null;
    otherIndustryDetails: string | null;
    tier: string;
    paymentTerms: string | null;
    creditLimit: number;
    creditAvailable: number;
    territory: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    priceList: {
      id: string;
      code: string;
      name: string;
    } | null;
    owner: {
      id: string;
      name: string | null;
      email: string;
      role: string;
    } | null;
    primaryContact: CompleteCustomerContact | null;
    contacts: CompleteCustomerContact[];
  }

  export interface CustomerSelectorItem {
    id: string;
    customerNumber: string | null;
    name: string;
    city: string | null;
    state: string | null;
    country: string | null;
    industry: string | null;
    tier: string;
  }

  export async function getCustomerById(customerId: string): Promise<CompleteCustomerProfile | null> {
    if (!customerId) return null;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        contacts: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!customer) return null;

    const priceList = customer.tier
      ? await prisma.priceList.findFirst({
          where: { tier: customer.tier, isActive: true },
          select: { id: true, code: true, name: true },
        })
      : null;

    const mappedContacts: CompleteCustomerContact[] = customer.contacts.map((ct) => ({
      id: ct.id,
      name: ct.name,
      email: ct.email,
      phone: ct.phone,
      title: ct.title,
      isPrimary: ct.isPrimary,
      portalAccessEnabled: ct.portalAccessEnabled || ct.portalAccess,
      isActive: ct.isActive,
    }));

    const primaryContact = mappedContacts.find((c) => c.isPrimary) || mappedContacts[0] || null;

    return {
      id: customer.id,
      customerNumber: customer.customerNumber,
      name: customer.name,
      externalAccountId: customer.externalAccountId,
      industry: customer.industry,
      otherIndustryDetails: customer.otherIndustryDetails,
      tier: customer.tier,
      paymentTerms: customer.paymentTerms,
      creditLimit: Number(customer.creditLimit),
      creditAvailable: Number(customer.creditAvailable),
      territory: customer.territory,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      priceList: priceList ? { id: priceList.id, code: priceList.code, name: priceList.name } : null,
      owner: customer.owner ? {
        id: customer.owner.id,
        name: customer.owner.name,
        email: customer.owner.email,
        role: customer.owner.role,
      } : null,
      primaryContact,
      contacts: mappedContacts,
    };
  }

  export async function getCustomerByIdAction(customerId: string): Promise<CompleteCustomerProfile | null> {
    const sessionUser = await getCurrentUser();
    if (sessionUser?.role === "CUSTOMER") {
      const authCustomer = await getAuthoritativeCustomerForSession(sessionUser);
      if (!authCustomer || authCustomer.id !== customerId) {
        // Customer cannot inspect or load any other customer's profile
        return null;
      }
    }
    return getCustomerById(customerId);
  }

  export async function getCustomerSelectorListAction(): Promise<CustomerSelectorItem[]> {
    const sessionUser = await getCurrentUser();
    if (sessionUser?.role === "CUSTOMER") {
      // Customer users are strictly blocked from enumerating enterprise accounts
      return [];
    }

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        customerNumber: true,
        name: true,
        city: true,
        state: true,
        country: true,
        industry: true,
        tier: true,
      },
      orderBy: { name: "asc" },
    });

    return customers.map((c) => ({
      id: c.id,
      customerNumber: c.customerNumber,
      name: c.name,
      city: c.city,
      state: c.state,
      country: c.country,
      industry: c.industry,
      tier: c.tier,
    }));
  }
