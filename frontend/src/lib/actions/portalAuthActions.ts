"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  normalizeEmail,
  findPortalContactByEmail,
  createPortalLoginIntent,
  invalidatePortalLoginIntent,
  toggleContactPortalAccess,
} from "@/lib/services/portalAuthService";
import { auth } from "@/auth";

const EmailCheckSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .min(1, "Email is required")
  .email("Please enter a valid business email address");

export interface PortalEligibilityResult {
  eligible: boolean;
  email?: string;
  error?: string;
  guidance?: string;
}

/**
 * Server Action: checkPortalEmailAction
 * Validates email with Zod, normalizes email, checks PostgreSQL for an active
 * contact with portal access & customer relation.
 * If eligible: creates short-lived PortalLoginIntent record and sets HTTP-only cookie.
 * If ineligible: returns clear rejection message without exposing customer data.
 */
export async function checkPortalEmailAction(
  emailInput: unknown
): Promise<PortalEligibilityResult> {
  try {
    const parseResult = EmailCheckSchema.safeParse(emailInput);
    if (!parseResult.success) {
      return {
        eligible: false,
        error: "Please enter a valid business email address.",
        guidance:
          "If you are not registered, contact your company representative or DealFlow360 sales team with your company name, mobile number, and business email to register.",
      };
    }

    const normalized = normalizeEmail(parseResult.data);
    const contact = await findPortalContactByEmail(normalized);

    if (!contact || !contact.customer) {
      return {
        eligible: false,
        error: "Please log in using the registered email address.",
        guidance:
          "If this email has not been registered, contact your company representative or DealFlow360 sales team with your company name, mobile number, and business email to register.",
      };
    }

    const intent = await createPortalLoginIntent(normalized);
    if (!intent) {
      return {
        eligible: false,
        error: "Please log in using the registered email address.",
        guidance:
          "If this email has not been registered, contact your company representative or DealFlow360 sales team with your company name, mobile number, and business email to register.",
      };
    }

    // Set secure, HTTP-only cookie containing the intent token
    try {
      const cookieStore = await cookies();
      cookieStore.set("portal_login_intent", intent.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60, // 10 minutes
      });
    } catch {
      // Safe no-op outside Next.js request scope (e.g. CLI/automated testing)
    }

    return {
      eligible: true,
      email: normalized,
    };
  } catch (error) {
    console.error("[checkPortalEmailAction] Error:", error);
    return {
      eligible: false,
      error: "Unable to verify email eligibility. Please try again.",
      guidance:
        "If you continue to experience issues, contact your DealFlow360 sales representative.",
    };
  }
}

/**
 * Server Action: clearPortalLoginIntentAction
 * Clears the login intent cookie and invalidates it in the database.
 */
export async function clearPortalLoginIntentAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("portal_login_intent")?.value;
    if (token) {
      await invalidatePortalLoginIntent(token);
    }
    cookieStore.delete("portal_login_intent");
    return { success: true };
  } catch (error) {
    console.error("[clearPortalLoginIntentAction] Error:", error);
    return { success: false };
  }
}

/**
 * Server Action: toggleContactPortalAccessAction
 * Allows Sales Rep or Admin to enable/disable portal access for a customer contact.
 */
export async function toggleContactPortalAccessAction(
  contactId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    const actorRole = session?.user?.role;

    // Do NOT allow customer users to modify portal access
    if (actorRole === "CUSTOMER") {
      return { success: false, error: "Unauthorized: Customers cannot modify portal permissions" };
    }

    await toggleContactPortalAccess(contactId, enabled, session?.user?.email || "internal_user");
    revalidatePath("/customers");
    revalidatePath("/portal");

    return { success: true };
  } catch (error) {
    console.error("[toggleContactPortalAccessAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update portal access",
    };
  }
}
