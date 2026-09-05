import { z } from "zod";

export const CustomerTierEnum = z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]);

export const CreateCustomerSchema = z.object({
  customerNumber: z
    .string()
    .regex(/^CUST-\d{5}$/, "Customer ID must follow format CUST-XXXXX (e.g. CUST-00006)"),
  name: z.string().min(2, "Company name must be at least 2 characters").max(150),
  externalAccountId: z.string().max(50).optional().nullable(),
  industry: z.string().min(2, "Industry is required").max(100),
  tier: CustomerTierEnum.default("BRONZE"),
  paymentTerms: z.string().default("Net 30 Days"),
  creditLimit: z.coerce.number().min(0, "Credit limit must be a positive number").default(1000000),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  country: z.string().default("India"),
  contactName: z.string().min(2, "Primary contact name must be at least 2 characters"),
  contactEmail: z.string().email("Valid business email is required"),
  contactPhone: z.string().max(30).optional().nullable(),
  contactTitle: z.string().max(100).optional().nullable(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
