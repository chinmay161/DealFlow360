import type { InventoryItem } from "../types/inventory.types";

export function exportInventoryToCSV(items: InventoryItem[], filename = "dealflow360-inventory.csv") {
  const headers = [
    "SKU",
    "Product Name",
    "Category",
    "Warehouse",
    "On Hand",
    "Reserved",
    "Available",
    "Free Stock",
    "Reorder Point",
    "Unit Price (INR)",
    "Status",
  ];

  const rows = items.map((item) => [
    `"${item.sku.replace(/"/g, '""')}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.categoryName.replace(/"/g, '""')}"`,
    `"${item.warehouseName.replace(/"/g, '""')}"`,
    item.quantityOnHand,
    item.quantityReserved,
    item.quantityAvailable,
    item.freeStock,
    item.reorderPoint,
    item.unitPrice,
    `"${item.status}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportInventoryToExcel(items: InventoryItem[], filename = "dealflow360-inventory.xls") {
  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head>
    <body>
      <table border="1">
        <thead>
          <tr style="background-color: #00288e; color: #ffffff; font-weight: bold;">
            <th>SKU</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Warehouse</th>
            <th>On Hand</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Free Stock</th>
            <th>Reorder Point</th>
            <th>Unit Price (INR)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (i) => `
            <tr>
              <td>${i.sku}</td>
              <td>${i.name}</td>
              <td>${i.categoryName}</td>
              <td>${i.warehouseName}</td>
              <td>${i.quantityOnHand}</td>
              <td>${i.quantityReserved}</td>
              <td>${i.quantityAvailable}</td>
              <td>${i.freeStock}</td>
              <td>${i.reorderPoint}</td>
              <td>${i.unitPrice}</td>
              <td>${i.status}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printInventoryPDF(title = "DealFlow360 Enterprise Inventory Report") {
  const originalTitle = document.title;
  document.title = title;
  window.print();
  document.title = originalTitle;
}
