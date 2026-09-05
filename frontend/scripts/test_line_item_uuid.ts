import { prisma } from "../src/lib/prisma";
import { UpdateLineItemSchema } from "../src/lib/validations/quotation";
import {
  updateLineItemAction,
  duplicateLineItemAction,
  removeLineItemAction,
  addLineItemAction,
  quickAddBundleAction,
} from "../src/lib/actions/quoteActions";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function runRegressionTests() {
  console.log("--- 1. Verify all DB line items are valid UUIDs ---");
  const allLineItems = await prisma.quoteLineItem.findMany();
  console.log(`Total quote line items in DB: ${allLineItems.length}`);
  for (const li of allLineItems) {
    if (!UUID_REGEX.test(li.id)) {
      throw new Error(`FAIL: Line item ID is not a UUID: ${li.id}`);
    }
  }
  console.log("PASS: 100% of line items in database have valid UUIDs.");

  console.log("\n--- 2. Verify Q-1042 line items and data integrity ---");
  const q1042 = await prisma.quotation.findUnique({
    where: { quotationNumber: "Q-1042" },
    include: {
      lineItems: {
        include: { product: true },
      },
      customer: true,
    },
  });

  if (!q1042) {
    throw new Error("FAIL: Q-1042 quotation not found!");
  }

  console.log(`Quotation: ${q1042.quotationNumber} (ID: ${q1042.id}, valid UUID: ${UUID_REGEX.test(q1042.id)})`);
  console.log(`Customer: ${q1042.customer.name}`);
  console.log(`Total Value: ₹${q1042.totalValue}`);
  console.log(`Risk Score: ${q1042.riskScore}`);
  console.log(`Line items count: ${q1042.lineItems.length}`);

  if (q1042.lineItems.length !== 3) {
    throw new Error(`FAIL: Expected 3 line items for Q-1042, got ${q1042.lineItems.length}`);
  }

  for (const li of q1042.lineItems) {
    console.log(`  - [${li.sku}] ID: ${li.id} (valid UUID: ${UUID_REGEX.test(li.id)}), Qty: ${li.quantity}, Total: ₹${li.lineTotal}, ProductId: ${li.productId}`);
    if (!UUID_REGEX.test(li.id)) {
      throw new Error(`FAIL: Q-1042 line item ID is not a UUID: ${li.id}`);
    }
  }
  console.log("PASS: Q-1042 line items are intact with valid UUIDs.");

  console.log("\n--- 3. Verify UpdateLineItemSchema accepts real UUID and rejects non-UUIDs ---");
  const testLineItem = q1042.lineItems[0];

  // A. Real seeded UUID accepted
  const validParsed = UpdateLineItemSchema.safeParse({
    lineItemId: testLineItem.id,
    quantity: 11,
    discountPercent: 12,
  });
  if (!validParsed.success) {
    throw new Error(`FAIL: UpdateLineItemSchema rejected valid UUID: ${JSON.stringify(validParsed.error)}`);
  }
  console.log(`PASS: Valid lineItemId "${testLineItem.id}" accepted by UpdateLineItemSchema.`);

  // B. Product SKU rejected
  const skuParsed = UpdateLineItemSchema.safeParse({
    lineItemId: "HW-LP14",
    quantity: 10,
  });
  if (skuParsed.success) {
    throw new Error("FAIL: UpdateLineItemSchema should have rejected product SKU 'HW-LP14'!");
  }
  console.log(`PASS: SKU "HW-LP14" properly rejected: ${skuParsed.error.issues[0].message}`);

  // C. Array index rejected
  const indexParsed = UpdateLineItemSchema.safeParse({
    lineItemId: "0",
    quantity: 10,
  });
  if (indexParsed.success) {
    throw new Error("FAIL: UpdateLineItemSchema should have rejected array index '0'!");
  }
  console.log(`PASS: Index "0" properly rejected: ${indexParsed.error.issues[0].message}`);

  // D. Slug ID rejected
  const slugParsed = UpdateLineItemSchema.safeParse({
    lineItemId: "qli-1042-1-laptop",
    quantity: 10,
  });
  if (slugParsed.success) {
    throw new Error("FAIL: UpdateLineItemSchema should have rejected old slug 'qli-1042-1-laptop'!");
  }
  console.log(`PASS: Slug "qli-1042-1-laptop" properly rejected: ${slugParsed.error.issues[0].message}`);

  console.log("\n--- 4. Verify updateLineItemAction with real seeded Q-1042 line ID ---");
  const originalQty = testLineItem.quantity;
  const originalDiscount = Number(testLineItem.discountPercent);

  // Update quantity and discount
  const updateRes = await updateLineItemAction({
    lineItemId: testLineItem.id,
    quantity: 12,
    discountPercent: 15,
  });
  if (!updateRes.success) {
    throw new Error(`FAIL: updateLineItemAction returned failure: ${JSON.stringify(updateRes)}`);
  }
  console.log(`PASS: updateLineItemAction succeeded for lineItemId: ${testLineItem.id}`);

  // Revert back to canonical values
  const revertRes = await updateLineItemAction({
    lineItemId: testLineItem.id,
    quantity: originalQty,
    discountPercent: originalDiscount,
  });
  if (!revertRes.success) {
    throw new Error(`FAIL: revert updateLineItemAction failed: ${JSON.stringify(revertRes)}`);
  }
  console.log(`PASS: Reverted line item to original quantity ${originalQty} and discount ${originalDiscount}%`);

  console.log("\n--- 5. Verify duplicateLineItemAction produces a valid UUID ---");
  const dupRes = await duplicateLineItemAction(testLineItem.id);
  if (!dupRes.success || !dupRes.item) {
    throw new Error(`FAIL: duplicateLineItemAction failed: ${JSON.stringify(dupRes)}`);
  }
  if (!UUID_REGEX.test(dupRes.item.id)) {
    throw new Error(`FAIL: Duplicated line item ID is not a UUID: ${dupRes.item.id}`);
  }
  console.log(`PASS: Cloned line item created with real UUID: ${dupRes.item.id}`);

  // Remove the duplicated item
  const removeRes = await removeLineItemAction({ lineItemId: dupRes.item.id });
  if (!removeRes.success) {
    throw new Error(`FAIL: removeLineItemAction failed for duplicated item: ${JSON.stringify(removeRes)}`);
  }
  console.log(`PASS: Removed cloned line item ${dupRes.item.id} successfully.`);

  console.log("\n--- 6. Verify duplicateLineItemAction rejects invalid UUID ---");
  let dupRejected = false;
  try {
    await duplicateLineItemAction("HW-LP14");
  } catch (err: unknown) {
    dupRejected = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`PASS: duplicateLineItemAction rejected non-UUID with message: "${msg}"`);
  }
  if (!dupRejected) {
    throw new Error("FAIL: duplicateLineItemAction should have rejected 'HW-LP14'!");
  }

  console.log("\n--- 7. Verify removeLineItemAction rejects non-UUID ---");
  let removeRejected = false;
  try {
    await removeLineItemAction({ lineItemId: "not-a-uuid-123" });
  } catch (err: unknown) {
    removeRejected = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`PASS: removeLineItemAction rejected non-UUID with message: "${msg}"`);
  }
  if (!removeRejected) {
    throw new Error("FAIL: removeLineItemAction should have rejected 'not-a-uuid-123'!");
  }

  console.log("\n--- 8. Verify addLineItemAction creates a line with real UUID ---");
  const anyProduct = await prisma.product.findFirst({
    where: { sku: "ACC-TB4-DK" },
  });
  if (!anyProduct) throw new Error("Product ACC-TB4-DK not found for test");

  const addRes = await addLineItemAction({
    quotationId: q1042.id,
    productId: anyProduct.id,
    quantity: 2,
    discountPercent: 5,
  });
  if (!addRes.success || !addRes.item) {
    throw new Error(`FAIL: addLineItemAction failed: ${JSON.stringify(addRes)}`);
  }
  if (!UUID_REGEX.test(addRes.item.id)) {
    throw new Error(`FAIL: Created line item ID is not a UUID: ${addRes.item.id}`);
  }
  console.log(`PASS: addLineItemAction returned persisted QuoteLineItem UUID: ${addRes.item.id}`);

  // Test updating newly added line item
  const updateNewRes = await updateLineItemAction({
    lineItemId: addRes.item.id,
    quantity: 3,
  });
  if (!updateNewRes.success) {
    throw new Error("FAIL: Cannot update newly added line item!");
  }
  console.log("PASS: Newly added line item can be edited immediately.");

  // Clean up the added line
  await removeLineItemAction({ lineItemId: addRes.item.id });
  console.log("PASS: Newly added line item deleted successfully.");

  console.log("\n--- 9. Verify quickAddBundleAction creates lines with real UUIDs ---");
  const bundleRes = await quickAddBundleAction({
    quotationId: q1042.id,
    bundleType: "CLOUD_STARTER",
  });
  if (!bundleRes.success || !bundleRes.items || bundleRes.items.length === 0) {
    throw new Error(`FAIL: quickAddBundleAction failed: ${JSON.stringify(bundleRes)}`);
  }
  for (const bItem of bundleRes.items) {
    if (!UUID_REGEX.test(bItem.id)) {
      throw new Error(`FAIL: Bundle line item ID is not a UUID: ${bItem.id}`);
    }
  }
  console.log(`PASS: quickAddBundleAction created ${bundleRes.items.length} lines with real UUIDs.`);

  // Test updating and deleting one of the bundle lines
  const firstBundleItem = bundleRes.items[0];
  const updateBundleRes = await updateLineItemAction({
    lineItemId: firstBundleItem.id,
    quantity: 5,
  });
  if (!updateBundleRes.success) {
    throw new Error("FAIL: Cannot update newly created bundle item!");
  }
  console.log(`PASS: Newly added bundle line ${firstBundleItem.id} can be edited immediately.`);

  // Clean up all bundle lines
  for (const bItem of bundleRes.items) {
    await removeLineItemAction({ lineItemId: bItem.id });
  }
  console.log("PASS: All bundle lines removed successfully.");

  console.log("\n--- 10. Verify Product.id is rejected if passed as lineItemId ---");
  let prodIdRejected = false;
  try {
    // If a component accidentally passed Product.id to updateLineItemAction, it should not find the QuoteLineItem
    await updateLineItemAction({
      lineItemId: anyProduct.id,
      quantity: 1,
    });
  } catch (err: unknown) {
    prodIdRejected = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`PASS: Product.id properly rejected because it is not a QuoteLineItem: "${msg}"`);
  }
  if (!prodIdRejected) {
    throw new Error("FAIL: Product.id should not be accepted as a valid QuoteLineItem ID!");
  }

  console.log("\n=========================================");
  console.log("All 10 regression test suites passed! 🚀");
  console.log("=========================================");
}

runRegressionTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
