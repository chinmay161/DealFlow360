/**
 * Pure utility functions for user display, initials, and role formatting.
 * Free of any server-only imports (such as next/headers or auth).
 */

/**
 * Generate user initials from name or email.
 * Shivam Mishra -> SM
 * Arjun Mehta -> AM
 * Priya -> P
 * shivam@domain.com -> S
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, Math.min(2, parts[0].length)).toUpperCase();
    }
  }

  if (email && email.trim()) {
    const clean = email.trim().split("@")[0];
    if (clean.length > 0) {
      return clean[0].toUpperCase();
    }
  }

  return "U";
}

/**
 * Human-readable display label for user role or stored designation
 */
export function getRoleDisplay(role?: string | null, title?: string | null): string {
  if (title && title.trim()) {
    return title.trim();
  }

  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "APPROVER":
      return "Commercial Approver";
    case "SALES_REP":
      return "Sales Representative";
    case "CUSTOMER":
      return "Customer Representative";
    default:
      return "Commercial Team";
  }
}
