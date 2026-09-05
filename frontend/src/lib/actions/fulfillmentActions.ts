"use server";

import { revalidatePath } from "next/cache";
import { SaveFulfillmentPlanSchema } from "@/lib/validations/fulfillment";
import { reserveWarehouseInventory } from "@/lib/services/fulfillmentService";

export async function saveFulfillmentPlanAction(input: unknown) {
  const parsed = SaveFulfillmentPlanSchema.parse(input);
  const result = await reserveWarehouseInventory({
    allocations: parsed.allocations,
  });

  revalidatePath("/fulfillment");
  return result;
}
