import { z } from "zod";

export const WarehouseAllocationSchema = z.object({
  warehouseId: z.string().uuid("Invalid warehouse ID"),
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
});

export const SaveFulfillmentPlanSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
  allocations: z.array(WarehouseAllocationSchema).min(1, "At least one allocation is required"),
  notes: z.string().max(500).optional(),
});

export type SaveFulfillmentPlanInput = z.infer<typeof SaveFulfillmentPlanSchema>;

export const ConfirmFulfillmentPlanSchema = z.object({
  quotationId: z.string().uuid("Invalid quotation ID"),
});

export type ConfirmFulfillmentPlanInput = z.infer<typeof ConfirmFulfillmentPlanSchema>;
