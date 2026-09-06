import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 * Ensures consistent case-insensitive identity comparison.
 */
export function normalizeEmail(email?: string | null): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Normalizes Indian mobile phone numbers to "+91 XXXXXXXXXX" format.
 */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2)}`;
  }
  return phone.trim();
}

/**
 * Authoritative PostgreSQL lookup for an active customer portal contact.
 * Enforces:
 * - normalized email match
 * - active contact state (isActive = true)
 * - enabled portal access (portalAccess = true OR portalAccessEnabled = true)
 * - existing customer relation
 */
export async function findPortalContactByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const contact = await prisma.contact.findFirst({
    where: {
      email: normalized,
      isActive: true,
      OR: [{ portalAccess: true }, { portalAccessEnabled: true }],
    },
    include: {
      customer: true,
    },
  });

  return contact;
}

/**
 * Resolves the authoritative Customer record from PostgreSQL for an authenticated user session.
 * For CUSTOMER role, verifies against Customer.id from session and/or verified Contact in PostgreSQL.
 */
export async function getAuthoritativeCustomerForSession(user?: {
  id?: string;
  email?: string | null;
  role?: string;
  customerId?: string | null;
} | null) {
  if (!user) return null;

  if (user.role === "CUSTOMER") {
    // 1. Direct verified customerId from session token
    if (user.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: user.customerId },
      });
      if (customer) return customer;
    }

    // 2. Identity chain via contact email verified in PostgreSQL
    if (user.email) {
      const contact = await findPortalContactByEmail(user.email);
      if (contact?.customer) {
        return contact.customer;
      }
    }
  }

  return null;
}

/**
 * Check if a portal contact with this email is already registered,
 * regardless of portal access flag or customer association.
 * Used to enforce uniqueness during customer/contact registration.
 */
export async function findExistingContactByEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  return await prisma.contact.findFirst({
    where: {
      email: normalized,
      isActive: true,
    },
    include: {
      customer: true,
    },
  });
}

/**
 * Creates a short-lived (10 minutes), single-use login intent record in PostgreSQL.
 * Used as a cryptographic bridge between the pre-login email eligibility check
 * and subsequent Google OAuth callback verification.
 */
export async function createPortalLoginIntent(email: string) {
  const normalized = normalizeEmail(email);
  const contact = await findPortalContactByEmail(normalized);

  if (!contact) {
    // Record rejected eligibility audit log
    await prisma.auditLog.create({
      data: {
        entity: "PortalAuth",
        entityId: "unregistered",
        action: "PORTAL_ELIGIBILITY_REJECTED",
        actorEmail: normalized,
        metadata: { reason: "No active portal contact found" },
      },
    });
    return null;
  }

  // Invalidate any existing unused login intents for this email
  await prisma.portalLoginIntent.updateMany({
    where: {
      email: normalized,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  // Generate 32-byte secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const intent = await prisma.portalLoginIntent.create({
    data: {
      token,
      email: normalized,
      contactId: contact.id,
      customerId: contact.customerId,
      expiresAt,
    },
  });

  // Record accepted eligibility audit log
  await prisma.auditLog.create({
    data: {
      entity: "PortalAuth",
      entityId: contact.id,
      action: "PORTAL_ELIGIBILITY_ACCEPTED",
      actorEmail: normalized,
      metadata: {
        customerId: contact.customerId,
        customerName: contact.customer.name,
      },
    },
  });

  return {
    token: intent.token,
    email: intent.email,
    expiresAt: intent.expiresAt,
  };
}

/**
 * Verifies that an incoming OAuth callback matches the short-lived login intent.
 * Strict verification rules:
 * 1. Intent token exists in PostgreSQL.
 * 2. Intent token has not expired.
 * 3. Intent token has not been used yet (single-use).
 * 4. Authenticated Google account email exactly matches normalized intent email.
 * 5. Authoritative Contact in PostgreSQL is still active with portal access and customer relation.
 */
export async function verifyPortalLoginIntent(
  token: string,
  authenticatedGoogleEmail: string
) {
  if (!token || !authenticatedGoogleEmail) {
    return { success: false, error: "MissingCredentials" };
  }

  const normalizedGoogleEmail = normalizeEmail(authenticatedGoogleEmail);

  const intent = await prisma.portalLoginIntent.findUnique({
    where: { token },
  });

  if (!intent) {
    return { success: false, error: "InvalidIntent" };
  }

  if (intent.usedAt) {
    return { success: false, error: "IntentAlreadyUsed" };
  }

  if (new Date() > intent.expiresAt) {
    // Mark expired
    await prisma.portalLoginIntent.update({
      where: { id: intent.id },
      data: { usedAt: new Date() },
    });
    return { success: false, error: "IntentExpired" };
  }

  // Strict email match between OAuth email and intent email
  if (intent.email !== normalizedGoogleEmail) {
    // Record OAuth mismatch audit event
    await prisma.auditLog.create({
      data: {
        entity: "PortalAuth",
        entityId: intent.contactId,
        action: "PORTAL_OAUTH_MISMATCH",
        actorEmail: normalizedGoogleEmail,
        metadata: {
          expectedEmail: intent.email,
          receivedEmail: normalizedGoogleEmail,
        },
      },
    });

    // Invalidate intent immediately upon mismatch
    await prisma.portalLoginIntent.update({
      where: { id: intent.id },
      data: { usedAt: new Date() },
    });

    return {
      success: false,
      error: "OAuthEmailMismatch",
      expectedEmail: intent.email,
      receivedEmail: normalizedGoogleEmail,
    };
  }

  // Authoritative PostgreSQL check on the Contact
  const contact = await prisma.contact.findFirst({
    where: {
      id: intent.contactId,
      email: normalizedGoogleEmail,
      isActive: true,
      OR: [{ portalAccess: true }, { portalAccessEnabled: true }],
    },
    include: {
      customer: true,
    },
  });

  if (!contact || !contact.customer) {
    await prisma.portalLoginIntent.update({
      where: { id: intent.id },
      data: { usedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        entity: "PortalAuth",
        entityId: intent.contactId,
        action: "PORTAL_LOGIN_FAILED",
        actorEmail: normalizedGoogleEmail,
        metadata: { reason: "Contact disabled or customer relation missing" },
      },
    });

    return { success: false, error: "AccessDenied" };
  }

  // Mark intent as consumed (single-use)
  await prisma.portalLoginIntent.update({
    where: { id: intent.id },
    data: { usedAt: new Date() },
  });

  // Record successful login audit event
  await prisma.auditLog.create({
    data: {
      entity: "PortalAuth",
      entityId: contact.id,
      action: "PORTAL_LOGIN_SUCCESS",
      actorEmail: normalizedGoogleEmail,
      metadata: {
        customerId: contact.customerId,
        customerName: contact.customer.name,
      },
    },
  });

  return {
    success: true,
    contact,
    customer: contact.customer,
  };
}

/**
 * Invalidates a login intent token (e.g. after logout or failed login).
 */
export async function invalidatePortalLoginIntent(token: string) {
  try {
    await prisma.portalLoginIntent.updateMany({
      where: { token, usedAt: null },
      data: { usedAt: new Date() },
    });
  } catch (err) {
    console.error("Failed to invalidate portal intent:", err);
  }
}

/**
 * Sales Rep / Admin management action to enable or disable portal access on a Contact.
 */
export async function toggleContactPortalAccess(
  contactId: string,
  enabled: boolean,
  actorEmail?: string
) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { customer: true },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: {
      portalAccess: enabled,
      portalAccessEnabled: enabled,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: "Contact",
      entityId: contact.id,
      action: enabled ? "PORTAL_ACCESS_ENABLED" : "PORTAL_ACCESS_DISABLED",
      actorEmail: actorEmail || "system",
      metadata: {
        customerId: contact.customerId,
        customerName: contact.customer.name,
        contactEmail: contact.email,
      },
    },
  });

  return updated;
}
